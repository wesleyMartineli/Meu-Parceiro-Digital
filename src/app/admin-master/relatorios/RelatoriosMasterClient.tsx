'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Target,
  TrendingUp,
  Handshake,
  BarChart3,
  Users2,
  Calendar,
  Filter,
  RotateCcw,
  Building2,
  Briefcase,
  Store,
  CheckCircle2,
  X,
  Award
} from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  supervisor_id: string | null;
  ativo: boolean;
}

interface Lead {
  id: string;
  nome: string;
  vendedor_id: string | null;
  created_at: string;
  tipo_parceiro?: string | null;
  codigo_pv?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

interface Negocio {
  id: string;
  titulo?: string | null;
  credito: number;
  etapa_funil: string;
  vendedor_id: string | null;
  cliente_id: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface RelatoriosMasterClientProps {
  usuarios: Usuario[];
  leads: Lead[];
  negocios: Negocio[];
}

export default function RelatoriosMasterClient({
  usuarios,
  leads,
  negocios,
}: RelatoriosMasterClientProps) {
  // --- Estados de Filtros ---
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedRegional, setSelectedRegional] = useState<string>('all');
  const [selectedGerente, setSelectedGerente] = useState<string>('all');
  const [selectedParceiro, setSelectedParceiro] = useState<string>('all');

  // Formatador de Moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // --- Listas de Filtro Hierárquicas (com Cascata) ---
  const regionais = useMemo(() => {
    return usuarios.filter(u => u.role === 'regional');
  }, [usuarios]);

  const gerentesDisponiveis = useMemo(() => {
    let list = usuarios.filter(u => u.role === 'gerente_negocio');
    if (selectedRegional !== 'all') {
      list = list.filter(u => u.supervisor_id === selectedRegional);
    }
    return list;
  }, [usuarios, selectedRegional]);

  const parceirosDisponiveis = useMemo(() => {
    let list = leads;

    if (selectedGerente !== 'all') {
      list = list.filter(l => l.vendedor_id === selectedGerente);
    } else if (selectedRegional !== 'all') {
      const gerentesDaRegionalIds = gerentesDisponiveis.map(g => g.id);
      list = list.filter(l => l.vendedor_id && gerentesDaRegionalIds.includes(l.vendedor_id));
    }

    return list;
  }, [leads, selectedGerente, selectedRegional, gerentesDisponiveis]);

  // Se trocar a Regional, ajusta o Gerente e o Parceiro caso deixem de ser válidos
  const handleRegionalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regId = e.target.value;
    setSelectedRegional(regId);
    setSelectedGerente('all');
    setSelectedParceiro('all');
  };

