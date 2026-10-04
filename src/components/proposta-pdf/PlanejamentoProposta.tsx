import React from "react";
import { PropostaData } from "./CapaProposta";
import { formatCurrency } from "./ResumoOperacaoProposta";

interface PlanejamentoPropostaProps {
  data: PropostaData;
}

export function PlanejamentoProposta({ data }: PlanejamentoPropostaProps) {
  const corPrimaria = data.corPrimaria || "#00CF7B";

  // Calcular economia ou desconto
  const valorParcelaInicial = data.parcelaInicial || 0;
  const valorParcelaNova = data.parcelaPosContemplacao || 0;
  const reducaoPercentual = valorParcelaInicial > 0 
    ? Math.round(((valorParcelaInicial - valorParcelaNova) / valorParcelaInicial) * 100)
    : 0;

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
              PLANEJAMENTO FINANCEIRO E JORNADA DE CONTEMPLAÇÃO
            </p>
            <h1 className="text-4xl font-bold">Fluxo de Caixa Estratégico</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#00441F] font-semibold bg-gray-100 px-4 py-1 rounded-full font-bold">
              PÁGINA 6
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-8">
          
          <p className="text-sm text-[#00441F] font-semibold leading-relaxed border-l-4 pl-4" style={{ borderColor: corPrimaria }}>
            Uma visão estratégica do fluxo de caixa e evolução do seu patrimônio.
          </p>

          {/* Section 1: Timeline */}
          <div className="relative py-4 mb-4">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2 z-0"></div>
            
            <div className="flex flex-col gap-8 relative z-10">
              {/* Milestone A */}
              <div className="flex flex-row items-center gap-8 w-full">
                <div className="w-1/2 flex justify-end pr-8">
                  <div className="bg-[#e9ebe4] border border-gray-200 rounded-lg p-6 shadow-sm w-full max-w-sm relative">
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-300 border-4 border-white"></div>
                    <div className="flex items-center gap-2 mb-4 text-[#00441F] font-semibold">
                      <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                      <span className="text-xs font-bold uppercase tracking-widest">ANTES DA CONTEMPLAÇÃO</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-[#00441F] font-semibold text-sm">Parcela Inicial:</span>
                        <span className="text-lg font-bold">{formatCurrency(data.parcelaInicial)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-[#00441F] font-semibold text-sm">Tempo Estimado:</span>
                        <span className="text-sm font-medium text-right">Até o {data.mesContemplacao || 1}º mês<br />da contemplação</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-1/2"></div>
              </div>

              {/* Milestone B */}
              <div className="flex flex-row items-center gap-8 w-full">
                <div className="w-1/2"></div>
                <div className="w-1/2 flex justify-start pl-8">
                  <div className="bg-[#e9ebe4] border rounded-lg p-6 shadow-md w-full max-w-sm relative overflow-hidden" style={{ borderColor: `${corPrimaria}40` }}>
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: corPrimaria }}></div>
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-20" style={{ backgroundColor: corPrimaria }}>
                      <div className="w-2 h-2 bg-[#e9ebe4] rounded-full"></div>
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4" style={{ color: corPrimaria }}>
                        <span className="material-symbols-outlined text-[20px]">stars</span>
                        <span className="text-xs font-bold uppercase tracking-widest">NO MOMENTO DA CONTEMPLAÇÃO</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="bg-[#e9ebe4] rounded p-3 border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-[#00441F] font-semibold text-[10px] uppercase tracking-wide font-bold">Lance Ofertado</span>
                              <span className="text-lg font-bold">{formatCurrency(data.lanceOfertado)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                              <span className="text-[#00441F] font-semibold text-xs">Lance Embutido:</span>
                              <span className="text-xs font-bold">{formatCurrency(data.lanceEmbutido)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                              <span className="text-[#00441F] font-semibold text-xs">Recursos Próprios:</span>
                              <span className="text-xs font-bold">{formatCurrency(data.recursosProprios)}</span>
                          </div>
                        </div>
                        <div className="text-white rounded p-3 flex justify-between items-center shadow-sm" style={{ backgroundColor: corPrimaria }}>
                          <span className="text-[10px] uppercase tracking-wide font-bold opacity-90">Crédito Líquido</span>
                          <span className="text-xl font-bold">{formatCurrency(data.creditoLiquido)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone C */}
              <div className="flex flex-row items-center gap-8 w-full">
                <div className="w-1/2 flex justify-end pr-8">
                  <div className="bg-[#e9ebe4] border border-gray-200 rounded-lg p-6 shadow-sm w-full max-w-sm relative">
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-300 border-4 border-white"></div>
                    <div className="flex items-center gap-2 mb-4 text-[#00441F] font-semibold">
                      <span className="material-symbols-outlined text-[20px]">done_all</span>
                      <span className="text-xs font-bold uppercase tracking-widest">APÓS CONTEMPLAÇÃO</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
                        <span className="text-[#00441F] font-semibold text-sm">Nova Parcela:</span>
                        <span className="text-xl font-bold" style={{ color: corPrimaria }}>{formatCurrency(data.parcelaPosContemplacao)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-[#00441F] font-semibold text-sm">Saldo Devedor:</span>
                        <span className="text-sm font-medium">Ajustado</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#00441F] font-semibold text-sm">Foco:</span>
                        <span className="text-sm font-medium">Usufruto do Bem</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Section 2: Comparison */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <span className="material-symbols-outlined">compare_arrows</span>
              <h2 className="text-lg font-bold">Comparativo de Estados</h2>
            </div>
            <div className="flex flex-row items-stretch justify-between gap-4 relative">
              {/* Before Card */}
              <div className="flex-1 bg-[#e9ebe4] rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-[#00441F] font-bold uppercase tracking-wider mb-2">ESTRUTURA ATUAL</div>
                  <div className="text-gray-800 text-xs mb-1">Parcela Mensal</div>
                  <div className="text-xl font-bold mb-2">{formatCurrency(data.parcelaInicial)}</div>
                </div>
                <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between">
                  <span className="text-[#00441F] font-semibold text-xs">Prazo Total</span>
                  <span className="text-xs font-bold">{data.prazo} meses</span>
                </div>
              </div>
              
              {/* Transition Arrow */}
              <div className="flex flex-col justify-center items-center px-2 text-[#00441F] font-semibold">
                <span className="material-symbols-outlined text-[30px]">arrow_forward</span>
              </div>
              
              {/* After Card */}
              <div className="flex-1 bg-[#e9ebe4] rounded-lg border-2 p-4 shadow-md flex flex-col justify-between relative overflow-hidden" style={{ borderColor: `${corPrimaria}60` }}>
                {reducaoPercentual > 0 && (
                  <div className="absolute top-0 right-0 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg" style={{ backgroundColor: corPrimaria }}>
                    -{reducaoPercentual}% na parcela
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: corPrimaria }}>ESTRUTURA PÓS-LANCE</div>
                  <div className="text-gray-800 text-xs mb-1">Nova Parcela</div>
                  <div className="text-xl font-bold mb-2" style={{ color: corPrimaria }}>{formatCurrency(data.parcelaPosContemplacao)}</div>
                </div>
                <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[#00441F] font-semibold text-xs">Amortização</span>
                  <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded uppercase">{data.amortizacao || "Linear"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Summary Box */}
          <div className="bg-gray-900 text-white rounded-xl p-6 flex flex-row items-center justify-between gap-6 shadow-lg mt-auto">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full flex items-center justify-center bg-[#e9ebe4]/10">
                <span className="material-symbols-outlined text-[32px]" style={{ color: corPrimaria }}>account_balance_wallet</span>
              </div>
              <div>
                <div className="text-[10px] text-[#00441F] font-semibold uppercase font-bold tracking-wider mb-1">Saldo Final Projetado</div>
                <div className="text-3xl font-bold leading-none">{formatCurrency(data.totalFinal)}</div>
              </div>
            </div>
            <div className="max-w-xs text-xs text-[#00441F] font-semibold border-l border-gray-700 pl-4">
              A estratégia de lance otimiza seu fluxo de caixa, garantindo a antecipação do bem e gerando uma economia significativa no montante final.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

