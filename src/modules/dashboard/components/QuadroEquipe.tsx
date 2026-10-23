"use client";

import React from "react";
import { Award } from "lucide-react";
import { ComparativoItem, DashboardTarefa } from "../types";

interface QuadroEquipeProps {
  equipeData: ComparativoItem[];
  filteredTarefas: DashboardTarefa[];
  onSelectUser: (id: string) => void;
  formatBRL: (val: number) => string;
}

export default function QuadroEquipe({
  equipeData,
  filteredTarefas,
  onSelectUser,
  formatBRL,
}: QuadroEquipeProps) {
  return (
    <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#E0E5CF] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#00441F] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00CF7B]" />
            Quadro de Eficiência por Gerência de Negócios (Visão de Liderança)
          </h3>
          <p className="text-xs text-[#00441F]/80 font-medium">
            Comparativo direto da produção versus volume de tarefas de cada membro da equipe subordinada
          </p>
        </div>
        <span className="text-xs font-bold text-[#00441F] bg-white px-2.5 py-1 rounded-lg border border-[#E0E5CF]">
          {equipeData.length} Membros Avaliados
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#00441F]">
          <thead>
            <tr className="border-b border-[#E0E5CF] text-[10px] font-bold uppercase tracking-wider text-[#00441F]/70">
              <th className="pb-3 px-3">Gerente / Membro</th>
              <th className="pb-3 px-3 text-center">Tarefas Totais</th>
              <th className="pb-3 px-3 text-center">Visitas a Parceiros</th>
              <th className="pb-3 px-3 text-center">Ligações Feitas</th>
              <th className="pb-3 px-3">Produção Fechada (R$)</th>
              <th className="pb-3 px-3 text-right">R$ Produzido / Tarefa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E5CF]">
            {equipeData.map((membro) => {
              const mTarefas = filteredTarefas.filter((t) => t.vendedor_id === membro.id);
              const mVisitas = mTarefas.filter(
                (t) => (t.tipo || "").toLowerCase() === "visita" || (t.tipo || "").toLowerCase() === "reuniao_presencial"
              ).length;
              const mLigacoes = mTarefas.filter((t) => (t.tipo || "").toLowerCase() === "ligacao").length;

              return (
                <tr
                  key={membro.id || membro.nome}
                  onClick={() => {
                    if (membro.id) onSelectUser(membro.id);
                  }}
                  className="hover:bg-white/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-bold group-hover:text-[#00CF7B] transition-colors">
                    {membro.nome}
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-[#00441F]">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {membro.esforco} tarefas
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-purple-700">
                    {mVisitas}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-amber-700">
                    {mLigacoes}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-emerald-600">
                    {formatBRL(membro.resultado)}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-[#00441F]">
                    {formatBRL(membro.eficiencia || 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {equipeData.length === 0 && (
          <div className="p-8 text-center text-xs font-bold text-[#00441F]/70">
            Nenhum membro avaliado para os parâmetros selecionados.
          </div>
        )}
      </div>
    </div>
  );
}
