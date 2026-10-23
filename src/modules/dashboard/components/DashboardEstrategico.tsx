"use client";

import React, { useState, useMemo, useEffect } from "react";
import { UserProfile } from "@/lib/supabase/helpers";
import {
  CustomAnalysisConfig,
  DashboardLead,
  DashboardNegocio,
  DashboardTarefa,
  DataPointAnalysis,
  DrilldownState,
  MetricaDefinicao,
  TipoCategoriaAnalise,
  UsuarioHierarquia
} from "../types";
import {
  PRESET_ANALYSES,
  aplicarFiltros,
  formatBRL,
  formatShortBRL,
  formatValor,
  AGRUPAMENTO_LABELS,
  PRODUTOS_OPCOES,
  TIPOS_TAREFA_OPCOES
} from "../analyticsEngine";
import CommercialKpiCards from "./CommercialKpiCards";
import AnalysisCard from "./AnalysisCard";
import AnalysisBuilderModal from "./AnalysisBuilderModal";
import DrilldownDrawer from "./DrilldownDrawer";
import {
  Compass,
  Filter,
  RefreshCw,
  Plus,
  Layers,
  CheckSquare,
  Briefcase,
  Calendar,
  Building2,
  Users,
  Package,
  PhoneCall,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

const STORAGE_KEY = "meuparceiro_custom_dashboard_analyses_v3";

interface DashboardEstrategicoProps {
  user: UserProfile | null;
  negocios: DashboardNegocio[];
  tarefas: DashboardTarefa[];
  parceiros: DashboardLead[];
  usuariosHierarquia: UsuarioHierarquia[];
  nomeEmpresa?: string;
}

export default function DashboardEstrategico({
  user,
  negocios,
  tarefas,
  parceiros,
  usuariosHierarquia,
  nomeEmpresa = "Rodobens",
}: DashboardEstrategicoProps) {
  const [mounted, setMounted] = useState(false);

  // Filtros Globais do Topo (afetam os cards de KPI principais e o escopo geral)
  const [globalPeriodo, setGlobalPeriodo] = useState<string>("mes");
  const [globalParceiroId, setGlobalParceiroId] = useState<string>("all");
  const [globalRepresentanteId, setGlobalRepresentanteId] = useState<string>("all");
  const [globalProduto, setGlobalProduto] = useState<string>("all");
  const [globalTipoTarefa, setGlobalTipoTarefa] = useState<string>("all");

  // Categoria de filtro para as análises salvas no dashboard
  const [selectedCategory, setSelectedCategory] = useState<TipoCategoriaAnalise>("todas");

  // Lista de análises salvas e fixadas no dashboard
  const [analyses, setAnalyses] = useState<CustomAnalysisConfig[]>(PRESET_ANALYSES);

  // Estados dos Modais
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CustomAnalysisConfig | null>(null);

  const [drilldown, setDrilldown] = useState<DrilldownState>({
    isOpen: false,
    tituloPonto: "",
    agrupamentoLabel: "",
    valorPrimarioLabel: "",
    tarefas: [],
    negocios: [],
  });

  // Carrega análises salvas do localStorage no client
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userCustoms = parsed.filter((item: CustomAnalysisConfig) => !item.isPreset);
          // Permite mesclar preservando os presets e adicionando as criadas pelo usuário
          setAnalyses([...PRESET_ANALYSES, ...userCustoms]);
        }
      }
    } catch (err) {
      console.warn("Erro ao carregar análises personalizadas do localStorage:", err);
    }
  }, []);

  // Salva no localStorage quando o usuário adiciona, edita ou exclui análises
  const persistAnalyses = (newList: CustomAnalysisConfig[]) => {
    setAnalyses(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (err) {
      console.warn("Erro ao salvar análises no localStorage:", err);
    }
  };

  // Papéis de Liderança
  const isMaster = user?.role === "master" || user?.role === "platform_admin";
  const isDiretoria = user?.role === "diretoria";
  const isSuperintendente = user?.role === "superintendente";
  const isRegional = user?.role === "regional";
  const isLeader = isMaster || isDiretoria || isSuperintendente || isRegional;

  const roleLabel = useMemo(() => {
    if (isMaster) return "Diretoria Master";
    if (isDiretoria) return "Diretoria Comercial";
    if (isSuperintendente) return "Superintendência";
    if (isRegional) return "Regional Comercial";
    return "Gerência de Negócios";
  }, [isMaster, isDiretoria, isSuperintendente, isRegional]);

  // Aplica os filtros globais nos dados brutos para alimentar os Cards KPI principais
  const { nList: kpiNegocios, tList: kpiTarefas } = useMemo(() => {
    return aplicarFiltros(negocios, tarefas, {
      periodo: globalPeriodo,
      parceiroId: globalParceiroId,
      representanteId: globalRepresentanteId,
      produtoModalidade: globalProduto,
      tipoTarefa: globalTipoTarefa,
    });
  }, [
    negocios,
    tarefas,
    globalPeriodo,
    globalParceiroId,
    globalRepresentanteId,
    globalProduto,
    globalTipoTarefa,
  ]);

  const handleResetGlobalFilters = () => {
    setGlobalPeriodo("mes");
    setGlobalParceiroId("all");
    setGlobalRepresentanteId("all");
    setGlobalProduto("all");
    setGlobalTipoTarefa("all");
  };

  const hasActiveGlobalFilters =
    globalPeriodo !== "mes" ||
    globalParceiroId !== "all" ||
    globalRepresentanteId !== "all" ||
    globalProduto !== "all" ||
    globalTipoTarefa !== "all";

  // Análises filtradas por categoria para exibição no painel
  const displayedAnalyses = useMemo(() => {
    if (selectedCategory === "todas") return analyses;
    return analyses.filter((a) => a.categoria === selectedCategory);
  }, [analyses, selectedCategory]);

  // Handlers para o construtor de análises
  const handleNewAnalysis = () => {
    setEditingConfig(null);
    setIsBuilderOpen(true);
  };

  const handleEditAnalysis = (config: CustomAnalysisConfig) => {
    setEditingConfig(config);
    setIsBuilderOpen(true);
  };

  const handleDuplicateAnalysis = (config: CustomAnalysisConfig) => {
    const duplicated: CustomAnalysisConfig = {
      ...config,
      id: `custom-${Date.now()}`,
      titulo: `${config.titulo} (Cópia)`,
      isPreset: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...analyses, duplicated];
    persistAnalyses(updated);
    toast.success("Análise duplicada e fixada no dashboard!");
  };

  const handleDeleteAnalysis = (id: string) => {
    if (confirm("Deseja realmente remover esta análise do seu dashboard?")) {
      const filtered = analyses.filter((a) => a.id !== id);
      persistAnalyses(filtered);
      toast.success("Análise removida.");
    }
  };

  const handleSaveAnalysisConfig = (savedConfig: CustomAnalysisConfig) => {
    const existingIndex = analyses.findIndex((a) => a.id === savedConfig.id);
    let updated: CustomAnalysisConfig[];

    if (existingIndex >= 0) {
      updated = [...analyses];
      updated[existingIndex] = savedConfig;
      toast.success("Análise atualizada com novos parâmetros congelados!");
    } else {
      updated = [...analyses, savedConfig];
      toast.success("Nova análise fixada no dashboard com sucesso!");
    }

    persistAnalyses(updated);
    setIsBuilderOpen(false);
  };

  // Handler de clique em ponto do gráfico / linha da tabela para Drilldown
  const handlePointDrilldown = (
    ponto: DataPointAnalysis,
    config: CustomAnalysisConfig,
    defPrimaria: MetricaDefinicao,
    defSecundaria?: MetricaDefinicao
  ) => {
    const labelPrimario = `${defPrimaria.label}: ${formatValor(ponto.valorPrimario, defPrimaria.tipoDado)}`;
    const labelSecundario = defSecundaria
      ? `${defSecundaria.label}: ${formatValor(ponto.valorSecundario, defSecundaria.tipoDado)}`
      : undefined;

    setDrilldown({
      isOpen: true,
      tituloPonto: ponto.label,
      agrupamentoLabel: AGRUPAMENTO_LABELS[config.agrupamento] || "Agrupamento",
      valorPrimarioLabel: labelPrimario,
      valorSecundarioLabel: labelSecundario,
      tarefas: ponto.tarefas,
      negocios: ponto.negocios,
    });
  };

  const periodoLabelMap: Record<string, string> = {
    hoje: "Hoje",
    semana: "Esta Semana",
    mes: "Este Mês",
    "30dias": "Últimos 30 Dias",
    trimestre: "Este Trimestre",
    semestre: "Este Semestre",
    ano: "Ano Atual",
    todos: "Histórico Completo",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. CABEÇALHO ACOPLADO: IDENTIFICAÇÃO, FILTROS GERAIS E CONTROLE DAS ANÁLISES SALVAS */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 divide-y divide-gray-100 overflow-hidden">
        {/* PARTE SUPERIOR: TÍTULO E BOTÃO DE CRIAR ANÁLISE */}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#00441F] tracking-tight">
              Dashboard Estratégico
            </h1>
          </div>

          {/* Botão de Criação de Nova Análise */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleNewAnalysis}
              className="px-4 py-2.5 bg-[#00441F] hover:bg-[#00CF7B] hover:text-[#00441F] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar Nova Análise
            </button>
          </div>
        </div>

        {/* PARTE INTERMEDIÁRIA: FILTRO GERAL DOS INDICADORES */}
        <div className="p-6 md:p-8 pt-5 pb-6 space-y-3 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00441F] uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-[#00CF7B]" />
              <span>Filtro Geral dos Indicadores</span>
              {hasActiveGlobalFilters && (
                <span className="text-[10px] bg-[#00CF7B] text-white font-bold px-2 py-0.5 rounded-full">
                  Filtros Ativos
                </span>
              )}
            </div>

            {hasActiveGlobalFilters && (
              <button
                onClick={handleResetGlobalFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Período */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#00CF7B]" />
                Período
              </label>
              <select
                value={globalPeriodo}
                onChange={(e) => setGlobalPeriodo(e.target.value)}
                className="w-full bg-white border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              >
                <option value="hoje">Hoje</option>
                <option value="semana">Esta Semana (7 dias)</option>
                <option value="mes">Este Mês Corrente</option>
                <option value="30dias">Últimos 30 Dias</option>
                <option value="trimestre">Este Trimestre</option>
                <option value="semestre">Este Semestre</option>
                <option value="ano">Ano Atual (2026)</option>
                <option value="todos">Todo o Histórico</option>
              </select>
            </div>

            {/* Parceiro */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#00CF7B]" />
                Parceiro da Carteira
              </label>
              <select
                value={globalParceiroId}
                onChange={(e) => setGlobalParceiroId(e.target.value)}
                className="w-full bg-white border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              >
                <option value="all">Todos os Parceiros ({parceiros.length})</option>
                {parceiros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.cidade ? `(${p.cidade})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Produto */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <Package className="w-3 h-3 text-emerald-600" />
                Produto / Modalidade
              </label>
              <select
                value={globalProduto}
                onChange={(e) => setGlobalProduto(e.target.value)}
                className="w-full bg-white border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              >
                <option value="all">Todos os Produtos</option>
                {PRODUTOS_OPCOES.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Tarefa */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-purple-600" />
                Tipo de Tarefa
              </label>
              <select
                value={globalTipoTarefa}
                onChange={(e) => setGlobalTipoTarefa(e.target.value)}
                className="w-full bg-white border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              >
                <option value="all">Todas as Ações</option>
                {TIPOS_TAREFA_OPCOES.map((tp) => (
                  <option key={tp.key} value={tp.key}>
                    {tp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Representante */}
            {isLeader ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#00CF7B]" />
                  Representante
                </label>
                <select
                  value={globalRepresentanteId}
                  onChange={(e) => setGlobalRepresentanteId(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
                >
                  <option value="all">Toda a Equipe ({usuariosHierarquia.length})</option>
                  {usuariosHierarquia.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.role === "gerente_negocio" ? "Gerente" : u.role})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1 flex flex-col justify-end">
                <div className="p-2 rounded-xl bg-white border border-gray-200 text-[11px] font-bold text-gray-600 flex items-center justify-between">
                  <span>Carteira:</span>
                  <span className="text-[#00441F]">{roleLabel}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PARTE INFERIOR (ACOPLADA): ANÁLISES SALVAS NO DASHBOARD + CATEGORIAS */}
        <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#00441F] text-[#00CF7B]">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-[#00441F]">
              Análises Salvas no Dashboard ({displayedAnalyses.length})
            </h2>
          </div>

          {/* Abas de Filtro de Categoria no Painel */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedCategory("todas")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === "todas"
                  ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
              }`}
            >
              Todas ({analyses.length})
            </button>

            <button
              onClick={() => setSelectedCategory("cruzada")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === "cruzada"
                  ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
              }`}
            >
              Cruzadas
            </button>

            <button
              onClick={() => setSelectedCategory("tarefas")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === "tarefas"
                  ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
              }`}
            >
              Apenas Tarefas
            </button>

            <button
              onClick={() => setSelectedCategory("negocios")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === "negocios"
                  ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
              }`}
            >
              Negócios & Produtos
            </button>
          </div>
        </div>
      </div>

      {/* 2. CARDS PRINCIPAIS: VOLUMES DE ATIVIDADES & NEGOCIAÇÃO (NO MEIO) */}
      <CommercialKpiCards
        negocios={kpiNegocios}
        tarefas={kpiTarefas}
        periodoLabel={periodoLabelMap[globalPeriodo] || "Período Ativo"}
      />

      {/* 3. GRADE DOS GRÁFICOS E ANÁLISES SALVAS CRIADAS */}
      <div className="space-y-4">
        {displayedAnalyses.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200/80 space-y-3">
            <Layers className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-700">Nenhuma análise salva nesta categoria</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Clique no botão abaixo para criar uma nova análise personalizada e fixá-la no seu painel.
            </p>
            <button
              onClick={handleNewAnalysis}
              className="px-4 py-2 bg-[#00CF7B] hover:bg-[#00441F] text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar Nova Análise
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {displayedAnalyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                config={analysis}
                negocios={negocios}
                tarefas={tarefas}
                parceiros={parceiros}
                usuariosHierarquia={usuariosHierarquia}
                mounted={mounted}
                onEdit={handleEditAnalysis}
                onDuplicate={handleDuplicateAnalysis}
                onDelete={handleDeleteAnalysis}
                onPointClick={handlePointDrilldown}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. MODAL DO CONSTRUTOR DE ANÁLISE */}
      <AnalysisBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleSaveAnalysisConfig}
        initialConfig={editingConfig}
        parceiros={parceiros}
        usuariosHierarquia={usuariosHierarquia}
        isLeader={isLeader}
      />

      {/* 5. GAVETA / MODAL DE DRILLDOWN DOS REGISTROS DE ORIGEM */}
      <DrilldownDrawer
        drilldown={drilldown}
        onClose={() => setDrilldown((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
