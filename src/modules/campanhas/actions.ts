'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

export type ActionState = {
  success: boolean;
  message: string | null;
  errors?: Record<string, string>;
};

export async function createCampanhaAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  const nome = formData.get('nome') as string;
  const data_inicio = formData.get('data_inicio') as string;
  const data_fim = formData.get('data_fim') as string;
  const segmentos = formData.getAll('segmentos') as string[];
  const desconto_taxa_adm = Number(formData.get('desconto_taxa_adm') || 0);
  const desconto_primeira_parcela = Number(formData.get('desconto_primeira_parcela') || 0);
  const reducao_meia_parcela_qtd = Number(formData.get('reducao_meia_parcela_qtd') || 0);

  if (!nome || !data_inicio || !data_fim || segmentos.length === 0) {
    return { success: false, message: 'Preencha os campos obrigatórios (Nome, Data Inicial, Data Final e Segmentos).' };
  }

  const { error } = await supabase
    .from('campanhas')
    .insert({
      nome,
      data_inicio,
      data_fim,
      segmentos,
      desconto_taxa_adm,
      desconto_primeira_parcela,
      reducao_meia_parcela_qtd,
      status: true
    });

  if (error) {
    console.error('Erro ao criar campanha:', error);
    return { success: false, message: 'Erro ao criar campanha.' };
  }

  logAuditEvent({
    usuarioId: user.id,
    acao: 'CREATE_CAMPANHA',
    entidade: 'campanhas',
    payload: { nome }
  });

  revalidatePath('/admin-master/campanhas');
  return { success: true, message: 'Campanha criada com sucesso!' };
}

export async function toggleCampanhaStatusAction(campanhaId: string, currentStatus: boolean): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Não autorizado' };

  const { error } = await supabase
    .from('campanhas')
    .update({ status: !currentStatus })
    .eq('id', campanhaId);

  if (error) {
    return { success: false, message: 'Erro ao atualizar status.' };
  }

  revalidatePath('/admin-master/campanhas');
  return { success: true, message: 'Status atualizado.' };
}

export async function deleteCampanhaAction(campanhaId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Não autorizado' };

  const { error } = await supabase
    .from('campanhas')
    .delete()
    .eq('id', campanhaId);

  if (error) {
    return { success: false, message: 'Erro ao excluir campanha.' };
  }

  revalidatePath('/admin-master/campanhas');
  return { success: true, message: 'Campanha excluída.' };
}
