'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';

const planoIdSchema = z.string().uuid('ID de plano inválido.');

const updateEmpresaAdminSchema = z.object({
  empresaId: z.string().uuid('ID inválido.'),
  nome_empresa: z.string().min(2, 'Nome da empresa é obrigatório.'),
  plano_id: z.string().uuid().nullable().optional(),
  status: z.enum(['ativo', 'suspenso'], { message: 'Status inválido.' }),
});

const updateFaturamentoSchema = z.object({
  empresaId: z.string().uuid('ID inválido.'),
  status_pagamento: z.enum(['em_dia', 'pendente', 'atrasado'], { message: 'Status de pagamento inválido.' }),
  data_vencimento: z.string().nullable().optional(),
});

const savePlanoSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, 'Nome do plano é obrigatório.'),
  limite_gerentes: z.number().int().min(1, 'Limite de gerentes deve ser pelo menos 1.'),
  features: z.record(z.string(), z.unknown()),
});

export type AdminActionState = {
  success: boolean;
  message: string;
};

/**
 * Atualiza dados cadastrais de uma empresa (nome, plano, status).
 * Registra auditoria com evento específico para suspensões/reativações.
 */
export async function updateEmpresaAdminAction(
  data: { empresaId: string; nome_empresa: string; plano_id: string | null; status: string }
): Promise<AdminActionState & { empresa?: any }> {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'master') {
      return { success: false, message: 'Acesso negado.' };
    }

    const parsed = updateEmpresaAdminSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { empresaId, nome_empresa, plano_id, status } = parsed.data;
    const supabase = await createClient();

    const { data: empresaAtual } = await (supabase as any)
      .from('empresas')
      .select('status')
      .eq('id', empresaId)
      .single();

    const { data: updated, error } = await (supabase as any)
      .from('empresas')
      .update({ nome_empresa, plano_id: plano_id || null, status })
      .eq('id', empresaId)
      .select('*, planos(id, nome)')
      .single();

    if (error) {
      console.error('Erro ao atualizar empresa:', error);
      return { success: false, message: 'Erro ao atualizar empresa. Tente novamente.' };
    }

    const statusMudou = empresaAtual && empresaAtual.status !== status;
    logAuditEvent({
      usuarioId: admin.id,
      acao: statusMudou
        ? status === 'suspenso' ? 'EMPRESA_SUSPENSA' : 'EMPRESA_REATIVADA'
        : 'EMPRESA_ATUALIZADA',
      entidade: 'empresas',
      entidadeId: empresaId,
      payload: { nome_empresa, plano_id, status, statusAnterior: empresaAtual?.status },
    });

    revalidatePath('/admin-master/empresas');
    return { success: true, message: 'Empresa atualizada com sucesso!', empresa: updated };
  } catch (err: any) {
    console.error('Erro interno ao atualizar empresa:', err);
    return { success: false, message: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Cria ou atualiza um plano. Registra auditoria.
 */
export async function savePlanoAction(
  data: { id?: string; nome: string; limite_gerentes: number; features: Record<string, unknown> }
): Promise<AdminActionState & { plano?: any }> {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'master') {
      return { success: false, message: 'Acesso negado.' };
    }

    const parsed = savePlanoSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { id, nome, limite_gerentes, features } = parsed.data;
    const supabase = await createClient();

    if (id) {
      const { data: updated, error } = await (supabase as any)
        .from('planos')
        .update({ nome, limite_gerentes, features })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar plano:', error);
        return { success: false, message: 'Erro ao atualizar plano. Tente novamente.' };
      }

      logAuditEvent({
        usuarioId: admin.id,
        acao: 'PLANO_ATUALIZADO',
        entidade: 'planos',
        entidadeId: id,
        payload: { nome, limite_gerentes },
      });

      revalidatePath('/admin-master/planos');
      return { success: true, message: 'Plano atualizado com sucesso!', plano: updated };
    } else {
      const { data: inserted, error } = await (supabase as any)
        .from('planos')
        .insert({ nome, limite_gerentes, features })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar plano:', error);
        return { success: false, message: 'Erro ao criar plano. Tente novamente.' };
      }

      logAuditEvent({
        usuarioId: admin.id,
        acao: 'PLANO_CRIADO',
        entidade: 'planos',
        entidadeId: inserted?.id,
        payload: { nome, limite_gerentes },
      });

      revalidatePath('/admin-master/planos');
      return { success: true, message: 'Plano criado com sucesso!', plano: inserted };
    }
  } catch (err: any) {
    console.error('Erro interno ao salvar plano:', err);
    return { success: false, message: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Exclui um plano. Registra auditoria com nome do plano.
 */
export async function deletePlanoAction(planoId: string): Promise<AdminActionState> {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'master') {
      return { success: false, message: 'Acesso negado.' };
    }

    const idCheck = planoIdSchema.safeParse(planoId);
    if (!idCheck.success) {
      return { success: false, message: idCheck.error.issues[0].message };
    }

    const supabase = await createClient();

    const { data: plano } = await (supabase as any)
      .from('planos')
      .select('nome')
      .eq('id', planoId)
      .single();

    const { error } = await (supabase as any)
      .from('planos')
      .delete()
      .eq('id', planoId);

    if (error) {
      console.error('Erro ao excluir plano:', error);
      return { success: false, message: 'Erro ao excluir plano. Tente novamente.' };
    }

    logAuditEvent({
      usuarioId: admin.id,
      acao: 'PLANO_EXCLUIDO',
      entidade: 'planos',
      entidadeId: planoId,
      payload: { nome: plano?.nome },
    });

    revalidatePath('/admin-master/planos');
    return { success: true, message: 'Plano excluído com sucesso!' };
  } catch (err: any) {
    console.error('Erro interno ao excluir plano:', err);
    return { success: false, message: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Atualiza status_pagamento e data_vencimento de uma empresa. Registra auditoria.
 */
export async function updateFaturamentoAction(
  data: { empresaId: string; status_pagamento: string; data_vencimento: string | null }
): Promise<AdminActionState & { empresa?: any }> {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'master') {
      return { success: false, message: 'Acesso negado.' };
    }

    const parsed = updateFaturamentoSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { empresaId, status_pagamento, data_vencimento } = parsed.data;
    const supabase = await createClient();

    const { data: updated, error } = await (supabase as any)
      .from('empresas')
      .update({ status_pagamento, data_vencimento: data_vencimento || null })
      .eq('id', empresaId)
      .select('id, nome_empresa, plano_id, status_pagamento, data_vencimento, status, planos(id, nome, features)')
      .single();

    if (error) {
      console.error('Erro ao atualizar faturamento:', error);
      return { success: false, message: 'Erro ao atualizar faturamento. Tente novamente.' };
    }

    logAuditEvent({
      usuarioId: admin.id,
      acao: 'FATURAMENTO_ATUALIZADO',
      entidade: 'empresas',
      entidadeId: empresaId,
      payload: { status_pagamento, data_vencimento },
    });

    revalidatePath('/admin-master/planos');
    return { success: true, message: 'Faturamento atualizado com sucesso!', empresa: updated };
  } catch (err: any) {
    console.error('Erro interno ao atualizar faturamento:', err);
    return { success: false, message: 'Erro interno. Tente novamente.' };
  }
}
