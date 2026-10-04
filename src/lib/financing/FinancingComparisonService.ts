import { createClient } from '@supabase/supabase-js';

// Mapeamento de produtos do consórcio para as modalidades do BCB
export const FINANCING_MODALITY_MAP: Record<string, string> = {
  auto: 'Aquisição de veículos - Prefixado',
  pesados: 'Aquisição de veículos - Prefixado', // Usando mesma base inicialmente, pode ser adaptado depois
  imovel: 'Financiamento imobiliário com taxas de mercado - Prefixado' // Exemplo
};

export interface FinancingParams {
  assetType: string;
  assetValue: number;
  financingDownPayment?: number;
  financingTerm?: number;
}

export interface FinancingResult {
  principal: number;
  downPayment: number;
  term: number;
  monthlyRate: number;
  annualRate: number;
  monthlyPayment: number;
  totalPaid: number;
  interestCost: number;
  referenceDate: string;
  institutionsConsidered: number;
  source: string;
}

export class FinancingComparisonService {
  
  /**
   * Calcula o valor da parcela baseado no Sistema Price.
   * Fórmula: PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
   */
  static calculatePriceFinancing(principal: number, monthlyRatePct: number, months: number) {
    if (months <= 0) return { monthlyPayment: 0, totalPaid: 0, interestCost: 0 };
    if (principal <= 0) return { monthlyPayment: 0, totalPaid: 0, interestCost: 0 };
    
    if (monthlyRatePct <= 0) {
      const payment = principal / months;
      return {
        monthlyPayment: payment,
        totalPaid: principal,
        interestCost: 0
      };
    }

    const rate = monthlyRatePct / 100; // Converte % para decimal (ex: 1.5% -> 0.015)
    
    const factor = Math.pow(1 + rate, months);
    const monthlyPayment = principal * (rate * factor) / (factor - 1);
    const totalPaid = monthlyPayment * months;
    const interestCost = totalPaid - principal;

    return {
      monthlyPayment,
      totalPaid,
      interestCost
    };
  }

  /**
   * Executa o serviço de comparação com financiamento buscando as taxas armazenadas no banco
   */
  static async getComparison(params: FinancingParams): Promise<FinancingResult | null> {
    const { assetType, assetValue, financingDownPayment = 0, financingTerm = 48 } = params;
    
    const modalityName = FINANCING_MODALITY_MAP[assetType] || FINANCING_MODALITY_MAP['auto'];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Pode usar anon no cliente
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar taxas da modalidade no banco de dados local
    const { data: rates, error } = await supabase
      .from('financing_rates')
      .select('*')
      .eq('modality', modalityName);

    if (error || !rates || rates.length === 0) {
      console.warn("Nenhuma taxa referencial encontrada para a modalidade:", modalityName);
      return null;
    }

    // Calcular a taxa referencial (média das instituições armazenadas, ou podemos usar a mediana)
    // Para simplificar, faremos a média aritmética simples
    let totalMonthlyRate = 0;
    let totalAnnualRate = 0;

    rates.forEach(r => {
      totalMonthlyRate += Number(r.monthly_rate);
      totalAnnualRate += Number(r.annual_rate);
    });

    const avgMonthlyRate = totalMonthlyRate / rates.length;
    const avgAnnualRate = totalAnnualRate / rates.length;
    const referenceDate = rates[0].reference_date;

    const principal = assetValue - financingDownPayment;

    // Calcular parcelas via Sistema Price
    const { monthlyPayment, totalPaid, interestCost } = this.calculatePriceFinancing(
      principal, 
      avgMonthlyRate, 
      financingTerm
    );

    return {
      principal,
      downPayment: financingDownPayment,
      term: financingTerm,
      monthlyRate: avgMonthlyRate,
      annualRate: avgAnnualRate,
      monthlyPayment,
      totalPaid,
      interestCost,
      referenceDate,
      institutionsConsidered: rates.length,
      source: 'BCB'
    };
  }
}
