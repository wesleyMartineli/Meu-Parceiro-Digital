import {
  CustomAnalysisConfig,
  DashboardLead,
  DashboardNegocio,
  DashboardTarefa,
  DataPointAnalysis,
  MetricaDefinicao,
  ResumoOperacaoMacroMicro,
  TipoAgrupamento,
  TipoMetrica,
  UsuarioHierarquia
} from "./types";

export const BRAND_COLORS = {
  verdeEscuro: "#00441F", // Pantone 3245C / 3425C
  verdeVivo: "#00CF7B",   // Pantone 7480C
  verdeClaro: "#E0E5CF",  // Pantone 2274C
  branco: "#FFFFFF",
  laranja: "#FF7A40",     // Pantone 1575C
  azul: "#00A8E2",        // Pantone 2192C
  rosa: "#EF6FD4",        // Pantone 252C
};

export const BRAND_CHART_PALETTE = [
  "#00CF7B", // Verde-vivo
  "#00441F", // Verde-escuro
  "#00A8E2", // Azul
  "#FF7A40", // Laranja
  "#EF6FD4", // Rosa
  "#E0E5CF", // Verde-claro
];

export const METRICAS_CATALOGO: Record<TipoMetrica, MetricaDefinicao> = {
  tarefas_visitas: {
    key: "tarefas_visitas",
    label: "Número de Visitas a Parceiros",
    labelCurto: "Visitas",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Contagem de visitas comerciais presenciais a parceiros",
    cor: BRAND_COLORS.azul,
  },
  tarefas_ligacoes: {
    key: "tarefas_ligacoes",
    label: "Número de Ligações Telefônicas",
    labelCurto: "Ligações",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Contagem de contatos telefônicos comerciais realizados",
    cor: BRAND_COLORS.laranja,
  },
  tarefas_reunioes_pres: {
    key: "tarefas_reunioes_pres",
    label: "Reuniões Presenciais",
    labelCurto: "Reuniões Pres.",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Contagem de reuniões presenciais realizadas",
    cor: BRAND_COLORS.verdeEscuro,
  },
  tarefas_reunioes_online: {
    key: "tarefas_reunioes_online",
    label: "Reuniões Online (Vídeo)",
    labelCurto: "Reuniões Online",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Contagem de reuniões e apresentações remotas por vídeo",
    cor: BRAND_COLORS.azul,
  },
  tarefas_whatsapp: {
    key: "tarefas_whatsapp",
    label: "Contatos via WhatsApp",
    labelCurto: "WhatsApp",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Contagem de follow-ups e interações comerciais via WhatsApp",
    cor: BRAND_COLORS.verdeVivo,
  },
  tarefas_emails: {
    key: "tarefas_emails",
    label: "E-mails & Propostas Enviadas",
    labelCurto: "E-mails",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Contagem de comunicações por e-mail e envio de estudos",
    cor: BRAND_COLORS.rosa,
  },
  tarefas_todas: {
    key: "tarefas_todas",
    label: "Total de Tarefas Comerciais",
    labelCurto: "Total Tarefas",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Soma de todas as ações operacionais registradas",
    cor: BRAND_COLORS.verdeEscuro,
  },
  tarefas_concluidas: {
    key: "tarefas_concluidas",
    label: "Tarefas Concluídas",
    labelCurto: "Concluídas",
    categoria: "tarefa",
    tipoDado: "numero",
    descricao: "Apenas tarefas com status finalizado/concluído",
    cor: BRAND_COLORS.verdeVivo,
  },
  producao_fechada: {
    key: "producao_fechada",
    label: "Produção Fechada / Ganha (R$)",
    labelCurto: "Produção Fechada",
    categoria: "producao",
    tipoDado: "moeda",
    descricao: "Volume total de crédito consórcio ganho/fechado",
    cor: BRAND_COLORS.verdeVivo,
  },
  producao_aberta: {
    key: "producao_aberta",
    label: "Volume em Carteira / Aberto (R$)",
    labelCurto: "Em Carteira",
    categoria: "producao",
    tipoDado: "moeda",
    descricao: "Volume de crédito em negociação ativa no pipeline",
    cor: BRAND_COLORS.azul,
  },
  producao_total: {
    key: "producao_total",
    label: "Volume Total de Negócios (R$)",
    labelCurto: "Volume Total",
    categoria: "producao",
    tipoDado: "moeda",
    descricao: "Soma de crédito de todas as oportunidades trabalhadas",
    cor: BRAND_COLORS.verdeEscuro,
  },
  producao_perdida: {
    key: "producao_perdida",
    label: "Volume Perdido / Desistência (R$)",
    labelCurto: "Volume Perdido",
    categoria: "producao",
    tipoDado: "moeda",
    descricao: "Volume de crédito que não converteu no pipeline",
    cor: BRAND_COLORS.laranja,
  },
  qtd_cotas_fechadas: {
    key: "qtd_cotas_fechadas",
    label: "Qtd de Cotas / Negócios Fechados",
    labelCurto: "Qtd Fechamentos",
    categoria: "producao",
    tipoDado: "numero",
    descricao: "Número absoluto de propostas/negócios ganhos",
    cor: BRAND_COLORS.verdeVivo,
  },
  qtd_negocios_pipeline: {
    key: "qtd_negocios_pipeline",
    label: "Qtd Total de Oportunidades no Pipeline",
    labelCurto: "Qtd Oportunidades",
    categoria: "producao",
    tipoDado: "numero",
    descricao: "Número de negócios cadastrados em qualquer etapa",
    cor: BRAND_COLORS.azul,
  },
  qtd_negocios_perdidos: {
    key: "qtd_negocios_perdidos",
    label: "Qtd de Negócios Perdidos",
    labelCurto: "Qtd Perdidos",
    categoria: "producao",
    tipoDado: "numero",
    descricao: "Número de negócios finalizados como perdidos",
    cor: BRAND_COLORS.laranja,
  },
  ticket_medio: {
    key: "ticket_medio",
    label: "Ticket Médio Fechado (R$)",
    labelCurto: "Ticket Médio",
    categoria: "producao",
    tipoDado: "moeda",
    descricao: "Média de valor de crédito por cota fechada",
    cor: BRAND_COLORS.rosa,
  },
};

