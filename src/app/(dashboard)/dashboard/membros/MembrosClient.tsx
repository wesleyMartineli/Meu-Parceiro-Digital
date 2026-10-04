'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { createUserAction, toggleUserStatusAction, UserActionState } from '@/modules/usuarios/actions';
import { impersonateUserAction } from '@/modules/auth/actions';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: 'master' | 'superintendente' | 'gerente_negocio';
  ativo: boolean;
  created_at: string;
}

interface MembrosClientProps {
  gerentes: User[];
  empresaId: string;
  planoInfo?: {
    nome: string;
    limite: number;
  } | null;
}

const initialState: UserActionState = {
  success: false,
  message: null,
};

export default function MembrosClient({ gerentes, empresaId, planoInfo }: MembrosClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);
  const [isPendingToggle, startTransition] = useTransition();
  const router = useRouter();

  const ativosCount = gerentes.filter(v => v.ativo).length;
  const isLimitReached = planoInfo ? ativosCount >= planoInfo.limite : false;

  const handleImpersonate = async (userId: string) => {
    startTransition(async () => {
      const res = await impersonateUserAction(userId);
      if (res.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (confirm(`Tem certeza que deseja ${currentStatus ? 'desativar' : 'ativar'} este gerente?`)) {
      startTransition(async () => {
        const res = await toggleUserStatusAction(userId, currentStatus);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00441F]">Gerenciamento de Equipe</h1>
          <p className="text-sm text-[#00441F] font-semibold font-light mt-1">
            Cadastre novos gerentes e ative/desative o acesso deles à plataforma.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {planoInfo && (
            <div className="text-right text-sm bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg">
              <p className="text-[#00441F] font-semibold font-medium">
                Plano <strong className="text-[#00CF7B]">{planoInfo.nome}</strong>
              </p>
              <p className={`text-xs mt-0.5 font-bold ${isLimitReached ? 'text-red-500' : 'text-[#00441F] font-semibold'}`}>
                {ativosCount} de {planoInfo.limite} Gerentes ativos
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (isLimitReached) {
                setShowLimitModal(true);
                return;
              }
              setIsOpen(true);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all cursor-pointer ${
              isLimitReached 
                ? 'bg-gray-400 hover:bg-gray-500' 
                : 'bg-[#00CF7B] hover:bg-[#FF7A40]'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adicionar Gerente de Negócios
          </button>
        </div>
      </div>

      {/* Erros e Sucessos Gerais do ActionState */}
      {state.message && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold ${
            state.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {state.message}
        </div>
      )}

      {/* Lista de Membros */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-[#E0E5CF]">
                <th className="px-6 py-4 text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider whitespace-nowrap">Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider whitespace-nowrap">E-mail</th>
                <th className="px-6 py-4 text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider whitespace-nowrap">Função</th>
                <th className="px-6 py-4 text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5CF]">
              {gerentes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#00441F] font-semibold font-light">
                    Nenhum gerente cadastrado ainda. Clique em &quot;Adicionar Gerente de Negócios&quot; para começar.
                  </td>
                </tr>
              ) : (
                gerentes.map((gerente) => (
                  <tr key={gerente.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#00CF7B]/10 flex items-center justify-center font-bold text-[#00CF7B] text-xs">
                          {gerente.nome[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-[#00441F]">{gerente.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#00441F] font-semibold font-light whitespace-nowrap">{gerente.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                        Gerente de Negócios
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          gerente.ativo
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                      >
                        {gerente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleImpersonate(gerente.id)}
                          disabled={isPendingToggle || !gerente.ativo}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer bg-[#e9ebe4] hover:bg-[#FF7A40]/10 text-[#00CF7B] border-[#00CF7B]/30 disabled:opacity-50"
                        >
                          Acessar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(gerente.id, gerente.ativo)}
                          disabled={isPendingToggle}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            gerente.ativo
                              ? 'bg-[#e9ebe4] hover:bg-red-50 text-red-600 border-red-200'
                              : 'bg-[#e9ebe4] hover:bg-green-50 text-green-600 border-green-200'
                          } disabled:opacity-50`}
                        >
                          {gerente.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Diálogo de Novo Gerente de Negócios */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#00441F]/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[#00441F] font-semibold hover:text-[#00441F] font-semibold cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-extrabold text-[#00441F] mb-1">Adicionar Novo Gerente de Negócios</h3>
            <p className="text-xs text-[#00441F] font-semibold font-light mb-6">
              Cadastre as credenciais do novo gerente. Ele poderá acessar a plataforma imediatamente.
            </p>

            <form
              action={async (formData) => {
                // Fechar modal no envio se der certo, ou manter aberto se falhar
                const res = await createUserAction(state, formData);
                if (res.success) {
                  setIsOpen(false);
                  // Reseta state local
                  state.message = res.message;
                  state.success = true;
                } else {
                  state.message = res.message;
                  state.success = false;
                }
              }}
              className="space-y-4"
            >
              <input type="hidden" name="empresa_id" value={empresaId} />
              <input type="hidden" name="role" value="gerente_negocio" />

              {state.message && !state.success && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg mb-4">
                  {state.message}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="Ex: Carlos Silva"
                  className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm text-[#00441F] outline-none transition-all placeholder:text-[#00441F] font-semibold focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">
                  E-mail institucional
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="carlos@empresa.com"
                  className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm text-[#00441F] outline-none transition-all placeholder:text-[#00441F] font-semibold focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">
                  Senha Temporária
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="block w-full mt-2 rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-2.5 text-sm text-[#00441F] outline-none transition-all placeholder:text-[#00441F] font-semibold focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>

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
                  {isPending ? 'Cadastrando...' : 'Salvar Gerente de Negócios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Limite Atingido */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-[#00441F]/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center relative">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-extrabold text-[#00441F] mb-2">Limite Atingido!</h3>
            
            <p className="text-sm text-[#00441F] font-semibold mb-6 leading-relaxed">
              O limite do seu plano <strong>{planoInfo?.nome}</strong> permite apenas <strong>{planoInfo?.limite}</strong> gerentes ativos. 
              <br/><br/>
              Para continuar expandindo sua equipe, por favor, contate o nosso suporte para realizar um upgrade.
            </p>
            
            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/5599999999999?text=Olá,%20gostaria%20de%20fazer%20um%20upgrade%20no%20meu%20plano!"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowLimitModal(false)}
                className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent bg-green-500 px-4 py-3 text-sm font-bold text-white hover:bg-green-600 transition-colors shadow-sm"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar com o Suporte
              </a>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full inline-flex justify-center items-center rounded-xl border border-gray-300 bg-[#e9ebe4] px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Entendi, voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
