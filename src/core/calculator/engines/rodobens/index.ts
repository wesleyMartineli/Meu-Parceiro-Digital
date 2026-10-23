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

  if (modalidade === 'degrau' || modalidade === 'degrau_70' || modalidade === 'degrau_50') {
    const meioPrazo = Math.ceil(prazo / 2);
    TA_plano_inicial = (credito * (taxaAdm / 100)) / meioPrazo;
    prazoDiluicao = Math.ceil(prazo / 2) - efetivoMesContemplacao;
  }

  const parcelaInicialRef = FC_plano + TA_plano_inicial + FR_plano_linear + SE_plano_linear;

  const parcelasFuro = input.parcelasFuro || 0;
  const furoReais = parcelasFuro * parcelaInicialRef;
  const adicionalFuroDiluido = (input.diluirFuro && furoReais > 0) ? (furoReais / prazo) : 0;

  // 2. Calcular Lance Total
  // A parcela base do grupo continua existindo para fins de referência (ex: fundo reserva, conversões visuais)
  const baseSeguroGrupo = credito + (credito * (taxaAdm / 100)) + (credito * (fundoReserva / 100));
  const seguroMensalGrupo = baseSeguroGrupo * (seguro / 100);
  const parcelaBaseGrupo = (credito / prazoMaxGrupo) + ((credito * (taxaAdm / 100)) / prazoMaxGrupo) + ((credito * (fundoReserva / 100)) / prazoMaxGrupo) + seguroMensalGrupo;

  // O Lance Total na Rodobens é ofertado em cima da Parcela Cheia (Integral 100%) da Cota.
  // Quando há diluição do furo nas parcelas a vencer, a parcela base do lance incorpora o valor do furo diluído.
  const parcelaCheiaCota = FC_plano + TA_plano_linear + FR_plano_linear + SE_plano_linear + adicionalFuroDiluido;

  let lanceTotalReais = 0;
  if (modalidade === 'pontual') {
    lanceTotalReais = 0; // Pontual não possui lance, a aquisição é feita puramente pelo adiantamento
  } else if (tipoLance === 'valor') {
    lanceTotalReais = (recursosProprios || 0) + (credito * ((lanceEmbutido || 0) / 100));
  } else if (tipoLance === '%') {
    lanceTotalReais = credito * (((recursosProprios || 0) + (lanceEmbutido || 0)) / 100);
  } else if (tipoLance === 'parcelas' || !tipoLance) {
    // A quantidade de parcelas informada pelo usuário já é a quantidade no prazo da cota.
    // Portanto, o lance total é simplesmente a quantidade × parcela da cota (já com furo diluído se aplicável).
    const qParcelasCota = quantidadeParcelasLance || 0;
    
    if (modalidade === 'degrau' || modalidade === 'degrau_70' || modalidade === 'degrau_50') {
      const meioPrazo = Math.ceil(prazo / 2);
      const TA_dobrada = (credito * (taxaAdm / 100)) / meioPrazo;
      
      const parcelaInicialDegrau = FC_plano + TA_dobrada + FR_plano_linear + SE_plano_linear + adicionalFuroDiluido;
      const parcelaFinalDegrau = FC_plano + FR_plano_linear + SE_plano_linear + adicionalFuroDiluido;

      if (qParcelasCota > meioPrazo) {
        lanceTotalReais = (parcelaFinalDegrau * meioPrazo) + (parcelaInicialDegrau * (qParcelasCota - meioPrazo));
      } else {
        lanceTotalReais = qParcelasCota * parcelaFinalDegrau;
      }
    } else {
      lanceTotalReais = qParcelasCota * parcelaCheiaCota;
    }

    if (input.baseCalculoLance === 'reduzida') {
      lanceTotalReais *= (modalidade === 'reducao_50' || modalidade === 'degrau_50') ? 0.50 : 0.70;
    }
  }

  // Regra solicitada: O valor do lance deve cobrir o furo quando não diluído. 
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

  // 4. Saldo Devedor Inicial Nominal
  let saldoDevedorInicial = (FC_plano + TA_plano_linear + FR_plano_linear + SE_plano_linear) * prazo;
  if (input.diluirFuro && furoReais > 0) {
    saldoDevedorInicial += furoReais;
  }

  const pontualMesAquicao = mesPontual;
  const parcelasPontualNecessarias = Math.round(prazo * 0.40);
  const parcelasPontualAntecipar = Math.max(parcelasPontualNecessarias - pontualMesAquicao, 0);
  const parcelaBaseLinear = FC_plano + TA_plano_linear + FR_plano_linear + SE_plano_linear;
  const valorAdiantamentoPontual = parcelasPontualAntecipar * parcelaBaseLinear;

  const isDegrau = modalidade === 'degrau' || modalidade === 'degrau_70' || modalidade === 'degrau_50';
  const meioPrazo = Math.ceil(prazo / 2);
  const TA_dobrada = (credito * (taxaAdm / 100)) / meioPrazo;

  // Rastrear diferenças acumuladas antes da contemplação
  let diferencaAcumuladaFC = 0;
  let diferencaAcumuladaTA = 0;

  for (let mes = 1; mes <= Math.min(efetivoMesContemplacao, prazo); mes++) {
    const FC_cheio = FC_plano;
    const TA_cheio = isDegrau ? (mes <= meioPrazo ? TA_dobrada : 0) : TA_plano_linear;

    let FC_pago = FC_cheio;
    let TA_pago = TA_cheio;

    if (modalidade === 'linear_70' || modalidade === 'degrau_70') {
      FC_pago = FC_cheio * 0.7;
      TA_pago = TA_cheio * 0.7;
      diferencaAcumuladaFC += (FC_cheio - FC_pago);
      diferencaAcumuladaTA += (TA_cheio - TA_pago);
    } else if (modalidade === 'reducao_50' || modalidade === 'degrau_50') {
      FC_pago = FC_cheio * 0.5;
      TA_pago = TA_cheio * 0.5;
      diferencaAcumuladaFC += (FC_cheio - FC_pago);
      diferencaAcumuladaTA += (TA_cheio - TA_pago);
    }
  }

  const mesesRestantes = Math.max(prazo - efetivoMesContemplacao, 0);
  const recupFC = mesesRestantes > 0 ? (diferencaAcumuladaFC / mesesRestantes) : 0;
  const recupTA = mesesRestantes > 0 ? (diferencaAcumuladaTA / mesesRestantes) : 0;

  interface MonthObligation {
    mes: number;
    FC: number;
    TA: number;
    FR: number;
    SE: number;
    total: number;
  }

  const futureMonths: MonthObligation[] = [];
  for (let mes = efetivoMesContemplacao + 1; mes <= prazo; mes++) {
    const FC = FC_plano + recupFC + adicionalFuroDiluido;
    const TA_base = isDegrau ? (mes <= meioPrazo ? TA_dobrada : 0) : TA_plano_linear;
    const TA = TA_base + recupTA;
    const FR = FR_plano_linear;
    const SE = SE_plano_linear;
    const total = FC + TA + FR + SE;
    futureMonths.push({ mes, FC, TA, FR, SE, total });
  }

  // Divisão do lance para prazo vs parcela
  let lanceParaParcela = 0;
  let lanceParaPrazo = 0;

  if (abatimento === 'prazo') {
    lanceParaPrazo = excessoLance;
  } else if (abatimento === 'misto') {
    lanceParaParcela = excessoLance * 0.5;
    lanceParaPrazo = excessoLance * 0.5;
  } else {
    lanceParaParcela = excessoLance;
  }

  // Eliminar parcelas do fim no caso de redução de prazo
  let mesesQuitadosPorPrazo = 0;
  let sobraLancePrazo = lanceParaPrazo;

  if (lanceParaPrazo > 0 && futureMonths.length > 0) {
    for (let i = futureMonths.length - 1; i >= 0; i--) {
      const valorMes = futureMonths[i].total;
      if (sobraLancePrazo >= valorMes - 0.01) {
        sobraLancePrazo -= valorMes;
        mesesQuitadosPorPrazo++;
      } else {
        break;
      }
    }
    // Sobras de centavos/parcela incompleta amortizam as parcelas ativas
    if (sobraLancePrazo > 0) {
      lanceParaParcela += sobraLancePrazo;
    }
  }

  const activeFutureCount = futureMonths.length - mesesQuitadosPorPrazo;
  const activeFutureMonths = futureMonths.slice(0, activeFutureCount);
  const totalAtivoSemLance = activeFutureMonths.reduce((acc, m) => acc + m.total, 0);

  // Proporção de abatimento nas parcelas restantes
  const fatorReducao = totalAtivoSemLance > 0 ? Math.min(lanceParaParcela / totalAtivoSemLance, 1) : 0;
  const fatorMultiplicador = 1 - fatorReducao;

  const cronograma: CronogramaParcela[] = [];
  let saldoDevedor = saldoDevedorInicial;

  // 1. Meses até a contemplação
  for (let mes = 1; mes <= efetivoMesContemplacao; mes++) {
    const FC_cheio = FC_plano;
    const TA_cheio = isDegrau ? (mes <= meioPrazo ? TA_dobrada : 0) : TA_plano_linear;
    const FR_cheio = FR_plano_linear;
    const SE_cheio = SE_plano_linear;

    let FC_efetiva = FC_cheio;
    let TA_efetiva = TA_cheio;
    let FR_efetiva = FR_cheio;
    let SE_efetiva = SE_cheio;
    let adiantamento = 0;

    if (modalidade === 'linear_70' || modalidade === 'degrau_70') {
      FC_efetiva = FC_cheio * 0.7;
      TA_efetiva = TA_cheio * 0.7;
    } else if (modalidade === 'reducao_50' || modalidade === 'degrau_50') {
      FC_efetiva = FC_cheio * 0.5;
      TA_efetiva = TA_cheio * 0.5;
    }

    if (input.diluirFuro && furoReais > 0) {
      FC_efetiva += (furoReais / prazo);
    }

    if (modalidade === 'pontual' && mes === pontualMesAquicao) {
      adiantamento = valorAdiantamentoPontual;
    }

    const totalParcela = FC_efetiva + TA_efetiva + FR_efetiva + SE_efetiva;
    const lancePagoNesseMes = (mes === efetivoMesContemplacao)
      ? (input.diluirFuro ? lanceTotalReais : Math.max(lanceTotalReais, furoReais))
      : 0;

    saldoDevedor = Math.max(saldoDevedor - (totalParcela + lancePagoNesseMes + adiantamento), 0);

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
      quitadaPorLance: false,
    });
  }

  // 2. Meses pós-contemplação ativos (proporcionalmente amortizados)
  for (let i = 0; i < activeFutureMonths.length; i++) {
    const fm = activeFutureMonths[i];
    const isLastActive = (i === activeFutureMonths.length - 1);

    let FC_efetiva = fm.FC * fatorMultiplicador;
    let TA_efetiva = fm.TA * fatorMultiplicador;
    let FR_efetiva = fm.FR * fatorMultiplicador;
    let SE_efetiva = fm.SE * fatorMultiplicador;
    let totalParcela = FC_efetiva + TA_efetiva + FR_efetiva + SE_efetiva;

    if (fatorMultiplicador <= 0.0001) {
      FC_efetiva = 0;
      TA_efetiva = 0;
      FR_efetiva = 0;
      SE_efetiva = 0;
      totalParcela = 0;
      saldoDevedor = 0;
    } else {
      saldoDevedor = Math.max(saldoDevedor - totalParcela, 0);
      // Ajuste de precisão centesimal no último mês ativo
      if (isLastActive && saldoDevedor < 2.00) {
        totalParcela += saldoDevedor;
        FC_efetiva += saldoDevedor;
        saldoDevedor = 0;
      }
    }

    cronograma.push({
      mes: fm.mes,
      amortizacao: Number(FC_efetiva.toFixed(2)),
      taxaAdm: Number(TA_efetiva.toFixed(2)),
      fundoReserva: Number(FR_efetiva.toFixed(2)),
      seguro: Number(SE_efetiva.toFixed(2)),
      total: Number(totalParcela.toFixed(2)),
      saldoDevedor: Number(saldoDevedor.toFixed(2)),
      contemplado: true,
      adiantamento: 0,
      quitadaPorLance: fatorMultiplicador <= 0.0001,
    });
  }

  // 3. Meses finais quitados pelo abatimento em prazo
  for (let mes = efetivoMesContemplacao + activeFutureCount + 1; mes <= prazo; mes++) {
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
  }

  const parcelaInicial = cronograma.length > 0 ? cronograma[0].total : 0;
  
  // Parcela pós-contemplação representativa para UI e Proposta:
  let parcelaPosContemplacaoInicial: number | undefined = undefined;
  let parcelaFinal = 0;

  if (isDegrau) {
    if (efetivoMesContemplacao < meioPrazo) {
      // Fase 1 pós-contemplação (meses efetivoMesContemplacao+1 até meioPrazo)
      const pPhase1 = cronograma.find(p => p.mes > efetivoMesContemplacao && p.mes <= meioPrazo && !p.quitadaPorLance);
      if (pPhase1) {
        parcelaPosContemplacaoInicial = pPhase1.total;
      }
      // Fase 2 pós-contemplação (meses meioPrazo+1 até fim)
      const pPhase2 = cronograma.find(p => p.mes > meioPrazo && !p.quitadaPorLance);
      if (pPhase2) {
        parcelaFinal = pPhase2.total;
      } else if (pPhase1) {
        parcelaFinal = pPhase1.total;
      }
    } else {
      // Se contemplado após a metade do prazo, só resta a Fase 2 (sem TA)
      const pPhase2 = cronograma.find(p => p.mes > efetivoMesContemplacao && !p.quitadaPorLance);
      if (pPhase2) {
        parcelaFinal = pPhase2.total;
      }
    }
  } else {
    // Linear
    const pPos = cronograma.find(p => p.mes > efetivoMesContemplacao && !p.quitadaPorLance);
    if (pPos) {
      parcelaFinal = pPos.total;
    } else {
      parcelaFinal = parcelaInicial;
    }
  }

  const totalPago_nominal = saldoDevedorInicial - lanceEmbutidoReais;

  return {
    creditoBruto: credito,
    creditoLiquido: Number(creditoLiquido.toFixed(2)),
    prazo,
    prazoEfetivo: prazo - mesesQuitadosPorPrazo,
    mesesReduzidos: mesesQuitadosPorPrazo,
    modalidade,
    parcelaInicial: Number(parcelaInicial.toFixed(2)),
    parcelaFinal: Number(parcelaFinal.toFixed(2)),
    parcelaPosContemplacaoInicial: parcelaPosContemplacaoInicial ? Number(parcelaPosContemplacaoInicial.toFixed(2)) : undefined,
    parcelaFinalNormal: isDegrau ? Number((FC_plano + FR_plano_linear + SE_plano_linear + adicionalFuroDiluido).toFixed(2)) : undefined,
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
