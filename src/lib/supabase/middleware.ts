import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password');

  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');
  const isPrimeiroAcessoRoute = request.nextUrl.pathname.startsWith('/primeiro-acesso');

  // Rotas públicas (ex: página inicial ou visualização pública de proposta)
  const isPublicProposalRoute = 
    request.nextUrl.pathname.includes('/publica/') || 
    request.nextUrl.pathname.includes('/p/') || 
    request.nextUrl.pathname.startsWith('/propostas/publica') ||
    request.nextUrl.pathname.startsWith('/proposta-publica');
  const isRootRoute = request.nextUrl.pathname === '/';

  // Se o usuário não estiver logado
  if (!user) {
    if (!isAuthRoute && !isAuthCallback && !isRootRoute && !isPublicProposalRoute && !isPrimeiroAcessoRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Se o usuário estiver logado, busca seu perfil no banco
  const { data: profile } = await supabase
    .from('usuarios')
    .select('ativo, role, primeiro_acesso')
    .eq('id', user.id)
    .single();

  // 1. Bloqueio de Usuário Inativo
  if (!profile || profile.ativo === false) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', !profile ? 'profile_not_found' : 'inactive_user');
    
    // Cria resposta para limpar os cookies do usuário
    const response = NextResponse.redirect(url);
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }

  // 2. Verificação de Primeiro Acesso
  if (profile.primeiro_acesso === true && !isPrimeiroAcessoRoute && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = '/primeiro-acesso';
    return NextResponse.redirect(url);
  }

  // Se já concluiu o primeiro acesso e tenta acessar a rota, volta pro dashboard
  if (profile.primeiro_acesso === false && isPrimeiroAcessoRoute) {
    const url = request.nextUrl.clone();
    url.pathname = (profile.role === 'master' || profile.role === 'platform_admin') ? '/admin-master' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Redirecionar usuário logado tentando acessar páginas de autenticação
  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = profile.primeiro_acesso ? '/primeiro-acesso' : ((profile.role === 'master' || profile.role === 'platform_admin') ? '/admin-master' : '/dashboard');
    return NextResponse.redirect(url);
  }

  // 4. Proteção de Rotas por Role
  const isAdminMasterRoute = request.nextUrl.pathname.startsWith('/admin-master');
  const isDashboardRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/crm') ||
    request.nextUrl.pathname.startsWith('/leads') ||
    request.nextUrl.pathname.startsWith('/simulador') ||
    request.nextUrl.pathname.startsWith('/multi-cotas') ||
    request.nextUrl.pathname.startsWith('/propostas') ||
    request.nextUrl.pathname.startsWith('/campanhas') ||
    request.nextUrl.pathname.startsWith('/relatorios') ||
    request.nextUrl.pathname.startsWith('/configuracoes');

  // Impede não-master de acessar /admin-master
  if (isAdminMasterRoute && profile.role !== 'master' && profile.role !== 'platform_admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  const impersonatedUserId = request.cookies.get('impersonated_user_id')?.value;
  const isImpersonating = !!impersonatedUserId && (profile.role === 'master' || profile.role === 'platform_admin' || profile.role === 'diretoria' || profile.role === 'superintendente');

  // Redireciona master de rotas do dashboard comum para /admin-master
  // SOMENTE SE ele não estiver em modo de personificação
  if (isDashboardRoute && (profile.role === 'master' || profile.role === 'platform_admin') && !isImpersonating) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin-master';
    return NextResponse.redirect(url);
  }

  // 5. Bloqueio de rotas operacionais individuais para Executivos (mantém acesso ao CRM/Negócios)
  const isOperationalRoute =
    request.nextUrl.pathname.startsWith('/simulador') ||
    request.nextUrl.pathname.startsWith('/tarefas') ||
    request.nextUrl.pathname.startsWith('/clientes');

  const isExecutive = profile.role === 'diretoria' || profile.role === 'superintendente' || profile.role === 'regional';

  if (isOperationalRoute && isExecutive) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
