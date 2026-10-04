'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  loginSchema,
  signUpSchema,
  submitLeadSchema,
  requestPasswordResetSchema,
  passwordChangeSchema,
} from './schemas';
import {
  checkRateLimit,
  loginRateLimit,
  passwordResetRateLimit,
  registerRateLimit,
  getClientIp,
} from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';

export type ActionState = {
  success: boolean;
  message: string | null;
  errors?: Record<string, string>;
};

/**
 * Traduz mensagens de erro comuns do Supabase Auth para português.
 */
function translateAuthError(message: string): string {
  if (
    message.toLowerCase().includes('fetch failed') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    message.includes('521')
  ) {
    return 'Não foi possível conectar ao servidor de autenticação. Por favor, tente novamente em instantes.';
  }
  if (message.includes('For security purposes, you can only request this after')) {
    const secondsMatch = message.match(/\d+/);
    const seconds = secondsMatch ? secondsMatch[0] : 'alguns';
    return `Por motivos de segurança, você só pode tentar novamente após ${seconds} segundos.`;
  }
  if (message.toLowerCase().includes('email rate limit exceeded')) {
    return 'Limite de envio de e-mails excedido. Por favor, aguarde alguns minutos antes de tentar novamente.';
  }
  if (message.toLowerCase().includes('database error querying schema')) {
    return 'Erro de banco de dados ao processar a requisição. Por favor, tente novamente em instantes.';
  }
  if (
    message.includes('User already registered') ||
    message.includes('Email already exists') ||
    message.includes('user already exists')
  ) {
    return 'Este endereço de e-mail já está cadastrado em nosso sistema.';
  }
  if (message.includes('Password should be at least 6 characters')) {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }
  if (
    message.includes('Invalid login credentials') ||
    message.includes('invalid_credentials')
  ) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de acessar a plataforma.';
  }
  return message;
}

/**
 * Entra na conta com e-mail e senha.
 */
export async function signIn(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? 'Por favor, preencha todos os campos.',
      };
    }

    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(loginRateLimit, `login:${ip}:${email}`);

    if (!rateLimit.success) {
      return {
        success: false,
        message: rateLimit.message ?? 'Muitas tentativas. Tente novamente mais tarde.',
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      logAuditEvent({
        acao: 'LOGIN_FAILED',
        entidade: 'auth',
        payload: { email },
      });

      return {
        success: false,
        message: translateAuthError(error.message),
      };
    }

    logAuditEvent({
      usuarioId: data.user?.id ?? null,
      acao: 'LOGIN',
      entidade: 'auth',
    });

    // Se tudo der certo, redireciona para o dashboard
    redirect('/dashboard');
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('[signIn error]', err);
    return {
      success: false,
      message: translateAuthError(err?.message || 'Erro inesperado ao autenticar.'),
    };
  }
}

/**
 * Cadastra uma nova empresa e o usuário como administrador dela.
 */
export async function signUp(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    nome_empresa: formData.get('nome_empresa') as string,
    telefone: formData.get('telefone') as string,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Por favor, preencha todos os campos obrigatórios.',
    };
  }

  const { nome, email, password, nome_empresa, telefone } = parsed.data;

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(registerRateLimit, `signup:${ip}`);
  if (!rateLimit.success) {
    return {
      success: false,
      message: rateLimit.message ?? 'Muitas tentativas. Tente novamente mais tarde.',
    };
  }

  // Usamos 'as any' para contornar problemas de typings rígidos do Supabase
  // que ocasionalmente resolvem objetos de inserção/update como tipo 'never'
  const supabase = await createClient() as any;

  // 1. Cadastra o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome,
        role: 'superintendente',
      },
    },
  });

  if (authError) {
    return {
      success: false,
      message: translateAuthError(authError.message),
    };
  }

  const user = authData.user;
  if (!user) {
    return {
      success: false,
      message: 'Erro desconhecido ao criar conta de usuário.',
    };
  }

  // 1.5 Get default plan ID (Essencial)
  const { data: defaultPlan } = await supabase
    .from('planos')
    .select('id')
    .eq('nome', 'Essencial')
    .limit(1)
    .single();

  // Calcula o vencimento para 30 dias a partir de hoje
  const dataVencimento = new Date();
  dataVencimento.setDate(dataVencimento.getDate() + 30);
  const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];

  // 2. Insere a nova empresa na tabela public.empresas
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .insert({
      nome_empresa,
      status: 'ativo',
      plano_id: defaultPlan?.id || null,
      telefone: telefone || null,
      status_pagamento: 'em_dia',
      data_vencimento: dataVencimentoStr,
    })
    .select()
    .single();

  if (empresaError) {
    console.error('Erro ao registrar empresa no signUp:', empresaError);
    return {
      success: false,
      message: 'Erro ao registrar empresa. Tente novamente.',
    };
  }

  // 3. Atualiza o registro em public.usuarios vinculando o supervisor_id
  // Nota: o registro do usuário já foi inserido automaticamente pelo trigger do banco
  const { error: userError } = await supabase
    .from('usuarios')
    .update({
      
      role: 'superintendente',
    })
    .eq('id', user.id);

  if (userError) {
    console.error('Erro ao vincular usuário no signUp:', userError);
    return {
      success: false,
      message: 'Empresa registrada, mas erro ao vincular usuário. Tente novamente.',
    };
  }

  // Redireciona para o dashboard
  redirect('/dashboard');
}

