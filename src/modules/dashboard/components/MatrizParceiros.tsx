"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { ComparativoItem, DashboardNegocio, DashboardTarefa } from "../types";

interface MatrizParceirosProps {
  partnerData: ComparativoItem[];
  filteredTarefas: DashboardTarefa[];
  filteredNegocios: DashboardNegocio[];
  onSelectPartner: (id: string) => void;
  formatBRL: (val: number) => string;
}

export default function MatrizParceiros({
  partnerData,
  filteredTarefas,
  filteredNegocios,
  onSelectPartner,
  formatBRL,
}: MatrizParceirosProps) {
  const isGanho = (etapa?: string | null) => {
    if (!etapa) return false;
    const l = etapa.toLowerCase();
    return l === "fechado" || l === "fechado_ganho" || l === "ganho";
  };

  const isPerdido = (etapa?: string | null) => {
    if (!etapa) return false;
    return etapa.toLowerCase() === "perdido";
  };

  return (
    <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0E5CF] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#00441F] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#00CF7B]" />
            Matriz de Eficiência por Parceiro da Carteira
          </h3>
          <p className="text-xs text-[#00441F]/80 font-medium">
            Relação direta de quantas visitas e ações foram dedicadas a cada parceiro versus o crédito produzido
          </p>
        </div>
        <span className="text-xs font-bold text-[#00441F]">
          Top Parceiros Ativos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#00441F]">
          <thead>
            <tr className="border-b border-[#E0E5CF] text-[10px] font-bold uppercase tracking-wider text-[#00441F]/70">
              <th className="pb-3 px-3">Parceiro / Base</th>
              <th className="pb-3 px-3 text-center">Ações Feitas</th>
              <th className="pb-3 px-3 text-center">Visitas Presenciais</th>
              <th className="pb-3 px-3 text-center">Contatos Digitais</th>
              <th className="pb-3 px-3">Produção Fechada (R$)</th>
              <th className="pb-3 px-3">Em Carteira (Aberto)</th>
              <th className="pb-3 px-3 text-right">R$ Gerado / Tarefa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E5CF]">
            {partnerData.map((p) => {
              const partnerTarefas = filteredTarefas.filter((t) => t.lead_id === p.id);
              const pVisitas = partnerTarefas.filter(
                (t) => (t.tipo || "").toLowerCase() === "visita" || (t.tipo || "").toLowerCase() === "reuniao_presencial"
              ).length;
              const pDigitais = partnerTarefas.length - pVisitas;
              const ratio = p.esforco > 0 ? p.resultado / p.esforco : 0;

              return (
                <tr
                  key={p.id || p.nome}
                  onClick={() => {
                    if (p.id) onSelectPartner(p.id);
                  }}
                  className="hover:bg-white/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-bold group-hover:text-[#00CF7B] transition-colors">
                    {p.nome}
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-[#00441F]">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {p.esforco} tarefas
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-purple-700">
                    {pVisitas}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-blue-700">
                    {pDigitais}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-emerald-600">
                    {formatBRL(p.resultado)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-blue-600">
                    {formatBRL(
                      filteredNegocios
                        .filter((n) => n.cliente_id === p.id && !isGanho(n.etapa_funil) && !isPerdido(n.etapa_funil))
                        .reduce((acc, n) => acc + (Number(n.credito) || 0), 0)
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-[#00441F]">
                    {formatBRL(ratio)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {partnerData.length === 0 && (
          <div className="p-8 text-center text-xs font-bold text-[#00441F]/70">
            Nenhuma movimentação para os parâmetros e filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
}
