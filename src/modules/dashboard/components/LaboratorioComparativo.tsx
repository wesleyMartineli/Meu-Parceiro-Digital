"use client";

import React from "react";
import { SlidersHorizontal, ArrowRight, Sparkles } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { ComparativoItem } from "../types";

interface LaboratorioComparativoProps {
  mounted: boolean;
  modoGrafico: "tempo" | "parceiros" | "equipe";
  onModoGraficoChange: (modo: "tempo" | "parceiros" | "equipe") => void;
  eixoEsforco: string;
  onEixoEsforcoChange: (val: string) => void;
  eixoResultado: string;
  onEixoResultadoChange: (val: string) => void;
  data: ComparativoItem[];
  labelEsforco: string;
  labelResultado: string;
  isResultadoMonetario: boolean;
  totalAtividades: number;
  valorFechado: number;
  producaoPorTarefa: number;
  isLeader: boolean;
  formatBRL: (val: number) => string;
  formatShortBRL: (val: number) => string;
}

export default function LaboratorioComparativo({
  mounted,
  modoGrafico,
  onModoGraficoChange,
  eixoEsforco,
  onEixoEsforcoChange,
  eixoResultado,
  onEixoResultadoChange,
  data,
  labelEsforco,
  labelResultado,
  isResultadoMonetario,
  totalAtividades,
  valorFechado,
  producaoPorTarefa,
  isLeader,
  formatBRL,
  formatShortBRL,
}: LaboratorioComparativoProps) {
  return (
    <div className="bg-[#e9ebe4] border-2 border-[#00CF7B]/30 rounded-2xl p-6 md:p-7 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E0E5CF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#00CF7B]" />
            <h2 className="text-lg font-extrabold text-[#00441F]">
              Laboratório Comparativo: Tarefas versus Produção
            </h2>
          </div>
          <p className="text-xs text-[#00441F]/80 font-medium mt-0.5">
            Cruze variáveis de esforço operacional contra produção financeira para descobrir correlações e padrões de sucesso.
          </p>
        </div>

        {/* Seletor de Modo */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E0E5CF] self-start md:self-auto">
          <button
            onClick={() => onModoGraficoChange("tempo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modoGrafico === "tempo"
                ? "bg-[#00441F] text-[#00CF7B] shadow-sm"
                : "text-[#00441F] hover:bg-gray-100"
            }`}
          >
            Linha do Tempo
          </button>
          <button
            onClick={() => onModoGraficoChange("parceiros")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modoGrafico === "parceiros"
                ? "bg-[#00441F] text-[#00CF7B] shadow-sm"
                : "text-[#00441F] hover:bg-gray-100"
            }`}
          >
            Por Parceiro da Carteira
          </button>
          {isLeader && (
            <button
              onClick={() => onModoGraficoChange("equipe")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modoGrafico === "equipe"
                  ? "bg-[#00441F] text-[#00CF7B] shadow-sm"
                  : "text-[#00441F] hover:bg-gray-100"
              }`}
            >
              Ranking da Equipe
            </button>
          )}
        </div>
      </div>

      {/* CONTROLES DO COMPARATIVO */}
      <div className="bg-white/80 border border-[#E0E5CF] rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* EIXO 1: ESFORÇO */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#00441F] flex items-center gap-1.5 uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Variável de Esforço (Eixo Y1 - Tarefas)
          </label>
          <select
            value={eixoEsforco}
            onChange={(e) => onEixoEsforcoChange(e.target.value)}
            className="w-full bg-white border border-[#E0E5CF] text-[#00441F] text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
          >
            <option value="todas">Todas as Tarefas / Atividades</option>
            <option value="visitas">Apenas Visitas & Reuniões Presenciais</option>
            <option value="online">Apenas Reuniões Online</option>
            <option value="ligacoes">Apenas Ligações Telefônicas</option>
            <option value="whatsapp">Apenas Contatos WhatsApp</option>
          </select>
        </div>

        {/* EIXO 2: RESULTADO */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#00441F] flex items-center gap-1.5 uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00CF7B]" />
            Variável de Resultado (Eixo Y2 - Produção)
          </label>
          <select
            value={eixoResultado}
            onChange={(e) => onEixoResultadoChange(e.target.value)}
            className="w-full bg-white border border-[#E0E5CF] text-[#00441F] text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00CF7B]"
          >
            <option value="valor_fechado">Volume de Crédito Fechado / Ganho (R$)</option>
            <option value="valor_aberto">Volume de Crédito em Carteira (Aberto R$)</option>
            <option value="qtd_fechado">Quantidade de Negócios / Cotas Fechadas</option>
            <option value="qtd_total">Quantidade Total de Negócios no Pipeline</option>
          </select>
        </div>
      </div>

      {/* GRÁFICO COMPOSTO DE DUPLO EIXO */}
      <div className="bg-white/90 border border-[#E0E5CF] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
          <div className="text-[#00441F] flex items-center gap-2">
            <span>Cruzamento:</span>
            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {labelEsforco}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#00441F]/50" />
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {labelResultado}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-600 font-bold">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Esforço (Tarefas)
            </span>
            <span className="flex items-center gap-1.5 text-[#00CF7B] font-bold">
              <span className="w-3 h-3 rounded-full bg-[#00CF7B] inline-block" /> Resultado (Produção)
            </span>
          </div>
        </div>

        <div className="w-full h-80">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e9d8" vertical={false} />
                <XAxis dataKey="label" stroke="#00441F" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#D97706"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Qtd Tarefas", angle: -90, position: "insideLeft", fill: "#D97706", fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#00CF7B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (isResultadoMonetario ? formatShortBRL(v) : String(v))}
                  label={{
                    value: isResultadoMonetario ? "Produção (R$)" : "Qtd Negócios",
                    angle: 90,
                    position: "insideRight",
                    fill: "#00CF7B",
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => {
                    if (name === "Resultado") {
                      return [isResultadoMonetario ? formatBRL(Number(val) || 0) : `${val} ocorrências`, labelResultado];
                    }
                    return [`${val} tarefas`, labelEsforco];
                  }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #E0E5CF",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="esforco"
                  name="Esforço (Tarefas)"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="resultado"
                  name="Resultado"
                  stroke="#00CF7B"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#00441F", stroke: "#00CF7B", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#00441F] font-semibold bg-white/50 rounded-xl border border-dashed border-[#E0E5CF]">
              Carregando modelo analítico...
            </div>
          )}
        </div>

        {/* INSIGHT ESTRATÉGICO GERADO PELO CRUZAMENTO */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#00441F]/10 via-[#00CF7B]/10 to-transparent border border-[#00CF7B]/30 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#00CF7B] shrink-0 mt-0.5" />
          <div className="text-xs text-[#00441F]">
            <span className="font-extrabold block">Conclusão de Produtividade Operacional:</span>
            Com base nos filtros ativos, foram registradas{" "}
            <strong className="text-[#00441F]">{totalAtividades} ações comerciais</strong> para gerar{" "}
            <strong className="text-emerald-700">{formatBRL(valorFechado)}</strong> em produção fechada.
            Cada tarefa realizada gerou em média <strong className="text-[#00441F]">{formatBRL(producaoPorTarefa)}</strong> em resultados comerciais.
          </div>
        </div>
      </div>
    </div>
  );
}
