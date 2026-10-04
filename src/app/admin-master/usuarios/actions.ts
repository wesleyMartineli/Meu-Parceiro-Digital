'use server';

import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

export type ActionState = {
  success: boolean;
  message: string;
};

export async function changeUserPasswordAction(userId: string, newPassword: string): Promise<ActionState> {
  try {
    const admin = await getCurrentUser();
    // Apenas Master ou Platform Admin podem trocar senhas
    if (!admin || (admin.role !== 'master' && admin.role !== 'platform_admin')) {
      return { success: false, message: 'Acesso negado. Apenas administradores podem realizar esta ação.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    // Usar a chave de serviço (Service Role) para conseguir alterar os dados de Auth
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Erro ao atualizar senha no Auth:', error);
      return { success: false, message: `Erro ao alterar senha: ${error.message}` };
    }

    // Registrar a ação na auditoria (se existir a funcionalidade)
    try {
      await logAuditEvent({
        usuarioId: admin.id,
        acao: 'SENHA_ALTERADA_ADMIN',
        entidade: 'usuarios',
        entidadeId: userId,
        payload: { message: 'Senha alterada pelo administrador' },
      });
    } catch (auditError) {
      console.error('Erro ao registrar auditoria:', auditError);
      // Não falha a ação se a auditoria falhar
    }

    return { success: true, message: 'Senha alterada com sucesso!' };
  } catch (error: any) {
    console.error('Erro inesperado ao alterar senha:', error);
    return { success: false, message: 'Erro interno ao alterar a senha. Tente novamente.' };
  }
}
