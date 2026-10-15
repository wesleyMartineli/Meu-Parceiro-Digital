'use client';

import React, { useState, useRef } from 'react';
import { LeadCandidate } from '@/modules/crm/taskParser';

interface QuickTaskBarProps {
  leads: LeadCandidate[];
  onOpenAssistant: (initialPrompt?: string) => void;
  onOpenCommercialAssistant?: () => void;
}

export default function QuickTaskBar({
  leads: _leads,
  onOpenAssistant,
  onOpenCommercialAssistant,
}: QuickTaskBarProps) {
  const [quickInput, setQuickInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) {
      onOpenAssistant();
      return;
    }
    onOpenAssistant(quickInput.trim());
    setQuickInput('');
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setQuickInput(text);
          onOpenAssistant(text);
        }
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#00441F]/90 to-[#00441F] rounded-2xl p-3 sm:p-4 text-white shadow-lg border border-[#00CF7B]/30 mb-8 transition-all hover:border-[#00CF7B]/60">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        
        {/* Ícone e Título Rápido */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#00CF7B]/20 border border-[#00CF7B]/30 flex items-center justify-center text-lg text-[#00CF7B] shadow-inner">
            ✨
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-extrabold text-[#00CF7B] uppercase tracking-wider block">Assistente IA</span>
            <span className="text-sm font-bold text-white">Criar Tarefa</span>
          </div>
        </div>

        {/* Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={
              isRecording
                ? 'Ouvindo sua voz... Fale o compromisso agora'
                : 'Ex: Ligar para [Parceiro] amanhã às 15h sobre proposta de consórcio...'
            }
            className={`w-full py-2.5 pl-4 pr-12 text-sm bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-gray-900 placeholder:text-white/60 focus:placeholder:text-gray-400 rounded-xl border border-white/20 focus:border-[#00CF7B] outline-none transition-all shadow-inner ${
              isRecording ? 'border-red-400 bg-red-950/30 ring-2 ring-red-400' : ''
            }`}
          />

          {/* Botão de Microfone no Input */}
          <button
            type="button"
            onClick={handleVoice}
            title={isRecording ? 'Parar gravação' : 'Falar comando de voz'}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-white/70 hover:text-white hover:bg-white/20'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>

        {/* Botão de Ação */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#00CF7B] hover:bg-[#00B56A] text-[#00441F] font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Interpretar</span>
            <span>➔</span>
          </button>

        </div>

      </form>
    </div>
  );
}
