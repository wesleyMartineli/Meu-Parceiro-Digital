import { createClient } from '@supabase/supabase-js';
import { BacenFinancingRateProvider, BacenRateDailyRecord } from './BacenFinancingRateProvider';

export class FinancingRateSyncService {
  /**
   * Sincroniza taxas de financiamento de Veículos do Banco Central para o Supabase
   */
  static async syncVehicleRates() {
    // Modalidade: Aquisição de veículos - Prefixado (401101)
    const records = await BacenFinancingRateProvider.fetchDailyRatesByModality('401101');
    
    if (!records || records.length === 0) {
      console.warn("Nenhum registro retornado do BCB para veículos.");
      return { success: false, message: "Nenhum dado retornado do BCB" };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Preparar os dados para upsert (evitar duplicatas, usar data de hoje como ref)
    const today = new Date().toISOString().split('T')[0];

    const ratesToInsert = records.map((record: BacenRateDailyRecord) => ({
      institution_name: record.InstituicaoFinanceira,
      institution_code: record.cnpj8,
      modality: record.modalidade,
      person_type: record.segmento,
      monthly_rate: record.TaxaJurosAoMes,
      annual_rate: record.TaxaJurosAoAno,
      reference_date: today,
      source: 'BCB'
    }));

    // Inserir os registros no banco. Como no temos unique constraint complexa além do ID gerado,
    // podemos deletar os antigos do mesmo dia (ou de antes) e inserir os novos, ou simplesmente adicionar.
    // Vamos limpar os registros antigos para manter o banco enxuto (últimos 5 dias por modalidade)
    
    // Apagar registros anteriores da mesma modalidade (opcional, para manter só os atuais)
    await supabase
      .from('financing_rates')
      .delete()
      .eq('modality', records[0].modalidade)
      .eq('source', 'BCB');

    const { data, error } = await supabase
      .from('financing_rates')
      .insert(ratesToInsert);

    if (error) {
      console.error("Erro ao inserir no Supabase:", error);
      return { success: false, error };
    }

    return { success: true, count: ratesToInsert.length };
  }
}
