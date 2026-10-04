"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { aceitarTermosAction } from '@/modules/usuarios/actions';

export default function LegalFooter() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('meuparceirodigital_legal_accepted');
    if (!hasAccepted) {
      setAccepted(false);
    }
  }, []);

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#e9ebe4] border-t border-gray-200 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] p-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-[10px] text-[#00441F] font-semibold leading-snug">
          <p>
            <strong>Aviso Legal:</strong> Esta plataforma é uma ferramenta independente de simulação. Não comercializamos cotas, não garantimos contemplações e não representamos oficialmente nenhuma administradora. Os valores apresentados são estimativas e devem ser confirmados nas condições oficiais. A responsabilidade pelo uso da ferramenta é do usuário.
          </p>
          <div className="flex items-center gap-3 mt-1.5 font-semibold text-[#00CF7B]">
            <Link href="/termos-de-uso" target="_blank" className="hover:underline">Termos de Uso</Link>
            <span className="text-gray-300">|</span>
            <Link href="/politica-de-privacidade" target="_blank" className="hover:underline">Política de Privacidade</Link>
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <button
            onClick={async () => {
              // Salva localmente primeiro para esconder o banner imediatamente
              localStorage.setItem('meuparceirodigital_legal_accepted', 'true');
              setAccepted(true);
              // Chama a server action para registrar no banco de dados (async)
              try {
                await aceitarTermosAction();
              } catch (e) {
                console.error("Erro ao gravar aceite no log:", e);
              }
            }}
            className="w-full md:w-auto px-8 py-2.5 bg-[#00CF7B] hover:bg-[#FF7A40] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Ciente e Aceito
          </button>
        </div>
      </div>
    </div>
  );
}
