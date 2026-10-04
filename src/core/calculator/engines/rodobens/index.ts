import { SimulacaoInput, CotaResult, CronogramaParcela } from '../../types';

export function calcularCotaRodobens(input: SimulacaoInput): CotaResult {
  const {
    credito,
    prazo,
    modalidade,
    taxaAdm,
    fundoReserva,
    seguro,
    lanceEmbutido,
    recursosProprios,
    tipoLance,
    quantidadeParcelasLance,
    abatimento,
    mesContemplacao,
    mesPontual = 6,
  } = input;

  // Sincroniza o mês de contemplação com o mês pontual se for a modalidade Pontual
  const efetivoMesContemplacao = modalidade === 'pontual' ? mesPontual : mesContemplacao;

  const prazoMaxGrupo = input.prazoMaxGrupo || prazo;

  // 1. Calcular Parcela Base Linear para Referência
  const FC_plano = credito / prazo;
  const TA_plano_linear = (credito * (taxaAdm / 100)) / prazo;
  const FR_plano_linear = (credito * (fundoReserva / 100)) / prazo;
  const baseSeguro = credito + (credito * (taxaAdm / 100)) + (credito * (fundoReserva / 100));
  const SE_plano_linear = baseSeguro * (seguro / 100);

  let TA_plano_inicial = TA_plano_linear;
  let prazoDiluicao = prazo - efetivoMesContemplacao;

  if (modalidade === 'degrau' || modalidade === 'degrau_70') {
    const meioPrazo = Math.ceil(prazo / 2);
    TA_plano_inicial = (credito * (taxaAdm / 100)) / meioPrazo;
    prazoDiluicao = Math.ceil(prazo / 2) - efetivoMesContemplacao;
  }

  const parcelaInicialRef = FC_plano + TA_plano_inicial + FR_plano_linear + SE_plano_linear;

  // 2. Calcular Lance Total
  // A parcela base do grupo continua existindo para fins de referência (ex: fundo reserva, conversões visuais)
  const baseSeguroGrupo = credito + (credito * (taxaAdm / 100)) + (credito * (fundoReserva / 100));
  const seguroMensalGrupo = baseSeguroGrupo * (seguro / 100);
  const parcelaBaseGrupo = (credito / prazoMaxGrupo) + ((credito * (taxaAdm / 100)) / prazoMaxGrupo) + ((credito * (fundoReserva / 100)) / prazoMaxGrupo) + seguroMensalGrupo;

  // O Lance Total na Rodobens é SEMPRE ofertado em cima da Parcela Cheia (Integral 100%) da Cota,
  // mesmo se o cliente estiver num plano reduzido (Linear 70%, Degrau, etc).
  const parcelaCheiaCota = FC_plano + TA_plano_linear + FR_plano_linear + SE_plano_linear;

  let lanceTotalReais = 0;
  if (modalidade === 'pontual') {
    lanceTotalReais = 0; // Pontual não possui lance, a aquisição é feita puramente pelo adiantamento
  } else if (tipoLance === 'valor') {
    lanceTotalReais = (recursosProprios || 0) + (credito * ((lanceEmbutido || 0) / 100));
  } else if (tipoLance === '%') {
    lanceTotalReais = credito * (((recursosProprios || 0) + (lanceEmbutido || 0)) / 100);
  } else if (tipoLance === 'parcelas' || !tipoLance) {
    // A quantidade de parcelas informada pelo usuário já é a quantidade no prazo da cota.
    // Portanto, o lance total é simplesmente a quantidade × parcela da cota.
    const qParcelasCota = quantidadeParcelasLance || 0;
    
    if (modalidade === 'degrau' || modalidade === 'degrau_70') {
      const meioPrazo = Math.ceil(prazo / 2);
      const TA_dobrada = (credito * (taxaAdm / 100)) / meioPrazo;
      
      const parcelaInicialDegrau = FC_plano + TA_dobrada + FR_plano_linear + SE_plano_linear;
      const parcelaFinalDegrau = FC_plano + FR_plano_linear + SE_plano_linear;

      if (qParcelasCota > meioPrazo) {
        lanceTotalReais = (parcelaFinalDegrau * meioPrazo) + (parcelaInicialDegrau * (qParcelasCota - meioPrazo));
      } else {
        lanceTotalReais = qParcelasCota * parcelaFinalDegrau;
      }
    } else {
      lanceTotalReais = qParcelasCota * parcelaCheiaCota;
    }

    if (input.baseCalculoLance === 'reduzida') {
      lanceTotalReais *= 0.70;
    }
  }

  const parcelasFuro = input.parcelasFuro || 0;
  const furoReais = parcelasFuro * parcelaInicialRef;

  // Regra solicitada: O valor do lance deve cobrir o furo. 
  // Se o lance ofertado for menor que o furo, o cliente paga de lance a quantidade dos furos.
  if (!input.diluirFuro && lanceTotalReais < furoReais) {
    lanceTotalReais = furoReais;
  }

  const percEmbutido = Math.min((lanceEmbutido || 0) / 100, 0.30);
  const lanceEmbutidoReais = Math.min(credito * percEmbutido, lanceTotalReais);
  const recursosPropriosReais = Math.max(lanceTotalReais - lanceEmbutidoReais, 0);

  const creditoLiquido = credito - lanceEmbutidoReais;
  const percentualLance = (lanceTotalReais / (prazoMaxGrupo * parcelaBaseGrupo)) * 100;

  // A grande regra do Furo da Rodobens:
  // Se não for diluído, o lance o abate primeiro.
  
  // Quantas parcelas o lance consegue abater do furo (limitado ao próprio furo)
  const parcelasReduzidasPeloLance = input.diluirFuro ? 0 : Math.min(lanceTotalReais / parcelaInicialRef, parcelasFuro);
  
  const deficitFuro = 0; // Déficit deixa de existir pois o lance agora sempre cobre o furo no mínimo
  const excessoLance = input.diluirFuro ? lanceTotalReais : Math.max(lanceTotalReais - furoReais, 0);

  // O prazo reduzido real só será aplicado na hora da contemplação
  // Guardamos esses valores para uso no momento exato
  let lanceParaAmortizar = excessoLance; // O que sobrou para reduzir a parcela
  let diluicaoPerMonth = 0; // Será calculado no mês da contemplação

  let lanceParaParcela = 0;
  let lanceParaPrazo = 0;
  let lanceEfetivoPrazo = 0;
  let qtdParcelasInteirasPrazo = 0;

  if (abatimento === 'prazo') {
    lanceParaPrazo = excessoLance;
  } else if (abatimento === 'misto') {
    lanceParaParcela = excessoLance * 0.5;
    lanceParaPrazo = excessoLance * 0.5;
  } else {
    lanceParaParcela = excessoLance;
  }

  if (lanceParaPrazo > 0) {
    let valorParcelaFinal = FC_plano + FR_plano_linear + SE_plano_linear;
    if (modalidade !== 'degrau' && modalidade !== 'degrau_70') {
      valorParcelaFinal += TA_plano_linear;
    }
    qtdParcelasInteirasPrazo = Math.floor(lanceParaPrazo / valorParcelaFinal);
    lanceEfetivoPrazo = qtdParcelasInteirasPrazo * valorParcelaFinal;
  }

  let lanceAplicadoTotal = input.diluirFuro ? lanceTotalReais : (lanceTotalReais < furoReais ? lanceTotalReais : (furoReais + lanceParaParcela + lanceEfetivoPrazo));

  // 4. Saldo Devedor Inicial Nominal
  let saldoDevedorInicial = (FC_plano + TA_plano_linear + FR_plano_linear + SE_plano_linear) * prazo;
  if (input.diluirFuro && furoReais > 0) {
    saldoDevedorInicial += furoReais;
  }
  let saldoDevedor = saldoDevedorInicial;

  const cronograma: CronogramaParcela[] = [];
  
  let diferencaAcumulada = 0;
  let recalculado = false;

  const pontualMesAquicao = mesPontual;
  const parcelasPontualNecessarias = Math.round(prazo * 0.40);
  const parcelasPontualAntecipar = Math.max(parcelasPontualNecessarias - pontualMesAquicao, 0);
  const parcelaBaseLinear = FC_plano + TA_plano_linear + FR_plano_linear + SE_plano_linear;
  const valorAdiantamentoPontual = parcelasPontualAntecipar * parcelaBaseLinear;

  for (let mes = 1; mes <= prazo; mes++) {
    if (saldoDevedor <= 0.01) {
      cronograma.push({ mes, amortizacao: 0, taxaAdm: 0, fundoReserva: 0, seguro: 0, total: 0, saldoDevedor: 0, contemplado: mes >= efetivoMesContemplacao, adiantamento: 0, quitadaPorLance: true });
      continue;
    }

    const jaContemplado = mes > efetivoMesContemplacao;
    const contemplandoNesseMes = mes === efetivoMesContemplacao;

    const FC_cheio = FC_plano;
    let TA_cheio = TA_plano_linear;
    const FR_cheio = FR_plano_linear;
    const SE_cheio = SE_plano_linear;

    if (modalidade === 'degrau' || modalidade === 'degrau_70') {
      const meioPrazo = Math.ceil(prazo / 2);
      TA_cheio = mes <= meioPrazo ? (credito * (taxaAdm / 100)) / meioPrazo : 0;
    }

    let FC_efetiva = FC_cheio;
    let TA_efetiva = TA_cheio;
    let FR_efetiva = FR_cheio;
    let SE_efetiva = SE_cheio;
    let adiantamento = 0;

    if (!jaContemplado) {
      if (modalidade === 'linear_70' || modalidade === 'degrau_70') {
        FC_efetiva = FC_cheio * 0.7;
        TA_efetiva = TA_cheio * 0.7;
        diferencaAcumulada += (FC_cheio + TA_cheio) - (FC_efetiva + TA_efetiva);
      } else if (modalidade === 'reducao_50') {
        FC_efetiva = FC_cheio * 0.5;
        TA_efetiva = TA_cheio * 0.5;
        diferencaAcumulada += (FC_cheio + TA_cheio) - (FC_efetiva + TA_efetiva);
      }
    }

    let descontoPorParcela = 0;

    if (jaContemplado) {
      if (!recalculado) {
        let prazoRestanteBase = prazo - efetivoMesContemplacao;
        const reducaoPrazoFuro = Math.floor(parcelasReduzidasPeloLance);
        prazoRestanteBase = Math.max(prazoRestanteBase - reducaoPrazoFuro, 1);

        const prazoRestanteEfetivo = Math.max(prazoRestanteBase - qtdParcelasInteirasPrazo, 1);

        if (deficitFuro > 0) {
          diluicaoPerMonth = deficitFuro / prazoRestanteEfetivo;
        }

        descontoPorParcela = (lanceParaParcela - diferencaAcumulada) / prazoRestanteEfetivo;
        recalculado = true;
        lanceParaAmortizar = descontoPorParcela;
      }
      
      let descontoRestante = lanceParaAmortizar; // Esse é o desconto (positivo) ou aumento (negativo)
      if (descontoRestante > 0) {
        if (descontoRestante <= FC_cheio) {
          FC_efetiva = FC_cheio - descontoRestante;
          TA_efetiva = TA_cheio;
        } else {
          FC_efetiva = 0;
          TA_efetiva = Math.max(TA_cheio - (descontoRestante - FC_cheio), 0);
        }
      } else {
        // Aumenta a parcela base por causa da diferença acumulada
        FC_efetiva = FC_cheio + Math.abs(descontoRestante);
        TA_efetiva = TA_cheio;
      }
      
      // Aplicar Diluição de Furo (Aumenta a parcela)
      if (diluicaoPerMonth > 0) {
        FC_efetiva += diluicaoPerMonth;
      }
    }

    if (input.diluirFuro && furoReais > 0) {
      FC_efetiva += (furoReais / prazo);
    }

    if (modalidade === 'pontual' && mes === pontualMesAquicao) {
      adiantamento = valorAdiantamentoPontual;
    }

    let totalParcela = FC_efetiva + TA_efetiva + FR_efetiva + SE_efetiva;

    let lanceAplicado = 0;
    if (contemplandoNesseMes) {
      lanceAplicado = lanceAplicadoTotal;
    }

    const totalDesconto = totalParcela + lanceAplicado + adiantamento;
    const saldoAnterior = saldoDevedor;
    
    saldoDevedor = Math.max(saldoDevedor - totalDesconto, 0);

    if (saldoDevedor === 0 && saldoAnterior < totalDesconto) {
      const saldoParaQuitar = saldoAnterior - lanceAplicado - adiantamento;
      if (saldoParaQuitar > 0) {
        totalParcela = saldoParaQuitar;
        const proporcao = totalParcela / (FC_efetiva + TA_efetiva + FR_efetiva + SE_efetiva || 1);
        FC_efetiva *= proporcao; TA_efetiva *= proporcao; FR_efetiva *= proporcao; SE_efetiva *= proporcao;
      } else {
        totalParcela = 0; FC_efetiva = 0; TA_efetiva = 0; FR_efetiva = 0; SE_efetiva = 0;
      }
    }

    cronograma.push({
      mes,
      amortizacao: Number(FC_efetiva.toFixed(2)),
      taxaAdm: Number(TA_efetiva.toFixed(2)),
      fundoReserva: Number(FR_efetiva.toFixed(2)),
      seguro: Number(SE_efetiva.toFixed(2)),
      total: Number(totalParcela.toFixed(2)),
      saldoDevedor: Number(saldoDevedor.toFixed(2)),
      contemplado: mes >= efetivoMesContemplacao,
      adiantamento: Number(adiantamento.toFixed(2)),
    });
  }

  let parcelaInicial = cronograma.length > 0 ? cronograma[0].total : 0;
  let parcelaFinal = cronograma.length > 0 ? cronograma[cronograma.length - 1].total : 0;
  
  let parcelaPosContemplacaoInicial = undefined;
  if (efetivoMesContemplacao > 0 && efetivoMesContemplacao < prazo) {
    const pCont = cronograma.find(p => p.mes > efetivoMesContemplacao);
    if (pCont) {
       if (modalidade === 'degrau' || modalidade === 'degrau_70') {
          parcelaPosContemplacaoInicial = pCont.total;
       } else {
          parcelaFinal = pCont.total;
       }
    }
  }

  // The 'Total Pago' in Rodobens often just represents Saldo Devedor Nominal - Lance Embutido
  const totalPago_nominal = saldoDevedorInicial - lanceEmbutidoReais;

  return {
    creditoBruto: credito,
    creditoLiquido: Number(creditoLiquido.toFixed(2)),
    prazo,
    modalidade,
    parcelaInicial: Number(parcelaInicial.toFixed(2)),
    parcelaFinal: Number(parcelaFinal.toFixed(2)),
    parcelaPosContemplacaoInicial: parcelaPosContemplacaoInicial ? Number(parcelaPosContemplacaoInicial.toFixed(2)) : undefined,
    parcelaFinalNormal: (modalidade === 'degrau' || modalidade === 'degrau_70') ? Number((FC_plano + FR_plano_linear + SE_plano_linear).toFixed(2)) : undefined,
    lanceEmbutidoReais: Number(lanceEmbutidoReais.toFixed(2)),
    recursosPropriosReais: Number(recursosPropriosReais.toFixed(2)),
    lanceTotalReais: Number(lanceTotalReais.toFixed(2)),
    percentualLance: Number(percentualLance.toFixed(2)),
    saldoDevedorInicial: Number(saldoDevedorInicial.toFixed(2)),
    totalPago: Number(totalPago_nominal.toFixed(2)),
    cronograma,
    adiantamento: modalidade === 'pontual' ? Number(valorAdiantamentoPontual.toFixed(2)) : undefined,
    parcelasAntecipadas: modalidade === 'pontual' ? parcelasPontualAntecipar : undefined,
  };
}
