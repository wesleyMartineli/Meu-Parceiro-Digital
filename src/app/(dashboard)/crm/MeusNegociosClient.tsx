'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { updateNegocioStageAction } from '@/modules/crm/actions';

interface GerenteNegocio {
  id: string;
  nome: string;
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
    nome: string;
    telefone: string | null;
  } | null;
  usuarios?: {
    nome: string;
  } | null;
}

interface MeusNegociosClientProps {
  negocios: Negocio[];
  gerentes: GerenteNegocio[];
  currentUser: {
    id: string;
    role: string;
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

export default function MeusNegociosClient({ negocios, gerentes, currentUser }: MeusNegociosClientProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isPendingMove, startTransition] = useTransition();

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGerente, setFilterGerente] = useState('all');
  const [filterEtapa, setFilterEtapa] = useState('all');
  const [filterAdministradora, setFilterAdministradora] = useState('all');
  const [filterProduto, setFilterProduto] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Filtros Dinâmicos gerados a partir da lista
  const administradorasDisponiveis = Array.from(new Set(negocios.map(n => n.administradora).filter(Boolean))) as string[];
  const produtosDisponiveis = Array.from(new Set(negocios.map(n => n.modalidade).filter(Boolean))) as string[];

  const filteredNegocios = negocios.filter((n) => {
    const nomeCliente = n.leads?.nome?.toLowerCase() || '';
    const telefone = n.leads?.telefone || '';
    const tituloNegocio = n.titulo?.toLowerCase() || '';
    const search = searchQuery.toLowerCase();
    
    const matchesSearch = nomeCliente.includes(search) || tituloNegocio.includes(search) || telefone.includes(search);
    const matchesGerenteNegocio = filterGerente === 'all' || n.vendedor_id === filterGerente;
    const matchesEtapa = filterEtapa === 'all' || n.etapa_funil === filterEtapa;
    const matchesAdministradora = filterAdministradora === 'all' || n.administradora === filterAdministradora;
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    let matchesProduto = true;
    if (filterProduto !== 'all') {
      const modNormalized = normalize(n.modalidade || '');
      if (filterProduto === 'Automóvel') {
        matchesProduto = modNormalized.includes('auto') || modNormalized.includes('veiculo');
      } else if (filterProduto === 'Imóvel') {
        matchesProduto = modNormalized.includes('imovel');
      } else if (filterProduto === 'Pesados') {
        matchesProduto = modNormalized.includes('pesado');
      } else if (filterProduto === 'Serviços') {
        matchesProduto = modNormalized.includes('servico');
      } else {
        matchesProduto = n.modalidade === filterProduto;
      }
    }

    let matchesDate = true;
    if (filterDateStart || filterDateEnd) {
      const negocioDate = new Date(n.created_at);
      
      if (filterDateStart) {
        const start = new Date(filterDateStart + "T00:00:00");
        if (negocioDate < start) matchesDate = false;
      }
      
      if (filterDateEnd) {
        const end = new Date(filterDateEnd + "T23:59:59");
        if (negocioDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesGerenteNegocio && matchesEtapa && matchesAdministradora && matchesProduto && matchesDate;
  });

  const getEtapaLabel = (id: string) => {
    return ETAPAS.find((e) => e.id === id)?.label || id;
  };

  const getEtapaColor = (id: string) => {
    if (id === 'ganho') return 'bg-green-50 text-green-700 border-green-200';
    if (id === 'perdido') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  // Indicadores (Cards Superiores)
  const totalEmNegociacao = filteredNegocios
    .filter(n => n.etapa_funil !== 'ganho' && n.etapa_funil !== 'perdido')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);
    
  const totalGanhos = filteredNegocios
    .filter(n => n.etapa_funil === 'ganho')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const totalPerdidos = filteredNegocios
    .filter(n => n.etapa_funil === 'perdido')
    .reduce((acc, curr) => acc + Number(curr.credito || 0), 0);

  const diferencaFechadoPerdido = totalGanhos - totalPerdidos;

  const negociosAtivosCount = filteredNegocios.filter(n => n.etapa_funil !== 'ganho' && n.etapa_funil !== 'perdido').length;

  // Kanban - Agrupar negócios por etapa (Somente se for Kanban e sem filtro de etapa global que esconda colunas)
  const negociosByStage: Record<string, Negocio[]> = {};
  ETAPAS.forEach((etapa) => {
    negociosByStage[etapa.id] = filteredNegocios.filter((n) => n.etapa_funil === etapa.id);
  });

  const handleMoveStage = async (negocio: Negocio, direction: 'prev' | 'next') => {
    const currentIndex = ETAPAS.findIndex((e) => e.id === negocio.etapa_funil);
    let nextIndex = currentIndex + (direction === 'next' ? 1 : -1);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00441F]">Meus Negócios</h1>
          <p className="text-sm text-[#00441F] font-semibold font-light mt-1">
            Acompanhe suas oportunidades de venda, propostas e histórico de negociações.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-[#E0E5CF]">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-[#e9ebe4] text-[#00441F] shadow-sm' : 'text-[#00441F] font-semibold hover:text-gray-700'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-[#e9ebe4] text-[#00441F] shadow-sm' : 'text-[#00441F] font-semibold hover:text-gray-700'
              }`}
            >
              Kanban
            </button>
          </div>

          <Link
            href="/simulador"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00CF7B] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#FF7A40] transition-all cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Negócio
          </Link>
        </div>
      </div>

      {/* Indicadores KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#e9ebe4] rounded-2xl p-6 border border-[#E0E5CF] shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider mb-2">Total em Negociação (Ativos)</h3>
          <div>
            <p className="text-2xl font-extrabold text-[#00441F]">{formatCurrency(totalEmNegociacao)}</p>
            <p className="text-xs text-[#00441F] font-semibold font-medium mt-1">{negociosAtivosCount} negócio(s) em aberto</p>
          </div>
        </div>
        <div className="bg-[#e9ebe4] rounded-2xl p-6 border border-[#E0E5CF] shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider mb-2">Total Fechado (Ganhos)</h3>
          <div>
            <p className="text-2xl font-extrabold text-green-600">{formatCurrency(totalGanhos)}</p>
            <p className="text-xs text-[#00441F] font-semibold font-medium mt-1">Negócios concluídos com sucesso</p>
          </div>
        </div>
        <div className="bg-[#e9ebe4] rounded-2xl p-6 border border-[#E0E5CF] shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider mb-2">Total Perdidos</h3>
          <div>
            <p className="text-2xl font-extrabold text-red-600">{formatCurrency(totalPerdidos)}</p>
            <p className="text-xs text-[#00441F] font-semibold font-medium mt-1">Negócios perdidos/arquivados</p>
          </div>
        </div>
        <div className="bg-[#e9ebe4] rounded-2xl p-6 border border-[#E0E5CF] shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider mb-2">Diferença (Ganho x Perdido)</h3>
          <div>
            <p className={`text-2xl font-extrabold ${diferencaFechadoPerdido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diferencaFechadoPerdido > 0 ? '+' : ''}{formatCurrency(diferencaFechadoPerdido)}
            </p>
            <p className="text-xs text-[#00441F] font-semibold font-medium mt-1">Balanço de conversão do funil</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Buscar Negócio</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome do cliente, telefone ou título..."
            className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2 text-sm outline-none placeholder:text-[#00441F] font-semibold focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
          />
        </div>

        {(currentUser.role === 'superintendente' || currentUser.role === 'master') && (
          <div className="w-40">
            <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Gerente de Negócios</label>
            <select
              value={filterGerente}
              onChange={(e) => setFilterGerente(e.target.value)}
              className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
            >
              <option value="all">Todos</option>
              {gerentes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="w-40">
          <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Administradora</label>
          <select
            value={filterAdministradora}
            onChange={(e) => setFilterAdministradora(e.target.value)}
            className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          >
            <option value="all">Todas</option>
            {administradorasDisponiveis.map((admin) => (
              <option key={admin} value={admin}>{admin}</option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Produto</label>
          <select
            value={filterProduto}
            onChange={(e) => setFilterProduto(e.target.value)}
            className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          >
            <option value="all">Todos</option>
            <option value="Automóvel">Automóvel</option>
            <option value="Imóvel">Imóvel</option>
            <option value="Pesados">Pesados</option>
            <option value="Serviços">Serviços</option>
          </select>
        </div>

        <div className="w-36">
          <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Criado De</label>
          <input
            type="date"
            value={filterDateStart}
            onChange={(e) => setFilterDateStart(e.target.value)}
            className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          />
        </div>
        <div className="w-36">
          <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Criado Até</label>
          <input
            type="date"
            value={filterDateEnd}
            onChange={(e) => setFilterDateEnd(e.target.value)}
            className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          />
        </div>

        {viewMode === 'table' && (
          <div className="w-48">
            <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Etapa do Funil</label>
            <select
              value={filterEtapa}
              onChange={(e) => setFilterEtapa(e.target.value)}
              className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
            >
              <option value="all">Todas</option>
              {ETAPAS.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {viewMode === 'table' ? (
        /* VISÃO TABELA (LISTA) */
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#00441F]">
              <thead className="bg-gray-50 border-b border-[#E0E5CF] text-xs uppercase text-[#00441F] font-semibold">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Negócio / Cliente</th>
                  <th className="px-6 py-4 whitespace-nowrap">Crédito</th>
                  <th className="px-6 py-4 whitespace-nowrap">Etapa / Funil</th>
                  <th className="px-6 py-4 whitespace-nowrap">Data</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E5CF]">
                {filteredNegocios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[#00441F] font-semibold font-light">
                      Nenhum negócio encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredNegocios.map((negocio) => (
                    <tr key={negocio.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-[#00441F] line-clamp-1">{negocio.titulo}</div>
                        <Link href={`/crm/${negocio.cliente_id}`} className="text-xs text-[#00441F] font-semibold mt-0.5 hover:text-[#00CF7B] hover:underline transition-colors block">
                          👤 {negocio.leads?.nome || 'Cliente não encontrado'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-[#00CF7B]">{formatCurrency(negocio.credito)}</div>
                        <div className="text-[11px] text-[#00441F] font-semibold font-medium mt-0.5 uppercase tracking-wider">
                          {negocio.modalidade} {negocio.administradora ? `- ${negocio.administradora}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={negocio.etapa_funil}
                          onChange={(e) => handleDropdownMove(negocio, e.target.value)}
                          disabled={isPendingMove}
                          className={`appearance-none inline-flex items-center px-2.5 py-1 rounded text-xs font-bold border capitalize outline-none cursor-pointer hover:opacity-80 transition-opacity ${getEtapaColor(negocio.etapa_funil)}`}
                        >
                          {ETAPAS.map((etapa) => (
                            <option key={etapa.id} value={etapa.id} className="text-[#00441F] bg-[#e9ebe4]">
                              {etapa.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[#00441F] font-semibold">{formatDate(negocio.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Link
                          href={`/crm/${negocio.cliente_id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#E0E5CF] text-xs font-bold text-[#00441F] font-semibold hover:bg-gray-100 transition-colors"
                        >
                          Ver Cliente
                        </Link>
                        {negocio.proposta_id && (
                          <Link
                            href={`/propostas/${negocio.proposta_id}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#00CF7B] text-xs font-bold text-white hover:bg-[#FF7A40] transition-colors"
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
        /* VISÃO KANBAN */
        <div className="flex gap-4 overflow-x-auto pb-6 items-start h-[calc(100vh-320px)] min-h-[450px] animate-fadeIn">
          {ETAPAS.map((etapa) => {
            const list = negociosByStage[etapa.id] || [];
            const totalCredito = list.reduce((acc, neg) => acc + Number(neg.credito || 0), 0);

            return (
              <div
                key={etapa.id}
                className="flex-shrink-0 w-80 bg-gray-50 border border-[#E0E5CF] rounded-2xl flex flex-col max-h-full"
              >
                {/* Header Coluna */}
                <div className="p-4 border-b border-[#E0E5CF] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#00441F]">{etapa.label}</h3>
                      <span className="text-[10px] text-[#00441F] font-semibold uppercase tracking-wider">{etapa.subtitle}</span>
                    </div>
                    <span className="h-5 px-2 rounded bg-gray-200/60 flex items-center justify-center text-xs font-bold text-[#00441F] font-semibold">
                      {list.length}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#00CF7B]">
                    {formatCurrency(totalCredito)}
                  </div>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {list.length === 0 ? (
                    <div className="border border-dashed border-[#E0E5CF] rounded-xl py-6 text-center text-xs text-[#00441F] font-semibold font-light">
                      Nenhum negócio.
                    </div>
                  ) : (
                    list.map((neg) => (
                      <div
                        key={neg.id}
                        className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#00CF7B]/40 transition-all group relative"
                      >
                        {/* Badge Modalidade */}
                        <div className="flex items-center justify-end mb-2">
                          <span className="text-[10px] bg-gray-100 text-[#00441F] font-semibold px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {neg.modalidade}
                          </span>
                        </div>

                        {/* Nome Cliente */}
                        <div className="font-bold text-sm text-[#00441F] leading-tight">
                          {neg.leads?.nome || 'Cliente Desconhecido'}
                        </div>
                        
                        {/* Crédito & Administradora */}
                        <div className="mt-1.5 flex flex-col gap-0.5">
                          <span className="text-sm font-extrabold text-[#00CF7B]">{formatCurrency(neg.credito)}</span>
                          {neg.administradora && (
                            <span className="text-xs text-[#00441F] font-semibold font-medium">🏢 {neg.administradora}</span>
                          )}
                        </div>
                        
                        {/* Data */}
                        <div className="mt-1 text-[11px] text-[#00441F] font-semibold">
                          Atualizado: {formatDate(neg.updated_at)}
                        </div>

                        {/* Links do Card */}
                        <div className="flex gap-2 mt-3 mb-1">
                          <Link
                            href={`/crm/${neg.cliente_id}`}
                            className="flex-1 text-center py-1.5 rounded-lg border border-[#E0E5CF] text-[10px] font-bold text-[#00441F] font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Ver Cliente
                          </Link>
                          {neg.proposta_id && (
                            <Link
                              href={`/propostas/${neg.proposta_id}`}
                              className="flex-1 text-center py-1.5 rounded-lg border border-[#00CF7B]/30 bg-[#00CF7B]/5 text-[10px] font-bold text-[#00CF7B] hover:bg-[#FF7A40]/10 transition-colors"
                            >
                              Ver Proposta
                            </Link>
                          )}
                        </div>

                        {/* Controle Rápido de Movimentação */}
                        <div className="flex items-center justify-between border-t border-[#E0E5CF] mt-2 pt-2 gap-2">
                          {/* Mover Esquerda */}
                          <button
                            onClick={() => handleMoveStage(neg, 'prev')}
                            disabled={isPendingMove || neg.etapa_funil === ETAPAS[0].id}
                            className="p-1 rounded bg-gray-50 hover:bg-gray-100 border border-[#E0E5CF] text-[#00441F] font-semibold disabled:opacity-40 disabled:hover:bg-gray-50 cursor-pointer transition-colors"
                            title="Mover para etapa anterior"
                          >
                            &larr;
                          </button>

                          {/* Mudar por Dropdown */}
                          <select
                            value={neg.etapa_funil}
                            disabled={isPendingMove}
                            onChange={(e) => handleDropdownMove(neg, e.target.value)}
                            className="text-[10px] bg-gray-50 border border-[#E0E5CF] rounded px-1.5 py-1 text-[#00441F] font-semibold outline-none w-full text-center"
                          >
                            {ETAPAS.map((et) => (
                              <option key={et.id} value={et.id}>
                                {et.label}
                              </option>
                            ))}
                          </select>

                          {/* Mover Direita */}
                          <button
                            onClick={() => handleMoveStage(neg, 'next')}
                            disabled={isPendingMove || neg.etapa_funil === ETAPAS[ETAPAS.length - 1].id}
                            className="p-1 rounded bg-gray-50 hover:bg-gray-100 border border-[#E0E5CF] text-[#00441F] font-semibold disabled:opacity-40 disabled:hover:bg-gray-50 cursor-pointer transition-colors"
                            title="Mover para próxima etapa"
                          >
                            &rarr;
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
