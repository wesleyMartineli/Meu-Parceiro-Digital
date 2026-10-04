import React from "react";
import { PropostaData } from "./CapaProposta";

interface ResumoOperacaoPropostaProps {
  data: PropostaData;
}

export function formatCurrency(value?: number) {
  if (value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ResumoOperacaoProposta({ data }: ResumoOperacaoPropostaProps) {
  const corPrimaria = data.corPrimaria || "#00CF7B";

  return (
    <div
      className="a4-container bg-[#e9ebe4] shadow-2xl flex flex-col mx-auto overflow-hidden text-gray-900 relative"
      style={{
        width: "794px",
        height: "1123px", // A4
      }}
    >
      <div className="flex flex-col flex-1 p-12">
        {/* Page Header */}
        <header className="flex justify-between items-end border-b-2 pb-4 mb-8" style={{ borderColor: corPrimaria }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: corPrimaria }}>
              PROPOSTA FINANCEIRA
            </p>
            <h1 className="text-4xl font-bold">Resumo da Operação</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#00441F] font-semibold bg-gray-100 px-4 py-1 rounded-full font-bold">
              PÁGINA 4
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-col flex-grow gap-8">
          {/* Context Banner */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: corPrimaria }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                analytics
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Visão Geral da Simulação</h2>
              <p className="text-sm text-[#00441F] font-semibold">Detalhamento dos valores e condições para aquisição planejada.</p>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6 flex-grow">
            {/* Left Side: Technical Data & Primary Highlights (8 cols) */}
            <div className="col-span-8 flex flex-col gap-6">
              {/* Top Highlights row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Gross Credit Card */}
                <div className="bg-[#e9ebe4] border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div 
                    className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 -z-10"
                    style={{ backgroundColor: corPrimaria }}
                  ></div>
                  <p className="text-xs text-[#00441F] font-semibold uppercase mb-4 font-bold">Planilha Financeira</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#00441F] font-semibold">Crédito Bruto (Total)</span>
                      <span className="text-sm font-semibold">{formatCurrency(data.creditoBruto)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#00441F] font-semibold">Lance Embutido</span>
                      <span className="text-sm font-semibold">{formatCurrency(data.lanceEmbutido)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#00441F] font-semibold">Recursos Próprios</span>
                      <span className="text-sm font-semibold">{formatCurrency(data.recursosProprios)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#00441F] font-semibold">Lance Ofertado Total</span>
                      <span className="text-sm font-semibold">{formatCurrency(data.lanceOfertado)} ({data.lanceOfertadoPercentual || 0}%)</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase" style={{ color: corPrimaria }}>Crédito Líquido Disponível</span>
                      <span className="text-lg font-bold" style={{ color: corPrimaria }}>{formatCurrency(data.creditoLiquido)}</span>
                    </div>
                  </div>
                </div>

                {/* Initial Installment Card */}
                <div className="bg-[#e9ebe4] border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gray-100 rounded-bl-full opacity-50 -z-10"></div>
                  <p className="text-xs text-[#00441F] font-semibold uppercase mb-2 font-bold">Parcela Inicial</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(data.parcelaInicial)}</h3>
                  <div className="mt-4 flex justify-between items-center border-t border-gray-200 pt-3">
                    <span className="text-xs text-[#00441F] font-semibold">Pós-Contemplação</span>
                    <span className="text-xs font-bold">{formatCurrency(data.parcelaPosContemplacao)}</span>
                  </div>
                </div>
              </div>

              {/* Technical Data Grid */}
              <div className="bg-[#e9ebe4] border border-gray-200 rounded-xl p-6 shadow-sm flex-grow">
                <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: corPrimaria }}>tune</span> Dados Técnicos
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-xs text-[#00441F] font-semibold uppercase mb-1 font-bold">Parcela Inicial</p>
                    <p className="text-base font-medium">{formatCurrency(data.parcelaInicial)}</p>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-xs text-[#00441F] font-semibold uppercase mb-1 font-bold">Parcela Pós-Contemplação</p>
                    <p className="text-base font-medium">{formatCurrency(data.parcelaPosContemplacao)}</p>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-xs text-[#00441F] font-semibold uppercase mb-1 font-bold">Mês Estimado Contemplação</p>
                    <p className="text-base font-medium">{data.mesContemplacao || 1}º mês</p>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-xs text-[#00441F] font-semibold uppercase mb-1 font-bold">Taxa Adm. Total</p>
                    <p className="text-base font-medium">{data.taxaAdmin || 0}%</p>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-xs text-[#00441F] font-semibold uppercase mb-1 font-bold">Total Final Pago</p>
                    <p className="text-base font-medium">{formatCurrency(data.totalFinal)}</p>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-xs text-[#00441F] font-semibold uppercase mb-1 font-bold">TAXA MENSAL SOB SALDO LÍQ.</p>
                    <p className="text-base font-bold uppercase" style={{ color: corPrimaria }}>{data.taxaMensal || 0}% a.m.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Secondary Info & Final Totals (4 cols) */}
            <div className="col-span-4 flex flex-col gap-6">
              {/* Group Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#00441F] font-semibold">group</span>
                  <h4 className="text-lg font-bold">Dados do Grupo</h4>
                </div>
                <div className="bg-[#e9ebe4] p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-[#00441F] font-semibold uppercase mb-1 font-bold">Prazo Máximo do Grupo</p>
                  <p className="text-2xl font-bold">{data.prazo} meses</p>
                </div>
              </div>

              {/* Contemplation Estimate */}
              <div 
                className="rounded-xl p-6 border relative overflow-hidden text-white"
                style={{ backgroundColor: corPrimaria, borderColor: corPrimaria }}
              >
                <div className="absolute right-0 bottom-0 opacity-20">
                  <span className="material-symbols-outlined" style={{ fontSize: "120px" }}>event_available</span>
                </div>
                <h4 className="text-xs uppercase mb-3 relative z-10 font-bold opacity-90">Estimativa de Contemplação</h4>
                <p className="text-4xl font-bold relative z-10">{data.mesContemplacao || 1}º mês</p>
                <p className="text-[10px] mt-3 relative z-10 opacity-80">*Sujeito a variações do lance embutido e saldo do grupo.</p>
              </div>

              {/* Spacer */}
              <div className="flex-grow"></div>

              {/* Final Total Card */}
              <div className="bg-gray-900 text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white opacity-10"></div>
                <p className="text-xs text-[#00441F] font-semibold uppercase mb-2 font-bold relative z-10">Total Final Pago</p>
                <h3 className="text-3xl font-bold relative z-10">{formatCurrency(data.totalFinal)}</h3>
                <div className="mt-6 border-t border-gray-700 pt-4 relative z-10 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#00441F] font-semibold text-sm mt-0.5">info</span>
                  <p className="text-[10px] text-[#00441F] font-semibold leading-tight">
                    Valor base para fins de simulação financeira. Consulte o memorial descritivo completo na próxima página.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#00441F] font-semibold">strategy</span>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">ANÁLISE ESTRATÉGICA DO PLANO</h4>
            </div>
            <p className="text-sm text-[#00441F] font-semibold leading-relaxed">
              Cálculo de amortização: <strong>{data.amortizacao || "Linear"}</strong>. Todas as taxas (fundo comum, administração e reserva) são distribuídas no prazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

