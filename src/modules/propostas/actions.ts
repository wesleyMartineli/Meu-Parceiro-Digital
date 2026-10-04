'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { revalidatePath } from 'next/cache';
import { createPropostaSchema, propostaIdSchema } from './schemas';

export type PropostaActionState = {
  success: boolean;
  message: string | null;
  propostaId?: string;
};

/**
 * Server Action para criar uma proposta comercial, fazendo upload do PDF para o Storage
 * e registrando na tabela 'propostas'.
 */
export async function createPropostaAction(payload: {
  leadId: string;
  simulacaoId: string;
  pdfBase64: string; // PDF ou PNG codificado em base64 vindo do cliente
  fileType?: 'pdf' | 'png';
}): Promise<PropostaActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }


    const parsed = createPropostaSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { leadId, simulacaoId, pdfBase64, fileType = 'pdf' } = parsed.data;
    const supabase = await createClient();

    // 1. Decodificar o base64 para Buffer (removendo prefixo data URI se existir) e validar
    let base64Data = pdfBase64;
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    
    let isValidFile = false;
    if (fileType === 'pdf') {
      isValidFile = buffer.subarray(0, 4).toString('latin1') === '%PDF';
    } else if (fileType === 'png') {
      isValidFile = buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    }

    if (!isValidFile || buffer.length > MAX_FILE_SIZE) {
      return { success: false, message: 'Arquivo inválido ou muito grande (máx. 8MB).' };
    }

    // Confere que o lead e a simulação pertencem à empresa do usuário (defesa contra IDOR)
    const { data: leadOk } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      
      .maybeSingle();

    const { data: simOk } = await supabase
      .from('simulacoes')
      .select('id')
      .eq('id', simulacaoId)
      
      .maybeSingle();

    if (!leadOk || !simOk) {
      return { success: false, message: 'Lead ou simulação inválidos para esta empresa.' };
    }

    const ext = fileType === 'png' ? 'png' : 'pdf';
    const contentType = fileType === 'png' ? 'image/png' : 'application/pdf';
    const fileName = `${null}/${simulacaoId}_${Date.now()}.${ext}`;

    // 2. Upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('propostas')
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Erro no upload do PDF:', uploadError);
      return { success: false, message: 'Erro ao enviar o PDF. Tente novamente.' };
    }

    // 3. Obter URL pública do PDF
    const { data: { publicUrl } } = supabase.storage
      .from('propostas')
      .getPublicUrl(fileName);

    // 4. Inserir registro na tabela 'propostas'
    const { data: insertedProposta, error: insertError } = await (supabase
      .from('propostas') as any)
      .insert({
        empresa_id: user.empresa_id || '43605699-aaf9-4caf-872a-2526e728ddd6',
        vendedor_id: user.id,
        lead_id: leadId,
        simulacao_id: simulacaoId,
        status: 'enviada',
        pdf_url: publicUrl,
        public_link: '', // Será atualizado em seguida
        visualizacoes: 0,
      })
      .select('id')
      .single();

    if (insertError || !insertedProposta) {
      console.error('Erro ao salvar proposta:', insertError);
      return {
        success: false,
        message: `Erro ao salvar proposta no banco: ${insertError?.message || 'Erro desconhecido'}`,
      };
    }

    const propostaId = (insertedProposta as any).id;
    const publicLink = `/proposta-publica/${propostaId}`;

    // 5. Atualizar a proposta com o link público final
    const { error: updateError } = await (supabase
      .from('propostas') as any)
      .update({ public_link: publicLink })
      .eq('id', propostaId);

    if (updateError) {
      console.error('Erro ao atualizar link público da proposta:', updateError);
    }

    // 6. Registrar log de auditoria
    const { error: auditError } = await (supabase.from('audit_logs') as any).insert({
      
      usuario_id: user.id,
      acao: 'CRIAR',
      entidade: 'propostas',
      entidade_id: propostaId,
      payload: { lead_id: leadId, simulacao_id: simulacaoId },
    });

    if (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError);
    }

    // 7. Criar Negócio no CRM Funil
    try {
      // Buscar dados da simulação e do lead
      const { data: sim } = await (supabase.from('simulacoes') as any)
        .select('credito_total, modalidade, administradora_id, produto, administradoras(nome)')
        .eq('id', simulacaoId)
        .single();
      
      const { data: lead } = await (supabase.from('leads') as any)
        .select('nome, origem, temperatura')
        .eq('id', leadId)
        .single();

      if (sim && lead) {
        let adminNome = '';
        if (sim.administradoras && typeof sim.administradoras === 'object' && 'nome' in sim.administradoras) {
          adminNome = sim.administradoras.nome as string;
        }

        const titulo = `${lead.nome} - ${sim.produto} - R$ ${sim.credito_total.toLocaleString('pt-BR')}`;
        
        const { data: newNegocio, error: negocioError } = await (supabase.from('negocios_crm') as any)
          .insert({
            empresa_id: user.empresa_id || '43605699-aaf9-4caf-872a-2526e728ddd6',
            cliente_id: leadId,
            proposta_id: propostaId,
            vendedor_id: user.id,
            titulo: titulo,
            credito: sim.credito_total,
            modalidade: sim.modalidade,
            administradora: adminNome,
            etapa_funil: 'simulacao_apresentada',
            temperatura: lead.temperatura,
            origem: lead.origem,
          })
          .select('id')
          .single();

        if (newNegocio && newNegocio.id) {
          // Atualiza a proposta com o negocio_id recém-criado
          await (supabase.from('propostas') as any)
            .update({ negocio_id: newNegocio.id })
            .eq('id', propostaId);
        }
      }
    } catch (crmError) {
      console.error('Erro ao criar negócio no CRM:', crmError);
    }

    revalidatePath(`/crm/${leadId}`);
    revalidatePath('/propostas');
    revalidatePath('/crm');

    return {
      success: true,
      message: 'Proposta gerada com sucesso!',
      propostaId,
    };
  } catch (err: any) {
    console.error('Erro interno ao criar proposta:', err);
    return {
      success: false,
      message: `Erro interno no servidor: ${err?.message || 'Erro desconhecido'}`,
    };
  }
}

/**
 * Server Action para atualizar o status de uma proposta (ex: 'aprovada', 'recusada').
 */
export async function updatePropostaStatusAction(
  propostaId: string,
  status: 'enviada' | 'aprovada' | 'recusada'
): Promise<PropostaActionState> {
  try {
    const idCheck = propostaIdSchema.safeParse(propostaId);
    if (!idCheck.success) {
      return { success: false, message: idCheck.error.issues[0].message };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    const supabase = await createClient();
    const { error } = await (supabase
      .from('propostas') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', propostaId)
      ;

    if (error) {
      console.error('Erro ao atualizar status da proposta:', error);
      return { success: false, message: 'Erro ao atualizar status. Tente novamente.' };
    }

    revalidatePath('/propostas');
    revalidatePath(`/propostas/${propostaId}`);

    return { success: true, message: 'Status da proposta atualizado com sucesso!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro desconhecido' };
  }
}

/**
 * Incrementa o número de visualizações da proposta.
 * Roda de forma anônima/pública por meio do RPC SECURITY DEFINER do Postgres.
 */
export async function incrementarVisualizacaoAction(propostaId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)('incrementar_visualizacao_proposta', {
      p_id: propostaId,
    });

    if (error) {
      console.error('Erro no RPC ao incrementar visualizações:', error);
    }
  } catch (err) {
    console.error('Erro ao incrementar visualizações:', err);
  }
}
