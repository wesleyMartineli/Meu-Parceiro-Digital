'use client';

import React, { useActionState } from 'react';
import { concluirPrimeiroAcessoAction, ActionState } from '@/modules/auth/actions';
import Logo from '@/components/Logo';

const initialState: ActionState = {
  success: false,
  message: null,
};

export default function PrimeiroAcessoPage() {
  const [state, formAction, isPending] = useActionState(concluirPrimeiroAcessoAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E0E5CF] px-4 py-12 sm:px-6 lg:px-8">
      {/* Glow de fundo sutil */}
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-[#00CF7B] opacity-5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-[#00441F] opacity-5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 bg-[#e9ebe4] p-8 rounded-xl border border-[#E0E5CF] shadow-sm relative z-10">
        <div className="text-center">
          <div className="inline-block hover:opacity-95 transition-opacity mb-4">
            <Logo size="xl" variant="dark" className="justify-center" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#00441F]">
            Bem-vindo ao Meu Parceiro Digital
          </h2>
          <p className="mt-2 text-sm text-[#00441F] font-semibold">
            Este é o seu primeiro acesso. Para garantir a segurança da sua conta, por favor, crie uma nova senha de acesso.
          </p>
        </div>

        {state.message && !state.success && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
            <p>{state.message}</p>
          </div>
        )}

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold tracking-wider text-[#00441F] font-semibold uppercase">
                Nova Senha
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 text-sm text-[#00441F] outline-none transition-all placeholder:text-[#00441F] font-semibold focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold tracking-wider text-[#00441F] font-semibold uppercase">
                Confirme a Nova Senha
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 text-sm text-[#00441F] outline-none transition-all placeholder:text-[#00441F] font-semibold focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center items-center rounded-lg bg-[#00CF7B] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#FF7A40] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00CF7B] transition-all disabled:opacity-50 hover:shadow-lg"
            >
              {isPending ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              {isPending ? 'Salvando...' : 'Salvar Senha e Acessar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
