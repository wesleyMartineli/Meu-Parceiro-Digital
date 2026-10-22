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
  negocioIdSchema,
  fecharNegocioUnificadoSchema,
  toggleFollowupStatusSchema,
  unificarNegociosSchema,
  updateLeadSchema,
  updateNegocioStageSchema,
  updateParceiroStageSchema,
} from './schemas';
import {
  generateCommercialRecommendations,
  ExistingTask,
  LeadData,
  PropostaData,
  NegocioCrmData,
  CommercialRecommendation,
  CapacityAnalysis,
} from './recommendationEngine';
import { parseCommercialIntent, buildAssistantResponse } from './intentParser';

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

    // Prevenção contra duplicidade de parceiros
    const normalizedNome = nome.trim();
    const { data: existingByName } = await (supabase as any)
      .from('leads')
      .select('id, nome')
      .eq('empresa_id', resolvedEmpresaId)
      .ilike('nome', normalizedNome)
      .limit(1);

    if (existingByName && existingByName.length > 0) {
      return {
        success: false,
        message: `Já existe um parceiro cadastrado com o nome "${existingByName[0].nome}".`,
      };
    }

    if (codigoPv && codigoPv.trim()) {
      const normalizedPv = codigoPv.trim();
      const { data: existingByPv } = await (supabase as any)
        .from('leads')
        .select('id, nome')
        .eq('empresa_id', resolvedEmpresaId)
        .eq('codigo_pv', normalizedPv)
        .limit(1);

      if (existingByPv && existingByPv.length > 0) {
        return {
          success: false,
          message: `O código PV "${normalizedPv}" já está vinculado ao parceiro "${existingByPv[0].nome}".`,
        };
      }
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

    revalidatePath('/crm');
    revalidatePath('/clientes');
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
      else if (newStage === 'fechado_ganho' || newStage === 'ganho') novoStatusProposta = 'aceita';
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
 * Exclui uma tarefa / compromisso da agenda (followup)
 */
export async function deleteFollowupAction(
  followupId: string,
  leadId?: string
): Promise<CRMActionState> {
  try {
    if (!followupId) {
      return { success: false, message: 'ID do compromisso é obrigatório.' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const supabase = await createClient();

    let query = (supabase as any)
      .from('followups')
      .delete()
      .eq('id', followupId);

    if (user.role === 'gerente_negocio') {
      query = query.eq('vendedor_id', user.id);
    }

    const { error } = await query;

    if (error) {
      console.error('Erro ao excluir compromisso da agenda:', error);
      return { success: false, message: 'Erro ao excluir compromisso. Tente novamente.' };
    }

    if (leadId) {
      revalidatePath(`/crm/${leadId}`);
    }
    revalidatePath('/tarefas');
    revalidatePath('/dashboard');
    return { success: true, message: 'Compromisso excluído com sucesso!' };
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

    let finalTitulo = titulo?.trim();
    if (!finalTitulo) {
      const { data: leadData } = await (supabase as any)
        .from('leads')
        .select('nome')
        .eq('id', clienteId)
        .maybeSingle();
      const nomeCliente = leadData?.nome || 'Cliente';
      const produtoNome = modalidade || 'Oportunidade';
      finalTitulo = `${nomeCliente} - ${produtoNome} - R$ ${Number(credito || 0).toLocaleString('pt-BR')}`;
    }

    const negocioPayload = {
      empresa_id: user.empresa_id || '43605699-aaf9-4caf-872a-2526e728ddd6',
      cliente_id: clienteId,
      vendedor_id: user.id,
      titulo: finalTitulo,
      credito,
      modalidade: modalidade || 'Geral',
      etapa_funil: etapaFunil || 'oportunidades',
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

    // Se o parceiro foi migrado para inativo, exclui tudo o que ele movimentou de negócios e propostas
    if (newStage === 'inativo') {
      const { error: delNegociosError } = await (supabase as any)
        .from('negocios_crm')
        .delete()
        .eq('cliente_id', leadId);

      if (delNegociosError) {
        console.error('Erro ao excluir negócios do parceiro inativo:', delNegociosError);
      }

      const { error: delPropostasError } = await (supabase as any)
        .from('propostas')
        .delete()
        .eq('lead_id', leadId);

      if (delPropostasError) {
        console.error('Erro ao excluir propostas do parceiro inativo:', delPropostasError);
      }
    }

    revalidatePath('/clientes');
    revalidatePath('/crm');
    revalidatePath('/dashboard');
    revalidatePath('/relatorios');
    revalidatePath('/propostas');
    return { success: true, message: 'Etapa atualizada com sucesso.' };
  } catch (err: any) {
    console.error('Unhandled exception in updateParceiroStageAction:', err);
    return { success: false, message: 'Erro interno ao atualizar a etapa.' };
  }
}

/**
 * Exclui ou cancela um negócio e remove a proposta vinculada, se houver.
 */
export async function deleteNegocioAction(
  negocioId: string
): Promise<CRMActionState> {
  try {
    const parsed = negocioIdSchema.safeParse(negocioId);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const supabase = await createClient();

    // 1. Busca o negócio para obter proposta_id
    const { data: negocio, error: fetchErr } = await (supabase as any)
      .from('negocios_crm')
      .select('id, proposta_id, vendedor_id, cliente_id')
      .eq('id', negocioId)
      .maybeSingle();

    if (fetchErr || !negocio) {
      return { success: false, message: 'Negócio não encontrado.' };
    }

    // 2. Exclui o negócio
    const { error: delNegocioErr } = await (supabase as any)
      .from('negocios_crm')
      .delete()
      .eq('id', negocioId);

    if (delNegocioErr) {
      console.error('Erro ao excluir negócio:', delNegocioErr);
      return { success: false, message: 'Erro ao excluir negócio. Tente novamente.' };
    }

    // 3. Exclui proposta vinculada, se houver
    if (negocio.proposta_id) {
      const { error: delPropostaErr } = await (supabase as any)
        .from('propostas')
        .delete()
        .eq('id', negocio.proposta_id);

      if (delPropostaErr) {
        console.error('Erro ao excluir proposta vinculada:', delPropostaErr);
      }
    }

    revalidatePath('/crm');
    revalidatePath('/clientes');
    revalidatePath('/dashboard');
    revalidatePath('/relatorios');
    revalidatePath('/propostas');
    return { success: true, message: 'Negócio excluído com sucesso!' };
  } catch (err: any) {
    console.error('Unhandled exception in deleteNegocioAction:', err);
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Criação direta de acompanhamento utilizada pelo Assistente Inteligente de Agenda.
 */
export async function createFollowupDirectAction(payload: {
  leadId: string;
  titulo: string;
  descricao?: string | null;
  dataFollowup: string;
  tipo?: string;
}): Promise<CRMActionState & { followup?: any }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const parsed = createFollowupSchema.safeParse({
      leadId: payload.leadId,
      titulo: payload.titulo,
      descricao: payload.descricao,
      dataFollowup: payload.dataFollowup,
      tipo: payload.tipo,
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

    const { data: newFollowup, error } = await (supabase as any)
      .from('followups')
      .insert(followupPayload)
      .select('id, titulo, descricao, data_followup, status, tipo, created_at, leads(id, nome)')
      .single();

    if (error) {
      console.error('Erro ao agendar acompanhamento via assistente:', error);
      return { success: false, message: 'Erro ao agendar tarefa. Tente novamente.' };
    }

    revalidatePath(`/crm/${leadId}`);
    revalidatePath(`/tarefas`);
    revalidatePath(`/dashboard`);
    return { success: true, message: 'Tarefa agendada com sucesso!', followup: newFollowup };
  } catch (err: any) {
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Carrega a visão completa do Assistente Comercial (tarefas, propostas, parceiros e recomendações)
 */
export async function getCommercialAssistantOverviewAction(): Promise<{
  success: boolean;
  message?: string;
  recommendations?: CommercialRecommendation[];
  capacity?: CapacityAnalysis;
  stats?: any;
  briefing?: string;
  leads?: LeadData[];
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const supabase = await createClient();

    // 1. Tarefas existentes (followups)
    let followupsQuery = supabase
      .from('followups')
      .select('id, titulo, descricao, data_followup, status, tipo, leads(id, nome)')
      .order('data_followup', { ascending: true });

    if (user.role === 'gerente_negocio') {
      followupsQuery = followupsQuery.eq('vendedor_id', user.id);
    }
    const { data: followupsData } = await followupsQuery;

    const existingTasks: ExistingTask[] = (followupsData || []).map((t: any) => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      data_followup: t.data_followup,
      status: t.status,
      tipo: t.tipo,
      leads: t.leads ? { id: t.leads.id, nome: t.leads.nome } : undefined,
    }));

    // 2. Propostas comerciais
    let propostasQuery = (supabase as any)
      .from('propostas')
      .select(`
        id,
        created_at,
        status,
        visualizacoes,
        lead_id,
        lead:leads(nome),
        simulacao:simulacoes(credito_total, produto)
      `)
      .order('created_at', { ascending: false });

    if (user.role === 'gerente_negocio') {
      propostasQuery = propostasQuery.eq('vendedor_id', user.id);
    }
    const { data: propostasData } = await propostasQuery;

    const propostas: PropostaData[] = (propostasData || []).map((p: any) => ({
      id: p.id,
      lead_id: p.lead_id,
      lead_nome: p.lead?.nome,
      status: p.status,
      created_at: p.created_at,
      visualizacoes: p.visualizacoes || 0,
      credito_total: p.simulacao?.credito_total,
      produto: p.simulacao?.produto,
    }));

    // 3. Leads / Parceiros da carteira com negócios e atividades agregados
    let leadsQuery = supabase
      .from('leads')
      .select(`
        id,
        nome,
        tipo_parceiro,
        etapa_funil,
        telefone,
        cidade,
        estado,
        created_at,
        updated_at,
        negocios_crm (
          id,
          credito,
          etapa_funil,
          titulo
        )
      `)
      .order('nome', { ascending: true });

    if (user.role === 'gerente_negocio') {
      leadsQuery = leadsQuery.eq('vendedor_id', user.id);
    }
    const { data: leadsData } = await leadsQuery;

    const leads: LeadData[] = (leadsData || []).map((l: any) => {
      const negs = l.negocios_crm || [];
      const totalNegocios = negs.length;
      const volumeCredito = negs.reduce((acc: number, n: any) => acc + (Number(n.credito) || 0), 0);
      const totalTarefas = (followupsData || []).filter((t: any) => t.lead_id === l.id || t.leads?.id === l.id).length;
      const totalPropostas = (propostasData || []).filter((p: any) => p.lead_id === l.id).length;
      return {
        id: l.id,
        nome: l.nome,
        tipo_parceiro: l.tipo_parceiro,
        etapa_funil: l.etapa_funil,
        telefone: l.telefone,
        cidade: l.cidade,
        estado: l.estado,
        created_at: l.created_at,
        updated_at: l.updated_at,
        totalNegocios,
        volumeCredito,
        totalTarefas,
        totalPropostas,
      };
    });

    // 4. Negócios CRM
    let crmQuery = (supabase as any)
      .from('negocios_crm')
      .select('id, cliente_id, titulo, credito, etapa_funil, proximo_followup, ultima_interacao, leads(id, nome, telefone)');

    if (user.role === 'gerente_negocio') {
      crmQuery = crmQuery.eq('vendedor_id', user.id);
    }
    const { data: crmData } = await crmQuery;

    const engineResult = generateCommercialRecommendations({
      existingTasks,
      leads,
      propostas,
      negocios: crmData || [],
      referenceDate: new Date(),
      closingConfig: { startDayOfMonth: 24, enabled: true },
    });

    const briefingPayload = buildAssistantResponse(
      { intent: 'PROACTIVE_BRIEFING', confidence: 1, matchedKeywords: [] },
      engineResult.recommendations,
      engineResult.capacitySummary,
      engineResult.stats
    );

    return {
      success: true,
      recommendations: engineResult.recommendations,
      capacity: engineResult.capacitySummary,
      stats: engineResult.stats,
      briefing: briefingPayload.messageText,
      leads,
    };
  } catch (error: any) {
    console.error('Erro ao gerar visão do assistente comercial:', error);
    return { success: false, message: error?.message || 'Erro ao carregar dados comerciais.' };
  }
}

/**
 * Processa a pergunta do usuário para o assistente comercial
 */
export async function queryCommercialAssistantAction(userInput: string): Promise<{
  success: boolean;
  message?: string;
  responsePayload?: {
    messageText: string;
    filteredRecommendations: CommercialRecommendation[];
    actionPills: { label: string; query: string }[];
  };
}> {
  try {
    const overview = await getCommercialAssistantOverviewAction();
    if (!overview.success || !overview.recommendations || !overview.capacity) {
      return { success: false, message: overview.message || 'Erro ao processar consulta comercial.' };
    }

    const intent = parseCommercialIntent(userInput);

    const responsePayload = buildAssistantResponse(
      intent,
      overview.recommendations,
      overview.capacity,
      overview.stats || {
        totalPropostasParadas: 0,
        totalParceirosInativos: 0,
        totalOportunidadesCrm: 0,
        diasBloqueadosSemana: 0,
      },
      (overview as any).leads || []
    );

    return {
      success: true,
      responsePayload,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro ao consultar assistente.' };
  }
}

/**
 * Registra a interação do GN com uma recomendação (auditoria e métricas)
 */
export async function logAssistantRecommendationAction(payload: {
  recommendationId: string;
  action: 'aceitar' | 'rejeitar' | 'reagendar';
  leadId?: string;
  tipo?: string;
  dataSugerida?: string;
  motivo?: string;
}): Promise<CRMActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Não autenticado' };

    // Tenta registrar na tabela audit_logs (já existente no sistema)
    const supabase = await createClient();
    try {
      await (supabase as any).from('audit_logs').insert({
        usuario_id: user.id,
        acao: `assistente_recomendacao_${payload.action}`,
        tabela: 'followups',
        detalhes: {
          recommendationId: payload.recommendationId,
          leadId: payload.leadId,
          tipo: payload.tipo,
          dataSugerida: payload.dataSugerida,
          motivo: payload.motivo,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Ignora silenciosamente caso audit_logs tenha schema restritivo
    }

    return { success: true, message: 'Interação registrada' };
  } catch {
    return { success: false, message: 'Erro ao registrar interação' };
  }
}

/**
 * Unifica múltiplos negócios/propostas de um mesmo parceiro/cliente em um único negócio consolidado.
 * Se os valores forem divergentes, calcula automaticamente a média das propostas.
 */
export async function unificarNegociosAction(payload: {
  clienteId: string;
  negocioIds: string[];
  valorDefinido?: number;
  tituloPersonalizado?: string;
}): Promise<CRMActionState & { negocioUnificadoId?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const parsed = unificarNegociosSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { clienteId, negocioIds, valorDefinido, tituloPersonalizado } = parsed.data;
    const supabase = await createClient();

    // 1. Busca os negócios selecionados para validar que pertencem ao mesmo cliente
    const { data: negocios, error: fetchErr } = await (supabase.from('negocios_crm') as any)
      .select('id, cliente_id, proposta_id, titulo, credito, modalidade, administradora, etapa_funil, created_at')
      .in('id', negocioIds)
      .eq('cliente_id', clienteId);

    if (fetchErr || !negocios || negocios.length < 2) {
      return { success: false, message: 'Não foi possível encontrar as propostas selecionadas para este parceiro.' };
    }

    // 2. Busca dados do parceiro/lead
    const { data: leadData } = await (supabase.from('leads') as any)
      .select('nome')
      .eq('id', clienteId)
      .maybeSingle();

    const nomeLead = leadData?.nome || 'Cliente';

    // 3. Cálculo de média ou valor definido
    const valores = negocios.map((n: any) => Number(n.credito || 0));
    const media = Math.round(valores.reduce((acc: number, val: number) => acc + val, 0) / valores.length);
    const valorConsolidado = valorDefinido !== undefined && valorDefinido > 0 ? valorDefinido : media;

    // Etapas ordenadas por avanço
    const hierarquiaEtapas = [
      'oportunidades',
      'simulacao_criada',
      'proposta_enviada',
      'negociacao',
      'pre_fechamento',
      'fechado_ganho',
      'perdido',
    ];
    let melhorEtapa = 'simulacao_criada';
    let melhorIndex = -1;
    for (const neg of negocios) {
      const idx = hierarquiaEtapas.indexOf(neg.etapa_funil);
      if (idx > melhorIndex && neg.etapa_funil !== 'perdido') {
        melhorIndex = idx;
        melhorEtapa = neg.etapa_funil;
      }
    }

    // Monta o snapshot das propostas unificadas
    const propostasUnificadas = negocios.map((n: any) => ({
      negocio_id: n.id,
      proposta_id: n.proposta_id,
      titulo: n.titulo,
      credito: Number(n.credito || 0),
      modalidade: n.modalidade,
      administradora: n.administradora,
      etapa_funil: n.etapa_funil,
      created_at: n.created_at,
    }));

    const tituloFinal =
      tituloPersonalizado?.trim() ||
      `${nomeLead} - Negociação Unificada (${negocios.length} cenários) - R$ ${valorConsolidado.toLocaleString('pt-BR')}`;

    // Elegemos o primeiro negócio como principal (priorizando o que já tem proposta_id)
    const sortedNegocios = [...negocios].sort((a: any, b: any) => (b.proposta_id ? 1 : 0) - (a.proposta_id ? 1 : 0));
    const primaryNegocio = sortedNegocios[0];
    const subsumedIds = sortedNegocios.slice(1).map((n: any) => n.id);

    // 4. Atualiza o negócio principal
    const { error: updateErr } = await (supabase.from('negocios_crm') as any)
      .update({
        titulo: tituloFinal,
        credito: valorConsolidado,
        valor_medio: media,
        is_unificado: true,
        propostas_unificadas: propostasUnificadas,
        etapa_funil: melhorEtapa,
        updated_at: new Date().toISOString(),
      })
      .eq('id', primaryNegocio.id);

    if (updateErr) {
      console.error('Erro ao atualizar negócio unificado:', updateErr);
      return { success: false, message: 'Erro ao consolidar negócio unificado.' };
    }

    // 5. Aponta as propostas dos negócios secundários para o negócio principal
    if (subsumedIds.length > 0) {
      await (supabase.from('propostas') as any)
        .update({ negocio_id: primaryNegocio.id })
        .in('negocio_id', subsumedIds);

      // Remove os negócios secundários para não inflar o pipeline
      await (supabase.from('negocios_crm') as any)
        .delete()
        .in('id', subsumedIds);
    }

    revalidatePath('/crm');
    revalidatePath('/dashboard');
    revalidatePath('/relatorios');
    revalidatePath('/propostas');

    return {
      success: true,
      message: `Propostas unificadas com sucesso! Valor consolidado: R$ ${valorConsolidado.toLocaleString('pt-BR')}`,
      negocioUnificadoId: primaryNegocio.id,
    };
  } catch (err: any) {
    console.error('Erro interno ao unificar negócios:', err);
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}

/**
 * Fecha um negócio unificado permitindo escolher o valor exato final fechado
 * (seja o valor original de uma das propostas ou a média).
 */
export async function fecharNegocioUnificadoAction(payload: {
  negocioId: string;
  valorFinal: number;
  propostaFechadaId?: string | null;
}): Promise<CRMActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const parsed = fecharNegocioUnificadoSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { negocioId, valorFinal, propostaFechadaId } = parsed.data;
    const supabase = await createClient();

    const { error: updateErr } = await (supabase.from('negocios_crm') as any)
      .update({
        etapa_funil: 'fechado_ganho',
        credito: valorFinal,
        valor_fechamento: valorFinal,
        proposta_fechada_id: propostaFechadaId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', negocioId);

    if (updateErr) {
      console.error('Erro ao fechar negócio unificado:', updateErr);
      return { success: false, message: 'Erro ao registrar fechamento do negócio.' };
    }

    if (propostaFechadaId) {
      await (supabase.from('propostas') as any)
        .update({ status: 'aceita' })
        .eq('id', propostaFechadaId);
    }

    revalidatePath('/crm');
    revalidatePath('/dashboard');
    revalidatePath('/relatorios');
    revalidatePath('/propostas');

    return {
      success: true,
      message: `Negócio fechado e registrado com sucesso em Fechado / Ganho por R$ ${valorFinal.toLocaleString('pt-BR')}!`,
    };
  } catch (err: any) {
    console.error('Erro ao fechar negócio:', err);
    return { success: false, message: `Erro interno: ${err?.message || 'Erro desconhecido'}` };
  }
}



