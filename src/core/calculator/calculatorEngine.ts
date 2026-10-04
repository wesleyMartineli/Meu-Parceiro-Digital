import { SimulacaoInput, CotaResult, SimulacaoResult } from './types';
import { calcularCotaRodobens } from './engines/rodobens';
import { calcularCotaPortoBank } from './engines/portobank';
import { calcularCotaUniversal } from './engines/universal';
import { calcularCotaTarraf } from './engines/tarraf';

/**
 * Calcula uma cota de consórcio individual utilizando a engine correspondente.
 */
export function calcularCota(input: SimulacaoInput, engineKey: string = 'universal'): CotaResult {
  const key = engineKey.toLowerCase();
  if (key === 'rodobens') {
    return calcularCotaRodobens(input);
  }
  if (key === 'portobank') {
    return calcularCotaPortoBank(input);
  }
  if (key === 'tarraf') {
    return calcularCotaTarraf(input);
  }
  return calcularCotaUniversal(input);
}

/**
 * Calcula múltiplas cotas simultaneamente e consolida os resultados financeiros.
 */
export function calcularMultiplasCotas(
  cotas: SimulacaoInput[],
  engineKey: string = 'universal'
): SimulacaoResult {
  const resultados = cotas.map((cota) => calcularCota(cota, engineKey));

  const totalCreditoBruto = resultados.reduce((soma, c) => soma + c.creditoBruto, 0);
  const totalCreditoLiquido = resultados.reduce((soma, c) => soma + c.creditoLiquido, 0);
  const totalLanceEmbutido = resultados.reduce((soma, c) => soma + c.lanceEmbutidoReais, 0);
  const totalRecursosProprios = resultados.reduce((soma, c) => soma + c.recursosPropriosReais, 0);
  const totalLance = totalLanceEmbutido + totalRecursosProprios;
  
  const percentualLanceMedio = totalCreditoBruto > 0 
    ? (totalLance / totalCreditoBruto) * 100 
    : 0;

  const totalParcelaInicial = resultados.reduce((soma, c) => soma + c.parcelaInicial, 0);
  const totalParcelaFinal = resultados.reduce((soma, c) => soma + c.parcelaFinal, 0);
  const totalFinalPago = resultados.reduce((soma, c) => soma + c.totalPago, 0);

  return {
    totalCreditoBruto,
    totalCreditoLiquido,
    totalLanceEmbutido,
    totalRecursosProprios,
    totalLance,
    percentualLanceMedio: Number(percentualLanceMedio.toFixed(2)),
    totalParcelaInicial: Number(totalParcelaInicial.toFixed(2)),
    totalParcelaFinal: Number(totalParcelaFinal.toFixed(2)),
    totalFinalPago: Number(totalFinalPago.toFixed(2)),
    cotas: resultados,
  };
}
