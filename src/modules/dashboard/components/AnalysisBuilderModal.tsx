"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  SlidersHorizontal,
  BarChart3,
  Sparkles,
  Save,
  Layers,
  CheckSquare,
  Briefcase,
  RefreshCw,
  Package,
  PhoneCall
} from "lucide-react";
import {
  CustomAnalysisConfig,
  DashboardLead,
  TipoAgrupamento,
  TipoCategoriaAnalise,
  TipoMetrica,
  TipoVisualizacao,
  UsuarioHierarquia
} from "../types";
import {
  AGRUPAMENTO_LABELS,
  METRICAS_CATALOGO,
  PRODUTOS_OPCOES,
  TIPOS_TAREFA_OPCOES,
  VISUALIZACAO_LABELS
} from "../analyticsEngine";

interface AnalysisBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CustomAnalysisConfig) => void;
  initialConfig?: CustomAnalysisConfig | null;
  parceiros: DashboardLead[];
  usuariosHierarquia: UsuarioHierarquia[];
  isLeader: boolean;
}

export default function AnalysisBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  parceiros,
  usuariosHierarquia,
  isLeader,
}: AnalysisBuilderModalProps) {
  const [titulo, setTitulo] = useState("Nova Análise Personalizada");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<"cruzada" | "tarefas" | "negocios">("cruzada");
  const [tipoGrafico, setTipoGrafico] = useState<TipoVisualizacao>("composed");
  const [agrupamento, setAgrupamento] = useState<TipoAgrupamento>("mes");
  const [metricaPrimaria, setMetricaPrimaria] = useState<TipoMetrica>("tarefas_visitas");
  const [metricaSecundaria, setMetricaSecundaria] = useState<TipoMetrica | "none">("producao_fechada");

  // Filtros embutidos
  const [periodo, setPeriodo] = useState("ano");
  const [representanteId, setRepresentanteId] = useState("all");
  const [parceiroId, setParceiroId] = useState("all");
  const [tipoTarefa, setTipoTarefa] = useState("all");
  const [etapaPipeline, setEtapaPipeline] = useState("all");
  const [produtoModalidade, setProdutoModalidade] = useState("all");

  useEffect(() => {
    if (initialConfig) {
      setTitulo(initialConfig.titulo || "Análise Personalizada");
      setDescricao(initialConfig.descricao || "");
      setCategoria(initialConfig.categoria || "cruzada");
      setTipoGrafico(initialConfig.tipoGrafico || "composed");
      setAgrupamento(initialConfig.agrupamento || "mes");
      setMetricaPrimaria(initialConfig.metricaPrimaria || "tarefas_visitas");
      setMetricaSecundaria(initialConfig.metricaSecundaria || "producao_fechada");
      setPeriodo(initialConfig.filtros.periodo || "ano");
      setRepresentanteId(initialConfig.filtros.representanteId || "all");
      setParceiroId(initialConfig.filtros.parceiroId || "all");
      setTipoTarefa(initialConfig.filtros.tipoTarefa || "all");
      setEtapaPipeline(initialConfig.filtros.etapaPipeline || "all");
      setProdutoModalidade(initialConfig.filtros.produtoModalidade || "all");
    } else {
      setTitulo("Visitas presenciais versus Produção por Mês");
      setDescricao("Cruzamento de tarefas de visita contra o volume de crédito consórcio produzido.");
      setCategoria("cruzada");
      setTipoGrafico("composed");
      setAgrupamento("mes");
      setMetricaPrimaria("tarefas_visitas");
      setMetricaSecundaria("producao_fechada");
      setPeriodo("ano");
      setRepresentanteId("all");
      setParceiroId("all");
      setTipoTarefa("all");
      setEtapaPipeline("all");
      setProdutoModalidade("all");
    }
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  // Sugestões inteligentes ao mudar de categoria
  const handleCategoryChange = (newCat: "cruzada" | "tarefas" | "negocios") => {
    setCategoria(newCat);
    if (newCat === "tarefas") {
      setMetricaPrimaria("tarefas_todas");
      setMetricaSecundaria("tarefas_concluidas");
      setAgrupamento("tipo_tarefa");
      setTipoGrafico("bar");
      if (!initialConfig) {
        setTitulo("Qual tarefa estou realizando mais? (Mix de Ações)");
        setDescricao("Distribuição das atividades operacionais por canal e intensidade de atendimento.");
      }
    } else if (newCat === "negocios") {
      setMetricaPrimaria("producao_fechada");
      setMetricaSecundaria("qtd_cotas_fechadas");
      setAgrupamento("produto_modalidade");
      setTipoGrafico("composed");
      if (!initialConfig) {
        setTitulo("Quais produtos trazem mais resultados? (Produção por Modalidade)");
        setDescricao("Volume financeiro e quantidade de negócios por produto de consórcio.");
      }
    } else {
      setMetricaPrimaria("tarefas_visitas");
      setMetricaSecundaria("producao_fechada");
      setAgrupamento("mes");
      setTipoGrafico("composed");
      if (!initialConfig) {
        setTitulo("Visitas presenciais versus Produção por Mês");
        setDescricao("Cruzamento de tarefas comerciais versus fechamento de crédito.");
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const configToSave: CustomAnalysisConfig = {
      id: initialConfig?.id && !initialConfig.isPreset ? initialConfig.id : `custom-${Date.now()}`,
      titulo: titulo.trim() || "Análise sem título",
      descricao: descricao.trim() || undefined,
      categoria,
      tipoGrafico,
      agrupamento,
      metricaPrimaria,
      metricaSecundaria,
      filtros: {
        periodo,
        representanteId,
        parceiroId,
        tipoTarefa,
        etapaPipeline,
        produtoModalidade,
      },
      isPreset: false,
      updatedAt: new Date().toISOString(),
    };
    onSave(configToSave);
  };

  const metricasArray = Object.values(METRICAS_CATALOGO);
  const metricasTarefas = metricasArray.filter((m) => m.categoria === "tarefa");
  const metricasProducao = metricasArray.filter((m) => m.categoria === "producao");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#00441F] text-[#00CF7B] px-2.5 py-0.5 rounded-full">
                Construtor de Relatórios
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                Monte visualizações personalizadas sobre sua operação
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#00441F] mt-1">
              {initialConfig && !initialConfig.isPreset ? "Editar Análise" : "Configurar Nova Análise"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. ESCOPO DA ANÁLISE (ESTILO HUBSPOT) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
              Tipo de Relatório / Âmbito da Análise *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange("cruzada")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  categoria === "cruzada"
                    ? "border-[#00CF7B] bg-[#00441F]/5 ring-2 ring-[#00CF7B]/20"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#00CF7B]" />
                  <span className="text-xs font-extrabold text-[#00441F]">Cruzamento</span>
                </div>
                <span className="text-[11px] text-gray-500 leading-tight">
                  Correlaciona esforço de tarefas com resultados de vendas
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange("tarefas")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  categoria === "tarefas"
                    ? "border-[#00CF7B] bg-[#00441F]/5 ring-2 ring-[#00CF7B]/20"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-[#00441F]">Apenas Tarefas</span>
                </div>
                <span className="text-[11px] text-gray-500 leading-tight">
                  Compara tarefas entre si: qual faz mais, canais e ritmo
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange("negocios")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  categoria === "negocios"
                    ? "border-[#00CF7B] bg-[#00441F]/5 ring-2 ring-[#00CF7B]/20"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-extrabold text-[#00441F]">Negócios & Produtos</span>
                </div>
                <span className="text-[11px] text-gray-500 leading-tight">
                  Quais produtos trazem mais crédito, funil e ticket médio
                </span>
              </button>
            </div>
          </div>

          {/* 2. TÍTULO E DESCRIÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Título da Análise *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Qual tarefa estou realizando mais?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Objetivo / Descrição Curta
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Observar o volume de tarefas e produtos mais vendidos"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              />
            </div>
          </div>

          {/* 3. ESCOLHA DAS MÉTRICAS A CRUZAR */}
          <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
            <h3 className="text-xs font-bold text-[#00441F] uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#00CF7B]" />
              1. Seleção de Métricas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Métrica Primária */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">
                  Métrica Primária (Eixo Principal / Y1) *
                </label>
                <select
                  value={metricaPrimaria}
                  onChange={(e) => setMetricaPrimaria(e.target.value as TipoMetrica)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
                >
                  <optgroup label="Tarefas & Ações Comerciais">
                    {metricasTarefas.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.labelCurto})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Produção & Pipeline">
                    {metricasProducao.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.labelCurto})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-gray-500 font-medium">
                  {METRICAS_CATALOGO[metricaPrimaria]?.descricao}
                </p>
              </div>

              {/* Métrica Secundária */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">
                  Métrica Secundária (Comparativo no Eixo Y2 - Opcional)
                </label>
                <select
                  value={metricaSecundaria}
                  onChange={(e) => setMetricaSecundaria(e.target.value as TipoMetrica | "none")}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
                >
                  <option value="none">Nenhuma (Apenas métrica primária)</option>
                  <optgroup label="Produção & Pipeline">
                    {metricasProducao.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.labelCurto})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tarefas & Ações Comerciais">
                    {metricasTarefas.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.labelCurto})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-gray-500 font-medium">
                  {metricaSecundaria !== "none"
                    ? METRICAS_CATALOGO[metricaSecundaria]?.descricao
                    : "Combine com uma segunda métrica para ver correlações"}
                </p>
              </div>
            </div>
          </div>

          {/* 4. DEFINIR AGRUPAMENTO E TIPO DE VISUALIZAÇÃO */}
          <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
            <h3 className="text-xs font-bold text-[#00441F] uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00CF7B]" />
              2. Agrupamento & Visualização
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agrupamento */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">
                  Agrupar Dados Por: *
                </label>
                <select
                  value={agrupamento}
                  onChange={(e) => setAgrupamento(e.target.value as TipoAgrupamento)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
                >
                  <option value="produto_modalidade">Por Produto / Modalidade de Consórcio (Imóveis, Auto, Pesados...)</option>
                  <option value="tipo_tarefa">Por Tipo de Tarefa (Visitas, Ligações, Reuniões, WhatsApp...)</option>
                  <option value="mes">Por Mês (Cronológico - Ex: Jan/26, Fev/26...)</option>
                  <option value="semana">Por Semana</option>
                  <option value="parceiro">Por Parceiro da Carteira</option>
                  {isLeader && <option value="representante">Por Representante Comercial</option>}
                  <option value="etapa_pipeline">Por Etapa do Pipeline</option>
                </select>
              </div>

              {/* Tipo de Visualização */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">
                  Formato de Visualização: *
                </label>
                <select
                  value={tipoGrafico}
                  onChange={(e) => setTipoGrafico(e.target.value as TipoVisualizacao)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
                >
                  <option value="composed">Comparativo Duplo (Barras + Linha em Eixo Duplo)</option>
                  <option value="bar">Gráfico de Barras</option>
                  <option value="line">Gráfico de Linhas</option>
                  <option value="area">Gráfico de Área</option>
                  <option value="pie">Gráfico de Pizza / Rosca</option>
                  <option value="table">Tabela Analítica</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. FILTROS DINÂMICOS PADRÃO DA ANÁLISE */}
          <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-4">
            <h3 className="text-xs font-bold text-[#00441F] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00CF7B]" />
              3. Filtros Padrão da Análise
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Janela de Período</label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
                >
                  <option value="mes">Este Mês Corrente</option>
                  <option value="30dias">Últimos 30 Dias</option>
                  <option value="trimestre">Este Trimestre</option>
                  <option value="semestre">Este Semestre</option>
                  <option value="ano">Ano Atual (2026)</option>
                  <option value="todos">Todo o Histórico</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Filtro de Produto</label>
                <select
                  value={produtoModalidade}
                  onChange={(e) => setProdutoModalidade(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
                >
                  <option value="all">Todos os Produtos</option>
                  {PRODUTOS_OPCOES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Filtro de Tarefa</label>
                <select
                  value={tipoTarefa}
                  onChange={(e) => setTipoTarefa(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
                >
                  <option value="all">Todas as Ações</option>
                  {TIPOS_TAREFA_OPCOES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Parceiro Específico</label>
                <select
                  value={parceiroId}
                  onChange={(e) => setParceiroId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
                >
                  <option value="all">Todos os Parceiros ({parceiros.length})</option>
                  {parceiros.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              {isLeader && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 uppercase">Representante Específico</label>
                  <select
                    value={representanteId}
                    onChange={(e) => setRepresentanteId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
                  >
                    <option value="all">Toda a Equipe</option>
                    {usuariosHierarquia.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00441F] hover:bg-[#00CF7B] hover:text-[#00441F] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Salvar Análise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
