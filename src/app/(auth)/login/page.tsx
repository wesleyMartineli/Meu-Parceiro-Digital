"use client";

import React, { useActionState, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, ActionState } from "@/modules/auth/actions";
import Logo from "@/components/Logo";

const initialState: ActionState = {
  success: false,
  message: null,
};

function LoginContent() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");

    if (errorParam) {
      switch (errorParam) {
        case "inactive_user":
          setErrorMessage(
            "Sua conta de usuário foi desativada. Entre em contato com seu administrador.",
          );
          break;
        case "company_suspended":
          setErrorMessage(
            "Sua empresa/representação está suspensa temporariamente. Entre em contato com o suporte.",
          );
          break;
        case "profile_not_found":
          setErrorMessage(
            "Erro de autenticação: perfil de usuário não configurado.",
          );
          break;
        case "auth_callback_failed":
          setErrorMessage(
            "O link de autenticação expirou ou é inválido. Tente novamente.",
          );
          break;
        default:
          setErrorMessage(
            "Ocorreu um erro ao validar sua sessão. Tente novamente.",
          );
      }
    }

    if (messageParam) {
      setInfoMessage(messageParam);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E0E5CF] text-[#00441F] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-[500px]">
        {/* Logo  Style */}
        <div className="flex justify-center mb-10">
          <Link href="/login" className="inline-block hover:opacity-95 transition-opacity">
            <Logo size="xxl" variant="dark" />
          </Link>
        </div>

        {/* Login Container */}
        <div className="bg-[#e9ebe4] px-8 py-10 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-xl border border-[#E0E5CF]">
          <div className="mb-8 text-center">
            <h2 className="text-[24px] font-bold tracking-tight text-[#00441F] leading-[1.4]">
              Entrar
            </h2>
            <p className="mt-2 text-[14px] text-[#00441F] font-semibold font-medium">
              Acesse sua conta para gerenciar sua operação
            </p>
          </div>

          {/* Mensagens de Sucesso ou Informações */}
          {infoMessage && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm font-medium text-green-800">
                {infoMessage}
              </p>
            </div>
          )}

          {/* Mensagens de Erro (Middleware ou Actions) */}
          {(errorMessage || (state.message && !state.success)) && (
            <div className="mb-6 rounded-lg bg-[#FFDAD6] p-4 border border-[#BA1A1A] animate-shake">
              <p className="text-sm font-medium text-[#93000A]">
                {errorMessage || state.message}
              </p>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-[12px] font-semibold tracking-[0.05em] text-[#00441F] uppercase mb-2"
              >
                E-mail corporativo
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@empresa.com.br"
                  className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 text-[14px] text-[#00441F] outline-none transition-all placeholder:text-[#99A0AF] focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[12px] font-semibold tracking-[0.05em] text-[#00441F] uppercase mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-4 py-3 pr-10 text-[14px] text-[#00441F] outline-none transition-all placeholder:text-[#99A0AF] focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#00441F] font-semibold hover:text-[#00441F] transition-colors focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                    )}
                    {!showPassword && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#E0E5CF] text-[#00CF7B] focus:ring-[#00CF7B] cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-[14px] text-[#00441F] cursor-pointer"
                >
                  Lembrar-me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-semibold text-[#00CF7B] hover:text-[#FF7A40] transition-colors"
                >
                  Esqueci minha senha
                </Link>
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
                {isPending ? "Autenticando..." : "Entrar na plataforma"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center w-full">
          <p className="text-[14px] text-[#00441F] font-semibold">
            Sem acesso? Solicite ao seu Regional Comercial.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
