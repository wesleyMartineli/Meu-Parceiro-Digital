"use client";

import React, { useActionState, Suspense } from "react";
import Link from "next/link";
import { submitLead, ActionState } from "@/modules/auth/actions";
import Logo from "@/components/Logo";

const initialState: ActionState = {
  success: false,
  message: null,
};

function RegisterContent() {
  const [state, formAction, isPending] = useActionState(submitLead, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E0E5CF] text-[#00441F] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/login" className="inline-block hover:opacity-95 transition-opacity">
            <Logo size="xl" variant="dark" />
          </Link>
        </div>

        {/* Register Container */}
        <div className="bg-[#e9ebe4] px-8 py-10 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-xl border border-[#E0E5CF]">
          <div className="mb-8 text-center">
            <h2 className="text-[24px] font-bold tracking-tight text-[#00441F] leading-[1.4]">
              Tenha controle da sua operação
            </h2>
            <p className="mt-2 text-[14px] text-[#00441F] font-semibold font-medium">
              Cadastre seus dados para um especialista entrar em contato
            </p>
          </div>

          {state.message && !state.success && (
            <div className="mb-6 rounded-lg bg-[#FFDAD6] p-4 border border-[#BA1A1A] animate-shake">
              <p className="text-sm font-medium text-[#93000A]">
                {state.message}
              </p>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="nome"
                  className="block text-[12px] font-semibold tracking-[0.05em] text-[#00441F] uppercase mb-2"
                >
                  Nome do Responsável *
                </label>
                <div className="relative">
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    placeholder="Ex: Wesley Souza"
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 text-[14px] text-[#00441F] outline-none transition-all placeholder:text-[#99A0AF] focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="nome_empresa"
                  className="block text-[12px] font-semibold tracking-[0.05em] text-[#00441F] uppercase mb-2"
                >
                  Nome da Empresa *
                </label>
                <div className="relative">
                  <input
                    id="nome_empresa"
                    name="nome_empresa"
                    type="text"
                    required
                    placeholder="Ex: Meu Parceiro Digital Representações"
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 text-[14px] text-[#00441F] outline-none transition-all placeholder:text-[#99A0AF] focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-[12px] font-semibold tracking-[0.05em] text-[#00441F] uppercase mb-2"
                >
                  E-mail corporativo *
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="contato@empresa.com.br"
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 text-[14px] text-[#00441F] outline-none transition-all placeholder:text-[#99A0AF] focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="telefone"
                  className="block text-[12px] font-semibold tracking-[0.05em] text-[#00441F] uppercase mb-2"
                >
                  Telefone
                </label>
                <div className="relative">
                  <input
                    id="telefone"
                    name="telefone"
                    type="text"
                    placeholder="(11) 99999-9999"
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 text-[14px] text-[#00441F] outline-none transition-all placeholder:text-[#99A0AF] focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center items-center rounded-lg bg-[#00CF7B] px-4 py-3 text-[12px] font-semibold tracking-[0.05em] uppercase text-white shadow-sm hover:bg-[#FF7A40] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00CF7B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : null}
                 {isPending ? "Enviando..." : "Enviar Informações"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center w-full">
          <p className="text-[14px] text-[#00441F] font-semibold">
            Já possui uma conta ativa?{" "}
            <Link
              href="/login"
              className="text-[12px] font-semibold tracking-[0.05em] uppercase text-[#00CF7B] hover:text-[#FF7A40] transition-colors ml-1"
            >
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#E0E5CF] text-[#00441F]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00CF7B] mx-auto"></div>
            <p className="mt-4 text-sm text-[#00441F] font-semibold font-medium">
              Carregando...
            </p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