  const handleGerenteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gerId = e.target.value;
    setSelectedGerente(gerId);
    setSelectedParceiro('all');
  };

  const handleParceiroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedParceiro(e.target.value);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value;
    setSelectedPeriod(period);
  };

  const resetFilters = () => {
    setSelectedPeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedRegional('all');
    setSelectedGerente('all');
    setSelectedParceiro('all');
  };

  const hasActiveFilters =
    selectedPeriod !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    selectedRegional !== 'all' ||
    selectedGerente !== 'all' ||
    selectedParceiro !== 'all';

  // --- Função para validação de data ---
  const isDateWithinFilter = (dateString?: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return true;

    const now = new Date();

    if (selectedPeriod === 'all') return true;

    if (selectedPeriod === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return date >= today;
    }

    if (selectedPeriod === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= sevenDaysAgo;
    }

    if (selectedPeriod === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }

    if (selectedPeriod === 'this_month') {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }

    if (selectedPeriod === 'last_month') {
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      return date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth;
    }

    if (selectedPeriod === 'this_year') {
      return date.getFullYear() === now.getFullYear();
    }

    if (selectedPeriod === 'last_year') {
      return date.getFullYear() === now.getFullYear() - 1;
    }

    if (selectedPeriod === 'custom') {
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate + 'T00:00:00');
        const end = new Date(customEndDate + 'T23:59:59');
        return date >= start && date <= end;
      } else if (customStartDate) {
        const start = new Date(customStartDate + 'T00:00:00');
        return date >= start;
      } else if (customEndDate) {
        const end = new Date(customEndDate + 'T23:59:59');
        return date <= end;
      }
      return true;
    }

    return true;
  };

  // --- Processamento Dinâmico de Métricas Baseadas nos Filtros ---
  const {
    filteredNegocios,
    filteredLeads,
    producaoTotal,
    totalGanhosCount,
    pipelineAberto,
    ticketMedio,
    taxaConversao,
    mediaMensalProducao,
    countSuperintendentes,
    countRegionais,
    countGerentes,
    countParceiros,
    totalForcaVendas,
    topGerentes,
    topParceiros,
  } = useMemo(() => {
    // 1. Determinar o escopo de gerentes e parceiros válidos
    const gerentesValidosIds = new Set<string>();
    if (selectedGerente !== 'all') {
      gerentesValidosIds.add(selectedGerente);
    } else if (selectedRegional !== 'all') {
      gerentesDisponiveis.forEach(g => gerentesValidosIds.add(g.id));
    } else {
      usuarios.filter(u => u.role === 'gerente_negocio' || u.role === 'regional' || u.role === 'superintendente').forEach(u => gerentesValidosIds.add(u.id));
    }

    // 2. Filtrar Negócios
    const negociosFiltrados = negocios.filter(n => {
      // Filtro de data
      if (!isDateWithinFilter(n.created_at)) return false;

      // Filtro de parceiro / cliente
      if (selectedParceiro !== 'all' && n.cliente_id !== selectedParceiro) {
        return false;
      }

      // Filtro de gerente / regional
      if (selectedGerente !== 'all') {
        if (n.vendedor_id !== selectedGerente) return false;
      } else if (selectedRegional !== 'all') {
        if (!n.vendedor_id || !gerentesValidosIds.has(n.vendedor_id)) return false;
      }

      return true;
    });

    // 3. Filtrar Leads / Parceiros
    const leadsFiltrados = leads.filter(l => {
      if (!isDateWithinFilter(l.created_at)) return false;

      if (selectedParceiro !== 'all' && l.id !== selectedParceiro) {
        return false;
      }

      if (selectedGerente !== 'all') {
        if (l.vendedor_id !== selectedGerente) return false;
      } else if (selectedRegional !== 'all') {
        if (!l.vendedor_id || !gerentesValidosIds.has(l.vendedor_id)) return false;
      }

      return true;
    });

    // 4. Cálculos Financeiros
    const ganhos = negociosFiltrados.filter(n => n.etapa_funil === 'Ganho');
    const totalGanhosCount = ganhos.length;
    const emAberto = negociosFiltrados.filter(
      n => n.etapa_funil !== 'Ganho' && n.etapa_funil !== 'Perdido'
    );

    const totalProducao = ganhos.reduce((sum, n) => sum + (Number(n.credito) || 0), 0);
    const totalPipeline = emAberto.reduce((sum, n) => sum + (Number(n.credito) || 0), 0);
    const ticket = ganhos.length > 0 ? totalProducao / ganhos.length : 0;
    const taxaConv =
      negociosFiltrados.length > 0 ? (ganhos.length / negociosFiltrados.length) * 100 : 0;

    // Média de produção mês a mês
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const ganhosAnoVigente = ganhos.filter(
      n => new Date(n.created_at).getFullYear() === currentYear
    );
    const producaoAnoVigente = ganhosAnoVigente.reduce(
      (sum, n) => sum + (Number(n.credito) || 0),
      0
    );
    const mediaMensal = producaoAnoVigente / currentMonth;

    // 5. Força de Vendas (Dinâmica de acordo com os filtros)
    let sups = usuarios.filter(u => u.role === 'superintendente' && u.ativo);
    let regs = usuarios.filter(u => u.role === 'regional' && u.ativo);
    let gers = usuarios.filter(u => u.role === 'gerente_negocio' && u.ativo);

    if (selectedRegional !== 'all') {
      regs = regs.filter(r => r.id === selectedRegional);
      gers = gers.filter(g => g.supervisor_id === selectedRegional);
      const reg = regs[0];
      if (reg && reg.supervisor_id) {
        sups = sups.filter(s => s.id === reg.supervisor_id);
      }
    }

    if (selectedGerente !== 'all') {
      gers = gers.filter(g => g.id === selectedGerente);
    }

    const cSups = sups.length;
    const cRegs = regs.length;
    const cGers = gers.length;
    const cParceiros = leadsFiltrados.length;
    const totalForca = cSups + cRegs + cGers;

    // 6. Top 5 Gerentes (Por Produção Ganha)
    const gerentesMap = new Map<string, { nome: string; valor: number }>();
    ganhos.forEach(n => {
      if (n.vendedor_id) {
        const u = usuarios.find(usr => usr.id === n.vendedor_id);
        const nome = u?.nome || 'Gerente';
        if (!gerentesMap.has(n.vendedor_id)) {
          gerentesMap.set(n.vendedor_id, { nome, valor: 0 });
        }
        gerentesMap.get(n.vendedor_id)!.valor += Number(n.credito) || 0;
      }
    });
    const rankingGerentes = Array.from(gerentesMap.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    // 7. Top 5 Parceiros (Por Produção Ganha)
    const parceirosMap = new Map<string, { nome: string; valor: number }>();
    ganhos.forEach(n => {
      if (n.cliente_id) {
        const p = leads.find(l => l.id === n.cliente_id);
        const nome = p?.nome || n.titulo || 'Parceiro';
        if (!parceirosMap.has(n.cliente_id)) {
          parceirosMap.set(n.cliente_id, { nome, valor: 0 });
        }
        parceirosMap.get(n.cliente_id)!.valor += Number(n.credito) || 0;
      }
    });
    const rankingParceiros = Array.from(parceirosMap.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return {
      filteredNegocios: negociosFiltrados,
      filteredLeads: leadsFiltrados,
      producaoTotal: totalProducao,
      totalGanhosCount,
      pipelineAberto: totalPipeline,
      ticketMedio: ticket,
      taxaConversao: taxaConv,
      mediaMensalProducao: mediaMensal,
      countSuperintendentes: cSups,
      countRegionais: cRegs,
      countGerentes: cGers,
      countParceiros: cParceiros,
      totalForcaVendas: totalForca,
      topGerentes: rankingGerentes,
      topParceiros: rankingParceiros,
    };
  }, [
    usuarios,
    leads,
    negocios,
    selectedPeriod,
    customStartDate,
    customEndDate,
    selectedRegional,
    selectedGerente,
    selectedParceiro,
    gerentesDisponiveis,
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 text-slate-100 pb-16">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Console Geral de Administração
          </h1>
          <p className="text-sm text-slate-400 font-light mt-1">
            Inteligência Comercial e Visão Consolidada - Rodobens Consórcio
          </p>
        </div>

        {/* Resumo de itens correspondentes */}
        <div className="flex items-center gap-3 bg-[#1E293B] border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#00CF7B]" />
            <strong className="text-white">{filteredNegocios.length}</strong> negócios encontrados
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-medium">
            <strong className="text-white">{filteredLeads.length}</strong> parceiros / leads
          </span>
        </div>
      </div>

      {/* PAINEL DE FILTROS AVANÇADOS */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Filter className="w-4 h-4 text-[#00CF7B]" />
            <span>Filtros de Análise</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          )}
        </div>

        {/* GRID DE FILTROS: DATA, REGIONAL, GERENTE DE NEGÓCIOS, PARCEIRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. FILTRO DE DATA / PERÍODO */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Período / Data
            </label>
            <select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="w-full bg-[#0B0F19] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B] transition-colors"
            >
              <option value="all">Todo o Histórico</option>
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="this_month">Este Mês</option>
              <option value="last_month">Mês Anterior</option>
              <option value="this_year">Este Ano</option>
              <option value="last_year">Ano Anterior</option>
              <option value="custom">Personalizado...</option>
            </select>
          </div>

          {/* 2. FILTRO DE REGIONAL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Regional Comercial
            </label>
            <select
              value={selectedRegional}
              onChange={handleRegionalChange}
              className="w-full bg-[#0B0F19] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B] transition-colors truncate"
            >
              <option value="all">Todas as Regionais</option>
              {regionais.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>

          {/* 3. FILTRO DE GERENTE DE NEGÓCIOS */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              Gerente de Negócios
            </label>
            <select
              value={selectedGerente}
              onChange={handleGerenteChange}
              className="w-full bg-[#0B0F19] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B] transition-colors truncate"
            >
              <option value="all">Todos os Gerentes</option>
              {gerentesDisponiveis.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>

          {/* 4. FILTRO DE PARCEIRO */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              Parceiro / Ponto de Venda
            </label>
            <select
              value={selectedParceiro}
              onChange={handleParceiroChange}
              className="w-full bg-[#0B0F19] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B] transition-colors truncate"
            >
              <option value="all">Todos os Parceiros</option>
              {parceirosDisponiveis.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.cidade ? `(${p.cidade}/${p.estado || ''})` : ''}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* CAMPO DE DATAS PERSONALIZADAS SE SELECIONADO "CUSTOM" */}
        {selectedPeriod === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Data Inicial</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#00CF7B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Data Final</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#00CF7B]"
              />
            </div>
          </div>
        )}

        {/* BADGES / PILLS DE FILTROS ATIVOS */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Filtros Ativos:
            </span>

            {selectedPeriod !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                Período: {selectedPeriod === 'custom' ? `${customStartDate || '...'} a ${customEndDate || '...'}` : selectedPeriod}
                <button onClick={() => setSelectedPeriod('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedRegional !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md">
                Regional: {regionais.find(r => r.id === selectedRegional)?.nome}
                <button onClick={() => setSelectedRegional('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedGerente !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-md">
                Gerente: {usuarios.find(u => u.id === selectedGerente)?.nome}
                <button onClick={() => setSelectedGerente('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedParceiro !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md">
                Parceiro: {leads.find(l => l.id === selectedParceiro)?.nome}
                <button onClick={() => setSelectedParceiro('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* SEÇÃO 1: MÉTRICAS FINANCEIRAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Produção Realizada */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-[#1E293B] border border-emerald-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24 text-emerald-400" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              Produção Realizada
            </h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-extrabold text-white truncate" title={formatCurrency(producaoTotal)}>
                {formatCurrency(producaoTotal)}
              </span>
            </div>
            <p className="text-xs text-emerald-400/80 mt-2 font-medium">
              Volume total vendido (ganhos) no filtro selecionado.
            </p>
          </div>
        </div>

        {/* Pipeline Aberto */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
            Média no Pipeline (Em Aberto)
          </h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-white truncate" title={formatCurrency(pipelineAberto)}>
              {formatCurrency(pipelineAberto)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Soma de todos os negócios não concluídos.</p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Ticket Médio Global
          </h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-white truncate" title={formatCurrency(ticketMedio)}>
              {formatCurrency(ticketMedio)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Valor médio dos negócios ganhos.</p>
        </div>
      </div>

      {/* SEÇÃO 2: MÉTRICAS DE VOLUME E TRAÇÃO */}
      <h2 className="text-lg font-bold text-white mt-8 mb-4 border-b border-slate-800 pb-2">
        Volumes, Tração e Hierarquia
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Força de Vendas */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 hover:border-[#00CF7B]/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Força de Vendas</h3>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-white">{totalForcaVendas}</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Sups:</span> <span>{countSuperintendentes}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Regionais:</span> <span>{countRegionais}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Gerentes:</span> <span>{countGerentes}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total de Leads / Parceiros */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 hover:border-[#00CF7B]/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total de Leads</h3>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-white">{filteredLeads.length}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Contatos e parceiros no escopo filtrado.</p>
        </div>

        {/* Card 3: Negócios Gerados (Oportunidades) */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 hover:border-[#00CF7B]/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Oportunidades</h3>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Handshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-white">{filteredNegocios.length}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Negócios inseridos no funil.</p>
        </div>

        {/* Card 4: Taxa de Conversão */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 hover:border-[#00CF7B]/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Conversão de Negócios</h3>
            <div className="h-10 w-10 rounded-full bg-[#00CF7B]/10 flex items-center justify-center text-[#00CF7B]">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold text-white">
              {taxaConversao.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Taxa de Win (Ganhos vs Total).</p>
        </div>

      </div>

      {/* SEÇÃO 3: RANKINGS E PRODUÇÃO CONSOLIDADA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10 mt-6">
        
        {/* Ranking: Top 5 Gerentes */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-amber-400">🏆</span> Top 5 Gerentes (Por Produção)
            </h3>
            {topGerentes.length > 0 ? (
              <div className="space-y-3">
                {topGerentes.map((gerente, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#0B0F19] rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-300' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-slate-800 text-slate-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[130px]">{gerente.nome}</span>
                    </div>
                    <span className="text-xs font-bold bg-[#1E293B] px-3 py-1.5 rounded-md text-emerald-400 border border-emerald-900/50 shadow-sm">
                      {formatCurrency(gerente.valor)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Nenhuma produção registrada para os filtros atuais.</p>
            )}
          </div>
        </div>

        {/* Ranking: Top 5 Parceiros */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Top 5 Parceiros / PVs
            </h3>
            {topParceiros.length > 0 ? (
              <div className="space-y-3">
                {topParceiros.map((parceiro, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#0B0F19] rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-300' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-slate-800 text-slate-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[130px]">{parceiro.nome}</span>
                    </div>
                    <span className="text-xs font-bold bg-[#1E293B] px-3 py-1.5 rounded-md text-emerald-400 border border-emerald-900/50 shadow-sm">
                      {formatCurrency(parceiro.valor)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Nenhum parceiro com produção no período.</p>
            )}
          </div>
        </div>
        
        {/* Info Geral de Produção Consolidada */}
        <div className="bg-gradient-to-br from-[#0B0F19] to-[#1E293B] border border-slate-800 rounded-2xl p-8 shadow-lg flex flex-col justify-center items-center text-center">
          <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <Users2 className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Produção Total Consolidada</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm">
            Soma de todos os negócios ganhos registrados no escopo e período selecionados.
          </p>
          <div className="px-6 py-4 bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-sm shadow-inner space-y-1">
            <span className="text-3xl font-extrabold text-blue-400 tracking-tight block">
              {formatCurrency(producaoTotal)}
            </span>
            <span className="text-xs font-semibold text-slate-400 block">
              {totalGanhosCount} {totalGanhosCount === 1 ? 'negócio ganho' : 'negócios ganhos'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}


