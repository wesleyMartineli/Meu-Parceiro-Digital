"use client";

import React, { useMemo } from "react";
import {
  ListTodo,
  Phone,
  MapPin,
  Video,
  MessageSquare,
  DollarSign,
  Briefcase,
  TrendingDown,
  Layers,
  Percent,
  Tag,
  Activity,
  Award
} from "lucide-react";
import { DashboardLead, DashboardNegocio, DashboardTarefa } from "../types";
import { formatBRL, formatShortBRL, isGanho, isPerdido } from "../analyticsEngine";

interface CommercialKpiCardsProps {
  negocios: DashboardNegocio[];
  tarefas: DashboardTarefa[];
  periodoLabel?: string;
}

export default function CommercialKpiCards({
  negocios,
  tarefas,
  periodoLabel = "Período Ativo",
}: CommercialKpiCardsProps) {
  // === MÉTRICAS DE ATIVIDADES / TAREFAS ===
  const kpisTarefas = useMemo(() => {
    const totalAcoes = tarefas.length;
    let ligacoes = 0;
    let visitas = 0;
    let reunioes = 0;
    let whatsapp = 0;

    tarefas.forEach((t) => {
      const tipo = (t.tipo || "outros").toLowerCase();
      if (tipo === "ligacao") ligacoes++;
      else if (tipo === "visita") visitas++;
      else if (tipo === "reuniao_presencial" || tipo === "reuniao_online" || tipo === "reuniao") reunioes++;
      else if (tipo === "whatsapp") whatsapp++;
    });

    return {
      totalAcoes,
      ligacoes,
      visitas,
      reunioes,
      whatsapp,
    };
  }, [tarefas]);

  // === MÉTRICAS DE NEGOCIAÇÃO & PRODUÇÃO ===
  const kpisProducao = useMemo(() => {
    let valorFechado = 0;
    let valorEmAberto = 0;
    let valorPerdido = 0;
    let qtdFechado = 0;
    let qtdEmAberto = 0;
    let qtdPerdido = 0;

    negocios.forEach((n) => {
      const credito = Number(n.credito) || 0;
      if (isGanho(n.etapa_funil)) {
        valorFechado += credito;
        qtdFechado++;
      } else if (isPerdido(n.etapa_funil)) {
        valorPerdido += credito;
        qtdPerdido++;
      } else {
        valorEmAberto += credito;
        qtdEmAberto++;
      }
    });

    const qtdTotalOportunidades = negocios.length;
    const taxaConversao = qtdTotalOportunidades > 0 ? (qtdFechado / qtdTotalOportunidades) * 100 : 0;
    const ticketMedio = qtdFechado > 0 ? valorFechado / qtdFechado : 0;

    return {
      valorFechado,
      valorEmAberto,
      valorPerdido,
      qtdFechado,
      qtdEmAberto,
      qtdPerdido,
      qtdTotalOportunidades,
      taxaConversao,
      ticketMedio,
    };
  }, [negocios]);

  return (
    <div className="space-y-4">
      {/* 1. BLOCO DE TAREFAS & ESFORÇO OPERACIONAL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#E0E5CF] text-[#00441F]">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#00441F]">
              Volume de Atividades Operacionais
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-gray-500">
            {periodoLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total de Ações */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ações Totais</span>
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[#00441F]">
                <ListTodo className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#00441F] block leading-tight">
                {kpisTarefas.totalAcoes}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 mt-0.5 block">
                atividades realizadas
              </span>
            </div>
          </div>

          {/* Ligações Feitas */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ligações</span>
              <div className="w-7 h-7 rounded-lg bg-[#FF7A40]/15 flex items-center justify-center text-[#FF7A40]">
                <Phone className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#00441F] block leading-tight">
                {kpisTarefas.ligacoes}
              </span>
              <span className="text-[10px] font-semibold text-[#FF7A40] mt-0.5 block">
                contatos telefônicos
              </span>
            </div>
          </div>

          {/* Visitas a Parceiros */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Visitas</span>
              <div className="w-7 h-7 rounded-lg bg-[#00A8E2]/15 flex items-center justify-center text-[#00A8E2]">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#00441F] block leading-tight">
                {kpisTarefas.visitas}
              </span>
              <span className="text-[10px] font-semibold text-[#00A8E2] mt-0.5 block">
                em campo a parceiros
              </span>
            </div>
          </div>

          {/* Reuniões */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Reuniões</span>
              <div className="w-7 h-7 rounded-lg bg-[#00441F]/10 flex items-center justify-center text-[#00441F]">
                <Video className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#00441F] block leading-tight">
                {kpisTarefas.reunioes}
              </span>
              <span className="text-[10px] font-semibold text-[#00441F] mt-0.5 block">
                presenciais & online
              </span>
            </div>
          </div>

          {/* WhatsApp / Mensagens */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
              <div className="w-7 h-7 rounded-lg bg-[#00CF7B]/15 flex items-center justify-center text-[#00441F]">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#00441F] block leading-tight">
                {kpisTarefas.whatsapp}
              </span>
              <span className="text-[10px] font-semibold text-[#00441F] mt-0.5 block">
                mensagens registradas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BLOCO DE NEGOCIAÇÃO & PRODUÇÃO COMERCIAL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#E0E5CF] text-[#00441F]">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#00441F]">
              Produção & Pipeline de Negócios
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-gray-500">
            Valores de Consórcio
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Vendas / Fechado */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#00CF7B]/40 bg-gradient-to-br from-white to-[#00CF7B]/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00441F]">Fechado / Ganho</span>
              <div className="w-7 h-7 rounded-lg bg-[#00CF7B]/20 flex items-center justify-center text-[#00441F]">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-[#00441F] block leading-tight truncate">
                {formatShortBRL(kpisProducao.valorFechado)}
              </span>
              <span className="text-[10px] font-semibold text-[#00CF7B] mt-0.5 block">
                {kpisProducao.qtdFechado} cotas vendidas
              </span>
            </div>
          </div>

          {/* Em Aberto / Negociação */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#00A8E2]/30 bg-gradient-to-br from-white to-[#00A8E2]/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A8E2]">Em Aberto</span>
              <div className="w-7 h-7 rounded-lg bg-[#00A8E2]/15 flex items-center justify-center text-[#00A8E2]">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-[#00441F] block leading-tight truncate">
                {formatShortBRL(kpisProducao.valorEmAberto)}
              </span>
              <span className="text-[10px] font-semibold text-[#00A8E2] mt-0.5 block">
                {kpisProducao.qtdEmAberto} em negociação
              </span>
            </div>
          </div>

          {/* Perdido / Desistência */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#FF7A40]/30 bg-gradient-to-br from-white to-[#FF7A40]/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A40]">Perdido</span>
              <div className="w-7 h-7 rounded-lg bg-[#FF7A40]/15 flex items-center justify-center text-[#FF7A40]">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-[#FF7A40] block leading-tight truncate">
                {formatShortBRL(kpisProducao.valorPerdido)}
              </span>
              <span className="text-[10px] font-semibold text-[#FF7A40] mt-0.5 block">
                {kpisProducao.qtdPerdido} cancelados
              </span>
            </div>
          </div>

          {/* Oportunidades Totais */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Oportunidades</span>
              <div className="w-7 h-7 rounded-lg bg-[#00441F]/10 flex items-center justify-center text-[#00441F]">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-[#00441F] block leading-tight">
                {kpisProducao.qtdTotalOportunidades}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 mt-0.5 block">
                no pipeline geral
              </span>
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Conversão</span>
              <div className="w-7 h-7 rounded-lg bg-[#00CF7B]/15 flex items-center justify-center text-[#00CF7B]">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-[#00CF7B] block leading-tight">
                {kpisProducao.taxaConversao.toFixed(1)}%
              </span>
              <span className="text-[10px] font-semibold text-[#00441F] mt-0.5 block">
                taxa de fechamento
              </span>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ticket Médio</span>
              <div className="w-7 h-7 rounded-lg bg-[#EF6FD4]/15 flex items-center justify-center text-[#EF6FD4]">
                <Tag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-[#00441F] block leading-tight truncate">
                {formatShortBRL(kpisProducao.ticketMedio)}
              </span>
              <span className="text-[10px] font-semibold text-[#EF6FD4] mt-0.5 block">
                média por cota ganha
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
