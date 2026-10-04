'use client';

import React, { useRef, useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createFollowupAction } from '@/modules/crm/actions';

interface LeadOption {
  id: string;
  nome: string;
}

interface NovaTarefaModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: LeadOption[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#00CF7B] text-white font-bold py-3 rounded-lg hover:bg-[#E66E00] transition-colors disabled:opacity-50"
    >
      {pending ? 'Agendando...' : 'Agendar Tarefa'}
    </button>
  );
}

export default function NovaTarefaModal({ isOpen, onClose, leads }: NovaTarefaModalProps) {
  const [state, formAction] = useActionState(createFollowupAction, { success: false, message: '' });
  const formRef = useRef<HTMLFormElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredLeads = leads.filter(lead => 
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state?.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-[#e9ebe4] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slideUp">
        
        <div className="p-6 border-b border-[#E0E5CF] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#00441F]">Agendar Novo Acompanhamento</h2>
          <button onClick={onClose} className="text-[#00441F] font-semibold hover:text-[#00441F] font-semibold transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!state.success && state.message && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium border border-red-200">
              {state.message}
            </div>
          )}

          <form ref={formRef} action={formAction} className="space-y-5">
            {/* Cliente (Pesquisável) */}
            <div>
              <label htmlFor="lead_id" className="block text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider mb-1.5">
                Parceiro *
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* Input falso (visual) para busca */}
                <div 
                  className={`flex items-center w-full rounded-lg border px-4 py-2.5 text-sm bg-[#e9ebe4] transition-colors cursor-text ${isDropdownOpen ? 'border-[#00CF7B] ring-1 ring-[#00CF7B]' : 'border-[#E0E5CF]'}`}
                  onClick={() => setIsDropdownOpen(true)}
                >
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                      if (selectedLead && e.target.value !== selectedLead.nome) {
                        setSelectedLead(null);
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Busque pelo nome do parceiro..."
                    className="w-full outline-none bg-transparent"
                  />
                  <div className="text-[#00441F] font-semibold cursor-pointer">
                    <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Input real invisível que vai no form */}
                <input type="hidden" name="lead_id" value={selectedLead?.id || ''} />

                {/* Lista suspensa */}
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-[#e9ebe4] border border-[#E0E5CF] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map(lead => (
                        <div
                          key={lead.id}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-[#FFF4EC] hover:text-[#FF7A40] cursor-pointer"
                          onClick={() => {
                            setSelectedLead(lead);
                            setSearchTerm(lead.nome);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {lead.nome}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-[#00441F] font-semibold text-center">
                        Nenhum cliente encontrado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tipo de Tarefa */}
            <div>
              <label htmlFor="tipo" className="block text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider mb-1.5">
                Tipo da Ação *
              </label>
              <div className="relative">
                <select
                  id="tipo"
                  name="tipo"
                  required
                  defaultValue="ligacao"
                  className="w-full appearance-none rounded-lg border border-[#E0E5CF] px-4 py-2.5 text-sm outline-none focus:border-[#00CF7B] bg-[#e9ebe4] transition-colors cursor-pointer"
                >
                  <option value="ligacao">Ligação</option>
                  <option value="email">E-mail</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="reuniao">Reunião</option>
                  <option value="visita">Visita Presencial</option>
                  <option value="outros">Outros</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#00441F] font-semibold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Título */}
            <div>
              <label htmlFor="titulo" className="block text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider mb-1.5">
                Título da Ação *
              </label>
              <input
                id="titulo"
                name="titulo"
                type="text"
                placeholder="Ex: Ligar para apresentar proposta"
                required
                className="w-full rounded-lg border border-[#E0E5CF] px-4 py-2.5 text-sm outline-none focus:border-[#00CF7B] transition-colors"
              />
            </div>

            {/* Data e Hora */}
            <div>
              <label htmlFor="data_followup" className="block text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider mb-1.5">
                Data e Hora *
              </label>
              <input
                id="data_followup"
                name="data_followup"
                type="datetime-local"
                required
                className="w-full rounded-lg border border-[#E0E5CF] px-4 py-2.5 text-sm outline-none focus:border-[#00CF7B] transition-colors"
              />
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider mb-1.5">
                Descrição / Nota
              </label>
              <textarea
                id="descricao"
                name="descricao"
                placeholder="Alguma nota importante sobre a ligação ou compromisso..."
                rows={3}
                className="w-full rounded-lg border border-[#E0E5CF] px-4 py-2.5 text-sm outline-none focus:border-[#00CF7B] transition-colors resize-none"
              ></textarea>
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}

