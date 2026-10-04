'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSimpleClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { createUserSchema, userIdSchema } from './schemas';
import { logAuditEvent } from '@/lib/audit';

export type UserActionState = {
  success: boolean;
  message: string | null;
};

/**
 * Creates an admin Supabase client utilizing the Service Role Key.
 * This client bypasses RLS and can perform administrative actions like creating users.
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSimpleClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const roleHierarchy = {
  platform_admin: 6,
  master: 5,
  diretoria: 4,
  superintendente: 3,
  regional: 2,
  gerente_negocio: 1,
  ponto_venda: 0
};

export async function createUserAction(
  prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  try {
    const admin = await getCurrentUser();
    if (!admin) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const nome = formData.get('nome') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const roleInput = formData.get('role') as string;
    const supervisorIdInput = formData.get('supervisor_id') as string;

    const parsed = createUserSchema.safeParse({
      nome,
      email,
      password,
      role: roleInput || undefined,
      supervisor_id: supervisorIdInput || undefined,
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const targetRole = roleInput as keyof typeof roleHierarchy || 'ponto_venda';

    // Verify if the creator has permission to create this role
    if (roleHierarchy[admin.role as keyof typeof roleHierarchy] <= roleHierarchy[targetRole]) {
       return { success: false, message: 'Acesso negado. Você só pode criar usuários de hierarquia inferior à sua.' };
    }

    // Default supervisor is the creator, unless specified (only master/superintendente might specify, keeping simple)
    const targetSupervisorId = supervisorIdInput || admin.id;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return {
        success: false,
        message: 'Configuração ausente: SUPABASE_SERVICE_ROLE_KEY é obrigatória no arquivo .env.local para criar usuários.',
      };
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, role: targetRole },
    });

    if (authError || !authData?.user) {
      return {
        success: false,
        message: `Erro ao criar credenciais: ${authError?.message || 'Erro desconhecido'}`,
      };
    }

    // 2. Update their profile in public.usuarios
    const { error: updateError } = await adminClient
      .from('usuarios')
      .update({
        role: targetRole,
        supervisor_id: targetRole === 'master' ? null : targetSupervisorId,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      console.error('Erro ao configurar perfil:', updateError);
      return {
        success: false,
        message: `Erro ao configurar perfil: ${updateError?.message || 'Tente novamente.'}`,
      };
    }

    revalidatePath('/dashboard/dashboard/membros');
    revalidatePath('/admin-master/usuarios');

    logAuditEvent({
      usuarioId: admin.id,
      acao: 'USER_CREATED',
      entidade: 'usuarios',
      entidadeId: authData.user.id,
      payload: { novoUsuarioId: authData.user.id, email, role: targetRole, supervisor_id: targetSupervisorId },
    });

    return {
      success: true,
      message: 'Usuário cadastrado com sucesso!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro interno no servidor: ${err?.message || 'Erro desconhecido'}`,
    };
  }
}

export async function toggleUserStatusAction(
  userId: string,
  currentStatus: boolean
): Promise<UserActionState> {
  try {
    const admin = await getCurrentUser();
    if (!admin) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const idCheck = userIdSchema.safeParse(userId);
    if (!idCheck.success) {
      return { success: false, message: idCheck.error.issues[0].message };
    }

    const supabase = await createServerClient();

    // Check permissions using the recursive function in RLS or simple logic
    // We assume if the user can view the user in the UI, they might be in their hierarchy.
    // However, we still need to verify if `userId` is actually a subordinate to prevent ID guessing.
    
    // Check if the user exists and is a subordinate (RLS handles this for us on Select)
    const { data: targetUser, error: fetchError } = await (supabase as any)
      .from('usuarios')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return { success: false, message: 'Usuário não encontrado ou você não tem permissão.' };
    }
    
    if (roleHierarchy[admin.role as keyof typeof roleHierarchy] <= roleHierarchy[targetUser.role as keyof typeof roleHierarchy]) {
       return { success: false, message: 'Acesso negado. Você não pode alterar o status deste usuário.' };
    }

    // For toggle status, we need to bypass RLS to actually change 'ativo' if the user isn't 'master'
    // Actually, RLS allows `update` on subordinates! So standard client works.
    const { error: updateError } = await (supabase as any)
      .from('usuarios')
      .update({ ativo: !currentStatus })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao alterar status:', updateError);
      return { success: false, message: 'Erro ao alterar status. Tente novamente.' };
    }

    revalidatePath('/dashboard/dashboard/membros');
    revalidatePath('/admin-master/usuarios');

    logAuditEvent({
      usuarioId: admin.id,
      acao: !currentStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entidade: 'usuarios',
      entidadeId: userId,
    });

    return {
      success: true,
      message: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro interno no servidor: ${err?.message || 'Erro desconhecido'}`,
    };
  }
}

export async function aceitarTermosAction(): Promise<UserActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const supabase = await createServerClient();
    const { error } = await (supabase as any)
      .from('usuarios')
      .update({ aceite_termos_em: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao gravar aceite:', error);
      return { success: false, message: 'Erro ao gravar aceite. Tente novamente.' };
    }

    return { success: true, message: 'Termos aceitos com sucesso.' };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro interno no servidor: ${err?.message || 'Erro desconhecido'}`,
    };
  }
}

export async function deleteUserAction(userId: string): Promise<UserActionState> {
  try {
    const admin = await getCurrentUser();
    // Only master or platform_admin can delete
    if (!admin || (admin.role !== 'master' && admin.role !== 'platform_admin')) {
      return { success: false, message: 'Apenas Administradores (Master/Platform Admin) podem excluir contas definitivamente.' };
    }

    const idCheck = userIdSchema.safeParse(userId);
    if (!idCheck.success) {
      return { success: false, message: idCheck.error.issues[0].message };
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return { success: false, message: 'Configuração de Service Role Key ausente.' };
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Erro ao excluir usuário:', error);
      return { success: false, message: 'Erro ao excluir o usuário. Tente novamente.' };
    }

    revalidatePath('/admin-master/usuarios');

    logAuditEvent({
      usuarioId: admin.id,
      acao: 'USER_DELETED',
      entidade: 'usuarios',
      entidadeId: userId,
      payload: { deletedUserId: userId },
    });

    return { success: true, message: 'Usuário excluído definitivamente com sucesso.' };
  } catch (err: any) {
    console.error('Erro interno ao excluir usuário:', err);
    return { success: false, message: 'Erro interno. Tente novamente.' };
  }
}



