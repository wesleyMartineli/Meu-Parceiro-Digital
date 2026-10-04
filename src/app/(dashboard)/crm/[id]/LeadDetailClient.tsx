'use client';

import React, { useState, useTransition, useActionState } from 'react';
import Link from 'next/link';
import { updateLeadAction, createFollowupAction, toggleFollowupStatusAction, appendObservationAction, CRMActionState } from '@/modules/crm/actions';
import { formatPhone } from '@/lib/utils';

interface GerenteNegocio {
  id: string;
  nome: string;
}

interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  etapa_funil: string;
  origem: string | null;
  observacoes: string | null;
  vendedor_id: string | null;
  usuarios?: {
    nome: string;
  } | null;
}

interface Followup {
  id: string;
  titulo: string;
  descricao: string | null;
  data_followup: string;
  status: string; // 'pendente', 'concluido'
}

interface Simulacao {
  id: string;
  produto: string;
  modalidade: string;
  credito_total: number;
  created_at: string;
}

interface Proposta {
  id: string;
  status: string;
  created_at: string;
  visualizacoes: number;
}

interface LeadDetailClientProps {
  lead: Lead;
  gerentes: GerenteNegocio[];
  followups: Followup[];
  simulacoes: Simulacao[];
  propostas: Proposta[];
  currentUser: {
    id: string;
    role: string;
  };
}

const ETAPAS = [
  { id: 'sem_contato', label: 'Sem Contato' },
  { id: 'contato_realizado', label: 'Contato Realizado' },
  { id: 'simulacao_apresentada', label: 'Simulação Apresentada' },
  { id: 'proposta_enviada', label: 'Proposta Enviada' },
  { id: 'ganho', label: 'Fechado / Ganho' },
  { id: 'perdido', label: 'Perdido' },
];

const ORIGENS = [
  { id: 'base_interna', label: 'Base Interna / Reativação' },
  { id: 'evento', label: 'Evento' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'google', label: 'Google' },
  { id: 'indicacao', label: 'Indicação' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'parceria_comercial', label: 'Parceria Comercial' },
  { id: 'presencial', label: 'Presencial' },
  { id: 'prospeccao_ativa', label: 'Prospecção Ativa' },
  { id: 'site', label: 'Site' },
  { id: 'trafego_pago', label: 'Tráfego Pago' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'outros', label: 'Outros' },
];

const initialLeadState: CRMActionState = { success: false, message: null };
const initialFollowupState: CRMActionState = { success: false, message: null };

