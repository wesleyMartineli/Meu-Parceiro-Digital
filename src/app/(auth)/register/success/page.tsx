"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function RegisterSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E0E5CF] text-[#00441F] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/login" className="inline-block hover:opacity-95 transition-opacity">
            <Logo size="xl" variant="dark" />
          </Link>
        </div>

        {/* Success Container */}
        <div className="bg-[#e9ebe4] px-8 py-10 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-xl border border-[#E0E5CF] text-center animate-fadeIn">
          {/* Success Check Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-6">
            <svg
              className="h-8 w-8 text-gray-900"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <h2 className="text-[24px] font-bold tracking-tight text-[#00441F] leading-[1.4] mb-3">
            Informações Recebidas!
          </h2>
          
          <p className="text-[14px] text-[#00441F] font-semibold font-medium leading-relaxed mb-8">
            Agradecemos o seu interesse. Seus dados foram enviados com sucesso! 
            Logo mais um de nossos especialistas entrará em contato para liberar o seu acesso à plataforma.
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              className="flex w-full justify-center items-center rounded-lg bg-[#00CF7B] px-4 py-3 text-[12px] font-semibold tracking-[0.05em] uppercase text-white shadow-sm hover:bg-[#FF7A40] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00CF7B] transition-all"
            >
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
