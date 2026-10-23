"use client";

import React from "react";
import {
  Plus,
  Edit3,
  Copy,
  Trash2,
  Calendar,
  Building2,
  Users,
  Filter,
  RefreshCw,
  Star,
  Layers,
  CheckSquare,
  Briefcase,
  Package,
  PhoneCall
} from "lucide-react";
import {
  CustomAnalysisConfig,
  DashboardLead,
  TipoCategoriaAnalise,
  UsuarioHierarquia
} from "../types";
import { PRODUTOS_OPCOES, TIPOS_TAREFA_OPCOES } from "../analyticsEngine";

interface DashboardHeaderBarProps {
  analyses: CustomAnalysisConfig[];
  selectedAnalysisId: string;
  onSelectAnalysis: (id: string) => void;
  onNewAnalysis: () => void;
  onEditAnalysis: () => void;
  onDuplicateAnalysis: () => void;
  onDeleteAnalysis: (id: string) => void;
  // Categoria de visão
  selectedCategory: TipoCategoriaAnalise;
  onSelectCategory: (cat: TipoCategoriaAnalise) => void;
  // Filtros ativos
  activePeriodo: string;
  onPeriodoChange: (p: string) => void;
  activeParceiroId: string;
  onParceiroChange: (pid: string) => void;
  activeRepresentanteId: string;
  onRepresentanteChange: (rid: string) => void;
  activeProdutoModalidade: string;
  onProdutoModalidadeChange: (prod: string) => void;
  activeTipoTarefa: string;
  onTipoTarefaChange: (tp: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  parceiros: DashboardLead[];
  usuariosHierarquia: UsuarioHierarquia[];
  isLeader: boolean;
  roleLabel: string;
  nomeEmpresa?: string;
}

export default function DashboardHeaderBar({
  analyses,
  selectedAnalysisId,
  onSelectAnalysis,
  onNewAnalysis,
  onEditAnalysis,
  onDuplicateAnalysis,
  onDeleteAnalysis,
  selectedCategory,
  onSelectCategory,
  activePeriodo,
  onPeriodoChange,
  activeParceiroId,
  onParceiroChange,
  activeRepresentanteId,
  onRepresentanteChange,
  activeProdutoModalidade,
  onProdutoModalidadeChange,
  activeTipoTarefa,
  onTipoTarefaChange,
  onResetFilters,
  hasActiveFilters,
  parceiros,
  usuariosHierarquia,
  isLeader,
  roleLabel,
  nomeEmpresa = "Rodobens",
}: DashboardHeaderBarProps) {
  const currentAnalysis = analyses.find((a) => a.id === selectedAnalysisId) || analyses[0];

  // Filtra as análises exibidas conforme a categoria selecionada
  const filteredAnalyses = analyses.filter((a) => {
    if (selectedCategory === "todas") return true;
    return a.categoria === selectedCategory;
  });

  return (
    <div className="space-y-4">
      {/* 1. SELETOR DE ESCOPO / CATEGORIA DA ANÁLISE (ESTILO HUBSPOT ANALYTICS) */}
      <div className="bg-white rounded-2xl p-3 md:p-4 shadow-xs border border-gray-200/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 shrink-0 mr-1.5 hidden sm:inline">
            Modo:
          </span>

          <button
            onClick={() => onSelectCategory("todas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "todas"
                ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Todas as Visões ({analyses.length})
          </button>

          <button
            onClick={() => onSelectCategory("cruzada")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "cruzada"
                ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cruzadas (Negócios x Tarefas)
          </button>

          <button
            onClick={() => onSelectCategory("tarefas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "tarefas"
                ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
            Apenas Tarefas (Esforço)
          </button>

          <button
            onClick={() => onSelectCategory("negocios")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === "negocios"
                ? "bg-[#00441F] text-[#00CF7B] shadow-2xs"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            Apenas Negócios & Produtos
          </button>
        </div>

        {/* Botão de Criação de Nova Análise */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={onNewAnalysis}
            className="px-3.5 py-2 bg-[#00CF7B] hover:bg-[#00441F] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Análise
          </button>
        </div>
      </div>

      {/* 2. ABAS DE ANÁLISES SALVAS / PRESETS DO ESCOPO SELECIONADO */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-gray-200/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Carrossel de Análises */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 max-w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 shrink-0 mr-1">
            Relatórios:
          </span>
          {filteredAnalyses.length === 0 ? (
            <span className="text-xs text-gray-400 italic">
              Nenhuma análise nesta categoria. Crie uma nova!
            </span>
          ) : (
            filteredAnalyses.map((a) => {
              const isSelected = a.id === selectedAnalysisId;
              return (
                <button
                  key={a.id}
                  onClick={() => onSelectAnalysis(a.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#00441F] text-[#00CF7B] shadow-xs"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80"
                  }`}
                >
                  {a.isPreset && <Star className="w-3 h-3 text-[#00CF7B]" />}
                  {a.titulo}
                </button>
              );
            })
          )}
        </div>

        {/* Ações na Análise Atual */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
          <button
            onClick={onEditAnalysis}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Editar métricas e agrupamentos desta análise"
          >
            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
            Editar
          </button>

          <button
            onClick={onDuplicateAnalysis}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Duplicar para criar uma nova variação"
          >
            <Copy className="w-3.5 h-3.5 text-gray-500" />
            Duplicar
          </button>

          {!currentAnalysis?.isPreset && (
            <button
              onClick={() => onDeleteAnalysis(currentAnalysis.id)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Excluir esta análise personalizada"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. BARRA DE FILTROS DINÂMICOS DA OPERAÇÃO (ESTILO HUBSPOT) */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-gray-200/70 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#00441F] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#00CF7B]" />
            <span>Filtros Dinâmicos da Análise Ativa</span>
            {hasActiveFilters && (
              <span className="text-[10px] bg-[#00CF7B] text-white font-bold px-2 py-0.5 rounded-full">
                Ativos
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Limpar Filtros
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
              value={activePeriodo}
              onChange={(e) => onPeriodoChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
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
              value={activeParceiroId}
              onChange={(e) => onParceiroChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
            >
              <option value="all">Todos os Parceiros ({parceiros.length})</option>
              {parceiros.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.cidade ? `(${p.cidade})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Produto / Modalidade */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
              <Package className="w-3 h-3 text-emerald-600" />
              Produto / Modalidade
            </label>
            <select
              value={activeProdutoModalidade}
              onChange={(e) => onProdutoModalidadeChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
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
              value={activeTipoTarefa}
              onChange={(e) => onTipoTarefaChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
            >
              <option value="all">Todas as Tarefas</option>
              {TIPOS_TAREFA_OPCOES.map((tp) => (
                <option key={tp.key} value={tp.key}>
                  {tp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Representante (se Líder) ou Indicador */}
          {isLeader ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <Users className="w-3 h-3 text-[#00CF7B]" />
                Representante
              </label>
              <select
                value={activeRepresentanteId}
                onChange={(e) => onRepresentanteChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-[#00441F] text-xs font-semibold rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
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
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-[11px] font-bold text-gray-600 flex items-center justify-between">
                <span>Representante:</span>
                <span className="text-[#00441F]">{roleLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
