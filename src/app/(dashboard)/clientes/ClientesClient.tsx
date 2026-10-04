'use client';

import React, { useState, useTransition, useActionState } from 'react';
import Link from 'next/link';
import { createLeadAction, updateParceiroStageAction, CRMActionState } from '@/modules/crm/actions';
import { formatPhone } from '@/lib/utils';

interface GerenteNegocio {
  id: string;
  nome: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  observacoes: string | null;
  vendedor_id: string | null;
  created_at: string;
  usuarios?: {
    nome: string;
  } | null;
  valor_total: number;
  propostas_ativas: number;
  tipo_parceiro: 'base' | 'lead';
  etapa_funil?: string;
}

interface ClientesClientProps {
  clientes: Cliente[];
  gerentes: GerenteNegocio[];
  currentUser: {
    id: string;
    role: string;
  };
}

const initialState: CRMActionState = {
  success: false,
  message: null,
};

const ETAPAS_PARCEIROS = [
  { id: 'mapeado', label: 'Mapeado', subtitle: 'Lead' },
  { id: 'em_qualificacao', label: 'Em qualificação', subtitle: 'Lead' },
  { id: 'em_nomeacao', label: 'Em Nomeação', subtitle: 'Lead' },
  { id: 'base_gerando_oportunidades', label: 'Base Oportunidades', subtitle: 'Base' },
  { id: 'base_em_nutricao', label: 'Base em Nutrição', subtitle: 'Base' },
  { id: 'base_sem_oportunidades', label: 'Base sem Oportunidades', subtitle: 'Base' },
  { id: 'perdido', label: 'Perdido', subtitle: 'Inativo' },
  { id: 'inativo', label: 'Inativo', subtitle: 'Inativo' },
];

