"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { UserProfile } from "@/lib/supabase/helpers";

interface DashboardClientProps {
  user: UserProfile | null;
  negocios: any[];
  tarefas: any[];
}

export default function DashboardClient({ user, negocios, tarefas }: DashboardClientProps) {
  const isExecutive = user?.role === 'diretoria' || user?.role === 'superintendente' || user?.role === 'regional';
  const isMaster = user?.role === 'master' || user?.role === 'platform_admin';

  // === CALCULOS DE KPIS ===
  
  // Tarefas Pendentes
  const tarefasPendentes = tarefas.filter(t => t.status === 'pendente');

  // Valores Agregados (Soma de crédito por etapa do funil)
  const metricas = useMemo(() => {
    let valorAberto = 0; // Total Carteira
    let valorFechado = 0;
    let valorPerdido = 0;
    let qtdFechado = 0;
    let qtdTotal = 0;

    negocios.forEach((n) => {
      const credito = Number(n.credito) || 0;
      qtdTotal++;
      if (n.etapa_funil === 'perdido') {
        valorPerdido += credito;
      } else if (n.etapa_funil === 'fechado') {
        valorFechado += credito;
        qtdFechado++;
      } else {
        valorAberto += credito;
      }
    });

    const taxaConversao = qtdTotal > 0 ? (qtdFechado / qtdTotal) * 100 : 0;
    const ticketMedio = qtdFechado > 0 ? valorFechado / qtdFechado : 0;

    return { valorAberto, valorFechado, valorPerdido, taxaConversao, ticketMedio };
  }, [negocios]);

  // Formatação em Real (BRL)
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Porcentagem para o Gráfico de Barras
  const totalGeral = metricas.valorAberto + metricas.valorFechado + metricas.valorPerdido;
  const porcentagemGanha = totalGeral > 0 ? (metricas.valorFechado / totalGeral) * 100 : 0;
  const porcentagemAberta = totalGeral > 0 ? (metricas.valorAberto / totalGeral) * 100 : 0;
  const porcentagemPerdida = totalGeral > 0 ? (metricas.valorPerdido / totalGeral) * 100 : 0;

  // Últimos negócios (Top 5 mais recentes)
  const ultimosNegocios = negocios.slice(0, 5);
  // Últimas tarefas pendentes (Top 5 mais próximas)
  const proximasTarefas = tarefasPendentes.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* BOAS-VINDAS */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#00441F]">
            Olá, <span className="text-[#00CF7B]">{user?.nome?.split(' ')[0]}</span>!
          </h1>
          <p className="text-sm text-[#00441F] font-semibold mt-1 font-medium">Acompanhe o resumo da sua operação financeira e comercial.</p>
        </div>
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#00441F]/10 blur-[60px]" />
        
        {/* Ações Rápidas (Apenas para Master ou Operacionais) */}
        {(!isExecutive) && (
          <div className="flex gap-3 relative z-10">
            <Link href="/crm" className="px-5 py-2.5 bg-[#00CF7B] text-white text-sm font-bold rounded-xl hover:bg-[#00441F]/10 transition-colors shadow-sm">
              Ir para CRM
            </Link>
            <Link href="/simulador" className="px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">
              Nova Simulação
            </Link>
          </div>
        )}
      </div>

      {/* KPIS GERAIS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card Total Carteira */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 grayscale">💼</div>
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider line-clamp-1">Total Carteira</span>
          </div>
          <span className="text-xl font-extrabold text-blue-600">{formatBRL(metricas.valorAberto)}</span>
        </div>

        {/* Card Valor Fechado */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 grayscale">🏆</div>
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider line-clamp-1">Valor Fechado</span>
          </div>
          <span className="text-xl font-extrabold text-emerald-600">{formatBRL(metricas.valorFechado)}</span>
        </div>

        {/* Card Valor Perdido */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 grayscale">📉</div>
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider line-clamp-1">Valor Perdido</span>
          </div>
          <span className="text-xl font-extrabold text-rose-600">{formatBRL(metricas.valorPerdido)}</span>
        </div>

        {/* Card Taxa Conversão */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 grayscale">⚡</div>
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider line-clamp-1">Taxa Conversão</span>
          </div>
          <span className="text-xl font-extrabold text-gray-800">{metricas.taxaConversao.toFixed(1)}%</span>
        </div>

        {/* Card Ticket Médio */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 grayscale">🏷️</div>
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider line-clamp-1">Ticket Médio</span>
          </div>
          <span className="text-xl font-extrabold text-gray-800">{formatBRL(metricas.ticketMedio)}</span>
        </div>
      </div>

      {/* DASHBOARD GRÁFICO (PIPELINE VALUE) */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#00441F] mb-6 flex items-center gap-2">
          <span className="grayscale">📊</span> Comparativo de Pipeline (Volume de Crédito)
        </h3>
        
        {totalGeral === 0 ? (
          <div className="py-6 text-center text-sm text-[#00441F] font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Ainda não há dados suficientes para gerar o gráfico.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full h-8 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
              {porcentagemAberta > 0 && (
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out flex items-center px-3" 
                  style={{ width: `${porcentagemAberta}%` }}
                  title={`Abertos: ${formatBRL(metricas.valorAberto)}`}
                >
                  {porcentagemAberta > 10 && <span className="text-[10px] text-white font-bold">{Math.round(porcentagemAberta)}%</span>}
                </div>
              )}
              {porcentagemGanha > 0 && (
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out flex items-center px-3" 
                  style={{ width: `${porcentagemGanha}%` }}
                  title={`Fechadas: ${formatBRL(metricas.valorFechado)}`}
                >
                  {porcentagemGanha > 10 && <span className="text-[10px] text-white font-bold">{Math.round(porcentagemGanha)}%</span>}
                </div>
              )}
              {porcentagemPerdida > 0 && (
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000 ease-out flex items-center justify-end px-3" 
                  style={{ width: `${porcentagemPerdida}%` }}
                  title={`Perdidas: ${formatBRL(metricas.valorPerdido)}`}
                >
                  {porcentagemPerdida > 10 && <span className="text-[10px] text-white font-bold">{Math.round(porcentagemPerdida)}%</span>}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-xs font-medium gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[#00441F] font-semibold">Total Carteira (Aberto)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[#00441F] font-semibold">Fechadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-[#00441F] font-semibold">Perdidas</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DUAS COLUNAS: TAREFAS E NEGÓCIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LISTA DE TAREFAS */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#00441F] flex items-center gap-2">
              <span className="grayscale">📋</span> Minhas Tarefas de Hoje
            </h3>
            {(!isExecutive) && (
              <Link href="/tarefas" className="text-xs font-bold text-[#00CF7B] hover:underline">Ver todas</Link>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {proximasTarefas.length === 0 ? (
              <div className="h-full min-h-[150px] flex items-center justify-center text-xs text-[#00441F] font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Tudo limpo! Nenhuma tarefa pendente.
              </div>
            ) : (
              <div className="space-y-3">
                {proximasTarefas.map(t => (
                  <div key={t.id} className="flex flex-col p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-[#e9ebe4] hover:border-[#00CF7B]/30 transition-all group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-gray-800">{t.titulo}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{t.tipo || 'Outros'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-[#00441F] font-semibold font-medium">Cliente: <span className="font-bold">{t.leads?.nome || 'Não definido'}</span></span>
                      <span className="text-[10px] text-[#00441F] font-semibold font-medium">{new Date(t.data_followup).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LISTA DE NEGÓCIOS RECENTES */}
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#00441F] flex items-center gap-2">
              <span className="grayscale">💼</span> Meus Negócios Recentes
            </h3>
            {(!isExecutive) && (
              <Link href="/crm" className="text-xs font-bold text-[#00CF7B] hover:underline">Ver Funil</Link>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {ultimosNegocios.length === 0 ? (
              <div className="h-full min-h-[150px] flex items-center justify-center text-xs text-[#00441F] font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Você ainda não possui negócios no funil.
              </div>
            ) : (
              <div className="space-y-3">
                {ultimosNegocios.map(n => {
                  let badgeCor = "bg-blue-100 text-blue-700";
                  if (n.etapa_funil === 'fechado') badgeCor = "bg-emerald-100 text-emerald-700";
                  if (n.etapa_funil === 'perdido') badgeCor = "bg-rose-100 text-rose-700";

                  return (
                    <div key={n.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-[#e9ebe4] hover:border-[#00CF7B]/30 transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{n.leads?.nome || 'Sem Nome'}</span>
                        <span className="text-[10px] font-semibold text-[#00441F] font-semibold mt-0.5">{n.titulo || 'Simulação'} - {formatBRL(n.credito)}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${badgeCor}`}>
                        {n.etapa_funil?.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