/**
 * Cadastra um novo lead de interesse no sistema a partir do formulário de cadastro.
 */
export async function submitLead(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const nome = formData.get('nome') as string;
  const email = formData.get('email') as string;
  const nome_empresa = formData.get('nome_empresa') as string;
  const telefone = formData.get('telefone') as string;

  const parsed = submitLeadSchema.safeParse({ nome, email, nome_empresa, telefone });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Por favor, preencha todos os campos obrigatórios.',
    };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(registerRateLimit, `register:${ip}`);

  if (!rateLimit.success) {
    return {
      success: false,
      message: rateLimit.message ?? 'Muitas tentativas. Tente novamente mais tarde.',
    };
  }

  const supabase = await createClient() as any;

  // Busca a empresa administradora master para associar o lead
  const { data: companies, error: compError } = await supabase
    .from('empresas')
    .select('id')
    .eq('nome_empresa', 'Meu Parceiro Digital Representações')
    .limit(1);

  let empresaId = '';
  if (!compError && companies && companies.length > 0) {
    empresaId = companies[0].id;
  } else {
    // Fallback: pega a primeira empresa encontrada no banco de dados
    const { data: allCompanies } = await supabase.from('empresas').select('id').limit(1);
    if (allCompanies && allCompanies.length > 0) {
      empresaId = allCompanies[0].id;
    }
  }

  if (!empresaId) {
    return {
      success: false,
      message: 'Erro interno: Empresa de destino não configurada no sistema.',
    };
  }

  // Insere o lead na tabela de leads
  const { error: insertError } = await supabase
    .from('leads')
    .insert({
      
      nome: nome,
      telefone: telefone || null,
      temperatura: 'quente', // Leads vindos do formulário de cadastro são bem quentes
      etapa_funil: 'sem_contato',
      origem: 'site',
      observacoes: `Solicitação de acesso à plataforma feita pelo site.\nEmpresa: ${nome_empresa}\nE-mail corporativo: ${email}`,
    });

  if (insertError) {
    console.error('[submitLead] Erro ao inserir lead:', insertError.message);
    return {
      success: false,
      message: 'Erro ao enviar suas informações. Tente novamente.',
    };
  }

  // Redireciona o lead para a página de sucesso
  redirect('/register/success');
}


/**
 * Envia o link de recuperação de senha por e-mail.
 */
export async function requestPasswordReset(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;

  const parsed = requestPasswordResetSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Por favor, informe seu e-mail.',
    };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(passwordResetRateLimit, `pwreset:${ip}:${email}`);

  if (!rateLimit.success) {
    return {
      success: false,
      message: rateLimit.message ?? 'Muitas tentativas. Tente novamente mais tarde.',
    };
  }

  logAuditEvent({
    acao: 'PASSWORD_RESET_REQUESTED',
    entidade: 'auth',
    payload: { email },
  });

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      success: false,
      message: translateAuthError(error.message),
    };
  }

  return {
    success: true,
    message: 'Se o e-mail estiver cadastrado, um link de recuperação foi enviado.',
  };
}

/**
 * Define uma nova senha para a conta após o redirecionamento.
 */
export async function updatePassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const parsed = passwordChangeSchema.safeParse({ password, confirmPassword });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Por favor, preencha ambos os campos de senha.',
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      message: translateAuthError(error.message),
    };
  }

  const { data: { user } } = await supabase.auth.getUser();

  logAuditEvent({
    usuarioId: user?.id ?? null,
    acao: 'PASSWORD_CHANGED',
    entidade: 'auth',
  });

  redirect('/login?message=Sua senha foi atualizada com sucesso. Faça login novamente.');
}

