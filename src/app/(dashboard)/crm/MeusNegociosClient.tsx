'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  X, 
  UserCheck, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Building2, 
  ChevronRight, 
  ChevronLeft,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { updateNegocioStageAction } from '@/modules/crm/actions';

interface GerenteNegocio {
  id: string;
  nome: string;
  role?: string;
}

interface Negocio {
  id: string;
  cliente_id: string;
  proposta_id: string | null;
  titulo: string;
  credito: number;
  modalidade: string;
  administradora: string | null;
  etapa_funil: string;
  origem: string | null;
  proximo_followup: string | null;
  ultima_interacao: string | null;
  motivo_perda: string | null;
  vendedor_id: string | null;
  created_at: string;
  updated_at: string;
  leads?: {
    id?: string;
    nome: string;
    telefone: string | null;
  } | null;
  usuarios?: {
    id?: string;
    nome: string;
    role?: string;
  } | null;
  propostas?: {
    id?: string;
    simulacoes?: {
      produto?: string | null;
    } | null;
  } | null;
}

interface UsuarioHierarquia {
  id: string;
  nome: string;
  role: string;
  supervisor_id?: string | null;
}

interface MeusNegociosClientProps {
  negocios: Negocio[];
  gerentes: GerenteNegocio[];
  usuariosHierarquia?: UsuarioHierarquia[];
  currentUser: {
    id: string;
    role: string;
    nome?: string;
  };
}