export default function LeadDetailClient({
  lead,
  gerentes,
  followups,
  simulacoes,
  propostas,
  currentUser,
}: LeadDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'followups' | 'observacoes' | 'simulacoes'>('followups');
  const [isEditing, setIsEditing] = useState(false);

  const [leadState, updateLeadActionBound, isPendingLead] = useActionState(
    (prevState: CRMActionState, formData: FormData) => updateLeadAction(lead.id, prevState, formData),
    initialLeadState
  );

  const [followupState, createFollowupActionBound, isPendingFollowup] = useActionState(
    createFollowupAction,
    initialFollowupState
  );

  const [isPendingStatus, startTransition] = useTransition();

  const handleToggleFollowup = async (followupId: string, currentStatus: string) => {
    startTransition(async () => {
      const res = await toggleFollowupStatusAction(followupId, lead.id, currentStatus);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <div>
        <Link href="/crm" className="inline-flex items-center gap-2 text-xs font-bold text-[#00441F] font-semibold hover:text-gray-700">
          &larr; Voltar para o Funil de CRM
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Painel Esquerdo: Detalhes e Edição */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-4">
            <h2 className="text-lg font-extrabold text-[#00441F]">Perfil do Cliente</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-[#00CF7B] hover:underline cursor-pointer"
            >
              {isEditing ? 'Cancelar' : 'Editar Dados'}
            </button>
          </div>

          {leadState.message && (
            <div className={`p-3 rounded-xl border text-xs font-semibold ${leadState.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {leadState.message}
            </div>
          )}

          {!isEditing ? (
            /* Visualização Ficha Fria */
            <div className="space-y-4">
              <div>
                <span className="block text-[10px] text-[#00441F] font-semibold uppercase tracking-wider">Nome Completo</span>
                <p className="text-base font-bold text-[#00441F] mt-0.5">{lead.nome}</p>
              </div>

              <div>
                <span className="block text-[10px] text-[#00441F] font-semibold uppercase tracking-wider">Telefone</span>
                <p className="text-sm text-[#00441F] font-semibold mt-0.5">{formatPhone(lead.telefone) || 'Não preenchido'}</p>
              </div>

              <div>
                <span className="block text-[10px] text-[#00441F] font-semibold uppercase tracking-wider">E-mail</span>
                <p className="text-sm text-[#00441F] font-semibold mt-0.5">{lead.email || 'Não preenchido'}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <span className="block text-[10px] text-[#00441F] font-semibold uppercase tracking-wider">Origem</span>
                  <p className="text-xs text-[#00441F] font-semibold font-medium capitalize mt-1.5">{lead.origem || 'Não informada'}</p>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-[#00441F] font-semibold uppercase tracking-wider">Responsável</span>
                <p className="text-xs text-gray-700 font-bold mt-1">
                  👤 {lead.usuarios?.nome || 'Sem responsável atribuído'}
                </p>
              </div>
            </div>
          ) : (
            /* Formulário de Edição */
            <form
              action={async (formData) => {
                const res = await updateLeadAction(lead.id, leadState, formData);
                if (res.success) {
                  setIsEditing(false);
                  leadState.message = res.message;
                  leadState.success = true;
                } else {
                  alert(res.message);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Nome Completo *</label>
                <input
                  type="text"
                  name="nome"
                  required
                  defaultValue={lead.nome}
                  className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2 text-sm text-[#00441F] outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  defaultValue={lead.telefone || ''}
                  onChange={(e) => {
                    e.target.value = formatPhone(e.target.value);
                  }}
                  className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2 text-sm text-[#00441F] outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">E-mail</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={lead.email || ''}
                  className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2 text-sm text-[#00441F] outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Origem</label>
                  <select
                    name="origem"
                    defaultValue={lead.origem || 'outros'}
                    className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-2 py-2 text-sm text-[#00441F]"
                  >
                    {ORIGENS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Responsável (Somente Gerente/Admin pode reatribuir) */}
              {(currentUser.role === 'superintendente' || currentUser.role === 'master') && (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Atribuir a</label>
                  <select
                    name="vendedor_id"
                    defaultValue={lead.vendedor_id || ''}
                    className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-2 py-2 text-sm text-[#00441F]"
                  >
                    <option value="">Ninguém (Sem responsável)</option>
                    {gerentes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Observações</label>
                <textarea
                  name="observacoes"
                  rows={4}
                  defaultValue={lead.observacoes || ''}
                  className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#00441F] outline-none transition-all focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B] resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-[#E0E5CF]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-[#00441F] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPendingLead}
                  className="px-3.5 py-2 rounded-lg bg-[#00CF7B] hover:bg-[#FF7A40] text-xs font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPendingLead ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Painel Direito: Histórico, Follow-ups, Simulações e Propostas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navegação de Abas */}
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-2 flex gap-2 shadow-sm">
            <button
              onClick={() => setActiveTab('followups')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'followups' ? 'bg-[#00441F]/10 text-[#00CF7B]' : 'text-[#00441F] font-semibold hover:bg-gray-50'
              }`}
            >
              Follow-ups & Agendamento ({followups.length})
            </button>
            <button
              onClick={() => setActiveTab('observacoes')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'observacoes' ? 'bg-[#00441F]/10 text-[#00CF7B]' : 'text-[#00441F] font-semibold hover:bg-gray-50'
              }`}
            >
              Observações
            </button>
            <button
              onClick={() => setActiveTab('simulacoes')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'simulacoes' ? 'bg-[#00441F]/10 text-[#00CF7B]' : 'text-[#00441F] font-semibold hover:bg-gray-50'
              }`}
            >
              Simulações & Propostas ({simulacoes.length + propostas.length})
            </button>
          </div>

          {/* Aba Followups */}
          {activeTab === 'followups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Listagem de Acompanhamentos */}
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-md font-extrabold text-[#00441F]">Histórico de Interações</h3>
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                  {followups.length === 0 ? (
                    <p className="text-xs text-[#00441F] font-semibold font-light text-center py-8">
                      Nenhuma tarefa ou contato agendado para este lead.
                    </p>
                  ) : (
                    followups.map((task) => (
                      <div
                        key={task.id}
                        className={`border rounded-xl p-4 transition-all ${
                          task.status === 'concluido' ? 'bg-gray-50/50 border-[#E0E5CF]' : 'bg-[#e9ebe4] border-[#E0E5CF] hover:border-[#00CF7B]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={task.status === 'concluido'}
                              disabled={isPendingStatus}
                              onChange={() => handleToggleFollowup(task.id, task.status)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00CF7B] focus:ring-[#00CF7B] cursor-pointer"
                            />
                            <div>
                              <p className={`text-sm font-bold leading-tight ${task.status === 'concluido' ? 'text-[#00441F] font-semibold line-through' : 'text-[#00441F]'}`}>
                                {task.titulo}
                              </p>
                              {task.descricao && (
                                <p className="text-xs text-[#00441F] font-semibold font-light mt-1">{task.descricao}</p>
                              )}
                              <span className="inline-block text-[10px] text-[#00441F] font-semibold mt-2">
                                📅 {formatDate(task.data_followup)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form de Agendamento */}
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm">
                <h3 className="text-md font-extrabold text-[#00441F] mb-4">Agendar Novo Acompanhamento</h3>
                {followupState.message && (
                  <div className={`p-3 mb-4 rounded-xl border text-xs font-semibold ${followupState.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {followupState.message}
                  </div>
                )}
                <form action={createFollowupActionBound} className="space-y-4">
                  <input type="hidden" name="lead_id" value={lead.id} />

                  <div>
                    <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Tipo da Ação *</label>
                    <select
                      name="tipo"
                      required
                      defaultValue="ligacao"
                      className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2.5 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                    >
                      <option value="ligacao">Ligação</option>
                      <option value="email">E-mail</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="reuniao">Reunião</option>
                      <option value="visita">Visita Presencial</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Título da Ação *</label>
                    <input
                      type="text"
                      name="titulo"
                      required
                      placeholder="Ex: Ligar para apresentar proposta"
                      className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2.5 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Data e Hora *</label>
                    <input
                      type="datetime-local"
                      name="data_followup"
                      required
                      className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2.5 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Descrição / Nota</label>
                    <textarea
                      name="descricao"
                      rows={3}
                      placeholder="Alguma nota importante sobre a ligação ou compromisso..."
                      className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPendingFollowup}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#00CF7B] hover:bg-[#FF7A40] text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isPendingFollowup ? 'Registrando...' : 'Agendar Tarefa'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Aba Observações */}
          {activeTab === 'observacoes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Histórico de Observações */}
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-md font-extrabold text-[#00441F]">Histórico de Observações</h3>
                <div className="max-h-96 overflow-y-auto pr-2">
                  <p className="text-xs text-[#00441F] font-semibold font-light leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-[#E0E5CF]">
                    {lead.observacoes || 'Nenhuma observação registrada para este lead.'}
                  </p>
                </div>
              </div>

              {/* Formulário de Nova Observação */}
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-md font-extrabold text-[#00441F]">Adicionar Nova Observação</h3>
                <form
                  action={async (formData) => {
                    const res = await appendObservationAction({success:false, message:null}, formData);
                    if (res.success) {
                      const form = document.getElementById('obs-form') as HTMLFormElement;
                      if (form) form.reset();
                    } else {
                      alert(res.message);
                    }
                  }}
                  id="obs-form"
                  className="space-y-4"
                >
                  <input type="hidden" name="lead_id" value={lead.id} />
                  
                  <div>
                    <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Anotação</label>
                    <textarea
                      name="nova_observacao"
                      rows={4}
                      required
                      placeholder="Digite os detalhes da observação..."
                      className="block w-full mt-1.5 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3.5 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#00CF7B] hover:bg-[#FF7A40] text-sm font-bold text-white transition-all cursor-pointer"
                  >
                    Adicionar Observação
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Aba Simulações */}
          {activeTab === 'simulacoes' && (
            <div className="space-y-6">
              {/* Quadro Simulações */}
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-extrabold text-[#00441F]">Simulações Rodobens V1</h3>
                  <Link
                    href={`/simulador?lead=${lead.id}`}
                    className="text-xs font-bold text-[#00CF7B] hover:underline"
                  >
                    + Criar Simulação
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {simulacoes.length === 0 ? (
                    <div className="col-span-2 border border-dashed border-[#E0E5CF] rounded-2xl py-10 text-center text-xs text-[#00441F] font-semibold font-light">
                      Nenhuma simulação de cota calculada para este cliente.
                    </div>
                  ) : (
                    simulacoes.map((sim) => (
                      <div key={sim.id} className="border border-[#E0E5CF] rounded-xl p-4 bg-gray-50/30 flex justify-between items-start gap-4">
                        <div>
                          <p className="text-sm font-bold text-[#00441F] capitalize">{sim.produto} / {sim.modalidade}</p>
                          <p className="text-xs text-[#00441F] font-semibold font-light mt-0.5">Calculada em {formatDate(sim.created_at)}</p>
                          <span className="block text-md font-extrabold text-[#00CF7B] mt-2">
                            {formatCurrency(sim.credito_total)}
                          </span>
                        </div>
                        <Link
                          href={`/simulador/${sim.id}`}
                          className="px-2.5 py-1 rounded bg-[#e9ebe4] hover:bg-gray-50 text-[10px] font-bold border border-gray-200 text-gray-700"
                        >
                          Ver Detalhes
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quadro Propostas */}
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-md font-extrabold text-[#00441F]">Propostas de Alto Impacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {propostas.length === 0 ? (
                    <div className="col-span-2 border border-dashed border-[#E0E5CF] rounded-2xl py-10 text-center text-xs text-[#00441F] font-semibold font-light">
                      Nenhuma proposta comercial gerada para este cliente.
                    </div>
                  ) : (
                    propostas.map((prop) => (
                      <div key={prop.id} className="border border-[#E0E5CF] rounded-xl p-4 bg-gray-50/30 flex justify-between items-start gap-4">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                            prop.status === 'aprovada'
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : prop.status === 'recusada'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {prop.status}
                          </span>
                          <p className="text-xs text-[#00441F] font-semibold font-light mt-2">Gerada em {formatDate(prop.created_at)}</p>
                          <p className="text-[10px] text-[#00441F] font-semibold font-medium mt-1">👁️ {prop.visualizacoes} Visualizações</p>
                        </div>
                        <Link
                          href={`/propostas/${prop.id}`}
                          className="px-2.5 py-1 rounded bg-[#00CF7B] hover:bg-[#FF7A40] text-[10px] font-bold text-white"
                        >
                          Ver PDF / Link
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
