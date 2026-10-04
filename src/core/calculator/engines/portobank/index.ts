import { SimulacaoInput, CotaResult, CronogramaParcela } from '../../types';

export function calcularCotaPortoBank(input: SimulacaoInput): CotaResult {
  const {
    credito,
    prazo,
    taxaAdm,
    fundoReserva,
    seguro,
    lanceEmbutido,
    recursosProprios,
    tipoLance,
    quantidadeParcelasLance,
    mesContemplacao,
    modalidade,
    percentualReducao,
    abatimento,
    taxaAdesao = 0,
    prazoTaxaAdesao = 1
  } = input;

  // Componentes de parcela linear
  const FC_linear = credito / prazo;
  const TA_linear = (credito * (taxaAdm / 100)) / prazo;
  const FR_linear = (credito * (fundoReserva / 100)) / prazo;
  const SE_linear = (credito * (seguro / 100)) / prazo;
  const parcelaLinear = FC_linear + TA_linear + FR_linear + SE_linear;

  // Redução
  const fatorPagamento = modalidade === 'reduzida' ? (percentualReducao || 100) / 100 : 1;
  const FC_inicial = FC_linear * fatorPagamento;
  const TA_inicial = TA_linear * fatorPagamento;
  const parcelaInicial = FC_inicial + TA_inicial + FR_linear + SE_linear;
  const diferencaMensal = (FC_linear - FC_inicial) + (TA_linear - TA_inicial);

  // Base para cálculo do valor total do lance em percentual: Crédito Bruto + Taxas (incluindo Adesão)
  const totalBaseParaLance = credito * (1 + (taxaAdm + fundoReserva + seguro + taxaAdesao) / 100);

  // Lance Embutido é SEMPRE calculado apenas sobre o Crédito Bruto
  const lanceEmbutidoReais = credito * (lanceEmbutido / 100);
  
  let recursosPropriosReais = 0;
  let lanceTotalReais = 0;

  if (tipoLance === '%') {
    // O total ofertado (em %) incide sobre o Total da Base (Crédito + Taxas)
    const percentualTotal = lanceEmbutido + recursosProprios;
    lanceTotalReais = totalBaseParaLance * (percentualTotal / 100);
    // Os recursos próprios são a diferença entre o Lance Total e o Lance Embutido
    recursosPropriosReais = lanceTotalReais - lanceEmbutidoReais;
  } else if (tipoLance === 'parcelas') {
    recursosPropriosReais = (quantidadeParcelasLance || 0) * parcelaLinear;
    lanceTotalReais = lanceEmbutidoReais + recursosPropriosReais;
  } else {
    recursosPropriosReais = recursosProprios;
    lanceTotalReais = lanceEmbutidoReais + recursosPropriosReais;
  }

  let lanceParaParcela = 0;
  let lanceParaPrazo = 0;

  if (abatimento === 'prazo') {
    lanceParaPrazo = lanceTotalReais;
  } else if (abatimento === 'misto') {
    lanceParaParcela = lanceTotalReais * 0.5;
    lanceParaPrazo = lanceTotalReais * 0.5;
  } else {
    lanceParaParcela = lanceTotalReais;
  }

  const creditoLiquido = credito - lanceEmbutidoReais;
  const percentualLance = (lanceTotalReais / totalBaseParaLance) * 100;

  const saldoDevedorInicial = parcelaLinear * prazo;
  let saldoDevedor = saldoDevedorInicial;

  const cronograma: CronogramaParcela[] = [];
  let diferencaAcumulada = 0;
  
  // Adesão
  const totalAdesao = credito * (taxaAdesao / 100);
  const parcelaAdesao = prazoTaxaAdesao > 0 ? totalAdesao / prazoTaxaAdesao : 0;

  let FC_final = FC_linear;
  let TA_final = TA_linear;
  let parcelaFinalBase = parcelaLinear;
  let lanceEfetivoPrazo = 0;
  let prazoRestanteEfetivo = prazo;

  for (let mes = 1; mes <= prazo; mes++) {
    if (saldoDevedor <= 0.01) {
      cronograma.push({
        mes,
        amortizacao: 0,
        taxaAdm: 0,
        fundoReserva: 0,
        seguro: 0,
        total: 0,
        saldoDevedor: 0,
        contemplado: true,
        adiantamento: 0,
        quitadaPorLance: true,
      });
      continue;
    }

    const contemplandoNesseMes = mes === mesContemplacao;
    const contemplado = mes >= mesContemplacao;
    let lanceAplicado = 0;

    let totalParcela = 0;
    let current_FC = 0;
    let current_TA = 0;
    let current_FR = FR_linear;
    let current_SE = SE_linear;

    if (!contemplado) {
      totalParcela = parcelaInicial;
      current_FC = FC_inicial;
      current_TA = TA_inicial;
      diferencaAcumulada += diferencaMensal;
    } else {
      if (contemplandoNesseMes) {
        // Na Porto Bank, a diferença acumulada não dilui no saldo (paga à vista/desconta crédito)
        diferencaAcumulada = 0;

        let lanceAplicadoParcela = lanceParaParcela;
        let lanceAplicadoPrazo = lanceParaPrazo;

        const prazoRestanteBase = prazo - mes + 1;
        prazoRestanteEfetivo = prazoRestanteBase;

        const parcelaIntegralBase = FC_linear + TA_linear + FR_linear + SE_linear;
        const parcelaMinima = parcelaIntegralBase * 0.5;

        let descontoPorParcela = 0;

        if (lanceAplicadoParcela > 0) {
            const reducaoMaximaPossivel = parcelaIntegralBase - parcelaMinima;
            const lanceMaximoPermitidoNaParcela = reducaoMaximaPossivel * prazoRestanteBase;

            if (lanceAplicadoParcela > lanceMaximoPermitidoNaParcela) {
                // Trava a parcela no mínimo de 50%
                descontoPorParcela = reducaoMaximaPossivel;
                // Excedente vai para abater o prazo
                const sobraLance = lanceAplicadoParcela - lanceMaximoPermitidoNaParcela;
                lanceAplicadoPrazo += sobraLance;
                lanceAplicadoParcela = lanceMaximoPermitidoNaParcela;
            } else {
                descontoPorParcela = lanceAplicadoParcela / prazoRestanteBase;
            }
        }

        let mesesAbatidos = 0;
        const parcelaParaAbatimentoPrazo = parcelaIntegralBase - descontoPorParcela;

        if (lanceAplicadoPrazo > 0 && parcelaParaAbatimentoPrazo > 0) {
            mesesAbatidos = Math.floor(lanceAplicadoPrazo / parcelaParaAbatimentoPrazo);
            prazoRestanteEfetivo = Math.max(prazoRestanteBase - mesesAbatidos, 1);
        }

        lanceEfetivoPrazo = mesesAbatidos * parcelaParaAbatimentoPrazo;
        lanceAplicado = lanceAplicadoParcela + lanceEfetivoPrazo;

        if (descontoPorParcela > 0) {
          if (descontoPorParcela <= FC_linear) {
            FC_final = FC_linear - descontoPorParcela;
            TA_final = TA_linear;
          } else {
            FC_final = 0;
            TA_final = Math.max(TA_linear - (descontoPorParcela - FC_linear), 0);
          }
        } else {
          FC_final = FC_linear;
          TA_final = TA_linear;
        }

        parcelaFinalBase = FC_final + TA_final + FR_linear + SE_linear;
      }
      
      totalParcela = parcelaFinalBase;
      current_FC = FC_final;
      current_TA = TA_final;
    }

    const totalDesconto = totalParcela + lanceAplicado;
    const saldoAnterior = saldoDevedor;

    saldoDevedor = Math.max(saldoDevedor - totalDesconto, 0);

    if (saldoDevedor === 0 && saldoAnterior < totalDesconto) {
      const saldoParaQuitar = saldoAnterior - lanceAplicado;
      if (saldoParaQuitar > 0) {
        totalParcela = saldoParaQuitar;
        const proporcao = totalParcela / ((current_FC + current_TA + FR_linear + SE_linear) || 1);
        current_FC *= proporcao; 
        current_TA *= proporcao;
        current_FR *= proporcao;
        current_SE *= proporcao;
      } else {
        totalParcela = 0;
        current_FC = 0;
        current_TA = 0;
        current_FR = 0;
        current_SE = 0;
      }
    }

    let current_Adesao = 0;
    if (mes <= prazoTaxaAdesao && taxaAdesao > 0) {
      current_Adesao = parcelaAdesao;
    }

    cronograma.push({
      mes,
      amortizacao: Number(current_FC.toFixed(2)),
      taxaAdm: Number(current_TA.toFixed(2)),
      fundoReserva: Number(current_FR.toFixed(2)),
      seguro: Number(current_SE.toFixed(2)),
      total: Number((totalParcela + current_Adesao).toFixed(2)),
      saldoDevedor: Number(saldoDevedor.toFixed(2)),
      contemplado,
      adiantamento: 0,
      quitadaPorLance: totalParcela === 0 && saldoDevedor === 0,
      taxaAdesao: current_Adesao > 0 ? Number(current_Adesao.toFixed(2)) : undefined
    });
  }

  const totalPago = cronograma.reduce((soma, p) => soma + p.total, 0) + (mesContemplacao > 0 ? recursosPropriosReais : 0);
  const parcelaInicialComAdesao = parcelaInicial + (prazoTaxaAdesao > 0 ? parcelaAdesao : 0);

  return {
    creditoBruto: credito,
    creditoLiquido: Number(creditoLiquido.toFixed(2)),
    prazo,
    modalidade: modalidade === 'reduzida' ? 'reduzida' : 'linear',
    parcelaInicial: Number(parcelaInicialComAdesao.toFixed(2)),
    parcelaPosAdesao: taxaAdesao > 0 && prazoTaxaAdesao > 0 ? Number(parcelaInicial.toFixed(2)) : undefined,
    parcelaFinal: Number(parcelaFinalBase.toFixed(2)),
    lanceEmbutidoReais: Number(lanceEmbutidoReais.toFixed(2)),
    recursosPropriosReais: Number(recursosPropriosReais.toFixed(2)),
    lanceTotalReais: Number(lanceTotalReais.toFixed(2)),
    percentualLance: Number(percentualLance.toFixed(2)),
    saldoDevedorInicial: Number(saldoDevedorInicial.toFixed(2)),
    totalPago: Number(totalPago.toFixed(2)),
    cronograma,
  };
}