export const PRODUTOS_OPCOES = [
  "Imóveis",
  "Automóveis & Veículos",
  "Pesados & Maquinários",
  "Serviços",
  "Consórcio Geral",
];

export const TIPOS_TAREFA_OPCOES = [
  { key: "visita", label: "Visita a Parceiro" },
  { key: "ligacao", label: "Ligação Telefônica" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "reuniao_presencial", label: "Reunião Presencial" },
  { key: "reuniao_online", label: "Reunião Online" },
  { key: "email", label: "E-mail / Proposta" },
];

export function normalizarProduto(modalidade?: string | null, titulo?: string | null): string {
  const text = `${modalidade || ""} ${titulo || ""}`.toLowerCase();
  if (
    text.includes("pesad") ||
    text.includes("caminha") ||
    text.includes("trator") ||
    text.includes("maquin") ||
    text.includes("agricola")
  ) {
    return "Pesados & Maquinários";
  }
  if (
    text.includes("imovel") ||
    text.includes("imóvel") ||
    text.includes("casa") ||
    text.includes("terreno") ||
    text.includes("construcao") ||
    text.includes("apartamento")
  ) {
    return "Imóveis";
  }
  if (
    text.includes("auto") ||
    text.includes("carro") ||
    text.includes("veicul") ||
    text.includes("veícu") ||
    text.includes("moto")
  ) {
    return "Automóveis & Veículos";
  }
  if (text.includes("servic") || text.includes("serviç")) {
    return "Serviços";
  }
  if (modalidade && modalidade.trim().length > 0 && modalidade.toLowerCase() !== "null") {
    return modalidade.charAt(0).toUpperCase() + modalidade.slice(1);
  }
  return "Consórcio Geral";
}

