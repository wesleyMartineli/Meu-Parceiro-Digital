'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { 
  parseNaturalLanguageTask, 
  LeadCandidate, 
  FollowupTipo, 
  ParsedTaskResult 
} from '@/modules/crm/taskParser';
import { createFollowupDirectAction } from '@/modules/crm/actions';

interface AgendaAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leads: LeadCandidate[];
  onTaskCreated?: (task: any) => void;
  initialPrompt?: string;
}

const TIPO_OPTIONS: { id: FollowupTipo; label: string; icon: string }[] = [
  { id: 'ligacao', label: 'Ligação', icon: '📞' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'reuniao_online', label: 'Reunião Online', icon: '💻' },
  { id: 'reuniao_presencial', label: 'Reunião Presencial', icon: '👥' },
  { id: 'email', label: 'E-mail', icon: '✉️' },
  { id: 'outros', label: 'Outros', icon: '📌' },
];

export default function AgendaAssistantDrawer({
  isOpen,
  onClose,
  leads,
  onTaskCreated,
  initialPrompt = '',
}: AgendaAssistantDrawerProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [parsedResult, setParsedResult] = useState<ParsedTaskResult | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [tipo, setTipo] = useState<FollowupTipo>('ligacao');
  const [dataFollowup, setDataFollowup] = useState<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Inicializa quando abre ou muda initialPrompt
  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        setPrompt(initialPrompt);
        handleAnalyze(initialPrompt);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    } else {
      setSuccessMessage(null);
      setErrorMessage(null);
      if (isRecording) {
        stopVoiceRecording();
      }
    }
  }, [isOpen, initialPrompt]);

  // Executa o parser quando o usuário analisa uma frase
  const handleAnalyze = (textToAnalyze?: string) => {
    const text = (textToAnalyze !== undefined ? textToAnalyze : prompt).trim();
    if (!text) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const result = parseNaturalLanguageTask(text, leads);
    setParsedResult(result);

    setSelectedLeadId(result.matchedLead?.id || (result.candidateLeads[0]?.id || (leads[0]?.id || '')));
    setTitulo(result.titulo);
    setDescricao(result.descricao);
    setTipo(result.tipo);
    setDataFollowup(result.dataFollowupIso);
  };

  // Suporte a Transcrição de Áudio (Web Speech API)
  const startVoiceRecording = () => {
    setRecordingError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecordingError('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setPrompt(transcript);
          handleAnalyze(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event);
        setIsRecording(false);
        setRecordingError('Não conseguimos ouvir com clareza. Tente novamente ou digite.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsRecording(false);
      setRecordingError('Erro ao iniciar microfone: ' + err.message);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Confirmar e agendar a tarefa no Supabase
  const handleConfirmTask = () => {
    if (!selectedLeadId) {
      setErrorMessage('Por favor, selecione um parceiro/lead para a tarefa.');
      return;
    }
    if (!titulo.trim()) {
      setErrorMessage('O título da tarefa não pode estar vazio.');
      return;
    }
    if (!dataFollowup) {
      setErrorMessage('A data e horário são obrigatórios.');
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await createFollowupDirectAction({
        leadId: selectedLeadId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        dataFollowup: new Date(dataFollowup).toISOString(),
        tipo,
      });

      if (res.success) {
        setSuccessMessage('Tarefa agendada com sucesso!');
        if (onTaskCreated && res.followup) {
          onTaskCreated(res.followup);
        }
        // Limpar após 1.2s e fechar
        setTimeout(() => {
          setPrompt('');
          setParsedResult(null);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Erro ao agendar tarefa.');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F4F6F0] shadow-2xl flex flex-col border-l border-[#E0E5CF] animate-slideLeft">
          
          {/* Header do Drawer */}
          <div className="p-6 bg-[#00441F] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00CF7B]/20 flex items-center justify-center text-xl text-[#00CF7B] shadow-inner">
                ✨
              </div>
              <div>
                <h2 className="text-lg font-bold">Assistente de Agenda</h2>
                <p className="text-xs text-[#00CF7B]">Agendamento inteligente em linguagem natural</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo com Scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Mensagens de Sucesso ou Erro */}
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-semibold animate-fadeIn">
                <span className="text-lg">✅</span>
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm font-semibold animate-fadeIn">
                <span className="text-lg">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Área de Entrada (Prompt) */}
            <div className="bg-[#e9ebe4] p-5 rounded-2xl border border-[#E0E5CF] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#00441F] uppercase tracking-wider">
                  O que você deseja agendar?
                </label>
                {isRecording && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-600"></span>
                    Gravando voz...
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                  rows={3}
                  placeholder='Ex: "Ligar para Carlos amanhã às 14h para apresentar a proposta de 200k"'
                  className="w-full p-3 pr-12 text-sm bg-gray-50 border border-[#E0E5CF] rounded-xl outline-none focus:border-[#00CF7B] focus:bg-[#e9ebe4] transition-all resize-none text-gray-800 placeholder-gray-400"
                />

                {/* Botão de Microfone */}
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  title={isRecording ? 'Parar gravação' : 'Falar por áudio'}
                  className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-bounce' 
                      : 'text-[#00441F] hover:bg-[#00441F]/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>

              {recordingError && (
                <p className="text-xs text-red-600 font-medium">{recordingError}</p>
              )}

              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={!prompt.trim()}
                className="w-full py-2.5 px-4 bg-[#00441F] text-white font-bold text-sm rounded-xl hover:bg-[#003317] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Processar com Assistente</span>
                <span>✨</span>
              </button>
            </div>

            {/* Exemplos Rápidos (Chips) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sugestões de comandos:</p>
              <div className="flex flex-col gap-2">
                {[
                  'Ligar amanhã às 14h para apresentar proposta de consórcio',
                  'Reunião na sexta às 10h para alinhar lance embutido',
                  'Mandar WhatsApp hoje às 17h solicitando documentos',
                  'Visita presencial na segunda às 09:30',
                ].map((sugestao, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(sugestao);
                      handleAnalyze(sugestao);
                    }}
                    className="text-left text-xs bg-[#e9ebe4] hover:bg-[#E0E5CF]/40 text-gray-700 p-2.5 rounded-xl border border-[#E0E5CF] transition-colors flex items-center gap-2 group cursor-pointer"
                  >
                    <span className="text-[#00CF7B] group-hover:scale-125 transition-transform">⚡</span>
                    <span className="truncate">{sugestao}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card de Pré-visualização da Tarefa Identificada */}
            {parsedResult && (
              <div className="bg-[#e9ebe4] p-5 rounded-2xl border-2 border-[#00CF7B]/60 shadow-md space-y-4 animate-slideUp">
                <div className="flex items-center justify-between pb-3 border-b border-[#E0E5CF]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00441F] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#00CF7B]"></span>
                    Tarefa Estruturada
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#00441F]/10 text-[#00441F]">
                    {Math.round(parsedResult.confidence * 100)}% precisão
                  </span>
                </div>

                {/* Seleção do Lead */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Parceiro / Lead:
                  </label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-[#E0E5CF] rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-[#00CF7B]"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                  {parsedResult.matchedLead ? (
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                      <span>✓</span> Reconhecido automaticamente: <strong>{parsedResult.matchedLead.nome}</strong>
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      ⚠️ Selecione o parceiro desejado na lista acima.
                    </p>
                  )}
                </div>

                {/* Tipo de Ação */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Tipo de Contato:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPO_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipo(t.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          tipo === t.id
                            ? 'bg-[#00441F] text-white border-[#00441F] shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-[#E0E5CF] hover:bg-gray-100'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data e Hora */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Data e Horário:
                  </label>
                  <input
                    type="datetime-local"
                    value={dataFollowup}
                    onChange={(e) => setDataFollowup(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-[#E0E5CF] rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-[#00CF7B]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 font-medium">
                    Interpretado como: {parsedResult.dataFollowupFormatted}
                  </p>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Título do Agendamento:
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-[#E0E5CF] rounded-xl text-sm text-gray-800 outline-none focus:border-[#00CF7B]"
                  />
                </div>

                {/* Botão de Confirmação */}
                <button
                  type="button"
                  onClick={handleConfirmTask}
                  disabled={isPending}
                  className="w-full py-3 bg-[#00CF7B] text-white font-extrabold text-sm rounded-xl hover:bg-[#00B56A] shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Agendando na sua rotina...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar e Agendar na Agenda</span>
                      <span>📅</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-[#e9ebe4] border-t border-[#E0E5CF] text-center">
            <p className="text-[11px] text-gray-500">
              Dica: Você pode ditar frases completas como <span className="font-semibold text-gray-700">&quot;Reunião com [Nome] amanhã às 15h&quot;</span>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
