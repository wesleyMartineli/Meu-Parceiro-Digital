// Calculator Types for Consórcio Simulators

export interface SimulacaoInput {
  credito: number;          // Crédito Bruto
  prazo: number;             // Prazo em meses
  modalidade: 'linear' | 'linear_70' | 'reducao_50' | 'degrau' | 'degrau_70' | 'pontual' | 'reduzida';
  taxaAdm: number;           // Taxa de administração total em % (ex: 15)
  fundoReserva: number;      // Fundo de reserva total em % (ex: 2)
  seguro: number;            // Seguro total em % (ex: 1)
  percentualReducao?: number; // Redução customizada na modalidade reduzida (universal)
  lanceEmbutido: number;     // Valor do lance embutido (pode ser percentual ou valor fixo dependendo do tipoLance)
  recursosProprios: number;  // Valor do lance de recursos próprios
  tipoLance: 'valor' | '%' | 'parcelas'; // Se o lance é expresso em valor (R$), percentual (%), ou quantidade de parcelas
  quantidadeParcelasLance?: number; // Quando tipoLance='parcelas', número de parcelas que compõem o lance
  parcelasFuro?: number;     // Furo de parcelas (ex: cliente entrando em grupo em andamento)
  diluirFuro?: boolean;      // Se true, dilui o furo nas parcelas em vez de exigir pagamento no lance
  abatimento: 'parcela' | 'prazo' | 'misto'; // Como o lance será amortizado: diluir parcelas, reduzir prazo, ou 50%/50%
  mesContemplacao: number;   // Mês estimado para contemplação (para cálculo de recálculo das modalidades reduzidas)
  mesPontual?: number;       // Mês programado de aquisição na modalidade Pontual (ex: 6 para auto, 12 para imóvel)
  prazoMaxGrupo?: number;    // Prazo máximo do grupo (opcional, para motor Rodobens)
  taxaAdesao?: number;       // Percentual da taxa de adesão (ex: 2) - exclusivo PortoBank
  prazoTaxaAdesao?: number;  // Prazo em meses para pagar a taxa (ex: 1, 3, 5, 12, 24) - exclusivo PortoBank
  baseCalculoLance?: 'integral' | 'reduzida'; // Define se o cálculo de lance considera parcela cheia ou reduzida
}

export interface CronogramaParcela {
  mes: number;
  amortizacao: number;
  taxaAdm: number;
  fundoReserva: number;
  seguro: number;
  total: number;
  saldoDevedor: number;
  contemplado: boolean;
  adiantamento: number; // Valor extra pago de adiantamento (como na modalidade pontual)
  quitadaPorLance?: boolean;
  taxaAdesao?: number; // Valor da taxa de adesão cobrada no mês
}

export interface CotaResult {
  creditoBruto: number;
  creditoLiquido: number;
  prazo: number;
  modalidade: string;
  parcelaInicial: number;
  parcelaFinal: number;
  parcelaPosContemplacaoInicial?: number;
  parcelaPosAdesao?: number;
  parcelaFinalNormal?: number;
  lanceEmbutidoReais: number;
  recursosPropriosReais: number;
  lanceTotalReais: number;
  percentualLance: number;
  saldoDevedorInicial: number;
  totalPago: number;
  cronograma: CronogramaParcela[];
  saldoLiquido?: number;
  taxaAmSobSaldoLiquido?: number;
  adiantamento?: number;
  parcelasAntecipadas?: number;
}

export interface SimulacaoResult {
  totalCreditoBruto: number;
  totalCreditoLiquido: number;
  totalLanceEmbutido: number;
  totalRecursosProprios: number;
  totalLance: number;
  percentualLanceMedio: number;
  totalParcelaInicial: number;
  totalParcelaFinal: number;
  totalFinalPago: number;
  cotas: CotaResult[];
}