export const PRESET_ANALYSES: CustomAnalysisConfig[] = [
  // 1. CRUZAMENTO (NEGÓCIOS X TAREFAS)
  {
    id: "preset-visitas-x-producao",
    titulo: "Visitas presenciais versus Produção por Mês",
    descricao: "Correlação direta entre o esforço de campo em visitas a parceiros e o volume de crédito fechado ao longo dos meses.",
    categoria: "cruzada",
    tipoGrafico: "composed",
    agrupamento: "mes",
    metricaPrimaria: "tarefas_visitas",
    metricaSecundaria: "producao_fechada",
    filtros: { periodo: "ano", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },
  {
    id: "preset-parceiros-esforco-retorno",
    titulo: "Eficiência por Parceiro: Ações Comerciais x Produção",
    descricao: "Compare quantas ações comerciais foram dedicadas a cada ponto de venda da carteira versus o volume de crédito efetivamente gerado.",
    categoria: "cruzada",
    tipoGrafico: "composed",
    agrupamento: "parceiro",
    metricaPrimaria: "tarefas_todas",
    metricaSecundaria: "producao_fechada",
    filtros: { periodo: "mes", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },

  // 2. APENAS TAREFAS (QUAL TAREFA ESTOU REALIZANDO MAIS?)
  {
    id: "preset-mix-tarefas",
    titulo: "Qual tarefa estou realizando mais? (Distribuição por Tipo)",
    descricao: "Visão quantitativa de qual tipo de atividade consome mais esforço da operação: ligações, visitas, WhatsApp, reuniões presenciais ou online.",
    categoria: "tarefas",
    tipoGrafico: "bar",
    agrupamento: "tipo_tarefa",
    metricaPrimaria: "tarefas_todas",
    metricaSecundaria: "none",
    filtros: { periodo: "mes", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },
  {
    id: "preset-evolucao-tarefas",
    titulo: "Evolução Histórica de Tarefas por Mês",
    descricao: "Acompanhe o ritmo e consistência das tarefas realizadas mês a mês, comparando o total de ações versus tarefas concluídas.",
    categoria: "tarefas",
    tipoGrafico: "line",
    agrupamento: "mes",
    metricaPrimaria: "tarefas_todas",
    metricaSecundaria: "tarefas_concluidas",
    filtros: { periodo: "ano", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },
  {
    id: "preset-tarefas-por-parceiro",
    titulo: "Intensidade de Contato por Parceiro (Top Atendimentos)",
    descricao: "Ranking dos parceiros que mais receberam visitas, reuniões e contatos comerciais.",
    categoria: "tarefas",
    tipoGrafico: "bar",
    agrupamento: "parceiro",
    metricaPrimaria: "tarefas_todas",
    metricaSecundaria: "tarefas_visitas",
    filtros: { periodo: "mes", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },

  // 3. APENAS NEGÓCIOS & PRODUTOS (QUAIS NEGÓCIOS E PRODUTOS TRAZEM MAIS?)
  {
    id: "preset-produtos-modalidade",
    titulo: "Quais produtos trazem mais resultados? (Produção por Modalidade)",
    descricao: "Descubra qual produto de consórcio (Imóveis, Automóveis, Pesados, Serviços) gera maior volume de crédito e cotas fechadas.",
    categoria: "negocios",
    tipoGrafico: "composed",
    agrupamento: "produto_modalidade",
    metricaPrimaria: "producao_fechada",
    metricaSecundaria: "qtd_cotas_fechadas",
    filtros: { periodo: "ano", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },
  {
    id: "preset-funil-etapas",
    titulo: "Volume de Crédito por Etapa do Pipeline",
    descricao: "Concentração do volume financeiro em consórcio em cada fase do funil de vendas (Prospecção até Fechamento).",
    categoria: "negocios",
    tipoGrafico: "bar",
    agrupamento: "etapa_pipeline",
    metricaPrimaria: "producao_aberta",
    metricaSecundaria: "qtd_negocios_pipeline",
    filtros: { periodo: "todos", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },
  {
    id: "preset-ranking-equipe",
    titulo: "Produtividade por Representante: Ações x Produção",
    descricao: "Quadro comparativo de volume de ações realizadas versus crédito ganho por membro da equipe comercial.",
    categoria: "cruzada",
    tipoGrafico: "composed",
    agrupamento: "representante",
    metricaPrimaria: "tarefas_todas",
    metricaSecundaria: "producao_fechada",
    filtros: { periodo: "mes", representanteId: "all", parceiroId: "all", produtoModalidade: "all", tipoTarefa: "all" },
    isPreset: true,
  },
];

export const AGRUPAMENTO_LABELS: Record<TipoAgrupamento, string> = {
  mes: "Por Mês (Cronológico)",
  semana: "Por Semana",
  parceiro: "Por Parceiro da Carteira",
  representante: "Por Representante Comercial",
  tipo_tarefa: "Por Tipo de Tarefa (Esforço)",
  etapa_pipeline: "Por Etapa do Pipeline",
  produto_modalidade: "Por Produto / Modalidade de Consórcio",
};

export const VISUALIZACAO_LABELS: Record<string, string> = {
  composed: "Comparativo Duplo (Barras + Linha)",
  bar: "Gráfico de Barras",
  line: "Gráfico de Linha",
  area: "Gráfico de Área",
  pie: "Gráfico de Pizza / Rosca",
  table: "Tabela Analítica",
};

export function isGanho(etapa?: string | null): boolean {
  if (!etapa) return false;
  const l = etapa.toLowerCase();
  return l === "fechado" || l === "fechado_ganho" || l === "ganho";
}

export function isPerdido(etapa?: string | null): boolean {
  if (!etapa) return false;
  return etapa.toLowerCase() === "perdido";
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatShortBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return formatBRL(value);
}

export function formatValor(value: number, tipoDado: "numero" | "moeda"): string {
  if (tipoDado === "moeda") return formatBRL(value);
  return new Intl.NumberFormat("pt-BR").format(value);
}

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/**
 * Filtra dados brutos aplicando os filtros da análise
 */
export function aplicarFiltros(
  negocios: DashboardNegocio[],
  tarefas: DashboardTarefa[],
  filtros: CustomAnalysisConfig["filtros"]
) {
  let nList = negocios;
  let tList = tarefas;

  // Filtro por Representante
  if (filtros.representanteId && filtros.representanteId !== "all") {
    nList = nList.filter((n) => n.vendedor_id === filtros.representanteId);
    tList = tList.filter((t) => t.vendedor_id === filtros.representanteId);
  }

  // Filtro por Parceiro
  if (filtros.parceiroId && filtros.parceiroId !== "all") {
    nList = nList.filter((n) => n.cliente_id === filtros.parceiroId);
    tList = tList.filter((t) => t.lead_id === filtros.parceiroId);
  }

  // Filtro por Tipo de Tarefa
  if (filtros.tipoTarefa && filtros.tipoTarefa !== "all") {
    tList = tList.filter((t) => (t.tipo || "").toLowerCase() === filtros.tipoTarefa?.toLowerCase());
  }

  // Filtro por Etapa do Pipeline
  if (filtros.etapaPipeline && filtros.etapaPipeline !== "all") {
    nList = nList.filter((n) => (n.etapa_funil || "").toLowerCase() === filtros.etapaPipeline?.toLowerCase());
  }

  // Filtro por Produto / Modalidade
  if (filtros.produtoModalidade && filtros.produtoModalidade !== "all") {
    nList = nList.filter((n) => normalizarProduto(n.modalidade, n.titulo) === filtros.produtoModalidade);
    // Para tarefas, filtra parceiros que possuem negócios no produto selecionado
    const parceirosComProduto = new Set(nList.map((n) => n.cliente_id));
    if (parceirosComProduto.size > 0) {
      tList = tList.filter((t) => parceirosComProduto.has(t.lead_id));
    }
  }

  // Filtro por Período
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  const periodo = filtros.periodo || "mes";

  if (periodo === "hoje") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (periodo === "semana") {
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    startDate = startOfWeek;
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (periodo === "mes") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (periodo === "30dias") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (periodo === "trimestre") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
  } else if (periodo === "semestre") {
    const isSecondHalf = now.getMonth() >= 6;
    startDate = new Date(now.getFullYear(), isSecondHalf ? 6 : 0, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), isSecondHalf ? 11 : 5, 31, 23, 59, 59);
  } else if (periodo === "ano") {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else if (periodo === "custom") {
    if (filtros.dataInicio) startDate = new Date(`${filtros.dataInicio}T00:00:00`);
    if (filtros.dataFim) endDate = new Date(`${filtros.dataFim}T23:59:59`);
  }

  const isDateInRange = (dateStr?: string | null) => {
    if (!dateStr) return false;
    if (!startDate && !endDate) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  if (periodo !== "todos") {
    nList = nList.filter((n) => {
      const dateToCheck = isGanho(n.etapa_funil) && n.updated_at ? n.updated_at : n.created_at;
      return isDateInRange(dateToCheck);
    });
    tList = tList.filter((t) => isDateInRange(t.data_followup || t.created_at));
  }

  return { nList, tList };
}

/**
 * Calcula o valor de uma métrica para um conjunto de tarefas e negócios
 */
export function calcularValorMetrica(
  metrica: TipoMetrica,
  tarefasSubset: DashboardTarefa[],
  negociosSubset: DashboardNegocio[]
): number {
  switch (metrica) {
    case "tarefas_visitas":
      return tarefasSubset.filter(
        (t) => (t.tipo || "").toLowerCase() === "visita" || (t.tipo || "").toLowerCase() === "reuniao_presencial"
      ).length;
    case "tarefas_ligacoes":
      return tarefasSubset.filter((t) => (t.tipo || "").toLowerCase() === "ligacao").length;
    case "tarefas_reunioes_pres":
      return tarefasSubset.filter((t) => (t.tipo || "").toLowerCase() === "reuniao_presencial").length;
    case "tarefas_reunioes_online":
      return tarefasSubset.filter(
        (t) => (t.tipo || "").toLowerCase() === "reuniao_online" || (t.tipo || "").toLowerCase() === "reuniao"
      ).length;
    case "tarefas_whatsapp":
      return tarefasSubset.filter((t) => (t.tipo || "").toLowerCase() === "whatsapp").length;
    case "tarefas_emails":
      return tarefasSubset.filter((t) => (t.tipo || "").toLowerCase() === "email").length;
    case "tarefas_todas":
      return tarefasSubset.length;
    case "tarefas_concluidas":
      return tarefasSubset.filter((t) => (t.status || "").toLowerCase() === "concluido" || (t.status || "").toLowerCase() === "realizado").length;

    case "producao_fechada":
      return negociosSubset
        .filter((n) => isGanho(n.etapa_funil))
        .reduce((acc, n) => acc + (Number(n.credito) || 0), 0);
    case "producao_aberta":
      return negociosSubset
        .filter((n) => !isGanho(n.etapa_funil) && !isPerdido(n.etapa_funil))
        .reduce((acc, n) => acc + (Number(n.credito) || 0), 0);
    case "producao_total":
      return negociosSubset.reduce((acc, n) => acc + (Number(n.credito) || 0), 0);
    case "producao_perdida":
      return negociosSubset
        .filter((n) => isPerdido(n.etapa_funil))
        .reduce((acc, n) => acc + (Number(n.credito) || 0), 0);

    case "qtd_cotas_fechadas":
      return negociosSubset.filter((n) => isGanho(n.etapa_funil)).length;
    case "qtd_negocios_pipeline":
      return negociosSubset.length;
    case "qtd_negocios_perdidos":
      return negociosSubset.filter((n) => isPerdido(n.etapa_funil)).length;

    case "ticket_medio": {
      const fechados = negociosSubset.filter((n) => isGanho(n.etapa_funil));
      const totalFechado = fechados.reduce((acc, n) => acc + (Number(n.credito) || 0), 0);
      return fechados.length > 0 ? totalFechado / fechados.length : 0;
    }

    default:
      return 0;
  }
}

/**
 * Motor Principal: Processa e Agrupa os dados conforme a configuração
 */
export function executarAnalise(
  config: CustomAnalysisConfig,
  allNegocios: DashboardNegocio[],
  allTarefas: DashboardTarefa[],
  allParceiros: DashboardLead[],
  allUsuarios: UsuarioHierarquia[]
): {
  dataPoints: DataPointAnalysis[];
  totalPrimario: number;
  totalSecundario: number;
  defPrimaria: MetricaDefinicao;
  defSecundaria?: MetricaDefinicao;
} {
  const { nList, tList } = aplicarFiltros(allNegocios, allTarefas, config.filtros);

  const defPrimaria = METRICAS_CATALOGO[config.metricaPrimaria] || METRICAS_CATALOGO.tarefas_visitas;
  const defSecundaria =
    config.metricaSecundaria && config.metricaSecundaria !== "none"
      ? METRICAS_CATALOGO[config.metricaSecundaria]
      : undefined;

  // Mapa de Agrupamento: Key -> { label, subLabel, dateSort, tarefas: [], negocios: [] }
  const groupsMap = new Map<
    string,
    {
      key: string;
      label: string;
      subLabel?: string;
      dateSort?: string;
      tarefas: DashboardTarefa[];
      negocios: DashboardNegocio[];
      cor?: string;
    }
  >();

  // Helper para garantir que a chave do grupo exista
  const getOrCreateGroup = (
    key: string,
    label: string,
    subLabel?: string,
    dateSort?: string,
    cor?: string
  ) => {
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { key, label, subLabel, dateSort, tarefas: [], negocios: [], cor });
    }
    return groupsMap.get(key)!;
  };

  const { agrupamento } = config;

  if (agrupamento === "mes") {
    // Agrupa por Mês Cronológico (ex: 2026-09)
    tList.forEach((t) => {
      const d = new Date(t.data_followup || t.created_at);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const g = getOrCreateGroup(key, label, `${MESES_ABREV[d.getMonth()]} de ${d.getFullYear()}`, key);
      g.tarefas.push(t);
    });

    nList.forEach((n) => {
      const d = new Date(isGanho(n.etapa_funil) && n.updated_at ? n.updated_at : n.created_at);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const g = getOrCreateGroup(key, label, `${MESES_ABREV[d.getMonth()]} de ${d.getFullYear()}`, key);
      g.negocios.push(n);
    });
  } else if (agrupamento === "semana") {
    // Agrupa por Semana do Ano
    const getWeekKey = (date: Date) => {
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDays = (date.getTime() - startOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
      return {
        key: `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`,
        label: `Sem ${weekNum}`,
        dateSort: `${date.getFullYear()}-${String(weekNum).padStart(2, "0")}`,
      };
    };

    tList.forEach((t) => {
      const d = new Date(t.data_followup || t.created_at);
      if (isNaN(d.getTime())) return;
      const { key, label, dateSort } = getWeekKey(d);
      const g = getOrCreateGroup(key, label, undefined, dateSort);
      g.tarefas.push(t);
    });

    nList.forEach((n) => {
      const d = new Date(isGanho(n.etapa_funil) && n.updated_at ? n.updated_at : n.created_at);
      if (isNaN(d.getTime())) return;
      const { key, label, dateSort } = getWeekKey(d);
      const g = getOrCreateGroup(key, label, undefined, dateSort);
      g.negocios.push(n);
    });
  } else if (agrupamento === "parceiro") {
    // Agrupa por Parceiro da Carteira
    allParceiros.forEach((p) => {
      getOrCreateGroup(p.id, p.nome, p.cidade ? `${p.cidade}/${p.estado || ""}` : undefined);
    });

    tList.forEach((t) => {
      const pid = t.lead_id;
      const pNome = t.leads?.nome || "Parceiro não identificado";
      const g = getOrCreateGroup(pid, pNome);
      g.tarefas.push(t);
    });

    nList.forEach((n) => {
      const pid = n.cliente_id;
      const pNome = n.leads?.nome || "Parceiro não identificado";
      const g = getOrCreateGroup(pid, pNome);
      g.negocios.push(n);
    });
  } else if (agrupamento === "representante") {
    // Agrupa por Representante Comercial
    allUsuarios.forEach((u) => {
      getOrCreateGroup(u.id, u.nome, u.role === "gerente_negocio" ? "Gerente" : u.role);
    });

    tList.forEach((t) => {
      const uid = t.vendedor_id || "sem_representante";
      const uNome = t.usuarios?.nome || "Sem Representante";
      const g = getOrCreateGroup(uid, uNome);
      g.tarefas.push(t);
    });

    nList.forEach((n) => {
      const uid = n.vendedor_id || "sem_representante";
      const uNome = n.usuarios?.nome || "Sem Representante";
      const g = getOrCreateGroup(uid, uNome);
      g.negocios.push(n);
    });
  } else if (agrupamento === "tipo_tarefa") {
    // Agrupa por Tipo de Tarefa (Esforço)
    const tipos = [
      { key: "visita", label: "Visita a Parceiro", cor: BRAND_COLORS.azul },
      { key: "reuniao_presencial", label: "Reunião Presencial", cor: BRAND_COLORS.verdeEscuro },
      { key: "reuniao_online", label: "Reunião Online", cor: BRAND_COLORS.azul },
      { key: "ligacao", label: "Ligação Telefônica", cor: BRAND_COLORS.laranja },
      { key: "whatsapp", label: "WhatsApp", cor: BRAND_COLORS.verdeVivo },
      { key: "email", label: "E-mail / Proposta", cor: BRAND_COLORS.rosa },
      { key: "outros", label: "Outros", cor: BRAND_COLORS.verdeClaro },
    ];

    tipos.forEach((tp) => getOrCreateGroup(tp.key, tp.label, undefined, undefined, tp.cor));

    tList.forEach((t) => {
      const tp = (t.tipo || "outros").toLowerCase();
      const matched = tipos.find((tdef) => tdef.key === tp);
      const key = matched ? matched.key : "outros";
      const label = matched ? matched.label : "Outros";
      const g = getOrCreateGroup(key, label);
      g.tarefas.push(t);
    });

    // Se o usuário associar produção a tarefas, aloca em outros
    nList.forEach((n) => {
      const g = getOrCreateGroup("outros", "Outros");
      g.negocios.push(n);
    });
  } else if (agrupamento === "etapa_pipeline") {
    // Agrupa por Etapa do Pipeline
    const etapas = [
      { key: "prospeccao", label: "Prospecção", cor: BRAND_COLORS.azul },
      { key: "qualificacao", label: "Qualificação", cor: BRAND_COLORS.rosa },
      { key: "apresentacao_proposta", label: "Apresentação", cor: BRAND_COLORS.verdeClaro },
      { key: "em_negociacao", label: "Em Negociação", cor: BRAND_COLORS.verdeEscuro },
      { key: "fechado_ganho", label: "Fechado / Ganho", cor: BRAND_COLORS.verdeVivo },
      { key: "perdido", label: "Perdido", cor: BRAND_COLORS.laranja },
    ];

    etapas.forEach((et) => getOrCreateGroup(et.key, et.label, undefined, undefined, et.cor));

    nList.forEach((n) => {
      const etapa = (n.etapa_funil || "prospeccao").toLowerCase();
      let key = etapa;
      if (isGanho(etapa)) key = "fechado_ganho";
      else if (isPerdido(etapa)) key = "perdido";

      const matched = etapas.find((edef) => edef.key === key);
      const g = getOrCreateGroup(key, matched ? matched.label : etapa.replace("_", " "));
      g.negocios.push(n);
    });

    tList.forEach((t) => {
      const g = getOrCreateGroup("prospeccao", "Prospecção");
      g.tarefas.push(t);
    });
  } else if (agrupamento === "produto_modalidade") {
    // Agrupa por Produto / Modalidade de Consórcio
    const produtosPredefinidos = [
      { key: "Imóveis", cor: BRAND_COLORS.verdeEscuro },
      { key: "Automóveis & Veículos", cor: BRAND_COLORS.verdeVivo },
      { key: "Pesados & Maquinários", cor: BRAND_COLORS.laranja },
      { key: "Serviços", cor: BRAND_COLORS.azul },
      { key: "Consórcio Geral", cor: BRAND_COLORS.rosa },
    ];

    produtosPredefinidos.forEach((p) => {
      getOrCreateGroup(p.key, p.key, undefined, undefined, p.cor);
    });

    // Mapeamento de quais parceiros operam em quais produtos
    const parceiroParaProdutos = new Map<string, string>();

    nList.forEach((n) => {
      const prod = normalizarProduto(n.modalidade, n.titulo);
      const g = getOrCreateGroup(prod, prod);
      g.negocios.push(n);
      if (n.cliente_id) {
        parceiroParaProdutos.set(n.cliente_id, prod);
      }
    });

    tList.forEach((t) => {
      const prodDoParceiro = parceiroParaProdutos.get(t.lead_id) || "Consórcio Geral";
      const g = getOrCreateGroup(prodDoParceiro, prodDoParceiro);
      g.tarefas.push(t);
    });
  }

  // Converte groupsMap para DataPointAnalysis[] calculando os valores reais
  let dataPoints: DataPointAnalysis[] = Array.from(groupsMap.values()).map((g) => {
    const valorPrimario = calcularValorMetrica(config.metricaPrimaria, g.tarefas, g.negocios);
    const valorSecundario = defSecundaria
      ? calcularValorMetrica(defSecundaria.key, g.tarefas, g.negocios)
      : 0;

    return {
      key: g.key,
      label: g.label,
      subLabel: g.subLabel,
      dateSort: g.dateSort,
      valorPrimario,
      valorSecundario,
      tarefas: g.tarefas,
      negocios: g.negocios,
      cor: g.cor || defPrimaria.cor,
    };
  });

  // Ordenação inteligente
  if (agrupamento === "mes" || agrupamento === "semana") {
    dataPoints.sort((a, b) => (a.dateSort || a.key).localeCompare(b.dateSort || b.key));
  } else {
    // Por padrão ordena pelos maiores valores primários ou secundários
    dataPoints.sort((a, b) => (b.valorPrimario + b.valorSecundario) - (a.valorPrimario + a.valorSecundario));
    // Limita para os top 12 em parceiros e representantes se forem muitos
    if (agrupamento === "parceiro" && dataPoints.length > 12) {
      dataPoints = dataPoints.filter((p) => p.valorPrimario > 0 || p.valorSecundario > 0).slice(0, 12);
    }
  }

  // Se não houver dados, garante pelo menos 1 ponto com valores zero para o gráfico não quebrar
  if (dataPoints.length === 0) {
    dataPoints = [
      {
        key: "sem_dados",
        label: "Sem Registros",
        valorPrimario: 0,
        valorSecundario: 0,
        tarefas: [],
        negocios: [],
      },
    ];
  }

  const totalPrimario = calcularValorMetrica(config.metricaPrimaria, tList, nList);
  const totalSecundario = defSecundaria
    ? calcularValorMetrica(defSecundaria.key, tList, nList)
    : 0;

  return {
    dataPoints,
    totalPrimario,
    totalSecundario,
    defPrimaria,
    defSecundaria,
  };
}

/**
 * Calcula o Resumo Executivo Macro e Micro da Operação
 */
export function calcularResumoMacroMicro(
  negocios: DashboardNegocio[],
  tarefas: DashboardTarefa[],
  parceiros: DashboardLead[]
): ResumoOperacaoMacroMicro {
  let totalCreditoFechado = 0;
  let totalCreditoAberto = 0;
  let qtdFechado = 0;

  // Mapa de contagem por produto
  const mapProdutos = new Map<string, { credito: number; qtd: number }>();

  negocios.forEach((n) => {
    const cred = Number(n.credito) || 0;
    const prod = normalizarProduto(n.modalidade, n.titulo);
    if (!mapProdutos.has(prod)) {
      mapProdutos.set(prod, { credito: 0, qtd: 0 });
    }
    const pEntry = mapProdutos.get(prod)!;
    pEntry.qtd += 1;

    if (isGanho(n.etapa_funil)) {
      totalCreditoFechado += cred;
      pEntry.credito += cred;
      qtdFechado++;
    } else if (!isPerdido(n.etapa_funil)) {
      totalCreditoAberto += cred;
      pEntry.credito += cred;
    }
  });

  const totalNegocios = negocios.length;
  const taxaConversao = totalNegocios > 0 ? (qtdFechado / totalNegocios) * 100 : 0;

  // Mapa de contagem de tarefas por tipo
  const mapTarefas = new Map<string, number>();
  const labelsTipos: Record<string, string> = {
    visita: "Visitas a Parceiros",
    reuniao_presencial: "Reuniões Presenciais",
    reuniao_online: "Reuniões Online",
    reuniao: "Reuniões Online",
    ligacao: "Ligações Telefônicas",
    whatsapp: "WhatsApp",
    email: "E-mails & Propostas",
    outros: "Outras Ações",
  };

  tarefas.forEach((t) => {
    const tp = (t.tipo || "outros").toLowerCase();
    mapTarefas.set(tp, (mapTarefas.get(tp) || 0) + 1);
  });

  let topTipoTarefa = "visita";
  let maxTarefas = 0;
  mapTarefas.forEach((qtd, tp) => {
    if (qtd > maxTarefas) {
      maxTarefas = qtd;
      topTipoTarefa = tp;
    }
  });

  const totalTarefas = tarefas.length;
  const pctTarefa = totalTarefas > 0 ? (maxTarefas / totalTarefas) * 100 : 0;

  // Produto campeão em crédito trazido
  let topProduto = "Imóveis";
  let maxCreditoProd = 0;
  let maxQtdProd = 0;
  mapProdutos.forEach((dados, prod) => {
    if (dados.credito > maxCreditoProd) {
      maxCreditoProd = dados.credito;
      topProduto = prod;
      maxQtdProd = dados.qtd;
    }
  });

  const totalCreditoGeral = totalCreditoFechado + totalCreditoAberto;
  const pctCreditoProd = totalCreditoGeral > 0 ? (maxCreditoProd / totalCreditoGeral) * 100 : 0;

  // Parceiro mais ativo (em tarefas e negócios)
  const mapParceiroScore = new Map<string, { id: string; nome: string; tarefas: number; fechado: number }>();
  parceiros.forEach((p) => {
    mapParceiroScore.set(p.id, { id: p.id, nome: p.nome, tarefas: 0, fechado: 0 });
  });

  tarefas.forEach((t) => {
    if (mapParceiroScore.has(t.lead_id)) {
      mapParceiroScore.get(t.lead_id)!.tarefas += 1;
    }
  });

  negocios.forEach((n) => {
    if (mapParceiroScore.has(n.cliente_id) && isGanho(n.etapa_funil)) {
      mapParceiroScore.get(n.cliente_id)!.fechado += Number(n.credito) || 0;
    }
  });

  let topParceiro = { id: "", nome: "Nenhum parceiro", totalTarefas: 0, creditoFechado: 0 };
  let maxScore = -1;
  mapParceiroScore.forEach((item) => {
    const score = item.tarefas * 1000 + item.fechado;
    if (score > maxScore) {
      maxScore = score;
      topParceiro = {
        id: item.id,
        nome: item.nome,
        totalTarefas: item.tarefas,
        creditoFechado: item.fechado,
      };
    }
  });

  return {
    totalCreditoFechado,
    totalCreditoAberto,
    totalTarefas,
    taxaConversao,
    tarefaMaisRealizada: {
      tipo: topTipoTarefa,
      label: labelsTipos[topTipoTarefa] || topTipoTarefa,
      total: maxTarefas,
      porcentagem: pctTarefa,
    },
    produtoMaisTrazido: {
      nome: topProduto,
      creditoTotal: maxCreditoProd,
      qtdNegocios: maxQtdProd,
      porcentagemCredito: pctCreditoProd,
    },
    parceiroMaisAtivo: topParceiro,
  };
}
