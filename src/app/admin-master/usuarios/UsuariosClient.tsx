'use client';

import React, { useState, useTransition, useActionState } from 'react';
import { createUserAction, toggleUserStatusAction, deleteUserAction, UserActionState } from '@/modules/usuarios/actions';
import { impersonateUserAction } from '@/modules/auth/actions';
import ChangePasswordModal from './ChangePasswordModal';

interface User {
  id: string;
  nome: string;
  email: string;
  role: 'master' | 'platform_admin' | 'diretoria' | 'superintendente' | 'regional' | 'gerente_negocio';
  ativo: boolean;
  supervisor_id: string | null;
}

export default function UsuariosClient({ usuarios }: { usuarios: User[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createUserAction, { message: null, success: false });
  const [isPendingToggle, startTransition] = useTransition();

  // Filtros locais
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [passwordUser, setPasswordUser] = useState<{ id: string; nome: string } | null>(null);

  // Form states
  const [formRole, setFormRole] = useState<string>('gerente_negocio');
  const [formSupervisorId, setFormSupervisorId] = useState<string>('');

  const handleOpenModal = () => {
    setFormRole('gerente_negocio');
    setFormSupervisorId('');
    setIsOpen(true);
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    if (confirm(`Tem certeza que deseja ${currentStatus ? 'desativar' : 'ativar'} este usuário?`)) {
      startTransition(async () => {
        const res = await toggleUserStatusAction(userId, currentStatus);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('ATENÇÃO: Deseja excluir este usuário definitivamente do sistema? Esta ação não pode ser desfeita.')) {
      startTransition(async () => {
        const res = await deleteUserAction(userId);
        if (!res.success) {
          alert(res.message);
        }
      });
    }
  };

  const handleImpersonate = (userId: string) => {
    startTransition(async () => {
      const res = await impersonateUserAction(userId);
      if (res.success) {
        window.location.href = '/dashboard'; // Redirects and uses impersonation
      } else {
        alert(res.message);
      }
    });
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    return selectedRole === 'all' || usuario.role === selectedRole;
  });

  const getSupervisorName = (supervisorId: string | null) => {
    if (!supervisorId) return <span className="text-slate-500 font-light italic">Nenhum</span>;
    const supervisor = usuarios.find(u => u.id === supervisorId);
    return supervisor ? supervisor.nome : <span className="text-slate-500 font-light italic">Desconhecido</span>;
  };

  // Determinar opções de supervisor com base no cargo selecionado no formulário
  const getSupervisorOptions = (role: string) => {
    if (role === 'superintendente') return usuarios.filter(u => u.role === 'diretoria');
    if (role === 'regional') return usuarios.filter(u => u.role === 'superintendente');
    if (role === 'gerente_negocio') return usuarios.filter(u => u.role === 'regional');
    return []; // Para diretoria ou master, não exigiremos supervisor específico aqui (vincula ao criador ou fica nulo)
  };

  const supervisorOptions = getSupervisorOptions(formRole);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários Global (Administradora)</h1>
          <p className="text-sm text-slate-400 font-light mt-1">
            Gerenciamento geral da hierarquia de liderança e gerentes de negócio.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00CF7B] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#FF7A40] transition-all cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Adicionar Usuário
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Filtrar por Cargo</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00CF7B] w-64"
          >
            <option value="all">Todos os cargos</option>
            <option value="diretoria">Diretoria</option>
            <option value="superintendente">Superintendente</option>
            <option value="regional">Regional Comercial</option>
            <option value="gerente_negocio">Gerente de Negócios</option>
            <option value="platform_admin">Platform Admin</option>
          </select>
        </div>
      </div>

      {state.message && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold ${
            state.success ? 'bg-green-950/30 border-green-800 text-green-400' : 'bg-red-950/30 border-red-800 text-red-400'
          }`}
        >
          {state.message}
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">E-mail</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Cargo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Supervisor Direto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 font-light">
                    Nenhum usuário correspondente aos filtros foi localizado.
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                          {usuario.nome[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-white">{usuario.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-light whitespace-nowrap">{usuario.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          usuario.role === 'master' || usuario.role === 'platform_admin'
                            ? 'bg-red-950/40 border-red-900 text-red-400'
                            : usuario.role === 'diretoria'
                            ? 'bg-purple-950/40 border-purple-900 text-purple-400'
                            : usuario.role === 'superintendente'
                            ? 'bg-amber-950/40 border-amber-900 text-amber-400'
                            : usuario.role === 'regional'
                            ? 'bg-blue-950/40 border-blue-900 text-blue-400'
                            : 'bg-green-950/40 border-green-900 text-green-400'
                        }`}
                      >
                        {usuario.role === 'master' || usuario.role === 'platform_admin'
                          ? 'Administrador'
                          : usuario.role === 'diretoria'
                          ? 'Diretoria'
                          : usuario.role === 'superintendente'
                          ? 'Superintendente'
                          : usuario.role === 'regional'
                          ? 'Regional Comercial'
                          : 'Gerente de Negócios'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-semibold whitespace-nowrap">
                      {getSupervisorName(usuario.supervisor_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          usuario.ativo
                            ? 'bg-green-950/30 border-green-900 text-green-400'
                            : 'bg-red-950/30 border-red-900 text-red-400'
                        }`}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setPasswordUser({ id: usuario.id, nome: usuario.nome })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-transparent hover:bg-blue-950/30 text-blue-400 border-blue-900/50 cursor-pointer"
                        >
                          Senha
                        </button>
                        {usuario.role !== 'master' && usuario.role !== 'platform_admin' && (
                          <button
                            onClick={() => handleImpersonate(usuario.id)}
                            disabled={isPendingToggle}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-[#00CF7B]/10 hover:bg-[#00CF7B]/30 text-[#00CF7B] border-[#00CF7B]/50 cursor-pointer disabled:opacity-50"
                          >
                            Acessar
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(usuario.id, usuario.ativo)}
                          disabled={isPendingToggle}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            usuario.ativo
                              ? 'bg-transparent hover:bg-red-950/30 text-red-400 border-red-900/50'
                              : 'bg-transparent hover:bg-green-950/30 text-green-400 border-green-900/50'
                          } disabled:opacity-50`}
                        >
                          {usuario.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usuario.id)}
                          disabled={isPendingToggle}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-transparent hover:bg-red-900/50 text-red-500 border-red-900 cursor-pointer disabled:opacity-50"
                        >
                          Excluir
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

      {/* Modal Novo Usuário */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 relative text-slate-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-extrabold text-white mb-1">
              Adicionar Novo Membro
            </h3>
            <p className="text-xs text-slate-400 font-light mb-6">
              Preencha os dados e selecione corretamente a quem este usuário se reportará.
            </p>

            <form
              action={async (formData) => {
                formData.append('role', formRole);
                formData.append('supervisor_id', formSupervisorId);

                const res = await createUserAction(state, formData);
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nível de Acesso (Cargo)
                </label>
                <select
                  required
                  value={formRole}
                  onChange={(e) => {
                    setFormRole(e.target.value);
                    setFormSupervisorId(''); // Reseta o supervisor ao trocar de cargo
                  }}
                  className="block w-full mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-[#00CF7B]"
                >
                  <option value="diretoria">Diretoria</option>
                  <option value="superintendente">Superintendente</option>
                  <option value="regional">Regional Comercial</option>
                  <option value="gerente_negocio">Gerente de Negócios</option>
                </select>
              </div>

              {/* Lógica de Supervisor Obrigatório */}
              {formRole !== 'diretoria' && formRole !== 'master' && formRole !== 'platform_admin' && (
                <>
                  {supervisorOptions.length > 0 ? (
                    <div className="bg-[#00CF7B]/10 border border-[#00CF7B]/30 p-4 rounded-xl mt-4">
                      <label className="block text-xs font-semibold text-[#00CF7B] uppercase tracking-wider">
                        Líder Direto (Supervisor)
                      </label>
                      <select
                        required
                        value={formSupervisorId}
                        onChange={(e) => setFormSupervisorId(e.target.value)}
                        className="block w-full mt-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                      >
                        <option value="">Selecione quem será o líder...</option>
                        {supervisorOptions.map((sup: any) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.nome}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#00CF7B]/80 mt-2">
                        Este campo é obrigatório para manter a hierarquia da equipe.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-950/30 border border-red-900 p-4 rounded-xl mt-4 text-red-400">
                      <p className="text-sm font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        Nenhum líder superior disponível!
                      </p>
                      <p className="text-xs mt-1">
                        Para criar este cargo, você deve **primeiro cadastrar** um usuário do cargo superior. 
                        Crie de cima para baixo: Diretoria → Superintendente → Regional → Gerente de Negócios.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="pt-2 border-t border-slate-800 mt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dados do Usuário</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      name="nome"
                      required
                      placeholder="Ex: Júlio Neves"
                      className="block w-full mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      E-mail institucional
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="julio@dominio.com"
                      className="block w-full mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Senha Temporária
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Mínimo 8 caracteres"
                      className="block w-full mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-sm font-semibold text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || (formRole !== 'diretoria' && formRole !== 'master' && formRole !== 'platform_admin' && !formSupervisorId)}
                  className="px-4 py-2 rounded-xl bg-[#00CF7B] hover:bg-[#FF7A40] text-sm font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? 'Salvando...' : 'Salvar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ChangePasswordModal 
        isOpen={!!passwordUser} 
        onClose={() => setPasswordUser(null)} 
        usuario={passwordUser} 
      />
    </div>
  );
}
