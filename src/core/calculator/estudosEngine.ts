import { SimulacaoInput, CotaResult, CronogramaParcela } from './types';
import { calcularCota } from './calculatorEngine';

export interface EstudoOperacoesResult {
  timeline: {
    mes: number;
    anoMes: Date;
    creditoBrutoMes: number | null;
    creditoLiquidoMes: number | null;
    recursosPropriosMes: number | null;
    parcelaMes: number;
    saldoLiquidoMensal: number;
  }[];
  resumo: {
    creditoLiquidoTotal: number;
    creditoBrutoTotal: number;
    prazoContratacao: number;
    parcelaMediaAntes: number;
    parcelaPosContemplacao: number;
    lanceProprioTotal: number;
    lanceEmbutidoTotal: number;
  };
  cotas: CotaResult[];
}

/**
 * Calcula a projeção de entrega (Degrau) para um estudo de múltiplas cotas
 */
export function calcularEstudoOperacoes(
  cotasInput: SimulacaoInput[],
  dataInicio: Date = new Date(),
  engineKey: string = 'rodobens'
): EstudoOperacoesResult {
  // 1. Calcular cada cota individualmente
  const cotasCalculadas = cotasInput.map((input) => calcularCota(input, engineKey));

  // 2. Determinar o prazo máximo global para o cronograma
  const prazoMaximo = cotasCalculadas.length > 0 ? Math.max(...cotasCalculadas.map((c) => c.prazo)) : 0;

  // 3. Agregar cronogramas mês a mês
  const timeline = [];
  
  let creditoBrutoTotal = 0;
  let creditoLiquidoTotal = 0;
  let lanceProprioTotal = 0;
  let lanceEmbutidoTotal = 0;

  for (let mes = 1; mes <= prazoMaximo; mes++) {
    let parcelaMes = 0;
    let creditoBrutoMes = 0;
    let creditoLiquidoMes = 0;
    let recursosPropriosMes = 0;

    for (let i = 0; i < cotasCalculadas.length; i++) {
      const cota = cotasCalculadas[i];
      const input = cotasInput[i];
      
      const parcelaCota = cota.cronograma.find((c) => c.mes === mes);
      if (parcelaCota) {
        parcelaMes += parcelaCota.total;
      }

      // Se a cota contempla EXATAMENTE neste mês, adicionamos os créditos à projeção de entrega
      if (input.mesContemplacao === mes) {
        creditoBrutoMes += cota.creditoBruto;
        creditoLiquidoMes += cota.creditoLiquido;
        recursosPropriosMes += cota.recursosPropriosReais;
        
        creditoBrutoTotal += cota.creditoBruto;
        creditoLiquidoTotal += cota.creditoLiquido;
        lanceProprioTotal += cota.recursosPropriosReais;
        lanceEmbutidoTotal += cota.lanceEmbutidoReais;
      }
    }

    const dataMes = new Date(dataInicio);
    dataMes.setMonth(dataInicio.getMonth() + mes - 1);

    timeline.push({
      mes,
      anoMes: dataMes,
      creditoBrutoMes: creditoBrutoMes > 0 ? creditoBrutoMes : null,
      creditoLiquidoMes: creditoLiquidoMes > 0 ? creditoLiquidoMes : null,
      recursosPropriosMes: recursosPropriosMes > 0 ? recursosPropriosMes : null,
      parcelaMes,
      saldoLiquidoMensal: creditoLiquidoTotal - lanceProprioTotal 
    });
  }

  // Cálculos de Resumo (Médias de parcelas, etc)
  const primeiraCotaContemplada = cotasInput.length > 0 ? Math.min(...cotasInput.map(c => c.mesContemplacao)) : 1;
  
  let totalParcelaAntes = 0;
  let totalParcelaDepois = 0;

  if (timeline.length > 0) {
    totalParcelaAntes = timeline[0].parcelaMes;
    const mesAposContemplacao = timeline.find(t => t.mes === primeiraCotaContemplada + 1);
    totalParcelaDepois = mesAposContemplacao ? mesAposContemplacao.parcelaMes : totalParcelaAntes;
  }

  return {
    timeline,
    resumo: {
      creditoLiquidoTotal,
      creditoBrutoTotal,
      prazoContratacao: prazoMaximo,
      parcelaMediaAntes: totalParcelaAntes,
      parcelaPosContemplacao: totalParcelaDepois,
      lanceProprioTotal,
      lanceEmbutidoTotal,
    },
    cotas: cotasCalculadas
  };
}
