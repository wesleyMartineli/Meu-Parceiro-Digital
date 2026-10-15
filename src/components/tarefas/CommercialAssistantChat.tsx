'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  CommercialRecommendation,
  CapacityAnalysis,
} from '@/modules/crm/recommendationEngine';
import {
  getCommercialAssistantOverviewAction,
  queryCommercialAssistantAction,
  createFollowupDirectAction,
  logAssistantRecommendationAction,
} from '@/modules/crm/actions';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendations?: CommercialRecommendation[];
  actionPills?: { label: string; query: string }[];
  timestamp: string;
}

interface CommercialAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (newTask: any) => void;
}

export default function CommercialAssistantChat({
  isOpen,
  onClose,
  onTaskCreated,
}: CommercialAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [capacity, setCapacity] = useState<CapacityAnalysis | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [customDateTime, setCustomDateTime] = useState('');
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [clearOnClose, setClearOnClose] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Inicializa preferência de limpeza do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('assistant_clear_on_close');
      if (saved !== null) {
        setClearOnClose(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleClearOnClose = () => {
    const newVal = !clearOnClose;
    setClearOnClose(newVal);
    try {
      localStorage.setItem('assistant_clear_on_close', String(newVal));
    } catch {
      // ignore
    }
    toast(newVal ? 'Chat será limpo ao sair/fechar a aba' : 'Histórico do chat será mantido');
  };

  const handleResetChat = () => {
    setMessages([]);
    setAcceptedIds(new Set());
    setDismissedIds(new Set());
    setReschedulingId(null);
    setInputText('');
    loadInitialOverview();
    toast.success('Chat reiniciado com sucesso!');
  };

  const handleClose = () => {
    if (clearOnClose) {
      setMessages([]);
      setAcceptedIds(new Set());
      setDismissedIds(new Set());
      setReschedulingId(null);
      setInputText('');
    }
    onClose();
  };

  // Garante limpeza completa sempre que fechar o drawer
  useEffect(() => {
    if (!isOpen && clearOnClose) {
      setMessages([]);
      setAcceptedIds(new Set());
      setDismissedIds(new Set());
      setReschedulingId(null);
      setInputText('');
    }
  }, [isOpen, clearOnClose]);

  // Se o usuário trocar de aba no navegador ou fechar a aba/janela
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && clearOnClose) {
        setMessages([]);
        setAcceptedIds(new Set());
        setDismissedIds(new Set());
        setReschedulingId(null);
        setInputText('');
      }
    };

    const handleUnload = () => {
      if (clearOnClose) {
        setMessages([]);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [clearOnClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 1) {
      // Quando usuário interage, rola para nova mensagem
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length === 1 && messagesContainerRef.current) {
      // No carregamento inicial com a mensagem de boas-vindas, inicia no TOPO
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = 0;
        }
      });
    }
  }, [messages]);

  // Carrega visão proativa inicial quando abre
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadInitialOverview();
    }
  }, [isOpen, messages.length]);

  const loadInitialOverview = async () => {
    setIsLoading(true);
    try {
      const res = await getCommercialAssistantOverviewAction();
      if (res.success && res.recommendations && res.capacity) {
        setCapacity(res.capacity);

        const welcomeText = `👋 **Olá! Seja bem-vindo ao seu Assistente de Agenda.**

Estou aqui para apoiar o seu dia a dia na gestão da carteira e acelerar seus fechamentos de cotas:
• Identificar parceiros estratégicos e com maior volume de negócios;
• Acompanhar propostas enviadas e oportunidades em aberto;
• Organizar sua agenda de atendimentos e visitas presenciais com proteção de tempo.

${res.briefing || 'Analisei sua carteira, propostas e capacidade da sua agenda para hoje.'}

💡 **Como começar:** Clique em uma das sugestões rápidas abaixo ou me envie uma pergunta por texto ou áudio!`;

        const initialMsg: Message = {
          id: 'msg-init',
          sender: 'assistant',
          text: welcomeText,
          // Não adiciona cards de antemão para manter a tela inicial limpa e leve
          actionPills: [
            { label: '🎯 Sugestões do dia', query: 'Quais são as principais sugestões para minha agenda hoje?' },
            { label: '🏆 Quem mais produz', query: 'Quero uma agenda com os parceiros que mais produzem.' },
            { label: '📊 Organizar semana', query: 'Organize minha agenda da semana.' },
            { label: '📄 Propostas pendentes', query: 'Quais propostas precisam de acompanhamento?' },
            { label: '🤝 Parceiros sem contato', query: 'Quais parceiros estão sem contato ou sem oportunidades geradas?' },
            { label: '🛡️ Minha capacidade', query: 'Minha agenda está muito cheia?' },
          ],
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages([initialMsg]);
      } else {
        setMessages([
          {
            id: 'msg-init-err',
            sender: 'assistant',
            text: '👋 **Olá! Seja bem-vindo ao seu Assistente de Agenda.**\n\nEstou pronto para te apoiar a gerenciar sua rotina e oportunidades da carteira.\n\n💡 **Como começar:** Escolha uma das opções abaixo ou me faça uma pergunta sobre seus parceiros ou agenda!',
            actionPills: [
              { label: '🎯 Sugestões do dia', query: 'Quais são as principais sugestões para minha agenda hoje?' },
              { label: '🏆 Quem mais produz', query: 'Quero uma agenda com os parceiros que mais produzem.' },
              { label: '🛡️ Minha capacidade', query: 'Minha agenda está muito cheia?' },
            ],
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      toast.error('Erro ao conectar ao assistente');
    } finally {
      setIsLoading(false);
    }
  };

  // Envio de mensagem
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await queryCommercialAssistantAction(text);
      if (res.success && res.responsePayload) {
        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: res.responsePayload.messageText,
          recommendations: res.responsePayload.filteredRecommendations,
          actionPills: res.responsePayload.actionPills,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: res.message || 'Desculpe, não consegui processar esta solicitação.',
            actionPills: [
              { label: '📊 Organizar semana', query: 'Organize minha agenda da semana.' },
              { label: '📄 Propostas pendentes', query: 'Quais propostas precisam de acompanhamento?' },
            ],
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      toast.error('Erro na resposta do assistente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Aceitar recomendação e criar tarefa real no Supabase
  const handleAcceptRecommendation = async (rec: CommercialRecommendation, customDate?: string) => {
    setActionPendingId(rec.id);
    const dateToSchedule = customDate || rec.dataSugerida;

    try {
      const res = await createFollowupDirectAction({
        leadId: rec.leadId,
        titulo: rec.titulo,
        descricao: `${rec.descricao}\n\n[Justificativa AI]: ${rec.motivo}`,
        dataFollowup: dateToSchedule,
        tipo: rec.tipo,
      });

      if (res.success && res.followup) {
        toast.success(`Agendado com sucesso para ${rec.leadNome}!`);
        setAcceptedIds(prev => new Set(prev).add(rec.id));
        setReschedulingId(null);

        // Notifica o componente pai para atualizar a grade do calendário
        onTaskCreated?.(res.followup);

        // Log da interação
        await logAssistantRecommendationAction({
          recommendationId: rec.id,
          action: customDate ? 'reagendar' : 'aceitar',
          leadId: rec.leadId,
          tipo: rec.tipo,
          dataSugerida: dateToSchedule,
          motivo: rec.motivo,
        });
      } else {
        toast.error(res.message || 'Erro ao criar compromisso.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar compromisso.');
    } finally {
      setActionPendingId(null);
    }
  };

  // Descartar recomendação
  const handleDismissRecommendation = async (rec: CommercialRecommendation) => {
    setDismissedIds(prev => new Set(prev).add(rec.id));
    toast('Recomendação descartada.', { icon: '🗑️' });

    await logAssistantRecommendationAction({
      recommendationId: rec.id,
      action: 'rejeitar',
      leadId: rec.leadId,
      tipo: rec.tipo,
      dataSugerida: rec.dataSugerida,
      motivo: rec.motivo,
    });
  };

  // Suporte a voz (Web Speech Recognition)
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.error('Reconhecimento de voz não suportado pelo seu navegador.');
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecording(true);
      toast('Ouvindo comando comercial...', { icon: '🎙️' });
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsRecording(false);
      handleSendMessage(transcript);
    };

    rec.onerror = () => {
      setIsRecording(false);
      toast.error('Não entendi o áudio. Tente novamente.');
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity flex justify-end"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-[#00441F] text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#00CF7B]/20 border border-[#00CF7B]/40 flex items-center justify-center text-[#00CF7B]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Assistente de Agenda</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Opção de Limpar ao Sair */}
            <button
              onClick={handleToggleClearOnClose}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1.5 border cursor-pointer ${
                clearOnClose
                  ? 'bg-[#00CF7B]/20 text-[#00CF7B] border-[#00CF7B]/40 hover:bg-[#00CF7B]/30'
                  : 'bg-white/10 text-emerald-200 border-white/20 hover:bg-white/20'
              }`}
              title="Ativar ou desativar limpeza automática do chat ao sair da aba"
            >
              <span className={`h-2 w-2 rounded-full ${clearOnClose ? 'bg-[#00CF7B] animate-pulse' : 'bg-gray-400'}`} />
              <span>Limpar ao sair</span>
            </button>

            {/* Botão Fechar */}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar painel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* STATUS DA CAPACIDADE (BANNER DINÂMICO) */}
        {capacity && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${
              capacity.capacityLevel === 'blocked'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : capacity.capacityLevel === 'restricted'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center space-x-2 truncate">
              {capacity.capacityLevel === 'blocked' ? (
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              ) : capacity.capacityLevel === 'restricted' ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
              ) : (
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
              <span className="font-medium truncate">{capacity.reason}</span>
            </div>
            {capacity.isClosingPeriod && (
              <span className="shrink-0 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-2">
                Fechamento
              </span>
            )}
          </div>
        )}

        {/* CHAT MESSAGES STREAM */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#00441F] text-white rounded-br-none'
                    : 'bg-white border border-gray-200/80 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 text-right ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* CARDS DE RECOMENDAÇÕES */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="w-full mt-3 space-y-3 pl-1">
                  {msg.recommendations.map(rec => {
                    const isAccepted = acceptedIds.has(rec.id);
                    const isDismissed = dismissedIds.has(rec.id);

                    if (isDismissed) return null;

                    return (
                      <div
                        key={rec.id}
                        className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${
                          isAccepted
                            ? 'border-emerald-300 bg-emerald-50/40 opacity-80'
                            : 'border-gray-200 hover:border-[#00CF7B] hover:shadow-md'
                        }`}
                      >
                        {/* Header do Card */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                  rec.prioridade === 'alta'
                                    ? 'bg-rose-100 text-rose-700'
                                    : rec.prioridade === 'media'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {rec.prioridade === 'alta'
                                  ? 'Alta Prioridade'
                                  : rec.prioridade === 'media'
                                  ? 'Média Prioridade'
                                  : 'Oportunidade'}
                              </span>
                              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                                {rec.tipoLabel}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm mt-1">
                              {rec.titulo}
                            </h4>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-xs font-semibold text-gray-500">
                              Score: {rec.score}
                            </span>
                          </div>
                        </div>

                        {/* Descrição */}
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                          {rec.descricao}
                        </p>

                        {/* Justificativa Estratégica */}
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 mb-3 flex items-start space-x-2">
                          <Sparkles className="h-3.5 w-3.5 text-[#00441F] mt-0.5 shrink-0" />
                          <div className="text-[11px] text-[#00441F]">
                            <strong className="font-semibold">Por que esta ação? </strong>
                            {rec.motivo}
                          </div>
                        </div>

                        {/* Horário Sugerido */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pt-1 border-t border-gray-100">
                          <div className="flex items-center space-x-1.5 text-gray-700 font-medium">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{rec.dataSugeridaFormatada}</span>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            ~{rec.duracaoEstimadaMinutos} min
                          </span>
                        </div>

                        {/* Painel de Reagendamento Inline */}
                        {reschedulingId === rec.id && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Escolha nova data e horário:
                            </label>
                            <input
                              type="datetime-local"
                              value={customDateTime || rec.dataSugerida.substring(0, 16)}
                              onChange={e => setCustomDateTime(e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#00CF7B] focus:outline-none mb-2"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setReschedulingId(null)}
                                className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-800"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleAcceptRecommendation(rec, customDateTime)}
                                disabled={actionPendingId === rec.id}
                                className="px-3 py-1 bg-[#00441F] text-white text-xs font-semibold rounded-lg hover:bg-[#003317]"
                              >
                                {actionPendingId === rec.id ? 'Salvando...' : 'Confirmar Reagendamento'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {isAccepted ? (
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Compromisso criado na sua agenda!</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleDismissRecommendation(rec)}
                                disabled={actionPendingId === rec.id}
                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Descartar sugestão"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setReschedulingId(reschedulingId === rec.id ? null : rec.id);
                                    setCustomDateTime(rec.dataSugerida.substring(0, 16));
                                  }}
                                  disabled={actionPendingId === rec.id}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                                >
                                  Reagendar
                                </button>
                                <button
                                  onClick={() => handleAcceptRecommendation(rec)}
                                  disabled={actionPendingId === rec.id}
                                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#00441F] hover:bg-[#003317] text-white text-xs font-bold rounded-xl transition shadow-sm"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{actionPendingId === rec.id ? 'Agendando...' : 'Aceitar'}</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PILLS DE AÇÕES RÁPIDAS */}
              {msg.actionPills && msg.actionPills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                  {msg.actionPills.map((pill, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(pill.query)}
                      disabled={isLoading}
                      className="text-xs bg-white border border-gray-200 hover:border-[#00441F] hover:text-[#00441F] text-gray-700 font-medium px-3 py-1.5 rounded-full shadow-2xs transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 bg-white p-3 rounded-2xl w-fit shadow-xs">
              <div className="h-2 w-2 rounded-full bg-[#00CF7B] animate-ping" />
              <span>Analisando carteira e calculando disponibilidade...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT DE PERGUNTAS / COMANDOS */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-[#00CF7B] focus-within:bg-white transition-all">
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-xl transition ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
              }`}
              title={isRecording ? 'Parar gravação' : 'Falar por voz'}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Ex: Organize minha semana ou Quem contatar hoje?"
              className="flex-1 bg-transparent border-none text-xs text-gray-800 placeholder-gray-400 focus:outline-none px-2"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-xl bg-[#00441F] text-white hover:bg-[#003317] disabled:opacity-40 transition shadow-xs"
              title="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
