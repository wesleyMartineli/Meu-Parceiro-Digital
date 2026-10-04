'use client';

import React, { useTransition } from 'react';
import { stopImpersonatingAction } from '@/modules/auth/actions';
import { useRouter } from 'next/navigation';

interface ImpersonationBannerProps {
  impersonatedName: string;
}

export default function ImpersonationBanner({ impersonatedName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStop = () => {
    startTransition(async () => {
      await stopImpersonatingAction();
      router.push('/dashboard/membros');
      router.refresh();
    });
  };

  return (
    <div className="bg-[#00441F] text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 z-50 relative shadow-md w-full">
      <span className="text-xs font-semibold text-center">
        Modo Simulação: Você está visualizando o sistema como <strong>{impersonatedName}</strong>.
      </span>
      <button
        onClick={handleStop}
        disabled={isPending}
        className="px-3 py-1 bg-[#e9ebe4] text-[#00441F] text-xs font-bold rounded hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
      >
        {isPending ? 'Saindo...' : 'Encerrar e Voltar'}
      </button>
    </div>
  );
}
