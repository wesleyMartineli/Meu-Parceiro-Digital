'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { revalidatePath } from 'next/cache';
import { SimulacaoResult } from '@/core/calculator/types';

export type SimulacaoActionState = {
  success: boolean;
  message: string | null;
  simulacaoId?: string;
};

/**
 * Server Action para salvar uma simulação (individual ou multi-cotas) no banco de dados.
 */
export async function saveSimulacaoAction(
  payload: {
    leadId: string | null;
    administradoraId: string | null;
    engineKey: string;
    produto: string; // 'imovel', 'veiculo', etc
    modalidade: string; // 'linear', 'multi_cotas', etc
    simulacaoResult: SimulacaoResult;
    inputsOriginal: any; // O array de inputs digitados
  }
): Promise<SimulacaoActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }


    const {
      leadId,
      administradoraId,
      engineKey,
      produto,
      modalidade,
      simulacaoResult,
      inputsOriginal,
    } = payload;

    const supabase = await createClient();

    // Se um lead foi informado, valida o RLS do lead no lado do servidor
    if (leadId) {
      const { data: lead, error: leadError } = await (supabase as any)
        .from('leads')
        .select('id, vendedor_id')
        .eq('id', leadId)
        .maybeSingle();

      if (leadError || !lead) {
        return { success: false, message: 'Lead não encontrado ou acesso negado.' };
      }

      // Se for ponto_venda comum, ele só pode salvar simulações para leads sob sua responsabilidade
      if (user.role === 'ponto_venda' && lead.vendedor_id !== user.id) {
        return { success: false, message: 'Acesso negado. Você só pode simular para seus próprios leads.' };
      }
    }

      const realAdministradoraId = administradoraId === 'rodobens-virtual' 
        ? '61b14e50-e517-4ac0-8133-19ca639d08ed' 
        : administradoraId;

      const { data: insertedSimulacao, error: insertSimulacaoError } = await (supabase as any)
        .from('simulacoes')
        .insert({
          empresa_id: '43605699-aaf9-4caf-872a-2526e728ddd6',
          vendedor_id: user.id,
          lead_id: leadId || null,
          administradora_id: realAdministradoraId || null,
        produto,
        modalidade,
        credito_total: simulacaoResult.totalCreditoBruto,
        parcela_inicial: simulacaoResult.totalParcelaInicial,
        parcela_final: simulacaoResult.totalParcelaFinal,
        credito_liquido: simulacaoResult.totalCreditoLiquido,
        lance_total: simulacaoResult.totalLance,
        lance_embutido: simulacaoResult.totalLanceEmbutido,
        recursos_proprios: simulacaoResult.totalRecursosProprios,
        saldo_devedor: simulacaoResult.totalCreditoBruto, // Saldo inicial amortizável (fundo comum)
        status: 'rascunho',
        engine_key: engineKey,
        engine_version: '1.0',
        input_json: inputsOriginal,
        output_json: simulacaoResult,
      })
      .select('id')
      .single();

    if (insertSimulacaoError || !insertedSimulacao) {
      console.error('Erro ao salvar cabeçalho de simulação:', insertSimulacaoError);
      return {
        success: false,
        message: `Erro ao salvar simulação: ${insertSimulacaoError?.message || 'Tente novamente.'}`,
      };
    }

    const simulacaoId = insertedSimulacao.id;

    // 2. Inserir cada cota na tabela 'simulacao_cotas'
    const cotasRows = simulacaoResult.cotas.map((cota, index) => {
      // O input correspondente a essa cota
      const inputCota = Array.isArray(inputsOriginal) ? inputsOriginal[index] : inputsOriginal;
      
      return {
        simulacao_id: simulacaoId,
        ordem: index + 1,
        produto: produto,
        modalidade: cota.modalidade,
        credito_bruto: cota.creditoBruto,
        credito_liquido: cota.creditoLiquido,
        prazo: cota.prazo,
        parcela_inicial: cota.parcelaInicial,
        parcela_final: cota.parcelaFinal,
        lance_total: cota.lanceTotalReais,
        lance_embutido: cota.lanceEmbutidoReais,
        recursos_proprios: cota.recursosPropriosReais,
        saldo_devedor: cota.saldoDevedorInicial,
        resultado_json: cota,
      };
    });

    const { error: insertCotasError } = await (supabase as any)
      .from('simulacao_cotas')
      .insert(cotasRows);

    if (insertCotasError) {
      console.error('Erro ao salvar cotas da simulação:', insertCotasError);
      // Opcional: deletar a simulação para manter consistência, embora a cascata não se aplique aqui manualmente
      await (supabase as any).from('simulacoes').delete().eq('id', simulacaoId);
      return {
        success: false,
        message: `Erro ao salvar cotas da simulação: ${insertCotasError?.message || 'Tente novamente.'}`,
      };
    }

    // Registrar o log de auditoria
    if (leadId) {
      await (supabase as any).from('audit_logs').insert({
        
        usuario_id: user.id,
        acao: 'CRIAR',
        entidade: 'simulacoes',
        entidade_id: simulacaoId,
        payload: { lead_id: leadId, credito_total: simulacaoResult.totalCreditoBruto },
      });
      
      revalidatePath(`/crm/${leadId}`);
    }

    revalidatePath('/crm');
    revalidatePath('/propostas');

    return {
      success: true,
      message: 'Simulação salva com sucesso!',
      simulacaoId,
    };
  } catch (err: any) {
    console.error('Erro interno ao salvar simulação:', err);
    return {
      success: false,
      message: `Erro interno no servidor: ${err?.message || 'Erro de conexão'}`,
    };
  }
}
