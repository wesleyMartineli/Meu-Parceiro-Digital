export interface BacenRateRecord {
  Mes: string;
  Modalidade: string;
  Posicao: number;
  InstituicaoFinanceira: string;
  TaxaJurosAoMes: number;
  TaxaJurosAoAno: number;
  cnpj8: string;
  anoMes: string;
}

export interface BacenRateDailyRecord {
  segmento: string;
  modalidade: string;
  posicao: number;
  InstituicaoFinanceira: string;
  TaxaJurosAoMes: number;
  TaxaJurosAoAno: number;
  cnpj8: string;
  dataMes: string;
}

export class BacenFinancingRateProvider {
  /**
   * Consulta as taxas diárias médias (últimos 5 dias) para uma dada modalidade
   * Exemplo: '401101' é Aquisição de Veículos - Prefixado (Pessoa Física)
   */
  static async fetchDailyRatesByModality(codigoModalidade: string): Promise<BacenRateDailyRecord[]> {
    const filter = `codigoSegmento eq '1' and codigoModalidade eq '${codigoModalidade}'`;
    const url = `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosDiariaPorInicioPeriodo?$filter=${encodeURIComponent(filter)}&$format=json&$top=100`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`BCB API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Failed to fetch from BCB:', error);
      return [];
    }
  }

  /**
   * Consulta taxas mensais baseadas em uma modalidade textual
   * Útil caso se queira Imóveis, que estão no endpoint mensal
   */
  static async fetchMonthlyRatesByModalityText(modalidadeText: string): Promise<BacenRateRecord[]> {
    const filter = `Modalidade eq '${modalidadeText}'`;
    const url = `https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes?$filter=${encodeURIComponent(filter)}&$format=json&$top=100`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`BCB API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Failed to fetch from BCB (Monthly):', error);
      return [];
    }
  }
}
