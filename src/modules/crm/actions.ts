'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/helpers';
import {
  appendObservationSchema,
  createFollowupSchema,
  createLeadSchema,
  createNegocioManualSchema,
  leadIdSchema,
  toggleFollowupStatusSchema,
  updateLeadSchema,
  updateNegocioStageSchema,
  updateParceiroStageSchema,
} from './schemas';

export type CRMActionState = {
  success: boolean;
  message: string | null;
};

/**
 * Confere se um lead pertence à empresa informada (defesa contra IDOR).
 */
async function leadPertenceAEmpresa(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
  _empresaId: string | null,
): Promise<boolean> {
  const { data } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    
    .maybeSingle();
  return !!data;
}

/**
 * Confere se um ponto_venda (usuário) pertence à empresa informada (defesa contra IDOR).
 */
async function ponto_vendaPertenceAEmpresa(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ponto_venda_id: string,
  _empresaId: string | null,
): Promise<boolean> {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', ponto_venda_id)
    
    .maybeSingle();
  return !!data;
}

/**
 * Creates a new lead inside the active tenant company.
 */
export async function createLeadAction(
  prevState: CRMActionState,
  formData: FormData
): Promise<CRMActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }
    

    const parsed = createLeadSchema.safeParse({
      nome: formData.get('nome') as string,
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string,
      etapaFunil: formData.get('etapa_funil') as string,
      origem: formData.get('origem') as string,
      observacoes: formData.get('observacoes') as string,
      gerenteId: formData.get('ponto_venda_id') as string,
      tipoParceiro: formData.get('tipo_parceiro') as string,
      codigoPv: formData.get('codigo_pv') as string,
      nomeResponsavel: formData.get('nome_responsavel') as string,
      cidade: formData.get('cidade') as string,
      estado: formData.get('estado') as string,
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { nome, telefone, email, etapaFunil, origem, observacoes, gerenteId, tipoParceiro, codigoPv, nomeResponsavel, cidade, estado } = parsed.data;
    let etapa_funil = etapaFunil;
    if (!etapa_funil) {
      if (tipoParceiro === 'lead') {
        etapa_funil = 'mapeado';
      } else if (tipoParceiro === 'base') {
        etapa_funil = 'base_sem_oportunidades';
      } else {
        etapa_funil = 'sem_contato';
      }
    }

    const supabase = await createClient();

    // Determine gerenteId: if ponto_venda, force their own id. If gerente, allow selecting a seller.
    let targetGerenteId = user.id;
    if (user.role === 'superintendente' || user.role === 'master') {
      if (gerenteId) {
        const ponto_vendaValido = await ponto_vendaPertenceAEmpresa(supabase, gerenteId, "");
        if (!ponto_vendaValido) {
          return { success: false, message: 'Gerente de Negócios selecionado é inválido.' };
        }
        targetGerenteId = gerenteId;
      }
    }

    let resolvedEmpresaId = user.empresa_id;
    if (!resolvedEmpresaId || targetGerenteId !== user.id) {
      const { data: sellerData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', targetGerenteId)
        .maybeSingle();
      
      if (sellerData?.empresa_id) {
        resolvedEmpresaId = sellerData.empresa_id;
      }
    }

    if (!resolvedEmpresaId) {
      // Fallback para usuários de teste sem empresa definida
      const { data: fallbackCompany } = await supabase
        .from('empresas')
        .select('id')
        .limit(1)
        .maybeSingle();
        
      if (fallbackCompany?.id) {
        resolvedEmpresaId = fallbackCompany.id;
      }
    }

    if (!resolvedEmpresaId) {
      return { success: false, message: 'Erro: Não foi possível determinar a empresa (empresa_id) do usuário.' };
    }

    const leadPayload = {
      empresa_id: resolvedEmpresaId,
      vendedor_id: targetGerenteId,
      nome,
      email: email || null,
      telefone: telefone || null,
      etapa_funil,
      origem: origem || null,
      observacoes: observacoes || null,
      tipo_parceiro: tipoParceiro || 'base',
      codigo_pv: codigoPv || null,
      nome_responsavel: nomeResponsavel || null,
      cidade: cidade || null,
      estado: estado || null,
    };

    const { data: leadInserido, error } = await (supabase as any)
      .from('leads')
      .insert(leadPayload)
      .select('id')
      .single();

    if (error || !leadInserido) {
      console.error('Erro ao criar lead:', error);
      return { success: false, message: `Erro: ${error?.message || 'Sem dados retornados'}` };
    }

    // Criar um negócio inicial
    const negocioPayload = {
      empresa_id: resolvedEmpresaId,
      cliente_id: leadInserido.id,
      vendedor_id: targetGerenteId,
      titulo: `${nome} - Novo Contato`,
      credito: 0,
      modalidade: 'Geral',
      etapa_funil: 'novo_lead',
      origem: origem || null,
    };

    const { error: negocioError } = await (supabase as any)
      .from('negocios_crm')
      .insert(negocioPayload);

    if (negocioError) {
      console.error('Erro ao criar negócio inicial para o lead:', negocioError);
    }

    revalidatePath('/crm');
    return { success: true, message: 'Lead criado com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Updates lead details.
 */
export async function updateLeadAction(
  leadId: string,
  prevState: CRMActionState,
  formData: FormData
): Promise<CRMActionState> {
  try {
    const idCheck = leadIdSchema.safeParse(leadId);
    if (!idCheck.success) {
      return { success: false, message: idCheck.error.issues[0].message };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const parsed = updateLeadSchema.safeParse({
      nome: formData.get('nome') as string,
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string,
      origem: formData.get('origem') as string,
      observacoes: formData.get('observacoes') as string,
      gerenteId: formData.get('ponto_venda_id') as string,
      tipoParceiro: formData.get('tipo_parceiro') as string,
      codigoPv: formData.get('codigo_pv') as string,
      nomeResponsavel: formData.get('nome_responsavel') as string,
      cidade: formData.get('cidade') as string,
      estado: formData.get('estado') as string,
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { nome, telefone, email, origem, observacoes, gerenteId, tipoParceiro, codigoPv, nomeResponsavel, cidade, estado } = parsed.data;

    const supabase = await createClient();

    const updatePayload: any = {
      nome,
      email: email || null,
      telefone: telefone || null,
      origem: origem || null,
      observacoes: observacoes || null,
      tipo_parceiro: tipoParceiro || 'base',
      codigo_pv: codigoPv || null,
      nome_responsavel: nomeResponsavel || null,
      cidade: cidade || null,
      estado: estado || null,
    };

    // Only allow changing ponto_venda if gerente or platform admin
    if (user.role === 'superintendente' || user.role === 'master') {
      if (gerenteId && user.id) {
        const ponto_vendaValido = await ponto_vendaPertenceAEmpresa(supabase, gerenteId, user.id);
        if (!ponto_vendaValido) {
          return { success: false, message: 'Gerente de Negócios selecionado é inválido.' };
        }
      }
      updatePayload.ponto_venda_id = gerenteId || null;
    }

    let query = (supabase as any)
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId);

    

    const { error } = await query;

    if (error) {
      console.error('Erro ao atualizar lead:', error);
      return { success: false, message: 'Erro ao atualizar lead. Tente novamente.' };
    }

    revalidatePath('/crm');
    revalidatePath(`/crm/${leadId}`);
    return { success: true, message: 'Lead atualizado com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Quick update of a negocio's funnel stage (used for Kanban dragging/clicking).
 */
export async function updateNegocioStageAction(
  negocioId: string,
  newStage: string,
  propostaId?: string | null
): Promise<CRMActionState> {
  try {
    const parsed = updateNegocioStageSchema.safeParse({ negocioId, newStage, propostaId });
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const supabase = await createClient();

    let query = (supabase as any)
      .from('negocios_crm')
      .update({ etapa_funil: newStage })
      .eq('id', negocioId);

    

    const { error } = await query;

    if (error) {
      console.error('Erro ao mover negócio:', error);
      return { success: false, message: 'Erro ao mover negócio. Tente novamente.' };
    }

    // Automação: Sincronizar com proposta, se houver
    if (propostaId) {
      let novoStatusProposta = '';
      if (newStage === 'proposta_enviada') novoStatusProposta = 'enviada';
      else if (newStage === 'fechado_ganho') novoStatusProposta = 'aceita';
      else if (newStage === 'perdido') novoStatusProposta = 'recusada';

      if (novoStatusProposta) {
        let propostaQuery = (supabase as any)
          .from('propostas')
          .update({ status: novoStatusProposta })
          .eq('id', propostaId);

        

        await propostaQuery;
      }
    }

    revalidatePath('/crm');
    return { success: true, message: 'Negócio movido com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Creates a scheduled followup task for a lead.
 */
export async function createFollowupAction(
  prevState: CRMActionState,
  formData: FormData
): Promise<CRMActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }
    

    const parsed = createFollowupSchema.safeParse({
      leadId: formData.get('lead_id') as string,
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
      dataFollowup: formData.get('data_followup') as string,
      tipo: formData.get('tipo') as string,
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { leadId, titulo, descricao, dataFollowup, tipo } = parsed.data;

    const supabase = await createClient();

    const leadValido = await leadPertenceAEmpresa(supabase, leadId, "");
    if (!leadValido) {
      return { success: false, message: 'Lead inválido para esta empresa.' };
    }

    const followupPayload = {
      lead_id: leadId,
      vendedor_id: user.id,
      empresa_id: user.empresa_id || '43605699-aaf9-4caf-872a-2526e728ddd6',
      titulo,
      descricao: descricao || null,
      data_followup: new Date(dataFollowup).toISOString(),
      status: 'pendente',
      tipo: tipo || 'outros',
    };

    const { error } = await (supabase as any)
      .from('followups')
      .insert(followupPayload);

    if (error) {
      console.error('Erro ao agendar acompanhamento:', error);
      return { success: false, message: 'Erro ao agendar tarefa. Tente novamente.' };
    }

    revalidatePath(`/crm/${leadId}`);
    revalidatePath(`/tarefas`);
    revalidatePath(`/dashboard`);
    return { success: true, message: 'Acompanhamento agendado com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Toggles a followup task status between 'pendente' and 'concluido'.
 */
export async function toggleFollowupStatusAction(
  followupId: string,
  leadId: string,
  currentStatus: string
): Promise<CRMActionState> {
  try {
    const parsed = toggleFollowupStatusSchema.safeParse({ followupId, leadId, currentStatus });
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const supabase = await createClient();
    const newStatus = currentStatus === 'pendente' ? 'concluido' : 'pendente';

    let query = (supabase as any)
      .from('followups')
      .update({ status: newStatus })
      .eq('id', followupId);

    

    const { error } = await query;

    if (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      return { success: false, message: 'Erro ao atualizar tarefa. Tente novamente.' };
    }

    revalidatePath(`/crm/${leadId}`);
    return { success: true, message: `Tarefa marcada como ${newStatus === 'concluido' ? 'concluída' : 'pendente'}!` };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Cria um negócio manualmente para um cliente existente.
 */
export async function createNegocioManualAction(
  prevState: CRMActionState,
  formData: FormData
): Promise<CRMActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }
    

    const parsed = createNegocioManualSchema.safeParse({
      clienteId: formData.get('cliente_id') as string,
      titulo: formData.get('titulo') as string,
      modalidade: formData.get('modalidade') as string,
      credito: Number(formData.get('credito') || 0),
      etapaFunil: formData.get('etapa_funil') as string,
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { clienteId, titulo, modalidade, credito, etapaFunil } = parsed.data;

    const supabase = await createClient();

    const clienteValido = await leadPertenceAEmpresa(supabase, clienteId, "");
    if (!clienteValido) {
      return { success: false, message: 'Cliente inválido para esta empresa.' };
    }

    const negocioPayload = {
      empresa_id: user.empresa_id || '43605699-aaf9-4caf-872a-2526e728ddd6',
      cliente_id: clienteId,
      vendedor_id: user.id,
      titulo,
      credito,
      modalidade: modalidade || 'Geral',
      etapa_funil: etapaFunil || 'novo_lead',
    };

    const { error: negocioError } = await (supabase as any)
      .from('negocios_crm')
      .insert(negocioPayload);

    if (negocioError) {
      console.error('Erro ao criar negócio:', negocioError);
      return { success: false, message: 'Erro ao criar negócio. Tente novamente.' };
    }

    revalidatePath('/crm');
    return { success: true, message: 'Negócio criado com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Appends a new observation to a lead's observacoes field.
 */
export async function appendObservationAction(
  prevState: CRMActionState,
  formData: FormData
): Promise<CRMActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const parsed = appendObservationSchema.safeParse({
      leadId: formData.get('lead_id') as string,
      novaObservacao: formData.get('nova_observacao') as string,
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { leadId, novaObservacao } = parsed.data;

    const supabase = await createClient();

    // 1. Fetch current observacoes
    let fetchQuery = (supabase as any)
      .from('leads')
      .select('observacoes')
      .eq('id', leadId);

    

    const { data: lead, error: fetchError } = await fetchQuery.single();

    if (fetchError || !lead) {
      return { success: false, message: 'Lead não encontrado.' };
    }

    // 2. Append new observation
    const timestamp = new Date().toLocaleString('pt-BR');
    const observacaoFormatada = `[${timestamp}] ${novaObservacao}`;
    const observacoesAtualizadas = lead.observacoes
      ? `${lead.observacoes}\n\n${observacaoFormatada}`
      : observacaoFormatada;

    // 3. Update
    let updateQuery = (supabase as any)
      .from('leads')
      .update({ observacoes: observacoesAtualizadas })
      .eq('id', leadId);

    

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Erro ao adicionar observação:', updateError);
      return { success: false, message: 'Erro ao salvar observação. Tente novamente.' };
    }

    revalidatePath(`/crm/${leadId}`);
    return { success: true, message: 'Observação adicionada com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

export async function updateParceiroStageAction(
  leadId: string,
  newStage: string,
): Promise<CRMActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const parsed = updateParceiroStageSchema.safeParse({
      leadId,
      newStage,
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Check ownership
    const pertence = await leadPertenceAEmpresa(supabase, leadId, user.empresa_id);
    if (!pertence) {
      return { success: false, message: 'Parceiro não encontrado ou acesso negado.' };
    }

    // Determina o tipo de parceiro baseado na etapa
    const etapasBase = ['base_gerando_oportunidades', 'base_em_nutricao', 'base_sem_oportunidades'];
    const updatePayload: any = {
      etapa_funil: newStage,
    };
    
    // Se for movido para uma etapa da base, atualizamos o tipo
    if (etapasBase.includes(newStage)) {
      updatePayload.tipo_parceiro = 'base';
    } else if (['mapeado', 'em_qualificacao', 'em_nomeacao'].includes(newStage)) {
      updatePayload.tipo_parceiro = 'lead';
    }

    const { error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId);

    if (error) {
      console.error('Erro ao atualizar etapa do parceiro:', error);
      return { success: false, message: 'Erro ao atualizar etapa do parceiro.' };
    }

    revalidatePath('/clientes');
    return { success: true, message: 'Etapa atualizada com sucesso.' };
  } catch (err: any) {
    console.error('Unhandled exception in updateParceiroStageAction:', err);
    return { success: false, message: 'Erro interno ao atualizar a etapa.' };
  }
}
