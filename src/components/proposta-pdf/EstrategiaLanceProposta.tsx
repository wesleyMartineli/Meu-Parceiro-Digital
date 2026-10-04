import React from "react";
import { PropostaData } from "./CapaProposta";
import { formatCurrency } from "./ResumoOperacaoProposta";

interface EstrategiaLancePropostaProps {
  data: PropostaData;
}

export function EstrategiaLanceProposta({ data }: EstrategiaLancePropostaProps) {
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
              ESTRATÉGIA DE LANCE
            </p>
            <h1 className="text-4xl font-bold">Composição da Oferta</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#00441F] font-semibold bg-gray-100 px-4 py-1 rounded-full font-bold">
              PÁGINA 5
            </span>
          </div>
        </header>

        {/* Document Content */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Context Banner */}
          <section className="border-b border-gray-200 pb-4">
            <p className="text-sm text-[#00441F] font-semibold max-w-2xl leading-relaxed">
              Uma alocação inteligente de recursos visando a aceleração da sua contemplação. Esta proposta foi desenhada para maximizar suas chances no curto prazo, equilibrando fluxo de caixa e competitividade no grupo.
            </p>
          </section>

          {/* Bid Composition Panel (Bento Layout) */}
          <section className="bg-gray-50 rounded p-6 mb-2 flex items-center justify-between border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: corPrimaria }}
              >
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Crédito Líquido Disponível</h2>
                <p className="text-xs text-[#00441F] font-semibold">Valor disponível para uso após descontos do lance</p>
              </div>
            </div>
            <div className="text-3xl tracking-tight font-bold" style={{ color: corPrimaria }}>
              {formatCurrency(data.creditoLiquido)}
            </div>
          </section>

          <section className="grid grid-cols-3 gap-6">
            {/* Lance Embutido */}
            <div className="bg-[#e9ebe4] border border-gray-200 rounded p-6 flex flex-col justify-between shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                </div>
                <span className="text-xs font-bold uppercase text-gray-700">Lance Embutido</span>
              </div>
              <div>
                <span className="text-xs text-[#00441F] font-semibold">Valor da Carta Utilizado</span>
                <div className="text-xl font-bold mt-1">{formatCurrency(data.lanceEmbutido)}</div>
              </div>
            </div>

            {/* Recursos Próprios */}
            <div className="bg-[#e9ebe4] border border-gray-200 rounded p-6 flex flex-col justify-between shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                </div>
                <span className="text-xs font-bold uppercase text-gray-700">Recursos Próprios</span>
              </div>
              <div>
                <span className="text-xs text-[#00441F] font-semibold">Capital Imediato</span>
                <div className="text-xl font-bold mt-1">{formatCurrency(data.recursosProprios)}</div>
              </div>
            </div>

            {/* Lance Total Ofertado */}
            <div 
              className="rounded p-6 flex flex-col justify-between relative overflow-hidden shadow-lg text-white"
              style={{ backgroundColor: corPrimaria }}
            >
              <div className="absolute -right-4 -top-4 opacity-20">
                <span className="material-symbols-outlined text-[100px]">rocket_launch</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-white">gavel</span>
                  <span className="text-xs font-bold uppercase text-white">Lance Total Ofertado</span>
                </div>
                <div className="mt-auto pt-4">
                  <div className="text-3xl font-bold tracking-tighter leading-none">
                    {formatCurrency(data.lanceOfertado)}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-[#e9ebe4]/20 border border-white/30 rounded px-3 py-1 inline-flex items-center gap-2 w-max relative z-10">
                <span className="material-symbols-outlined text-[16px] text-white">pie_chart</span>
                <span className="text-xs font-bold text-white">{data.lanceOfertadoPercentual || 0}% da Carta</span>
              </div>
            </div>
          </section>

          {/* Strategic Recommendation */}
          <section className="bg-gray-50 border-l-[4px] p-6 rounded-r flex gap-4 items-start" style={{ borderColor: corPrimaria }}>
            <span className="material-symbols-outlined text-[24px] mt-[2px]" style={{ color: corPrimaria }}>lightbulb</span>
            <div>
              <h3 className="text-xs font-bold uppercase mb-2 tracking-widest">Recomendação Estratégica</h3>
              <p className="text-sm text-[#00441F] font-semibold italic leading-relaxed">
                "Nesta estratégia, parte da oferta é composta por lance embutido e parte por recursos próprios, aumentando a competitividade da operação e reduzindo a necessidade de capital imediato."
              </p>
            </div>
          </section>

          {/* Impact Indicator */}
          <section className="mt-auto">
            <h3 className="text-xs font-bold uppercase mb-4 tracking-widest text-gray-800">Impacto na Contemplação</h3>
            <div className="bg-gray-50 border border-gray-200 rounded p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-lg font-bold">Probabilidade de Êxito</div>
                  <div className="text-xs text-[#00441F] font-semibold mt-1">Baseado no histórico do grupo selecionado</div>
                </div>
                <div className="text-xl font-bold flex items-center gap-2" style={{ color: corPrimaria }}>
                  Alta
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
              </div>
              {/* Progress Bar Simulation */}
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-gray-300 w-[20%] border-r border-white"></div>
                <div className="h-full bg-gray-400 w-[40%] border-r border-white"></div>
                {/* Active zone */}
                <div className="h-full w-[35%] relative" style={{ backgroundColor: corPrimaria }}>
                  {/* Striped pattern via CSS linear-gradient for texture */}
                  <div 
                    className="absolute inset-0 opacity-20" 
                    style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, #fff 5px, #fff 10px)" }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase">Baixa</span>
                <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase ml-12">Média</span>
                <span className="text-[10px] font-bold uppercase" style={{ color: corPrimaria }}>Alta</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

