'use client';

import React, { useState, useTransition, useMemo, useEffect } from 'react';
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
  ShieldCheck,
  Trash2,
  Plus,
  Sparkles,
  Calculator,
  GitMerge,
  Info
} from 'lucide-react';
import { 
  updateNegocioStageAction, 
  deleteNegocioAction, 
  createNegocioManualAction,
  unificarNegociosAction,
  fecharNegocioUnificadoAction
} from '@/modules/crm/actions';

interface GerenteNegocio {
  id: string;
  nome: string;
  role?: string;
}

export interface PropostaUnificadaItem {
  negocio_id: string;
  proposta_id?: string | null;
  titulo: string;
  credito: number;
  modalidade: string;
  administradora?: string | null;
  etapa_funil: string;
  created_at: string;
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
  is_unificado?: boolean | null;
  propostas_unificadas?: PropostaUnificadaItem[] | null;
  valor_medio?: number | null;
  valor_fechamento?: number | null;
  proposta_fechada_id?: string | null;
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

interface ClienteDisponivel {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
}

interface MeusNegociosClientProps {
  negocios: Negocio[];
  gerentes: GerenteNegocio[];
  usuariosHierarquia?: UsuarioHierarquia[];
  clientesDisponiveis?: ClienteDisponivel[];
  currentUser: {
    id: string;
    role: string;
    nome?: string;
  };
}

export function getProdutoParam(negocio: Negocio): string {
  const text = `${negocio.modalidade || ''} ${negocio.titulo || ''} ${negocio.propostas?.simulacoes?.produto || ''}`.toLowerCase();
  if (text.includes('pesad') || text.includes('caminha') || text.includes('trator') || text.includes('maquina')) return 'pesado';
  if (text.includes('auto') || text.includes('carro') || text.includes('veicul')) return 'auto';
  if (text.includes('moto') || text.includes('motocicl')) return 'moto';
  if (text.includes('servic')) return 'servico';
  return 'imovel';
}

export function normalizeEtapa(etapa?: string | null): string {
  if (!etapa) return 'oportunidades';
  const clean = etapa.trim().toLowerCase();
  if (
    clean === 'novo_lead' ||
    clean === 'em_atendimento' ||
    clean === 'qualificacao' ||
    clean === 'sem_contato' ||
    clean === 'contato_realizado'
  ) {
    return 'oportunidades';
  }
  if (clean === 'simulacao_apresentada') {
    return 'simulacao_criada';
  }
  if (clean === 'ganho' || clean === 'fechado') {
    return 'fechado_ganho';
  }
  return clean;
}

export const ETAPAS = [
  { id: 'oportunidades', label: 'Oportunidades / Qualificação', subtitle: 'Captação' },
  { id: 'simulacao_criada', label: 'Simulação Criada', subtitle: 'Simulação' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', subtitle: 'Proposta' },
  { id: 'negociacao', label: 'Negociação / Follow Up', subtitle: 'Acompanhamento' },
  { id: 'pre_fechamento', label: 'Pré-Fechamento', subtitle: 'Decisão' },
  { id: 'fechado_ganho', label: 'Fechado / Ganho', subtitle: 'Sucesso' },
  { id: 'perdido', label: 'Perdido', subtitle: 'Arquivado' },
];

export default function MeusNegociosClient({
  negocios,
  gerentes,
  usuariosHierarquia,
  clientesDisponiveis,
  currentUser,
}: MeusNegociosClientProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isPendingMove, startTransition] = useTransition();

  // Modal Nova Oportunidade
  const [isNovaOportunidadeOpen, setIsNovaOportunidadeOpen] = useState(false);
  const [oportunidadeClienteId, setOportunidadeClienteId] = useState('');
  const [oportunidadeProduto, setOportunidadeProduto] = useState('imovel');
  const [oportunidadeCredito, setOportunidadeCredito] = useState(200000);
  const [oportunidadeTitulo, setOportunidadeTitulo] = useState('');
  const [isSubmittingOportunidade, setIsSubmittingOportunidade] = useState(false);
  const [oportunidadeFeedback, setOportunidadeFeedback] = useState<string | null>(null);

  // Modal Unificar Propostas
  const [isUnificarOpen, setIsUnificarOpen] = useState(false);
  const [unificarClienteId, setUnificarClienteId] = useState('');
  const [selectedNegocioIds, setSelectedNegocioIds] = useState<string[]>([]);
  const [valorUnificadoCustomizado, setValorUnificadoCustomizado] = useState<number | null>(null);
  const [usarMedia, setUsarMedia] = useState(true);
  const [tituloUnificadoCustomizado, setTituloUnificadoCustomizado] = useState('');
  const [isSubmittingUnificar, setIsSubmittingUnificar] = useState(false);
  const [unificarFeedback, setUnificarFeedback] = useState<string | null>(null);

  // Modal Fechar Negócio Unificado
  const [isFecharUnificadoOpen, setIsFecharUnificadoOpen] = useState(false);
  const [negocioParaFechar, setNegocioParaFechar] = useState<Negocio | null>(null);
  const [fecharValorEscolhido, setFecharValorEscolhido] = useState<number>(0);
  const [fecharPropostaIdEscolhida, setFecharPropostaIdEscolhida] = useState<string | null>(null);
  const [isSubmittingFechar, setIsSubmittingFechar] = useState(false);
  const [fecharFeedback, setFecharFeedback] = useState<string | null>(null);

  // Modal Visualizar Cenários Unificados
  const [cenariosModalNegocio, setCenariosModalNegocio] = useState<Negocio | null>(null);

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

  const listaClientes = useMemo(() => {
    if (clientesDisponiveis && clientesDisponiveis.length > 0) {
      return clientesDisponiveis;
    }
    return parceirosDisponiveis;
  }, [clientesDisponiveis, parceirosDisponiveis]);

  const handleCriarOportunidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oportunidadeClienteId) {
      setOportunidadeFeedback('Por favor, selecione um parceiro/cliente.');
      return;
    }
    if (!oportunidadeCredito || oportunidadeCredito <= 0) {
      setOportunidadeFeedback('Por favor, informe um valor de crédito válido.');
      return;
    }