export default function ClientesClient({ clientes, gerentes, currentUser }: ClientesClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [isPendingMove, startTransition] = useTransition();
  const [tipoParceiro, setTipoParceiro] = useState<'base' | 'lead'>('base');
  const [state, formAction, isPending] = useActionState(createLeadAction, initialState);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGerente, setFilterGerente] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');

  const filteredClientes = clientes.filter((c) => {
    const matchesSearch = c.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.telefone && c.telefone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGerenteNegocio = filterGerente === 'all' || c.vendedor_id === filterGerente;
    const matchesTipo = filterTipo === 'all' || c.tipo_parceiro === filterTipo;

    return matchesSearch && matchesGerenteNegocio && matchesTipo;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  const getEtapaColor = (id: string) => {
    if (id === 'perdido' || id === 'inativo') return 'bg-red-50 text-red-700 border-red-200';
    if (id.startsWith('base')) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const clientesByStage: Record<string, Cliente[]> = {};
  ETAPAS_PARCEIROS.forEach((etapa) => {
    clientesByStage[etapa.id] = filteredClientes.filter((c) => c.etapa_funil === etapa.id);
  });

  const handleDropdownMove = async (cliente: Cliente, newStage: string) => {
    startTransition(async () => {
      const res = await updateParceiroStageAction(cliente.id, newStage);
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
          <h1 className="text-2xl font-bold text-[#00441F]">Meus Parceiros</h1>
          <p className="text-sm text-[#00441F] font-semibold font-light mt-1">
            Gerencie sua carteira de parceiros, veja o valor total negociado e acesse detalhes rápidos.
          </p>
        </div>
        <div className="flex gap-4 items-center">
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

          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00CF7B] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#FF7A40] transition-all cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Parceiro
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Buscar Parceiro</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome ou telefone..."
            className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2 text-sm outline-none placeholder:text-[#00441F] font-semibold focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
          />
        </div>

        <div className="w-48">
          <label className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider block mb-1.5">Tipo</label>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          >
            <option value="all">Todos os tipos</option>
            <option value="base">Parceiro Base</option>
            <option value="lead">Lead</option>
          </select>
        </div>

        {(currentUser.role === 'superintendente' || currentUser.role === 'master') && (
          <div className="w-52">
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
      </div>

      {state.message && (
        <div className={`p-4 rounded-xl border text-sm font-semibold ${state.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {state.message}
        </div>
      )}

      {/* Tabela ou Kanban */}
      {viewMode === 'table' ? (
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#00441F]">
            <thead className="bg-gray-50 border-b border-[#E0E5CF] text-xs uppercase text-[#00441F] font-semibold">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Parceiro</th>
                <th className="px-6 py-4 whitespace-nowrap">Tipo</th>
                <th className="px-6 py-4 whitespace-nowrap">Contato</th>
                <th className="px-6 py-4 whitespace-nowrap">Valor em Negociação</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5CF]">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#00441F] font-semibold font-light">
                    Nenhum parceiro encontrado.
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/crm/${cliente.id}`} className="font-bold text-[#00441F] hover:border-[#00CF7B]/30 transition-colors">
                        {cliente.nome}
                      </Link>
                      <div className="text-[11px] text-[#00441F] font-semibold mt-0.5">Criado em {formatDate(cliente.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        cliente.tipo_parceiro === 'base' ? 'bg-[#00CF7B]/10 text-[#00CF7B]' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cliente.tipo_parceiro === 'base' ? 'Base' : 'Lead'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[#00441F] font-semibold">{formatPhone(cliente.telefone) || '-'}</div>
                      {cliente.email && <div className="text-[11px] text-[#00441F] font-semibold mt-0.5">{cliente.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-extrabold text-[#00CF7B]">{formatCurrency(cliente.valor_total)}</div>
                      <div className="text-[11px] text-[#00441F] font-semibold font-medium mt-0.5">{cliente.propostas_ativas} negócio(s) ativo(s)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Link
                        href={`/crm/${cliente.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#E0E5CF] text-xs font-bold text-[#00441F] font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Perfil
                      </Link>
                      {cliente.tipo_parceiro === 'base' && (
                        <Link
                          href={`/simulador?lead=${cliente.id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#00CF7B] text-xs font-bold text-white hover:bg-[#FF7A40] transition-colors"
                        >
                          Nova Simulação
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
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {ETAPAS_PARCEIROS.map((etapa) => {
            const clientesNaEtapa = clientesByStage[etapa.id] || [];
            const isBase = etapa.id.startsWith('base');
            const totalValor = clientesNaEtapa.reduce((acc, curr) => acc + curr.valor_total, 0);

            return (
              <div
                key={etapa.id}
                className="flex-shrink-0 w-80 bg-[#e9ebe4] rounded-2xl border border-[#E0E5CF] flex flex-col max-h-[calc(100vh-250px)] snap-center"
              >
                <div className={`p-4 border-b border-[#E0E5CF] rounded-t-2xl ${isBase ? 'bg-[#00CF7B]/5' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-[#00441F]">{etapa.label}</h3>
                    <span className="bg-white text-[#00441F] text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {clientesNaEtapa.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] text-[#00441F] font-semibold">{etapa.subtitle}</p>
                    {isBase && <p className="text-xs font-extrabold text-[#00CF7B]">{formatCurrency(totalValor)}</p>}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {clientesNaEtapa.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="bg-white p-4 rounded-xl border border-[#E0E5CF] shadow-sm hover:border-[#00CF7B]/50 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/crm/${cliente.id}`} className="font-bold text-[#00441F] text-sm group-hover:text-[#00CF7B] transition-colors leading-tight">
                          {cliente.nome}
                        </Link>
                        <select
                          value={cliente.etapa_funil}
                          onChange={(e) => handleDropdownMove(cliente, e.target.value)}
                          disabled={isPendingMove}
                          className="text-[10px] bg-gray-50 border border-[#E0E5CF] text-[#00441F] font-bold rounded px-1 py-0.5 outline-none cursor-pointer max-w-[100px] truncate"
                        >
                          {ETAPAS_PARCEIROS.map((e) => (
                            <option key={e.id} value={e.id}>{e.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          cliente.tipo_parceiro === 'base' ? 'bg-[#00CF7B]/10 text-[#00CF7B]' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {cliente.tipo_parceiro === 'base' ? 'Base' : 'Lead'}
                        </span>
                        {cliente.telefone && (
                          <span className="text-[10px] text-[#00441F] font-semibold">
                            {formatPhone(cliente.telefone)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs font-extrabold text-[#00CF7B]">
                          {isBase ? formatCurrency(cliente.valor_total) : '-'}
                        </div>
                        {cliente.tipo_parceiro === 'base' && (
                          <Link
                            href={`/simulador?lead=${cliente.id}`}
                            className="text-[10px] font-bold text-white bg-[#00CF7B] hover:bg-[#FF7A40] px-2 py-1 rounded transition-colors"
                          >
                            Simular
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}

                  {clientesNaEtapa.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-[#00441F] font-semibold font-light">Nenhum parceiro nesta etapa.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Novo Cliente */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#00441F]/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl max-w-md w-full shadow-2xl p-6 relative text-[#00441F]">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[#00441F] font-semibold hover:text-[#00441F] font-semibold cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-extrabold mb-1">Cadastrar Novo Parceiro</h3>
            <p className="text-xs text-[#00441F] font-semibold font-light mb-4">
              Preencha os dados básicos do parceiro para iniciar o atendimento.
            </p>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setTipoParceiro('base')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${tipoParceiro === 'base' ? 'bg-white shadow text-[#00441F]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Parceiro Base
              </button>
              <button
                type="button"
                onClick={() => setTipoParceiro('lead')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${tipoParceiro === 'lead' ? 'bg-white shadow text-[#00441F]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Lead / Nomear
              </button>
            </div>

            <form
              action={async (formData) => {
                formData.append('tipo_parceiro', tipoParceiro);
                const res = await createLeadAction(state, formData);
                if (res.success) {
                  setIsOpen(false);
                  state.message = res.message;
                  state.success = true;
                } else {
                  alert(res.message);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">
                  {tipoParceiro === 'base' ? 'Nome da Representação *' : 'Nome da Empresa *'}
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder={tipoParceiro === 'base' ? "Ex: Representações ABC" : "Ex: Empresa XYZ"}
                  className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              {tipoParceiro === 'base' && (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Código PV</label>
                  <input
                    type="text"
                    name="codigo_pv"
                    placeholder="Ex: 123456"
                    className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Nome Responsável</label>
                <input
                  type="text"
                  name="nome_responsavel"
                  placeholder="Ex: Carlos Silva"
                  className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Contato</label>
                <input
                  type="tel"
                  name="telefone"
                  placeholder="Ex: (11) 98888-7777"
                  onChange={(e) => {
                    e.target.value = formatPhone(e.target.value);
                  }}
                  className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    placeholder="Ex: São Paulo"
                    className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Estado</label>
                  <input
                    type="text"
                    name="estado"
                    maxLength={2}
                    placeholder="Ex: SP"
                    className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B] uppercase"
                  />
                </div>
              </div>

              {(currentUser.role === 'superintendente' || currentUser.role === 'master') && (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Gerente de Negócios</label>
                  <select name="vendedor_id" className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm outline-none focus:border-[#00CF7B]">
                    <option value={currentUser.id}>Atribuir a mim</option>
                    {gerentes.filter(v => v.id !== currentUser.id).map((v) => (
                      <option key={v.id} value={v.id}>{v.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-[#E0E5CF] mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-[#00441F] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-[#00CF7B] hover:bg-[#FF7A40] text-sm font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? 'Gravando...' : 'Salvar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