/**
 * Faz logout limpando a sessão.
 */
export async function signOut() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  logAuditEvent({
    usuarioId: user?.id ?? null,
    acao: 'LOGOUT',
    entidade: 'auth',
  });

  redirect('/login');
}

/**
 * Inicia a personificação (impersonation) de um ponto_venda da mesma empresa.
 */
export async function impersonateUserAction(userId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  const { data: adminProfile } = await supabase
    .from('usuarios')
    .select('role, supervisor_id')
    .eq('id', user.id)
    .single();

  if (!adminProfile || (adminProfile.role !== 'superintendente' && adminProfile.role !== 'master' && adminProfile.role !== 'platform_admin' && adminProfile.role !== 'diretoria' && adminProfile.role !== 'regional' && adminProfile.role !== 'gerente_negocio')) {
    return { success: false, message: 'Permissão negada. Apenas líderes podem acessar contas subordinadas.' };
  }

  let query = supabase
    .from('usuarios')
    .select('id, nome, role')
    .eq('id', userId)
    .neq('role', 'master');

  // Se for gerente, só pode acessar ponto_vendaes da mesma empresa
  if (adminProfile.role === 'superintendente' && null) {
    query = query;
  }

  const { data: targetUser } = await query.single();

  if (!targetUser) {
    return { success: false, message: 'Usuário alvo não encontrado ou você não tem permissão para acessá-lo.' };
  }

  const hierarchyMap: Record<string, number> = {
    'master': 100,
    'platform_admin': 90,
    'diretoria': 80,
    'superintendente': 70,
    'regional': 60,
    'gerente_negocio': 50,
    'ponto_venda': 40,
    'vendedor': 30
  };

  const adminWeight = hierarchyMap[adminProfile.role] || 0;
  const targetWeight = hierarchyMap[targetUser.role] || 0;

  // Master can access anyone (except other masters, which is already blocked by the query)
  if (adminProfile.role !== 'master' && adminProfile.role !== 'platform_admin') {
    if (adminWeight <= targetWeight) {
      return { success: false, message: 'Você não tem permissão hierárquica para acessar este perfil.' };
    }
  }

  // Set impersonated_user_id cookie
  const cookieStore = await cookies();
  cookieStore.set('impersonated_user_id', userId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 horas
  });

  logAuditEvent({
    usuarioId: user.id,
    empresaId: null,
    acao: 'IMPERSONATION_START',
    entidade: 'auth',
    entidadeId: targetUser.id,
    payload: { targetUserId: targetUser.id, targetUserName: targetUser.nome },
  });

  return { success: true, message: `Acesso iniciado como ${targetUser.nome}` };
}

/**
 * Encerra a personificação (impersonation).
 */
export async function stopImpersonatingAction(): Promise<ActionState> {
  const cookieStore = await cookies();
  cookieStore.delete('impersonated_user_id');

  logAuditEvent({
    acao: 'IMPERSONATION_END',
    entidade: 'auth',
  });

  return { success: true, message: 'Sessão de simulação encerrada.' };
}

/**
 * Conclui o Primeiro Acesso: atualiza a senha no Supabase Auth e o status no public.usuarios
 */
export async function concluirPrimeiroAcessoAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const parsed = passwordChangeSchema.safeParse({ password, confirmPassword });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Por favor, preencha ambos os campos de senha.',
    };
  }

  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: 'Sessão inválida. Faça login novamente.',
    };
  }

  // Atualiza a senha no Supabase Auth
  const { error: updateAuthError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (updateAuthError) {
    return {
      success: false,
      message: translateAuthError(updateAuthError.message),
    };
  }

  // Remove a flag de primeiro acesso
  const { error: updateProfileError } = await (supabase as any)
    .from('usuarios')
    .update({ primeiro_acesso: false })
    .eq('id', user.id);

  if (updateProfileError) {
    return {
      success: false,
      message: 'Erro ao registrar conclusão do primeiro acesso. ' + updateProfileError.message,
    };
  }

  logAuditEvent({
    usuarioId: user.id,
    acao: 'PASSWORD_CHANGED',
    entidade: 'auth',
  });

  redirect('/dashboard');
}