    setIsSubmittingOportunidade(true);
    setOportunidadeFeedback(null);

    const formData = new FormData();
    formData.append('cliente_id', oportunidadeClienteId);
    formData.append('modalidade', oportunidadeProduto);
    formData.append('credito', oportunidadeCredito.toString());
    formData.append('etapa_funil', 'oportunidades');
    if (oportunidadeTitulo.trim()) {
      formData.append('titulo', oportunidadeTitulo.trim());
    }

    const res = await createNegocioManualAction({ success: false, message: null }, formData);
    setIsSubmittingOportunidade(false);

    if (res.success) {
      setIsNovaOportunidadeOpen(false);
      setOportunidadeClienteId('');
      setOportunidadeCredito(200000);
      setOportunidadeTitulo('');
      window.location.reload();
    } else {
      setOportunidadeFeedback(res.message || 'Erro ao criar oportunidade.');
    }
  };

  // Propostas disponíveis para o cliente selecionado no modal de unificação
  const propostasDoClienteUnificar = useMemo(() => {
    if (!unificarClienteId) return [];
    return negocios.filter(
      (n) => n.cliente_id === unificarClienteId && normalizeEtapa(n.etapa_funil) !== 'fechado_ganho' && normalizeEtapa(n.etapa_funil) !== 'perdido'
    );
  }, [negocios, unificarClienteId]);

  // Ao trocar o cliente no modal, pré-seleciona todos os negócios em aberto desse cliente
  useEffect(() => {
    if (unificarClienteId) {
      const items = negocios.filter(
        (n) => n.cliente_id === unificarClienteId && normalizeEtapa(n.etapa_funil) !== 'fechado_ganho' && normalizeEtapa(n.etapa_funil) !== 'perdido'
      );
      setSelectedNegocioIds(items.map((i) => i.id));
      setUsarMedia(true);
      setValorUnificadoCustomizado(null);
      setTituloUnificadoCustomizado('');
    } else {
      setSelectedNegocioIds([]);
    }
  }, [unificarClienteId, negocios]);

  const propostasSelecionadasUnificar = useMemo(() => {
    return propostasDoClienteUnificar.filter((n) => selectedNegocioIds.includes(n.id));
  }, [propostasDoClienteUnificar, selectedNegocioIds]);

  const valoresSelecionados = useMemo(() => {
    return propostasSelecionadasUnificar.map((n) => Number(n.credito || 0));
  }, [propostasSelecionadasUnificar]);

  const somaValoresSelecionados = useMemo(() => {
    return valoresSelecionados.reduce((acc, v) => acc + v, 0);
  }, [valoresSelecionados]);

  const mediaValoresSelecionados = useMemo(() => {
    if (valoresSelecionados.length === 0) return 0;
    return Math.round(somaValoresSelecionados / valoresSelecionados.length);
  }, [valoresSelecionados, somaValoresSelecionados]);

  const isDivergente = useMemo(() => {
    return new Set(valoresSelecionados).size > 1;
  }, [valoresSelecionados]);

  const handleUnificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unificarClienteId) {
      setUnificarFeedback('Por favor, selecione um parceiro/cliente.');
      return;
    }
    if (selectedNegocioIds.length < 2) {
      setUnificarFeedback('Selecione pelo menos 2 propostas para unificar.');
      return;
    }

    const valorFinal = usarMedia ? mediaValoresSelecionados : (valorUnificadoCustomizado || mediaValoresSelecionados);

    setIsSubmittingUnificar(true);
    setUnificarFeedback(null);

    try {
      const res = await unificarNegociosAction({
        clienteId: unificarClienteId,
        negocioIds: selectedNegocioIds,
        valorDefinido: valorFinal,
        tituloPersonalizado: tituloUnificadoCustomizado.trim() || undefined,
      });

      if (res.success) {
        setIsUnificarOpen(false);
        setUnificarClienteId('');
        setSelectedNegocioIds([]);
        window.location.reload();
      } else {
        setUnificarFeedback(res.message || 'Erro ao unificar propostas.');
      }
    } catch (err: any) {
      setUnificarFeedback(`Erro: ${err?.message || 'Falha ao processar unificação'}`);
    } finally {
      setIsSubmittingUnificar(false);
    }
  };

  const handleConfirmarFechamentoUnificado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negocioParaFechar) return;

    if (!fecharValorEscolhido || fecharValorEscolhido <= 0) {
      setFecharFeedback('Por favor, informe um valor de fechamento válido.');
      return;
    }

    setIsSubmittingFechar(true);
    setFecharFeedback(null);

    try {
      const res = await fecharNegocioUnificadoAction({
        negocioId: negocioParaFechar.id,
        valorFinal: fecharValorEscolhido,
        propostaFechadaId: fecharPropostaIdEscolhida || null,
      });

      if (res.success) {
        setIsFecharUnificadoOpen(false);
        setNegocioParaFechar(null);
        window.location.reload();
      } else {
        setFecharFeedback(res.message || 'Erro ao fechar negócio.');
      }
    } catch (err: any) {
      setFecharFeedback(`Erro: ${err?.message || 'Falha ao registrar fechamento'}`);
    } finally {
      setIsSubmittingFechar(false);
    }
  };

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
      const matchesEtapa = filterEtapa === 'all' || normalizeEtapa(n.etapa_funil) === filterEtapa;

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
    const norm = normalizeEtapa(id);
    return ETAPAS.find((e) => e.id === norm)?.label || id;
  };

  const getEtapaColor = (id: string) => {
    const norm = normalizeEtapa(id);
    if (norm === 'fechado_ganho') return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (norm === 'perdido') return 'bg-rose-50 text-rose-800 border-rose-300';
    if (norm === 'oportunidades') return 'bg-blue-50 text-blue-800 border-blue-300';
    if (norm === 'simulacao_criada') return 'bg-amber-50 text-amber-800 border-amber-300';
    if (norm === 'proposta_enviada') return 'bg-purple-50 text-purple-800 border-purple-300';
    if (norm === 'negociacao') return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    if (norm === 'pre_fechamento') return 'bg-teal-50 text-teal-800 border-teal-300';
    return 'bg-gray-50 text-gray-800 border-gray-300';
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
    .filter((n) => {
      const s = normalizeEtapa(n.etapa_funil);
      return s !== 'fechado_ganho' && s !== 'perdido';
    })
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const totalGanhos = filteredNegocios
    .filter((n) => normalizeEtapa(n.etapa_funil) === 'fechado_ganho')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const totalPerdidos = filteredNegocios
    .filter((n) => normalizeEtapa(n.etapa_funil) === 'perdido')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const diferencaFechadoPerdido = totalGanhos - totalPerdidos;
  const negociosAtivosCount = filteredNegocios.filter((n) => {
    const s = normalizeEtapa(n.etapa_funil);
    return s !== 'fechado_ganho' && s !== 'perdido';
  }).length;
  const negociosGanhosCount = filteredNegocios.filter((n) => normalizeEtapa(n.etapa_funil) === 'fechado_ganho').length;

  // Kanban - Agrupar negócios por etapa
  const negociosByStage: Record<string, Negocio[]> = useMemo(() => {
    const grouped: Record<string, Negocio[]> = {};
    ETAPAS.forEach((etapa) => {
      grouped[etapa.id] = filteredNegocios.filter((n) => normalizeEtapa(n.etapa_funil) === etapa.id);
    });
    return grouped;
  }, [filteredNegocios]);

  const handleMoveStage = async (negocio: Negocio, direction: 'prev' | 'next') => {
    const currentNorm = normalizeEtapa(negocio.etapa_funil);
    const currentIndex = ETAPAS.findIndex((e) => e.id === currentNorm);
    const nextIndex = currentIndex + (direction === 'next' ? 1 : -1);

    if (nextIndex >= 0 && nextIndex < ETAPAS.length) {
      const newStage = ETAPAS[nextIndex].id;
      if (newStage === 'fechado_ganho' && negocio.is_unificado) {
        setNegocioParaFechar(negocio);
        setFecharValorEscolhido(Number(negocio.credito || 0));
        setFecharPropostaIdEscolhida(negocio.proposta_fechada_id || negocio.proposta_id || null);
        setFecharFeedback(null);
        setIsFecharUnificadoOpen(true);
        return;
      }

      startTransition(async () => {
        const res = await updateNegocioStageAction(negocio.id, newStage, negocio.proposta_id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const handleDropdownMove = async (negocio: Negocio, newStage: string) => {
    if (newStage === 'fechado_ganho' && negocio.is_unificado) {
      setNegocioParaFechar(negocio);
      setFecharValorEscolhido(Number(negocio.credito || 0));
      setFecharPropostaIdEscolhida(negocio.proposta_fechada_id || negocio.proposta_id || null);
      setFecharFeedback(null);
      setIsFecharUnificadoOpen(true);
      return;
    }

    startTransition(async () => {
      const res = await updateNegocioStageAction(negocio.id, newStage, negocio.proposta_id);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  const [isPendingDelete, startDeleteTransition] = useTransition();

  const handleDeleteNegocio = (negocio: Negocio) => {
    const confirmMsg = `Tem certeza que deseja cancelar/excluir o negócio "${negocio.titulo}"?\n\nEsta ação apagará o registro e removerá o valor de ${formatCurrency(negocio.credito)} dos seus resultados e do CRM.`;
    if (window.confirm(confirmMsg)) {
      startDeleteTransition(async () => {
        const res = await deleteNegocioAction(negocio.id);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
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

          {/* Botão Nova Oportunidade */}
          <button
            onClick={() => {
              setIsNovaOportunidadeOpen(true);
              setOportunidadeFeedback(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00441F] px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-[#002E17] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#00CF7B]" />
            Nova Oportunidade
          </button>

          {/* Botão Unificar Propostas */}
          <button
            onClick={() => {
              setIsUnificarOpen(true);
              setUnificarFeedback(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#00441F]/20 bg-white px-4 py-2 text-sm font-bold text-[#00441F] shadow-xs hover:bg-emerald-50 hover:border-[#00CF7B] transition-all cursor-pointer"
            title="Unificar propostas e opções de um mesmo parceiro/cliente em uma negociação consolidada"
          >
            <GitMerge className="h-4 w-4 text-[#00CF7B]" />
            Unificar Propostas
          </button>

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
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#00441F] line-clamp-1">
                            {negocio.titulo}
                          </span>
                          {negocio.is_unificado && (
                            <button
                              type="button"
                              onClick={() => setCenariosModalNegocio(negocio)}
                              className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-black px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
                              title="Clique para ver os cenários unificados"
                            >
                              <GitMerge className="w-3 h-3 text-indigo-600" />
                              <span>{negocio.propostas_unificadas?.length || 2} Cenários</span>
                            </button>
                          )}
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
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-black text-[#00441F] text-base">
                            {formatCurrency(negocio.credito)}
                          </span>
                          {negocio.is_unificado && negocio.valor_medio && !negocio.valor_fechamento && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Valor calculado pela média">
                              (Média)
                            </span>
                          )}
                          {negocio.is_unificado && negocio.valor_fechamento && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Valor confirmado de fechamento">
                              (Fechado: {formatCurrency(negocio.valor_fechamento)})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#00441F]/80 font-bold uppercase tracking-wider mt-0.5">
                          {negocio.modalidade}{' '}
                          {negocio.administradora ? `• ${negocio.administradora}` : ''}
                        </div>
                      </td>

                      {/* Etapa do Funil com Seletor Rápido */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={normalizeEtapa(negocio.etapa_funil)}
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
                        {normalizeEtapa(negocio.etapa_funil) === 'oportunidades' && (
                          <Link
                            href={`/simulador?leadId=${negocio.cliente_id}&produto=${getProdutoParam(negocio)}&credito=${negocio.credito}&oportunidadeId=${negocio.id}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00CF7B] text-xs font-black text-white hover:bg-[#00441F] transition-colors shadow-xs"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Criar Simulação</span>
                          </Link>
                        )}
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
                        <button
                          onClick={() => handleDeleteNegocio(negocio)}
                          disabled={isPendingDelete || isPendingMove}
                          className="inline-flex items-center justify-center p-1.5 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-colors shadow-xs cursor-pointer disabled:opacity-40"
                          title="Cancelar / Excluir Negociação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                      {etapa.id === 'oportunidades' ? 'Nenhuma oportunidade / qualificação.' : 'Nenhum negócio nesta etapa.'}
                    </div>
                  ) : (
                    list.map((neg) => (
                      <div
                        key={neg.id}
                        className="bg-white border border-[#E0E5CF] rounded-xl p-4 shadow-xs hover:shadow-md hover:border-[#00CF7B] transition-all space-y-2.5"
                      >
                        {/* Badges de Topo: Modalidade & Administradora */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] bg-[#e9ebe4] text-[#00441F] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {neg.modalidade}
                            </span>
                            {neg.is_unificado && (
                              <button
                                type="button"
                                onClick={() => setCenariosModalNegocio(neg)}
                                className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-black px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer"
                                title="Ver todos os cenários/propostas unificadas"
                              >
                                <GitMerge className="w-3 h-3 text-indigo-600" />
                                <span>{neg.propostas_unificadas?.length || 2} Opções</span>
                              </button>
                            )}
                          </div>
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
                          {normalizeEtapa(neg.etapa_funil) === 'oportunidades' ? (
                            <Link
                              href={`/simulador?leadId=${neg.cliente_id}&produto=${getProdutoParam(neg)}&credito=${neg.credito}&oportunidadeId=${neg.id}`}
                              className="group/title block hover:bg-black/5 -mx-2 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Clique para abrir e criar simulação para esta oportunidade"
                            >
                              <div className="text-xs font-semibold text-[#00441F] group-hover/title:text-[#00CF7B] transition-colors line-clamp-1 flex items-center justify-between">
                                <span>{negocioFormatTitle(neg.titulo)}</span>
                                <span className="text-[10px] text-[#00CF7B] font-extrabold">Simular ⚡</span>
                              </div>
                              <div className="text-base font-black text-[#00441F] mt-0.5">
                                {formatCurrency(neg.credito)}
                              </div>
                            </Link>
                          ) : (
                            <>
                              <div className="text-xs font-medium text-gray-700 line-clamp-1">
                                {negocioFormatTitle(neg.titulo)}
                              </div>
                              <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-base font-black text-[#00441F]">
                                  {formatCurrency(neg.credito)}
                                </span>
                                {neg.is_unificado && neg.valor_medio && !neg.valor_fechamento && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Valor calculado pela média">
                                    Média
                                  </span>
                                )}
                                {neg.is_unificado && neg.valor_fechamento && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Valor confirmado de fechamento">
                                    Fechado
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Tag de Gerente Responsável (para liderança) */}
                        {isLeader && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00441F] bg-[#e9ebe4]/80 px-2 py-1 rounded-md">
                            <UserCheck className="w-3.5 h-3.5 text-[#00CF7B]" />
                            <span className="truncate">{neg.usuarios?.nome || 'Gerente do Time'}</span>
                          </div>
                        )}

                        {/* Botão de Destaque para Oportunidades: Criar Simulação */}
                        {normalizeEtapa(neg.etapa_funil) === 'oportunidades' && (
                          <Link
                            href={`/simulador?leadId=${neg.cliente_id}&produto=${getProdutoParam(neg)}&credito=${neg.credito}&oportunidadeId=${neg.id}`}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#00CF7B] hover:bg-[#00441F] text-white text-xs font-black shadow-xs transition-all text-center cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Criar Simulação</span>
                          </Link>
                        )}

                        {/* Botão de Fechamento de Negócio Unificado */}
                        {neg.is_unificado && normalizeEtapa(neg.etapa_funil) !== 'fechado_ganho' && normalizeEtapa(neg.etapa_funil) !== 'perdido' && (
                          <button
                            type="button"
                            onClick={() => {
                              setNegocioParaFechar(neg);
                              setFecharValorEscolhido(Number(neg.credito || 0));
                              setFecharPropostaIdEscolhida(neg.proposta_fechada_id || neg.proposta_id || null);
                              setFecharFeedback(null);
                              setIsFecharUnificadoOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-extrabold shadow-xs transition-all text-center cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>Definir Fechamento / Valor Final</span>
                          </button>
                        )}

                        {/* Rodapé do Card: Links e Excluir */}
                        <div className="flex gap-2 pt-1 items-center">
                          <Link
                            href={`/crm/${neg.cliente_id}`}
                            className="flex-1 text-center py-1.5 rounded-lg border border-[#E0E5CF] text-[11px] font-bold text-[#00441F] hover:bg-gray-50 transition-colors truncate"
                          >
                            Ver Parceiro
                          </Link>
                          {neg.proposta_id && (
                            <Link
                              href={`/propostas/${neg.proposta_id}`}
                              className="flex-1 text-center py-1.5 rounded-lg bg-[#00CF7B] text-white text-[11px] font-bold hover:bg-[#00441F] transition-colors truncate"
                            >
                              Ver Proposta
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteNegocio(neg)}
                            disabled={isPendingDelete || isPendingMove}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                            title="Cancelar / Excluir Negociação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Navegação Rápida de Etapa */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-2 gap-1.5">
                          <button
                            onClick={() => handleMoveStage(neg, 'prev')}
                            disabled={isPendingMove || normalizeEtapa(neg.etapa_funil) === ETAPAS[0].id}
                            className="p-1 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#00441F] disabled:opacity-30 cursor-pointer"
                            title="Mover para etapa anterior"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <select
                            value={normalizeEtapa(neg.etapa_funil)}
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
                              isPendingMove || normalizeEtapa(neg.etapa_funil) === ETAPAS[ETAPAS.length - 1].id
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

      {/* Modal Nova Oportunidade */}
      {isNovaOportunidadeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E5CF]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00CF7B]/20 text-[#00441F] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#00441F]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#00441F]">Nova Oportunidade</h2>
                  <p className="text-xs text-[#00441F]/70 font-medium">Cadastre um interesse de negócio para iniciar a esteira</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNovaOportunidadeOpen(false);
                  setOportunidadeFeedback(null);
                }}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#00441F]/70 hover:text-[#00441F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {oportunidadeFeedback && (
              <div className="mt-4 p-3 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs font-bold">
                {oportunidadeFeedback}
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleCriarOportunidade} className="mt-5 space-y-4">
              {/* Parceiro / Cliente */}
              <div>
                <label className="block text-xs font-extrabold text-[#00441F] uppercase tracking-wider mb-1.5">
                  1. Selecione o Parceiro / Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  value={oportunidadeClienteId}
                  onChange={(e) => setOportunidadeClienteId(e.target.value)}
                  required
                  className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#00441F] outline-none focus:ring-2 focus:ring-[#00CF7B]"
                >
                  <option value="">-- Escolha um parceiro cadastrado --</option>
                  {listaClientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {'telefone' in c && (c as any).telefone ? `(${(c as any).telefone})` : ''}
                    </option>
                  ))}
                </select>
                {listaClientes.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">
                    Nenhum parceiro encontrado. Cadastre um parceiro primeiro no menu Parceiros.
                  </p>
                )}
              </div>

              {/* Produto */}
              <div>
                <label className="block text-xs font-extrabold text-[#00441F] uppercase tracking-wider mb-1.5">
                  2. Produto de Interesse <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'imovel', label: 'Imóvel', icon: '🏠', val: 300000 },
                    { id: 'auto', label: 'Auto', icon: '🚗', val: 120000 },
                    { id: 'pesado', label: 'Pesados / Caminhão', icon: '🚛', val: 500000 },
                    { id: 'servico', label: 'Serviços', icon: '🔧', val: 50000 },
                    { id: 'moto', label: 'Moto', icon: '🏍️', val: 30000 },
                  ].map((p) => {
                    const selected = oportunidadeProduto === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setOportunidadeProduto(p.id);
                          if (oportunidadeCredito === 200000) {
                            setOportunidadeCredito(p.val);
                          }
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#00441F] border-[#00441F] text-white shadow-xs'
                            : 'bg-white border-[#E0E5CF] text-[#00441F] hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">{p.icon}</span>
                        <span className="text-xs font-bold leading-tight">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valor do Crédito */}
              <div>
                <label className="block text-xs font-extrabold text-[#00441F] uppercase tracking-wider mb-1.5">
                  3. Valor do Crédito Estimado (R$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#00441F]/60">
                    R$
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={oportunidadeCredito || ''}
                    onChange={(e) => setOportunidadeCredito(Number(e.target.value))}
                    placeholder="0,00"
                    required
                    className="w-full bg-white border border-[#E0E5CF] rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-black text-[#00441F] outline-none focus:ring-2 focus:ring-[#00CF7B]"
                  />
                </div>
                {/* Atalhos rápidos de valor */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 200000, 300000, 500000, 1000000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setOportunidadeCredito(v)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-[#E0E5CF] text-[#00441F] hover:bg-[#00CF7B]/20 transition-colors cursor-pointer"
                    >
                      {formatCurrency(v)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título Personalizado Opcional */}
              <div>
                <label className="block text-[11px] font-bold text-[#00441F]/80 uppercase tracking-wider mb-1">
                  Título Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  value={oportunidadeTitulo}
                  onChange={(e) => setOportunidadeTitulo(e.target.value)}
                  placeholder="Ex: Expansão de Frota / Compra de Imóvel Comercial"
                  className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3.5 py-2 text-xs text-[#00441F] outline-none focus:ring-2 focus:ring-[#00CF7B]"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-[#E0E5CF] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsNovaOportunidadeOpen(false);
                    setOportunidadeFeedback(null);
                  }}
                  disabled={isSubmittingOportunidade}
                  className="px-4 py-2 rounded-xl border border-[#E0E5CF] text-xs font-bold text-[#00441F] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOportunidade}
                  className="px-5 py-2 rounded-xl bg-[#00CF7B] text-white text-xs font-black shadow-xs hover:bg-[#00441F] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingOportunidade ? (
                    'Criando...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Criar Oportunidade
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UNIFICAR PROPOSTAS DO PARCEIRO/CLIENTE                           */}
      {/* ========================================================================= */}
      {isUnificarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E5CF]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <GitMerge className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#00441F]">Unificar Propostas de Negociação</h2>
                  <p className="text-xs text-[#00441F]/70 font-medium">
                    Consolide múltiplos cenários e valores de um mesmo parceiro em um único card no CRM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUnificarOpen(false);
                  setUnificarFeedback(null);
                }}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#00441F]/70 hover:text-[#00441F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {unificarFeedback && (
              <div className="mt-4 p-3 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs font-bold">
                {unificarFeedback}
              </div>
            )}

            <form onSubmit={handleUnificar} className="mt-5 space-y-5">
              {/* Passo 1: Selecionar Parceiro / Ponto de Venda */}
              <div>
                <label className="block text-xs font-extrabold text-[#00441F] uppercase tracking-wider mb-1.5">
                  1. Ponto de Venda / Parceiro <span className="text-red-500">*</span>
                </label>
                <select
                  value={unificarClienteId}
                  onChange={(e) => setUnificarClienteId(e.target.value)}
                  required
                  className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#00441F] outline-none focus:ring-2 focus:ring-[#00CF7B]"
                >
                  <option value="">-- Selecione o parceiro para buscar propostas --</option>
                  {listaClientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {'telefone' in c && (c as any).telefone ? `(${(c as any).telefone})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#00441F]/70 mt-1">
                  O sistema listará automaticamente todas as propostas e oportunidades ativas deste parceiro.
                </p>
              </div>

              {/* Passo 2: Listar e Selecionar Propostas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-[#00441F] uppercase tracking-wider">
                    2. Selecione as Propostas para Unificar ({selectedNegocioIds.length} selecionadas) <span className="text-red-500">*</span>
                  </label>
                  {propostasDoClienteUnificar.length > 0 && (
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedNegocioIds(propostasDoClienteUnificar.map((p) => p.id))}
                        className="font-bold text-indigo-700 hover:underline cursor-pointer"
                      >
                        Selecionar todas
                      </button>
                      <span className="text-gray-400">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedNegocioIds([])}
                        className="font-bold text-gray-600 hover:underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>

                {!unificarClienteId ? (
                  <div className="p-4 rounded-xl bg-white border border-[#E0E5CF] text-center text-xs text-gray-500">
                    Selecione um parceiro no campo acima para carregar as propostas.
                  </div>
                ) : propostasDoClienteUnificar.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs font-bold text-amber-800">
                    Nenhuma proposta ativa em aberto encontrada para este parceiro.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {propostasDoClienteUnificar.map((p) => {
                      const isSelected = selectedNegocioIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedNegocioIds(selectedNegocioIds.filter((id) => id !== p.id));
                            } else {
                              setSelectedNegocioIds([...selectedNegocioIds, p.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                              : 'bg-white border-[#E0E5CF] hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                            />
                            <div>
                              <div className="font-bold text-xs text-[#00441F]">{p.titulo}</div>
                              <div className="text-[11px] text-[#00441F]/70 flex items-center gap-2 mt-0.5">
                                <span className="uppercase font-semibold">{p.modalidade}</span>
                                {p.administradora && <span>• {p.administradora}</span>}
                                <span>• Etapa: {getEtapaLabel(p.etapa_funil)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-sm text-[#00441F]">
                              {formatCurrency(p.credito)}
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {formatDate(p.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Passo 3: Regra de Cálculo (Média em caso de divergência) */}
              {selectedNegocioIds.length >= 2 && (
                <div className="p-4 rounded-2xl bg-white border border-[#E0E5CF] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#00441F]">
                    <Calculator className="w-4 h-4 text-[#00CF7B]" />
                    <span>3. Cálculo do Valor Consolidado no Pipeline</span>
                  </div>

                  {isDivergente ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold">Valores divergentes identificados: </span>
                            {valoresSelecionados.map((v) => formatCurrency(v)).join(', ')}.
                            <p className="mt-1 text-[11px] text-amber-800">
                              Para não inflar o pipeline, o sistema calcula automaticamente o <strong>valor médio</strong> das propostas.
                              Ao fechar a negociação, você poderá escolher o valor original que foi contratado.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <label
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            usarMedia
                              ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="tipoValor"
                              checked={usarMedia}
                              onChange={() => {
                                setUsarMedia(true);
                                setValorUnificadoCustomizado(null);
                              }}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="text-xs font-black text-[#00441F]">Usar Valor Médio (Recomendado)</div>
                              <div className="text-[10px] text-gray-500">Média aritmética dos cenários</div>
                            </div>
                          </div>
                          <div className="font-black text-sm text-emerald-700">
                            {formatCurrency(mediaValoresSelecionados)}
                          </div>
                        </label>

                        <label
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            !usarMedia
                              ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="tipoValor"
                              checked={!usarMedia}
                              onChange={() => {
                                setUsarMedia(false);
                                setValorUnificadoCustomizado(mediaValoresSelecionados);
                              }}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="text-xs font-black text-[#00441F]">Valor Personalizado</div>
                              <div className="text-[10px] text-gray-500">Digitar outro valor manual</div>
                            </div>
                          </div>
                        </label>
                      </div>

                      {!usarMedia && (
                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-[#00441F] mb-1">
                            Valor Consolidado Desejado (R$):
                          </label>
                          <input
                            type="number"
                            min="1000"
                            step="1000"
                            value={valorUnificadoCustomizado || ''}
                            onChange={(e) => setValorUnificadoCustomizado(Number(e.target.value))}
                            placeholder="0,00"
                            required
                            className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3.5 py-2 text-xs font-black text-[#00441F] outline-none focus:ring-2 focus:ring-[#00CF7B]"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold">Todas as propostas possuem o mesmo valor:</span>
                          <div className="text-[11px] text-emerald-800">
                            Cenários diferentes (ex: linear vs degrau) para o mesmo crédito.
                          </div>
                        </div>
                      </div>
                      <span className="font-black text-sm text-emerald-800">
                        {formatCurrency(valoresSelecionados[0] || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Passo 4: Título Personalizado */}
              {selectedNegocioIds.length >= 2 && (
                <div>
                  <label className="block text-xs font-extrabold text-[#00441F] uppercase tracking-wider mb-1">
                    4. Nome / Título do Negócio Consolidado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={tituloUnificadoCustomizado}
                    onChange={(e) => setTituloUnificadoCustomizado(e.target.value)}
                    placeholder={`Ex: Propostas Consolidadas (${selectedNegocioIds.length} Cenários)`}
                    className="w-full bg-white border border-[#E0E5CF] rounded-xl px-3.5 py-2.5 text-xs text-[#00441F] outline-none focus:ring-2 focus:ring-[#00CF7B]"
                  />
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-[#E0E5CF] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUnificarOpen(false);
                    setUnificarFeedback(null);
                  }}
                  disabled={isSubmittingUnificar}
                  className="px-4 py-2 rounded-xl border border-[#E0E5CF] text-xs font-bold text-[#00441F] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedNegocioIds.length < 2 || isSubmittingUnificar}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-xs hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingUnificar ? (
                    'Unificando...'
                  ) : (
                    <>
                      <GitMerge className="w-4 h-4" />
                      Unificar {selectedNegocioIds.length} Propostas
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMAR FECHAMENTO DE NEGÓCIO UNIFICADO                        */}
      {/* ========================================================================= */}
      {isFecharUnificadoOpen && negocioParaFechar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E5CF]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#00441F]">Confirmar Fechamento (Ganho)</h2>
                  <p className="text-xs text-[#00441F]/70 font-medium">
                    Escolha qual proposta venceu ou defina o valor final fechado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFecharUnificadoOpen(false);
                  setNegocioParaFechar(null);
                  setFecharFeedback(null);
                }}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#00441F]/70 hover:text-[#00441F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {fecharFeedback && (
              <div className="mt-4 p-3 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs font-bold">
                {fecharFeedback}
              </div>
            )}

            <form onSubmit={handleConfirmarFechamentoUnificado} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed">
                Este negócio unificou múltiplos cenários para o cliente{' '}
                <strong>{negocioParaFechar.leads?.nome || 'Cliente'}</strong>. Selecione qual opção foi fechada de fato:
              </div>

              {/* Lista dos Cenários Unificados como Opções de Rádio */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-[#00441F] uppercase tracking-wider mb-1">
                  Selecione a Proposta / Valor Vencedor:
                </label>

                {Array.isArray(negocioParaFechar.propostas_unificadas) &&
                  negocioParaFechar.propostas_unificadas.map((item, idx) => {
                    const isSelected =
                      fecharValorEscolhido === Number(item.credito) &&
                      fecharPropostaIdEscolhida === (item.proposta_id || null);
                    return (
                      <label
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="cenarioVencedor"
                            checked={isSelected}
                            onChange={() => {
                              setFecharValorEscolhido(Number(item.credito));
                              setFecharPropostaIdEscolhida(item.proposta_id || null);
                            }}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="text-xs font-black text-[#00441F]">
                              {item.titulo || `Cenário ${idx + 1}`}
                            </div>
                            <div className="text-[11px] text-[#00441F]/70">
                              {item.modalidade} {item.administradora ? `• ${item.administradora}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-[#00441F]">
                            {formatCurrency(Number(item.credito))}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-semibold">Valor original</span>
                        </div>
                      </label>
                    );
                  })}

                {/* Opção Manter Valor Médio */}
                {negocioParaFechar.valor_medio && (
                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      fecharValorEscolhido === Number(negocioParaFechar.valor_medio) &&
                      fecharPropostaIdEscolhida === null
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="cenarioVencedor"
                        checked={
                          fecharValorEscolhido === Number(negocioParaFechar.valor_medio) &&
                          fecharPropostaIdEscolhida === null
                        }
                        onChange={() => {
                          setFecharValorEscolhido(Number(negocioParaFechar.valor_medio));
                          setFecharPropostaIdEscolhida(null);
                        }}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-black text-[#00441F]">Manter Valor Médio Consolidado</div>
                        <div className="text-[10px] text-gray-500">Valor já calculado na esteira</div>
                      </div>
                    </div>
                    <div className="font-black text-sm text-amber-700">
                      {formatCurrency(Number(negocioParaFechar.valor_medio))}
                    </div>
                  </label>
                )}
              </div>

              {/* Campo de confirmação/ajuste do valor numérico */}
              <div className="pt-2">
                <label className="block text-xs font-extrabold text-[#00441F] uppercase tracking-wider mb-1">
                  Valor Final de Fechamento Confirmado (R$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#00441F]/60">
                    R$
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={fecharValorEscolhido || ''}
                    onChange={(e) => setFecharValorEscolhido(Number(e.target.value))}
                    required
                    className="w-full bg-white border border-[#E0E5CF] rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-black text-[#00441F] outline-none focus:ring-2 focus:ring-[#00CF7B]"
                  />
                </div>
              </div>

              {/* Rodapé */}
              <div className="pt-3 border-t border-[#E0E5CF] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsFecharUnificadoOpen(false);
                    setNegocioParaFechar(null);
                    setFecharFeedback(null);
                  }}
                  disabled={isSubmittingFechar}
                  className="px-4 py-2 rounded-xl border border-[#E0E5CF] text-xs font-bold text-[#00441F] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!fecharValorEscolhido || fecharValorEscolhido <= 0 || isSubmittingFechar}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black shadow-xs hover:bg-emerald-800 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingFechar ? (
                    'Salvando Fechamento...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      Confirmar Fechado / Ganho
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VISUALIZAR CENÁRIOS DA NEGOCIAÇÃO UNIFICADA                      */}
      {/* ========================================================================= */}
      {cenariosModalNegocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E5CF]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <GitMerge className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#00441F]">Cenários da Negociação</h2>
                  <p className="text-xs text-[#00441F]/70 font-medium">
                    {cenariosModalNegocio.leads?.nome || 'Cliente'} • {cenariosModalNegocio.titulo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCenariosModalNegocio(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#00441F]/70 hover:text-[#00441F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* KPIs do Negócio Unificado */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-[#E0E5CF]">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Valor no Pipeline
                  </div>
                  <div className="text-sm font-black text-[#00441F] mt-0.5">
                    {formatCurrency(cenariosModalNegocio.credito)}
                  </div>
                </div>

                {cenariosModalNegocio.valor_medio && (
                  <div className="bg-white p-3 rounded-xl border border-[#E0E5CF]">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Média Original
                    </div>
                    <div className="text-sm font-black text-amber-700 mt-0.5">
                      {formatCurrency(cenariosModalNegocio.valor_medio)}
                    </div>
                  </div>
                )}

                <div className="bg-white p-3 rounded-xl border border-[#E0E5CF]">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Etapa Atual
                  </div>
                  <div className="text-xs font-black text-[#00441F] mt-1">
                    {getEtapaLabel(cenariosModalNegocio.etapa_funil)}
                  </div>
                </div>

                {cenariosModalNegocio.valor_fechamento && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300 col-span-2 sm:col-span-3">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Valor Final de Fechamento Contratado
                    </div>
                    <div className="text-base font-black text-emerald-900 mt-0.5">
                      {formatCurrency(cenariosModalNegocio.valor_fechamento)}
                    </div>
                  </div>
                )}
              </div>

              {/* Lista dos Cenários */}
              <div>
                <h3 className="text-xs font-black text-[#00441F] uppercase tracking-wider mb-2">
                  Propostas Consolidadas ({cenariosModalNegocio.propostas_unificadas?.length || 0} opções)
                </h3>

                <div className="space-y-2">
                  {cenariosModalNegocio.propostas_unificadas && cenariosModalNegocio.propostas_unificadas.length > 0 ? (
                    cenariosModalNegocio.propostas_unificadas.map((item, idx) => {
                      const isVencedor =
                        cenariosModalNegocio.proposta_fechada_id === item.proposta_id ||
                        (cenariosModalNegocio.valor_fechamento &&
                          Number(cenariosModalNegocio.valor_fechamento) === Number(item.credito));

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            isVencedor
                              ? 'bg-emerald-50 border-emerald-400'
                              : 'bg-white border-[#E0E5CF]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-[#00441F]">
                                {item.titulo || `Cenário ${idx + 1}`}
                              </span>
                              {isVencedor && (
                                <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                  Vencedora / Fechada
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#00441F]/70 flex items-center gap-2 mt-0.5">
                              <span className="uppercase font-semibold">{item.modalidade}</span>
                              {item.administradora && <span>• {item.administradora}</span>}
                              {item.etapa_funil && <span>• {getEtapaLabel(item.etapa_funil)}</span>}
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="font-black text-sm text-[#00441F]">
                              {formatCurrency(Number(item.credito))}
                            </span>
                            {item.proposta_id && (
                              <Link
                                href={`/propostas/${item.proposta_id}`}
                                className="text-[10px] font-bold text-indigo-700 hover:underline"
                              >
                                Ver Proposta →
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl bg-white border border-[#E0E5CF] text-center text-xs text-gray-500">
                      Nenhum histórico detalhado de propostas registrado.
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé */}
              <div className="pt-3 border-t border-[#E0E5CF] flex justify-end">
                <button
                  type="button"
                  onClick={() => setCenariosModalNegocio(null)}
                  className="px-5 py-2 rounded-xl bg-[#00441F] text-white text-xs font-bold hover:bg-[#00CF7B] transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function negocioFormatTitle(title: string) {
  if (!title) return 'Oportunidade';
  return title;
}