const ETAPAS = [
  { id: 'novo_lead', label: 'Em Atendimento', subtitle: 'Contato' },
  { id: 'qualificacao', label: 'Qualificação', subtitle: 'Filtro' },
  { id: 'simulacao_apresentada', label: 'Simulação Apresentada', subtitle: 'Proposta' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', subtitle: 'Decisão' },
  { id: 'negociacao', label: 'Negociação / Follow-up', subtitle: 'Acompanhamento' },
  { id: 'ganho', label: 'Fechado / Ganho', subtitle: 'Sucesso' },
  { id: 'perdido', label: 'Perdido', subtitle: 'Arquivado' },
];

export default function MeusNegociosClient({
  negocios,
  gerentes,
  usuariosHierarquia,
  currentUser,
}: MeusNegociosClientProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isPendingMove, startTransition] = useTransition();

  const isLeader =
    currentUser.role === 'regional' ||
    currentUser.role === 'superintendente' ||
    currentUser.role === 'diretoria' ||
    currentUser.role === 'master' ||
    currentUser.role === 'platform_admin';

  const canFilterSuperintendente =
    currentUser.role === 'diretoria' ||
    currentUser.role === 'master' ||
    currentUser.role === 'platform_admin';

  const canFilterRegional =
    currentUser.role === 'superintendente' ||
    currentUser.role === 'diretoria' ||
    currentUser.role === 'master' ||
    currentUser.role === 'platform_admin';

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSuperintendente, setFilterSuperintendente] = useState('all');
  const [filterRegional, setFilterRegional] = useState('all');
  const [filterGerente, setFilterGerente] = useState('all');
  const [filterParceiro, setFilterParceiro] = useState('all');
  const [filterEtapa, setFilterEtapa] = useState('all');
  const [filterProduto, setFilterProduto] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');

  const userHierarchyList = useMemo(() => {
    return (usuariosHierarquia || gerentes) as UsuarioHierarquia[];
  }, [usuariosHierarquia, gerentes]);

  // Lista de Superintendentes disponíveis para filtro (Diretoria / Master)
  const superintendentesDisponiveis = useMemo(() => {
    return userHierarchyList.filter((u) => u.role === 'superintendente');
  }, [userHierarchyList]);

  // Lista de Regionais disponíveis para filtro
  // Se um superintendente estiver selecionado, filtra APENAS as Regionais desse superintendente
  const regionaisDisponiveis = useMemo(() => {
    const todasRegionais = userHierarchyList.filter((u) => u.role === 'regional');
    if (filterSuperintendente !== 'all') {
      return todasRegionais.filter((u) => u.supervisor_id === filterSuperintendente);
    }
    return todasRegionais;
  }, [userHierarchyList, filterSuperintendente]);

  // Lista de Gerentes de Negócios (GN) / Vendedores disponíveis
  // Se uma regional estiver selecionada, filtra APENAS os GNs do time daquela regional!
  // Se um superintendente estiver selecionado (mas regional = 'all'), filtra GNs de todas as regionais daquele superintendente!
  const gerentesDisponiveis = useMemo(() => {
    const todosGns = userHierarchyList.filter(
      (u) => u.role === 'gerente_negocio' || u.role === 'ponto_venda'
    );

    if (filterRegional !== 'all') {
      return todosGns.filter((u) => u.supervisor_id === filterRegional);
    }

    if (filterSuperintendente !== 'all') {
      const regionaisSuperIds = userHierarchyList
        .filter((u) => u.role === 'regional' && u.supervisor_id === filterSuperintendente)
        .map((u) => u.id);
      return todosGns.filter((u) => u.supervisor_id && regionaisSuperIds.includes(u.supervisor_id));
    }

    return todosGns;
  }, [userHierarchyList, filterSuperintendente, filterRegional]);

  const handleSuperintendenteChange = (newSuper: string) => {
    setFilterSuperintendente(newSuper);
    setFilterRegional('all');
    setFilterGerente('all');
  };

  const handleRegionalChange = (newRegional: string) => {
    setFilterRegional(newRegional);
    setFilterGerente('all'); // Reseta a seleção de GN ao alternar de Regional
  };



  // Lista única de Parceiros (Leads)
  const parceirosDisponiveis = useMemo(() => {
    const map = new Map<string, string>();
    negocios.forEach((n) => {
      if (n.cliente_id && n.leads?.nome) {
        map.set(n.cliente_id, n.leads.nome);
      }
    });
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [negocios]);

  // Funções de atalhos de data
  const handleDatePreset = (preset: string) => {
    setActiveDatePreset(preset);
    const now = new Date();
    
    if (preset === 'all') {
      setFilterDateStart('');
      setFilterDateEnd('');
      return;
    }

    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setFilterDateStart(todayStr);
      setFilterDateEnd(todayStr);
      return;
    }

    if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setFilterDateStart(past.toISOString().split('T')[0]);
      setFilterDateEnd(now.toISOString().split('T')[0]);
      return;
    }

    if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFilterDateStart(firstDay.toISOString().split('T')[0]);
      setFilterDateEnd(lastDay.toISOString().split('T')[0]);
      return;
    }

    if (preset === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setFilterDateStart(firstDay.toISOString().split('T')[0]);
      setFilterDateEnd(lastDay.toISOString().split('T')[0]);
      return;
    }

    if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setFilterDateStart(past.toISOString().split('T')[0]);
      setFilterDateEnd(now.toISOString().split('T')[0]);
      return;
    }

    if (preset === 'year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setFilterDateStart(firstDay.toISOString().split('T')[0]);
      setFilterDateEnd(lastDay.toISOString().split('T')[0]);
      return;
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterSuperintendente('all');
    setFilterRegional('all');
    setFilterGerente('all');
    setFilterParceiro('all');
    setFilterEtapa('all');
    setFilterProduto('all');
    setFilterDateStart('');
    setFilterDateEnd('');
    setActiveDatePreset('all');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    filterSuperintendente !== 'all' ||
    filterRegional !== 'all' ||
    filterGerente !== 'all' ||
    filterParceiro !== 'all' ||
    filterEtapa !== 'all' ||
    filterProduto !== 'all' ||
    filterDateStart !== '' ||
    filterDateEnd !== '';

  const getDescendantUserIds = (parentId: string): string[] => {
    const children = userHierarchyList.filter((u) => u.supervisor_id === parentId);
    let ids = children.map((c) => c.id);
    for (const child of children) {
      ids = ids.concat(getDescendantUserIds(child.id));
    }
    return ids;
  };

  const filteredNegocios = useMemo(() => {
    return negocios.filter((n) => {
      const nomeCliente = n.leads?.nome?.toLowerCase() || '';
      const telefone = n.leads?.telefone || '';
      const tituloNegocio = n.titulo?.toLowerCase() || '';
      const nomeVendedor = n.usuarios?.nome?.toLowerCase() || '';
      const search = searchQuery.toLowerCase();

      const matchesSearch =
        nomeCliente.includes(search) ||
        tituloNegocio.includes(search) ||
        telefone.includes(search) ||
        nomeVendedor.includes(search);

      // Lógica de filtro por Hierarquia (Superintendente, Regional e Gerente)
      let matchesHierarquia = true;
      if (filterGerente !== 'all') {
        matchesHierarquia = n.vendedor_id === filterGerente;
      } else if (filterRegional !== 'all') {
        const timeRegionalIds = [filterRegional, ...getDescendantUserIds(filterRegional)];
        matchesHierarquia = n.vendedor_id ? timeRegionalIds.includes(n.vendedor_id) : false;
      } else if (filterSuperintendente !== 'all') {
        const timeSuperIds = [filterSuperintendente, ...getDescendantUserIds(filterSuperintendente)];
        matchesHierarquia = n.vendedor_id ? timeSuperIds.includes(n.vendedor_id) : false;
      }

      const matchesParceiro = filterParceiro === 'all' || n.cliente_id === filterParceiro;
      const matchesEtapa = filterEtapa === 'all' || n.etapa_funil === filterEtapa;

      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

      let matchesProduto = true;
      if (filterProduto !== 'all') {
        const fullSearchable = normalize(
          `${n.modalidade || ''} ${n.titulo || ''} ${n.propostas?.simulacoes?.produto || ''}`
        );

        if (filterProduto === 'imovel') {
          matchesProduto =
            fullSearchable.includes('imov') ||
            fullSearchable.includes('imobili') ||
            fullSearchable.includes('casa') ||
            fullSearchable.includes('apartamento') ||
            fullSearchable.includes('terreno') ||
            fullSearchable.includes('construcao');
        } else if (filterProduto === 'caminhao') {
          matchesProduto =
            fullSearchable.includes('caminha') ||
            fullSearchable.includes('pesad') ||
            fullSearchable.includes('trator') ||
            fullSearchable.includes('maquina') ||
            fullSearchable.includes('onibus') ||
            fullSearchable.includes('carreta') ||
            fullSearchable.includes('agricola');
        } else if (filterProduto === 'auto') {
          matchesProduto =
            (fullSearchable.includes('auto') ||
              fullSearchable.includes('veicul') ||
              fullSearchable.includes('carro') ||
              fullSearchable.includes('camionete')) &&
            !fullSearchable.includes('pesad') &&
            !fullSearchable.includes('caminha') &&
            !fullSearchable.includes('moto');
        } else if (filterProduto === 'servico') {
          matchesProduto =
            fullSearchable.includes('servic') ||
            fullSearchable.includes('service') ||
            fullSearchable.includes('festa') ||
            fullSearchable.includes('viagem') ||
            fullSearchable.includes('solar') ||
            fullSearchable.includes('cirurgia');
        } else if (filterProduto === 'moto') {
          matchesProduto =
            fullSearchable.includes('moto') ||
            fullSearchable.includes('motocicl');
        } else {
          const prodNorm = normalize(filterProduto);
          matchesProduto = fullSearchable.includes(prodNorm);
        }
      }

      let matchesDate = true;
      if (filterDateStart || filterDateEnd) {
        const negocioDate = new Date(n.created_at);

        if (filterDateStart) {
          const start = new Date(filterDateStart + 'T00:00:00');
          if (negocioDate < start) matchesDate = false;
        }

        if (filterDateEnd) {
          const end = new Date(filterDateEnd + 'T23:59:59');
          if (negocioDate > end) matchesDate = false;
        }
      }

      return (
        matchesSearch &&
        matchesHierarquia &&
        matchesParceiro &&
        matchesEtapa &&
        matchesProduto &&
        matchesDate
      );
    });
  }, [
    negocios,
    searchQuery,
    filterSuperintendente,
    filterRegional,
    filterGerente,
    filterParceiro,
    filterEtapa,
    filterProduto,
    filterDateStart,
    filterDateEnd,
    userHierarchyList,
  ]);

  const getEtapaLabel = (id: string) => {
    return ETAPAS.find((e) => e.id === id)?.label || id;
  };

  const getEtapaColor = (id: string) => {
    if (id === 'ganho') return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (id === 'perdido') return 'bg-rose-50 text-rose-800 border-rose-300';
    if (id === 'novo_lead') return 'bg-blue-50 text-blue-800 border-blue-300';
    if (id === 'qualificacao') return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    if (id === 'simulacao_apresentada') return 'bg-amber-50 text-amber-800 border-amber-300';
    if (id === 'proposta_enviada') return 'bg-purple-50 text-purple-800 border-purple-300';
    return 'bg-teal-50 text-teal-800 border-teal-300';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  // Indicadores KPI
  const totalEmNegociacao = filteredNegocios
    .filter((n) => n.etapa_funil !== 'ganho' && n.etapa_funil !== 'perdido')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const totalGanhos = filteredNegocios
    .filter((n) => n.etapa_funil === 'ganho')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const totalPerdidos = filteredNegocios
    .filter((n) => n.etapa_funil === 'perdido')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const diferencaFechadoPerdido = totalGanhos - totalPerdidos;
  const negociosAtivosCount = filteredNegocios.filter(
    (n) => n.etapa_funil !== 'ganho' && n.etapa_funil !== 'perdido'
  ).length;
  const negociosGanhosCount = filteredNegocios.filter((n) => n.etapa_funil === 'ganho').length;

  // Kanban - Agrupar negócios por etapa
  const negociosByStage: Record<string, Negocio[]> = useMemo(() => {
    const grouped: Record<string, Negocio[]> = {};
    ETAPAS.forEach((etapa) => {
      grouped[etapa.id] = filteredNegocios.filter((n) => n.etapa_funil === etapa.id);
    });
    return grouped;
  }, [filteredNegocios]);

  const handleMoveStage = async (negocio: Negocio, direction: 'prev' | 'next') => {
    const currentIndex = ETAPAS.findIndex((e) => e.id === negocio.etapa_funil);
    const nextIndex = currentIndex + (direction === 'next' ? 1 : -1);

    if (nextIndex >= 0 && nextIndex < ETAPAS.length) {
      const newStage = ETAPAS[nextIndex].id;
      startTransition(async () => {
        const res = await updateNegocioStageAction(negocio.id, newStage, negocio.proposta_id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const handleDropdownMove = async (negocio: Negocio, newStage: string) => {
    startTransition(async () => {
      const res = await updateNegocioStageAction(negocio.id, newStage, negocio.proposta_id);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#00441F] tracking-tight">
              {isLeader ? 'Negócios da Equipe' : 'Meus Negócios'}
            </h1>
            {isLeader && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00CF7B]/15 text-[#00441F] border border-[#00CF7B]/30">
                <Users className="w-3.5 h-3.5 text-[#00441F]" />
                Visão de Liderança
              </span>
            )}
          </div>
          <p className="text-sm text-[#00441F]/80 font-medium mt-1">
            {isLeader
              ? 'Acompanhe as oportunidades, pipeline de vendas e a tração da sua equipe comercial com filtros operacionais.'
              : 'Acompanhe suas oportunidades de venda, propostas ativas e histórico de negociações.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Alternador de Visualização (Lista / Kanban) */}
          <div className="flex bg-white/70 p-1 rounded-xl border border-[#E0E5CF] shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-[#00441F] text-white shadow-xs'
                  : 'text-[#00441F] hover:bg-black/5'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-[#00441F] text-white shadow-xs'
                  : 'text-[#00441F] hover:bg-black/5'
              }`}
            >
              Pipeline (Kanban)
            </button>
          </div>

          <Link
            href="/simulador"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00CF7B] px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-[#00441F] transition-all cursor-pointer"
          >
            <Briefcase className="h-4 w-4" />
            Novo Negócio
          </Link>
        </div>
      </div>

      {/* Cards de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#e9ebe4] rounded-2xl p-5 border border-[#E0E5CF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#00441F] uppercase tracking-wider">
              Total em Negociação
            </h3>
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-[#00441F]">{formatCurrency(totalEmNegociacao)}</p>
            <p className="text-xs text-[#00441F]/80 font-medium mt-1">
              {negociosAtivosCount} oportunidade(s) em aberto
            </p>
          </div>
        </div>

        <div className="bg-[#e9ebe4] rounded-2xl p-5 border border-[#E0E5CF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#00441F] uppercase tracking-wider">
              Total Fechado (Ganhos)
            </h3>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalGanhos)}</p>
            <p className="text-xs text-[#00441F]/80 font-medium mt-1">
              {negociosGanhosCount} negócio(s) convertidos
            </p>
          </div>
        </div>

        <div className="bg-[#e9ebe4] rounded-2xl p-5 border border-[#E0E5CF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#00441F] uppercase tracking-wider">
              Total Perdidos
            </h3>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600">{formatCurrency(totalPerdidos)}</p>
            <p className="text-xs text-[#00441F]/80 font-medium mt-1">
              Negócios arquivados no período
            </p>
          </div>
        </div>

        <div className="bg-[#e9ebe4] rounded-2xl p-5 border border-[#E0E5CF] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#00441F] uppercase tracking-wider">
              Saldo / Balanço
            </h3>
            <span className="p-1.5 rounded-lg bg-[#00CF7B]/20 text-[#00441F]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p
              className={`text-2xl font-black ${
                diferencaFechadoPerdido >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {diferencaFechadoPerdido > 0 ? '+' : ''}
              {formatCurrency(diferencaFechadoPerdido)}
            </p>
            <p className="text-xs text-[#00441F]/80 font-medium mt-1">
              Volume total filtrado: {formatCurrency(totalEmNegociacao + totalGanhos + totalPerdidos)}
            </p>
          </div>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-xs space-y-4">
        {/* Linha 1: Barra de Busca + Atalhos de Período */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Input de Busca Geral */}
          <div className="relative flex-1 w-full min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00441F]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por parceiro, cliente, título ou gerente..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-[#E0E5CF] text-sm text-[#00441F] placeholder:text-[#00441F]/50 focus:outline-none focus:ring-2 focus:ring-[#00CF7B] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Atalhos Rápidos de Data */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/60 p-1 rounded-xl border border-[#E0E5CF]">
            <span className="text-[11px] font-bold uppercase text-[#00441F]/70 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Período:
            </span>
            {[
              { id: 'all', label: 'Todo o histórico' },
              { id: 'month', label: 'Este Mês' },
              { id: 'last_month', label: 'Mês Passado' },
              { id: '30days', label: 'Últimos 30D' },
              { id: 'year', label: 'Este Ano' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleDatePreset(p.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeDatePreset === p.id
                    ? 'bg-[#00441F] text-white shadow-xs'
                    : 'text-[#00441F] hover:bg-black/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Linha 2: Dropdowns de Filtro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 pt-2 border-t border-[#E0E5CF]/60">
          {/* Filtro por Superintendente (Visível para Diretoria / Master) */}
          {canFilterSuperintendente && superintendentesDisponiveis.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#00441F] uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#00CF7B]" /> Superintendente
              </label>
              <select
                value={filterSuperintendente}
                onChange={(e) => handleSuperintendenteChange(e.target.value)}
                className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3 py-2 text-xs font-medium text-[#00441F] focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              >
                <option value="all">Todos os Superintendentes ({superintendentesDisponiveis.length})</option>
                {superintendentesDisponiveis.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Regional Comercial (Visível para Superintendente / Diretoria / Master) */}
          {canFilterRegional && regionaisDisponiveis.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#00441F] uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-[#00CF7B]" /> Regional Comercial
              </label>
              <select
                value={filterRegional}
                onChange={(e) => handleRegionalChange(e.target.value)}
                className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3 py-2 text-xs font-medium text-[#00441F] focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              >
                <option value="all">
                  {filterSuperintendente !== 'all' ? 'Todas do Superintendente' : 'Todas as Regionais'} ({regionaisDisponiveis.length})
                </option>
                {regionaisDisponiveis.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Gerente de Negócios (GN) */}
          {gerentesDisponiveis.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#00441F] uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-[#00CF7B]" /> Gerente (GN)
              </label>
              <select
                value={filterGerente}
                onChange={(e) => setFilterGerente(e.target.value)}
                className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3 py-2 text-xs font-medium text-[#00441F] focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
              >
                <option value="all">
                  {filterRegional !== 'all' ? 'Todos do Time Regional' : 'Todos os Gerentes'} ({gerentesDisponiveis.length})
                </option>
                {gerentesDisponiveis.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Parceiro (Cliente / Lead) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#00441F] uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#00CF7B]" /> Parceiro / Cliente
            </label>
            <select
              value={filterParceiro}
              onChange={(e) => setFilterParceiro(e.target.value)}
              className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3 py-2 text-xs font-medium text-[#00441F] focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
            >
              <option value="all">Todos os Parceiros ({parceirosDisponiveis.length})</option>
              {parceirosDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Produto */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#00441F] uppercase tracking-wider">
              Produto
            </label>
            <select
              value={filterProduto}
              onChange={(e) => setFilterProduto(e.target.value)}
              className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3 py-2 text-xs font-medium text-[#00441F] focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
            >
              <option value="all">Todos os Produtos</option>
              <option value="imovel">Imóvel</option>
              <option value="caminhao">Caminhão</option>
              <option value="auto">Auto</option>
              <option value="servico">Serviço</option>
              <option value="moto">Moto</option>
            </select>
          </div>

          {/* Filtro Data Inicial */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#00441F] uppercase tracking-wider">
              Criado De
            </label>
            <input
              type="date"
              value={filterDateStart}
              onChange={(e) => {
                setFilterDateStart(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3 py-1.5 text-xs text-[#00441F] focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
            />
          </div>

          {/* Filtro Data Final */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#00441F] uppercase tracking-wider">
              Criado Até
            </label>
            <input
              type="date"
              value={filterDateEnd}
              onChange={(e) => {
                setFilterDateEnd(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3 py-1.5 text-xs text-[#00441F] focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
            />
          </div>
        </div>

        {/* Linha 3: Barra de Status & Limpar Filtros */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#00441F]/80 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#00441F]">
              {filteredNegocios.length} negócio(s) exibido(s)
            </span>
            <span>de {negocios.length} no total</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Visualização Lista (Tabela) */}
      {viewMode === 'table' ? (
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#00441F]">
              <thead className="bg-[#dddedc] border-b border-[#E0E5CF] text-xs uppercase text-[#00441F] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Negócio / Oportunidade</th>
                  <th className="px-6 py-4 whitespace-nowrap">Parceiro (Cliente)</th>
                  {isLeader && <th className="px-6 py-4 whitespace-nowrap">Responsável</th>}
                  <th className="px-6 py-4 whitespace-nowrap">Crédito & Cota</th>
                  <th className="px-6 py-4 whitespace-nowrap">Etapa do Funil</th>
                  <th className="px-6 py-4 whitespace-nowrap">Data</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E5CF]">
                {filteredNegocios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isLeader ? 7 : 6}
                      className="px-6 py-12 text-center text-[#00441F]/70 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                        <p className="font-bold">Nenhum negócio encontrado com os filtros selecionados.</p>
                        <p className="text-xs text-gray-500">
                          Tente ajustar os filtros de gerente, parceiro ou período de data.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNegocios.map((negocio) => (
                    <tr key={negocio.id} className="hover:bg-white/40 transition-colors">
                      {/* Título do Negócio */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-[#00441F] line-clamp-1">
                          {negocio.titulo}
                        </div>
                        <div className="text-[11px] text-[#00441F]/70 mt-0.5">
                          Origem: {negocio.origem || 'Direto'}
                        </div>
                      </td>

                      {/* Parceiro / Cliente */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/crm/${negocio.cliente_id}`}
                          className="font-bold text-[#00441F] hover:text-[#00CF7B] hover:underline transition-colors flex items-center gap-1.5"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#00CF7B]/20 text-[#00441F] text-[10px] font-black flex items-center justify-center">
                            {negocio.leads?.nome ? negocio.leads.nome[0].toUpperCase() : 'P'}
                          </span>
                          <span>{negocio.leads?.nome || 'Cliente não identificado'}</span>
                        </Link>
                        {negocio.leads?.telefone && (
                          <div className="text-[11px] text-[#00441F]/60 ml-7">
                            📞 {negocio.leads.telefone}
                          </div>
                        )}
                      </td>

                      {/* Responsável (Visível para Líderes) */}
                      {isLeader && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-[#E0E5CF] text-xs font-bold text-[#00441F]">
                            <UserCheck className="w-3.5 h-3.5 text-[#00CF7B]" />
                            {negocio.usuarios?.nome || 'Gerente Geral'}
                          </div>
                        </td>
                      )}

                      {/* Crédito & Modalidade */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-black text-[#00441F] text-base">
                          {formatCurrency(negocio.credito)}
                        </div>
                        <div className="text-[11px] text-[#00441F]/80 font-bold uppercase tracking-wider mt-0.5">
                          {negocio.modalidade}{' '}
                          {negocio.administradora ? `• ${negocio.administradora}` : ''}
                        </div>
                      </td>

                      {/* Etapa do Funil com Seletor Rápido */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={negocio.etapa_funil}
                          onChange={(e) => handleDropdownMove(negocio, e.target.value)}
                          disabled={isPendingMove}
                          className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer hover:opacity-90 transition-opacity shadow-xs ${getEtapaColor(
                            negocio.etapa_funil
                          )}`}
                        >
                          {ETAPAS.map((etapa) => (
                            <option key={etapa.id} value={etapa.id} className="text-gray-900 bg-white">
                              {etapa.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Data */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-[#00441F]">
                          {formatDate(negocio.created_at)}
                        </div>
                        <div className="text-[10px] text-[#00441F]/60">
                          Alt: {formatDate(negocio.updated_at)}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Link
                          href={`/crm/${negocio.cliente_id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-[#E0E5CF] bg-white text-xs font-bold text-[#00441F] hover:bg-gray-50 transition-colors shadow-xs"
                        >
                          Ver Parceiro
                        </Link>
                        {negocio.proposta_id && (
                          <Link
                            href={`/propostas/${negocio.proposta_id}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#00CF7B] text-xs font-bold text-white hover:bg-[#00441F] transition-colors shadow-xs"
                          >
                            Ver Proposta
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visualização Kanban (Pipeline) */
        <div className="flex gap-4 overflow-x-auto pb-6 items-start h-[calc(100vh-320px)] min-h-[500px]">
          {ETAPAS.map((etapa) => {
            const list = negociosByStage[etapa.id] || [];
            const totalCredito = list.reduce((acc, neg) => acc + Number(neg.credito || 0), 0);

            return (
              <div
                key={etapa.id}
                className="flex-shrink-0 w-84 bg-[#dddedc] border border-[#E0E5CF] rounded-2xl flex flex-col max-h-full shadow-xs"
              >
                {/* Header da Coluna */}
                <div className="p-4 border-b border-[#E0E5CF] flex flex-col gap-1.5 bg-[#e9ebe4]/80 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#00441F]">{etapa.label}</h3>
                      <span className="text-[10px] text-[#00441F]/70 font-bold uppercase tracking-wider">
                        {etapa.subtitle}
                      </span>
                    </div>
                    <span className="h-6 px-2.5 rounded-full bg-white/90 border border-[#E0E5CF] flex items-center justify-center text-xs font-extrabold text-[#00441F]">
                      {list.length}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-[#00441F]">
                    {formatCurrency(totalCredito)}
                  </div>
                </div>

                {/* Lista de Cards da Etapa */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {list.length === 0 ? (
                    <div className="border border-dashed border-[#E0E5CF] rounded-xl py-8 text-center text-xs text-[#00441F]/60 font-medium">
                      Nenhuma oportunidade.
                    </div>
                  ) : (
                    list.map((neg) => (
                      <div
                        key={neg.id}
                        className="bg-white border border-[#E0E5CF] rounded-xl p-4 shadow-xs hover:shadow-md hover:border-[#00CF7B] transition-all space-y-2.5"
                      >
                        {/* Badges de Topo: Modalidade & Administradora */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] bg-[#e9ebe4] text-[#00441F] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {neg.modalidade}
                          </span>
                          {neg.administradora && (
                            <span className="text-[10px] text-[#00441F]/70 font-semibold truncate">
                              🏢 {neg.administradora}
                            </span>
                          )}
                        </div>

                        {/* Nome do Parceiro */}
                        <div>
                          <div className="text-xs text-[#00441F]/60 font-bold uppercase tracking-wider">
                            Parceiro / Cliente
                          </div>
                          <Link
                            href={`/crm/${neg.cliente_id}`}
                            className="font-extrabold text-sm text-[#00441F] hover:text-[#00CF7B] hover:underline transition-colors block line-clamp-1"
                          >
                            👤 {neg.leads?.nome || 'Cliente não identificado'}
                          </Link>
                        </div>

                        {/* Título do Negócio & Valor */}
                        <div className="pt-1 border-t border-gray-100">
                          <div className="text-xs font-medium text-gray-700 line-clamp-1">
                            {negocioFormatTitle(neg.titulo)}
                          </div>
                          <div className="text-base font-black text-[#00441F] mt-0.5">
                            {formatCurrency(neg.credito)}
                          </div>
                        </div>

                        {/* Tag de Gerente Responsável (para liderança) */}
                        {isLeader && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00441F] bg-[#e9ebe4]/80 px-2 py-1 rounded-md">
                            <UserCheck className="w-3.5 h-3.5 text-[#00CF7B]" />
                            <span className="truncate">{neg.usuarios?.nome || 'Gerente do Time'}</span>
                          </div>
                        )}

                        {/* Rodapé do Card: Links */}
                        <div className="flex gap-2 pt-1">
                          <Link
                            href={`/crm/${neg.cliente_id}`}
                            className="flex-1 text-center py-1.5 rounded-lg border border-[#E0E5CF] text-[11px] font-bold text-[#00441F] hover:bg-gray-50 transition-colors"
                          >
                            Ver Parceiro
                          </Link>
                          {neg.proposta_id && (
                            <Link
                              href={`/propostas/${neg.proposta_id}`}
                              className="flex-1 text-center py-1.5 rounded-lg bg-[#00CF7B] text-white text-[11px] font-bold hover:bg-[#00441F] transition-colors"
                            >
                              Ver Proposta
                            </Link>
                          )}
                        </div>

                        {/* Navegação Rápida de Etapa */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-2 gap-1.5">
                          <button
                            onClick={() => handleMoveStage(neg, 'prev')}
                            disabled={isPendingMove || neg.etapa_funil === ETAPAS[0].id}
                            className="p-1 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#00441F] disabled:opacity-30 cursor-pointer"
                            title="Mover para etapa anterior"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <select
                            value={neg.etapa_funil}
                            disabled={isPendingMove}
                            onChange={(e) => handleDropdownMove(neg, e.target.value)}
                            className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-[#00441F] outline-none flex-1 text-center"
                          >
                            {ETAPAS.map((et) => (
                              <option key={et.id} value={et.id}>
                                {et.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleMoveStage(neg, 'next')}
                            disabled={
                              isPendingMove || neg.etapa_funil === ETAPAS[ETAPAS.length - 1].id
                            }
                            className="p-1 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#00441F] disabled:opacity-30 cursor-pointer"
                            title="Mover para próxima etapa"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function negocioFormatTitle(title: string) {
  if (!title) return 'Oportunidade';
  return title;
}
