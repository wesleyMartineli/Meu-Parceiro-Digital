export interface DashboardLead {
  id: string;
  nome: string;
  tipo_parceiro?: string | null;
  codigo_pv?: string | null;
  cidade?: string | null;
  estado?: string | null;
  vendedor_id?: string | null;
}

export interface DashboardNegocio {
  id: string;
  cliente_id: string;
  vendedor_id: string | null;
  titulo: string;
  credito: number;
  modalidade: string;
  etapa_funil: string;
  temperatura?: string | null;
  created_at: string;
  updated_at?: string | null;
  leads?: {
    id: string;
    nome: string;
    tipo_parceiro?: string | null;
    cidade?: string | null;
    estado?: string | null;
  } | null;
  usuarios?: {
    id: string;
    nome: string;
    role: string;
  } | null;
}

export interface DashboardTarefa {
  id: string;
  lead_id: string;
  vendedor_id: string | null;
  titulo: string;
  descricao?: string | null;
  data_followup: string;
  status: string | null;
  tipo?: string | null;
  created_at: string;
  leads?: {
    id: string;
    nome: string;
    tipo_parceiro?: string | null;
  } | null;
  usuarios?: {
    id: string;
    nome: string;
  } | null;
}

export interface UsuarioHierarquia {
  id: string;
  nome: string;
  role: string;
  supervisor_id: string | null;
}

export type TipoVisualizacao = 'composed' | 'bar' | 'line' | 'area' | 'pie' | 'table';

export type TipoCategoriaAnalise = 'todas' | 'cruzada' | 'tarefas' | 'negocios';

export type TipoAgrupamento = 
  | 'mes'
  | 'semana'
  | 'representante'
  | 'parceiro'
  | 'tipo_tarefa'
  | 'etapa_pipeline'
  | 'produto_modalidade';

export type TipoMetrica =
  | 'tarefas_visitas'
  | 'tarefas_ligacoes'
  | 'tarefas_reunioes_pres'
  | 'tarefas_reunioes_online'
  | 'tarefas_whatsapp'
  | 'tarefas_emails'
  | 'tarefas_todas'
  | 'tarefas_concluidas'
  | 'producao_fechada'
  | 'producao_aberta'
  | 'producao_total'
  | 'producao_perdida'
  | 'qtd_cotas_fechadas'
  | 'qtd_negocios_pipeline'
  | 'qtd_negocios_perdidos'
  | 'ticket_medio';

export interface FiltrosAnalise {
  periodo?: string; // 'hoje' | 'semana' | 'mes' | '30dias' | 'trimestre' | 'semestre' | 'ano' | 'todos' | 'custom'
  dataInicio?: string;
  dataFim?: string;
  representanteId?: string; // 'all' ou uuid
  parceiroId?: string; // 'all' ou uuid
  tipoTarefa?: string; // 'all' ou tipo específico
  etapaPipeline?: string; // 'all' ou etapa específica
  produtoModalidade?: string; // 'all' ou produto específico (Imóveis, Automóveis, Pesados, etc.)
}

export interface CustomAnalysisConfig {
  id: string;
  titulo: string;
  descricao?: string;
  categoria?: 'cruzada' | 'tarefas' | 'negocios';
  tipoGrafico: TipoVisualizacao;
  agrupamento: TipoAgrupamento;
  metricaPrimaria: TipoMetrica;
  metricaSecundaria?: TipoMetrica | 'none';
  filtros: FiltrosAnalise;
  isPreset?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResumoOperacaoMacroMicro {
  totalCreditoFechado: number;
  totalCreditoAberto: number;
  totalTarefas: number;
  taxaConversao: number;
  tarefaMaisRealizada: {
    tipo: string;
    label: string;
    total: number;
    porcentagem: number;
  };
  produtoMaisTrazido: {
    nome: string;
    creditoTotal: number;
    qtdNegocios: number;
    porcentagemCredito: number;
  };
  parceiroMaisAtivo: {
    id: string;
    nome: string;
    totalTarefas: number;
    creditoFechado: number;
  };
}

export interface DataPointAnalysis {
  key: string;
  label: string;
  subLabel?: string;
  dateSort?: string;
  valorPrimario: number;
  valorSecundario: number;
  tarefas: DashboardTarefa[];
  negocios: DashboardNegocio[];
  cor?: string;
}

export interface DrilldownState {
  isOpen: boolean;
  tituloPonto: string;
  agrupamentoLabel: string;
  valorPrimarioLabel: string;
  valorSecundarioLabel?: string;
  tarefas: DashboardTarefa[];
  negocios: DashboardNegocio[];
}

export interface MetricaDefinicao {
  key: TipoMetrica;
  label: string;
  labelCurto: string;
  categoria: 'tarefa' | 'producao';
  tipoDado: 'numero' | 'moeda';
  descricao: string;
  cor: string;
}

export interface ComparativoItem {
  id?: string;
  nome?: string;
  label: string;
  dateSort?: string;
  esforco: number;
  resultado: number;
  fechados?: number;
  eficiencia?: number;
}

export interface AnaliseTarefas {
  ligacoes: number;
  visitas: number;
  reunioesPresenciais: number;
  reunioesOnline: number;
  whatsapp: number;
  emails: number;
  outros: number;
  totalAtividades: number;
  totalPresenciais: number;
  totalDigitais: number;
}

export interface IndicesEstrategicos {
  valorAberto: number;
  valorFechado: number;
  valorPerdido: number;
  qtdAberto: number;
  qtdFechado: number;
  qtdPerdido: number;
  totalNegocios: number;
  taxaConversao: number;
  ticketMedio: number;
  producaoPorTarefa: number;
  tarefasPorFechamento: number;
  visitasPorFechamento: number;
  parceirosAtendidos: number;
  taxaAtivacaoCarteira: number;
  totalParceiros: number;
}
