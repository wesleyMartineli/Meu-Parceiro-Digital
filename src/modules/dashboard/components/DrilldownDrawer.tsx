"use client";

import React, { useState } from "react";
import { X, ListTodo, Briefcase, Calendar, MapPin, Video, Phone, MessageSquare, Mail, Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { DrilldownState } from "../types";
import { formatBRL, isGanho, isPerdido } from "../analyticsEngine";

interface DrilldownDrawerProps {
  drilldown: DrilldownState;
  onClose: () => void;
}

export default function DrilldownDrawer({ drilldown, onClose }: DrilldownDrawerProps) {
  const [activeTab, setActiveTab] = useState<"tarefas" | "negocios">(
    drilldown.tarefas.length >= drilldown.negocios.length ? "tarefas" : "negocios"
  );

  if (!drilldown.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Drilldown */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#00441F] text-[#00CF7B] px-2.5 py-0.5 rounded-full">
                Drilldown • Detalhes de Origem
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                {drilldown.agrupamentoLabel}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#00441F] mt-1.5">
              {drilldown.tituloPonto}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600 mt-2">
              <span className="text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-bold">
                {drilldown.valorPrimarioLabel}
              </span>
              {drilldown.valorSecundarioLabel && (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                  {drilldown.valorSecundarioLabel}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas Tarefas vs Negócios */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-gray-100">
          <button
            onClick={() => setActiveTab("tarefas")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "tarefas"
                ? "border-[#00CF7B] text-[#00441F]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ListTodo className="w-4 h-4 text-[#00CF7B]" />
            Tarefas & Ações ({drilldown.tarefas.length})
          </button>
          <button
            onClick={() => setActiveTab("negocios")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "negocios"
                ? "border-[#00CF7B] text-[#00441F]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Negócios & Propostas ({drilldown.negocios.length})
          </button>
        </div>

        {/* Lista de Registros Reais */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === "tarefas" ? (
            drilldown.tarefas.length === 0 ? (
              <div className="p-12 text-center text-xs font-semibold text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Nenhuma tarefa comercial associada a este recorte.
              </div>
            ) : (
              drilldown.tarefas.map((t) => {
                const tipo = (t.tipo || "outros").toLowerCase();
                const isConcluida = t.status === "concluido";

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-gray-200/80 bg-white hover:border-[#00CF7B]/60 transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {tipo === "visita" ? "Visita ao Parceiro" :
                           tipo === "reuniao_presencial" ? "Reunião Presencial" :
                           tipo === "reuniao_online" ? "Reunião Online" :
                           tipo === "ligacao" ? "Ligação" :
                           tipo === "whatsapp" ? "WhatsApp" :
                           tipo === "email" ? "E-mail" : tipo}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 mt-1">
                          {t.titulo}
                        </h4>
                      </div>

                      <span className="text-[11px] font-semibold text-gray-500 shrink-0">
                        {t.data_followup ? new Date(t.data_followup).toLocaleDateString("pt-BR") : "Sem data"}
                      </span>
                    </div>

                    {t.descricao && (
                      <p className="text-xs text-gray-600 font-normal leading-relaxed line-clamp-2">
                        {t.descricao}
                      </p>
                    )}

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">
                        Parceiro: <strong className="text-[#00441F]">{t.leads?.nome || "Não informado"}</strong>
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isConcluida ? "text-emerald-600" : "text-amber-600"}`}>
                        {isConcluida ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> Pendente
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : drilldown.negocios.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              Nenhuma proposta ou negócio associado a este recorte.
            </div>
          ) : (
            drilldown.negocios.map((n) => {
              const ganho = isGanho(n.etapa_funil);
              const perdido = isPerdido(n.etapa_funil);

              return (
                <div
                  key={n.id}
                  className="p-4 rounded-xl border border-gray-200/80 bg-white hover:border-[#00CF7B]/60 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {n.leads?.nome || "Lead sem nome"}
                        </span>
                        {n.modalidade && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                            {n.modalidade}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                        {n.titulo || "Simulação de Consórcio"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-[#00441F] block">
                        {formatBRL(n.credito)}
                      </span>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 uppercase ${
                          ganho
                            ? "bg-emerald-100 text-emerald-800"
                            : perdido
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {n.etapa_funil?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      Representante: <strong className="text-gray-800">{n.usuarios?.nome || "Vendedor"}</strong>
                    </span>
                    <span>
                      Data: {new Date(n.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Total de Registros de Origem: {activeTab === "tarefas" ? drilldown.tarefas.length : drilldown.negocios.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
