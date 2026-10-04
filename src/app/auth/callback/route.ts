import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const rawNext = requestUrl.searchParams.get('next') || '/dashboard';
    // Proteção contra Open Redirect: garante que o destino é uma rota interna
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

    if (code) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore
              }
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      } else {
        console.error('Auth callback exchangeCodeForSession error:', error);
      }
    }

    // Se falhar, redireciona para a página de login com erro
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
  } catch (err: any) {
    console.error('Auth callback 500 error:', err);
    // Em vez de 500, força um redirecionamento seguro para o login
    return NextResponse.redirect(new URL('/login?error=internal_auth_error', request.url));
  }
}
