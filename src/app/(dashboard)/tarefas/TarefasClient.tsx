'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NovaTarefaModal from '@/components/modals/NovaTarefaModal';
import AgendaAssistantDrawer from '@/components/tarefas/AgendaAssistantDrawer';
import CommercialAssistantChat from '@/components/tarefas/CommercialAssistantChat';
import { toggleFollowupStatusAction, deleteFollowupAction } from '@/modules/crm/actions';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  nome: string;
}

interface Followup {
  id: string;
  titulo: string;
  descricao: string | null;
  data_followup: string;
  status: string | null;
  tipo?: string;
  created_at: string;
  leads: Lead;
}

interface TarefasClientProps {
  tarefas: Followup[];
  leads: Lead[];
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function TarefasClient({ tarefas, leads }: TarefasClientProps) {
  const router = useRouter();
  const [localTarefas, setLocalTarefas] = useState<Followup[]>(tarefas);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCommercialChatOpen, setIsCommercialChatOpen] = useState(false);
  const [isDevWarningOpen, setIsDevWarningOpen] = useState(false);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState('');
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Followup | null>(null);

  // Sincroniza tarefas caso o server component revalide
  useEffect(() => {
    setLocalTarefas(tarefas);
  }, [tarefas]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month === 0 ? 11 : month - 1);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number, isCurrentMonth: boolean, offsetMonth: number = 0) => {
    if (isCurrentMonth) {
      setSelectedDate(new Date(year, month, day));
    } else {
      const newDate = new Date(year, month + offsetMonth, day);
      setCurrentDate(newDate);
      setSelectedDate(newDate);
    }
  };

  // Helper para verificar se um dia tem tarefas
  const hasTasksOnDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('pt-BR');
    return localTarefas.some(t => new Date(t.data_followup).toLocaleDateString('pt-BR') === dateStr);
  };

  // Filtrar tarefas apenas do dia selecionado
  const selectedDateStr = selectedDate.toLocaleDateString('pt-BR');
  const tasksForSelectedDate = useMemo(() => {
    return [...localTarefas]
      .filter(t => new Date(t.data_followup).toLocaleDateString('pt-BR') === selectedDateStr)
      .sort((a, b) => new Date(a.data_followup).getTime() - new Date(b.data_followup).getTime());
  }, [localTarefas, selectedDateStr]);

  const pendentesParaHoje = tasksForSelectedDate.filter(t => t.status !== 'concluido').length;

  // Callback ao criar tarefa pelo assistente
  const handleTaskCreated = (newTask: any) => {
    const formattedTask: Followup = {
      id: newTask.id,
      titulo: newTask.titulo,
      descricao: newTask.descricao,
      data_followup: newTask.data_followup,
      status: newTask.status || 'pendente',
      tipo: newTask.tipo || 'outros',
      created_at: newTask.created_at || new Date().toISOString(),
      leads: {
        id: newTask.leads?.id || (newTask.lead_id || ''),
        nome: newTask.leads?.nome || (leads.find(l => l.id === newTask.lead_id)?.nome || 'Cliente'),
      },
    };

    setLocalTarefas(prev => [formattedTask, ...prev]);

    // Seleciona a data da nova tarefa no calendário
    if (newTask.data_followup) {
      const taskDate = new Date(newTask.data_followup);
      setSelectedDate(taskDate);
      setCurrentDate(new Date(taskDate.getFullYear(), taskDate.getMonth(), 1));
    }

    router.refresh();
  };

  // Alternar status da tarefa (Pendente <-> Concluído)
  const handleToggleStatus = async (task: Followup) => {
    setPendingToggleId(task.id);
    const newStatus = task.status === 'concluido' ? 'pendente' : 'concluido';

    // Atualização otimista imediata
    setLocalTarefas(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await toggleFollowupStatusAction(task.id, task.leads?.id || '', task.status || 'pendente');
      if (!res.success) {
        // Reverte se falhou
        setLocalTarefas(prev =>
          prev.map(t => (t.id === task.id ? { ...t, status: task.status } : t))
        );
      } else {
        router.refresh();
      }
    } catch {
      setLocalTarefas(prev =>
        prev.map(t => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    } finally {
      setPendingToggleId(null);
    }
  };

  // Excluir compromisso / tarefa da agenda
  const handleDeleteTask = async (task: Followup) => {
    setPendingDeleteId(task.id);
    const previousTarefas = [...localTarefas];
    setLocalTarefas(prev => prev.filter(t => t.id !== task.id));
    setTaskToDelete(null);

    try {
      const res = await deleteFollowupAction(task.id, task.leads?.id);
      if (res.success) {
        toast.success('Compromisso excluído com sucesso!');
        router.refresh();
      } else {
        setLocalTarefas(previousTarefas);
        toast.error(res.message || 'Erro ao excluir compromisso.');
      }
    } catch {
      setLocalTarefas(previousTarefas);
      toast.error('Erro de conexão ao excluir compromisso.');
    } finally {
      setPendingDeleteId(null);
    }
  };


  // Renderizar a grade do calendário
  const renderCalendarGrid = () => {
    const grid = [];
    let dayCounter = 1;
    let nextMonthDayCounter = 1;

    for (let row = 0; row < 6; row++) {
      const week = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDay) {
          // Dias do mês anterior
          const prevDay = daysInPrevMonth - firstDay + col + 1;
          week.push(
            <div key={`prev-${prevDay}`} onClick={() => handleDayClick(prevDay, false, -1)} className="h-10 w-10 mx-auto flex flex-col items-center justify-center cursor-pointer text-gray-300 text-sm font-medium">
              {prevDay}
            </div>
          );
        } else if (dayCounter <= daysInMonth) {
          // Dias do mês atual
          const currentDay = dayCounter;
          const dateObj = new Date(year, month, currentDay);
          const isSelected = dateObj.toLocaleDateString('pt-BR') === selectedDate.toLocaleDateString('pt-BR');
          const isToday = dateObj.toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR');
          const hasTasks = hasTasksOnDate(dateObj);

          week.push(
            <div 
              key={`current-${currentDay}`} 
              onClick={() => handleDayClick(currentDay, true)}
              className={`h-10 w-10 mx-auto flex flex-col items-center justify-center cursor-pointer transition-all rounded-xl relative
                ${isSelected ? 'bg-[#00441F] text-white font-bold shadow-md' : 'text-gray-700 hover:bg-gray-100 font-medium'}
                ${isToday && !isSelected ? 'text-[#00CF7B] font-bold' : ''}
              `}
            >
              <span className="text-sm">{currentDay}</span>
              {hasTasks && (
                <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${isSelected ? 'bg-[#e9ebe4]' : 'bg-[#00CF7B]'}`}></span>
              )}
            </div>
          );
          dayCounter++;
        } else {
          // Dias do próximo mês
          const nextDay = nextMonthDayCounter;
          week.push(
            <div key={`next-${nextDay}`} onClick={() => handleDayClick(nextDay, false, 1)} className="h-10 w-10 mx-auto flex flex-col items-center justify-center cursor-pointer text-gray-300 text-sm font-medium">
              {nextDay}
            </div>
          );
          nextMonthDayCounter++;
        }
      }
      grid.push(<div key={`row-${row}`} className="grid grid-cols-7 gap-1 mt-1">{week}</div>);
      if (dayCounter > daysInMonth) break;
    }
    return grid;
  };

  // Determinar cores e visual do card baseado no status/data
  const getTaskVisuals = (task: Followup) => {
    if (task.status === 'concluido') {
      return { border: 'border-l-4 border-l-gray-300', iconBg: 'bg-gray-100', iconColor: 'text-gray-900', badge: 'CONCLUÍDO', badgeColors: 'bg-gray-100 text-[#00441F] font-semibold', icon: 'M5 13l4 4L19 7' };
    }
    
    const now = new Date();
    const taskDate = new Date(task.data_followup);
    
    // Atrasada (Alta Prioridade)
    if (taskDate < now) {
      return { border: 'border-l-4 border-l-red-500', iconBg: 'bg-red-50', iconColor: 'text-gray-900', badge: 'ALTA PRIORIDADE', badgeColors: 'bg-red-100 text-red-700', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' };
    }
    
    // Hoje
    if (taskDate.toLocaleDateString() === now.toLocaleDateString()) {
      return { border: 'border-l-4 border-l-[#FF7A40]', iconBg: 'bg-[#FF7A40]/10', iconColor: 'text-gray-900', badge: 'PARA HOJE', badgeColors: 'bg-[#FF7A40]/10 text-[#FF7A40]', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' };
    }

    // Futuro
    return { border: 'border-l-4 border-l-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-gray-900', badge: 'ROTINA', badgeColors: 'bg-blue-100 text-blue-700', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' };
  };

  // Calcular estatística básica de produtividade semanal
  const weeklyProductivity = useMemo(() => {
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    const tasksThisWeek = localTarefas.filter(t => new Date(t.data_followup) >= currentWeekStart);
    if (tasksThisWeek.length === 0) return 0;
    
    const completedThisWeek = tasksThisWeek.filter(t => t.status === 'concluido').length;
    return Math.round((completedThisWeek / tasksThisWeek.length) * 100);
  }, [localTarefas]);

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8 lg:p-10">
      
      {/* Header com Filtros e Ações */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b border-[#E0E5CF] pb-4">
        <div className="flex items-center gap-4 text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-2 px-4 py-2 bg-[#e9ebe4] rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50">
            <svg className="w-4 h-4 text-[#00441F] font-semibold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filtrar por:
          </span>
          <span className="flex items-center gap-2 px-4 py-2 bg-[#e9ebe4] rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50">
            <svg className="w-4 h-4 text-[#00441F] font-semibold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Hoje, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDevWarningOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#00441F] to-[#005a29] text-white text-sm font-extrabold rounded-xl shadow-md hover:from-[#003317] hover:to-[#00441F] transition-all flex items-center gap-2 border border-[#00CF7B]/60 hover:border-[#00CF7B] cursor-pointer"
            title="Abrir Assistente de Agenda com Recomendações e Inteligência"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00CF7B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00CF7B]"></span>
            </span>
            <span className="text-base text-[#00CF7B]">✨</span>
            <span>Assistente de Agenda</span>
          </button>


          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#FF7A40] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#E66E00] transition-colors cursor-pointer"
          >
            + Nova Tarefa
          </button>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO ESQUERDO: CALENDÁRIO E PRODUTIVIDADE */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          
          {/* Card do Calendário */}
          <div className="bg-[#e9ebe4] rounded-2xl p-6 shadow-sm border border-[#E0E5CF]">
            {/* Header Mes/Ano */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-[#00441F] capitalize">
                {MONTH_NAMES[month]} {year}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded text-[#00441F] font-semibold transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded text-[#00441F] font-semibold transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 mb-2 min-w-[280px]">
                {WEEK_DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-[#00441F] font-semibold">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Grade de Dias */}
            <div className="overflow-x-auto">
              <div className="space-y-1 min-w-[280px]">
                {renderCalendarGrid()}
              </div>
            </div>
          </div>

          {/* Card de Produtividade */}
          <div className="bg-[#00CF7B] rounded-2xl p-6 shadow-md text-white relative overflow-hidden">
            {/* Elemento de fundo decorativo */}
            <svg className="absolute right-[-20%] top-[-20%] w-48 h-48 text-white/10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            
            <h3 className="text-lg font-bold mb-2">Produtividade Semanal</h3>
            <p className="text-sm text-white/90 font-medium leading-relaxed mb-6">
              Você completou {weeklyProductivity}% das suas tarefas agendadas para esta semana.
            </p>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-[#e9ebe4]/30 rounded-full h-1.5 mb-6">
              <div className="bg-[#e9ebe4] h-1.5 rounded-full" style={{ width: `${weeklyProductivity}%` }}></div>
            </div>

            <button className="bg-[#e9ebe4] text-[#00CF7B] px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
              Ver Relatório
            </button>
          </div>
        </div>

        {/* LADO DIREITO: LISTA DE TAREFAS */}
        <div className="lg:col-span-8 xl:col-span-9">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-[#00441F]">Próximos Compromissos</h1>
              <p className="text-sm text-[#00441F] font-semibold font-medium mt-1">
                {pendentesParaHoje > 0 
                  ? `Você tem ${pendentesParaHoje} tarefas pendentes para o dia selecionado.` 
                  : 'Nenhuma tarefa pendente para o dia selecionado.'}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 bg-[#e9ebe4] border border-[#E0E5CF] rounded-lg text-[#00441F] font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
              <button className="p-2.5 bg-gray-100 border border-transparent rounded-lg text-[#00441F] font-semibold cursor-not-allowed">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tasksForSelectedDate.length === 0 ? (
              <div className="bg-[#e9ebe4] rounded-2xl border border-[#E0E5CF] p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700">Dia Livre!</h3>
                <p className="text-sm text-[#00441F] font-semibold mt-2">Você não tem compromissos agendados para {selectedDateStr}.</p>
              </div>
            ) : (
              tasksForSelectedDate.map((t) => {
                const visual = getTaskVisuals(t);
                const isConcluido = t.status === 'concluido';
                const hourStr = new Date(t.data_followup).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                // Exemplo de horários se tivéssemos duração. Vamos simular +30min para exibir range como na imagem
                const endTime = new Date(t.data_followup);
                endTime.setMinutes(endTime.getMinutes() + 30);
                const endHourStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={t.id} className={`bg-[#e9ebe4] rounded-xl border border-[#E0E5CF] shadow-sm flex items-center overflow-hidden transition-all hover:shadow-md ${isConcluido ? 'opacity-65' : ''} ${visual.border}`}>
                    
                    {/* Botão de Conclusão / Checkbox */}
                    <div className="pl-4 sm:pl-5 pr-1 flex items-center justify-center shrink-0">
                      <button
                        type="button"
                        disabled={pendingToggleId === t.id}
                        onClick={() => handleToggleStatus(t)}
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                          isConcluido
                            ? 'bg-[#00CF7B] border-[#00CF7B] text-white shadow-xs'
                            : 'border-gray-300 hover:border-[#00CF7B] text-transparent hover:text-[#00CF7B]/50 bg-white'
                        }`}
                        title={isConcluido ? 'Marcar como pendente' : 'Marcar como concluído'}
                      >
                        <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 py-4 px-4 sm:px-5 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <Link href={`/crm/${t.leads?.id}`} className={`text-base sm:text-lg font-extrabold text-[#00441F] hover:text-[#00CF7B] transition-colors ${isConcluido ? 'line-through text-gray-500' : ''}`}>
                            {t.leads?.nome}
                          </Link>
                          {!isConcluido && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${visual.badgeColors}`}>
                              {visual.badge}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider capitalize ${
                            t.tipo === 'whatsapp' ? 'bg-green-100 text-green-700' :
                            t.tipo === 'ligacao' ? 'bg-blue-100 text-blue-700' :
                            t.tipo === 'email' ? 'bg-purple-100 text-purple-700' :
                            t.tipo === 'visita' ? 'bg-orange-100 text-orange-700' :
                            t.tipo === 'reuniao' ? 'bg-teal-100 text-teal-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t.tipo || 'Outros'}
                          </span>
                          {isConcluido && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider bg-gray-200 text-gray-700">
                              CONCLUÍDO
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs sm:text-sm font-bold ${isConcluido ? 'text-gray-400 line-through' : 'text-[#00441F]'}`}>
                            {hourStr} - {endHourStr}
                          </p>
                        </div>
                      </div>

                      <p className={`text-xs sm:text-sm mt-1 mb-2 font-medium ${isConcluido ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                        {t.titulo}: {t.descricao || 'Sem detalhes adicionais.'}
                      </p>

                      {!isConcluido && (
                        <div className="flex items-center gap-4 mt-0.5">
                          {visual.badge === 'ALTA PRIORIDADE' && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                              Atrasado
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            Meu Parceiro Digital
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botão de Excluir Agenda */}
                    <div className="pr-4 sm:pr-5 pl-1 flex items-center justify-center shrink-0">
                      <button
                        type="button"
                        disabled={pendingDeleteId === t.id}
                        onClick={() => setTaskToDelete(t)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer group"
                        title="Excluir este compromisso da agenda"
                      >
                        <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                  </div>
                );
              })
            )}

            {tasksForSelectedDate.length > 0 && (
              <div className="pt-6 text-center">
                <button className="px-6 py-2.5 bg-[#e9ebe4] border border-[#E0E5CF] rounded-full text-sm font-bold text-[#00441F] font-semibold hover:bg-gray-50 transition-colors shadow-sm inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  Carregar mais tarefas
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal Convencional de Nova Tarefa */}
      <NovaTarefaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        leads={leads}
      />

      {/* Assistente Inteligente de Agenda (Drawer) */}
      <AgendaAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        leads={leads}
        initialPrompt={assistantInitialPrompt}
        onTaskCreated={handleTaskCreated}
      />

      {/* Assessor Comercial IA com Chatbot e Recomendações */}
      <CommercialAssistantChat
        isOpen={isCommercialChatOpen}
        onClose={() => setIsCommercialChatOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* Modal de Confirmação: Funcionalidade em Desenvolvimento */}
      {isDevWarningOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setIsDevWarningOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-7 animate-slideUp text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-inner">
              <span className="text-2xl">⚠️</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#00441F] mb-2">
              Funcionalidade em Desenvolvimento
            </h3>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Esta função do <strong>Assistente de Agenda</strong> ainda está em desenvolvimento.
              <br /><br />
              Deseja continuar para acessar o assistente?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDevWarningOpen(false)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDevWarningOpen(false);
                  setIsCommercialChatOpen(true);
                }}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-[#00441F] hover:bg-[#003317] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Sim, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Tarefa / Agenda */}
      {taskToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setTaskToDelete(null)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 animate-slideUp text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-inner">
              <svg className="w-6 h-6 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1.5">
              Excluir este compromisso?
            </h3>

            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Deseja remover <strong>{taskToDelete.titulo}</strong>{taskToDelete.leads?.nome ? ` (${taskToDelete.leads.nome})` : ''} da sua agenda?
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="w-1/2 py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={pendingDeleteId === taskToDelete.id}
                onClick={() => handleDeleteTask(taskToDelete)}
                className="w-1/2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {pendingDeleteId === taskToDelete.id ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
