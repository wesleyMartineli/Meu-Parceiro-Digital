import React from "react";
import { getPropostaContent } from "@/lib/proposta-content";
import { PropostaData } from "./CapaProposta";

interface ComoFuncionaPropostaProps {
  data: PropostaData;
}

export function ComoFuncionaProposta({ data }: ComoFuncionaPropostaProps) {
  const content = getPropostaContent(data.produto);
  const corPrimaria = data.corPrimaria || "#00CF7B";

  return (
    <div
      className="a4-container bg-[#e9ebe4] shadow-2xl flex flex-col mx-auto overflow-hidden text-gray-900 relative"
      style={{
        width: "794px",
        height: "1123px", // A4
      }}
    >
      {/* Top Accent Line */}
      <div className="h-2 w-full" style={{ backgroundColor: corPrimaria }}></div>

      {/* Inner Padding Container */}
      <div className="flex-1 flex flex-col p-12">
        {/* Header Section */}
        <header className="mb-10 pb-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span 
                className="inline-block px-3 py-1 font-semibold rounded uppercase tracking-wider text-xs"
                style={{ backgroundColor: `${corPrimaria}20`, color: corPrimaria }}
              >
                {content.label}
              </span>
            </div>
            <span className="text-[#00441F] font-semibold text-xs font-semibold uppercase tracking-widest">
              Página 3
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-4">
            Como funciona o consórcio de {content.label}
          </h1>
          <p className="text-base text-[#00441F] font-semibold max-w-[90%] leading-relaxed">
            O consórcio é a maneira mais inteligente e planejada de construir seu patrimônio sem pagar juros. Entenda a jornada até a conquista do seu objetivo.
          </p>
        </header>

        {/* Timeline Section */}
        <section className="mb-12 relative">
          {/* Horizontal Connector Line */}
          <div className="absolute top-[28px] left-[10%] right-[10%] h-[1px] bg-gray-200 z-0"></div>
          <div className="grid grid-cols-4 gap-6 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative bg-[#e9ebe4]">
              <div 
                className="w-14 h-14 rounded-full bg-[#e9ebe4] border border-gray-200 shadow-sm flex items-center justify-center mb-4 z-10"
                style={{ color: corPrimaria }}
              >
                <span className="material-symbols-outlined text-[28px]">group_add</span>
              </div>
              <h3 className="text-sm font-bold mb-1">Entrada no Grupo</h3>
              <p className="text-xs text-[#00441F] font-semibold px-2">
                Você se une a pessoas com o mesmo objetivo, formando um fundo comum.
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative bg-[#e9ebe4]">
              <div 
                className="w-14 h-14 rounded-full bg-[#e9ebe4] border border-gray-200 shadow-sm flex items-center justify-center mb-4 z-10"
                style={{ color: corPrimaria }}
              >
                <span className="material-symbols-outlined text-[28px]">payments</span>
              </div>
              <h3 className="text-sm font-bold mb-1">Pagamento Mensal</h3>
              <p className="text-xs text-[#00441F] font-semibold px-2">
                Todos pagam parcelas fixas sem juros, poupando em conjunto.
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative bg-[#e9ebe4]">
              <div 
                className="w-14 h-14 rounded-full bg-[#e9ebe4] border border-gray-200 shadow-sm flex items-center justify-center mb-4 z-10"
                style={{ color: corPrimaria }}
              >
                <span className="material-symbols-outlined text-[28px]">gavel</span>
              </div>
              <h3 className="text-sm font-bold mb-1">Assembleias e Lances</h3>
              <p className="text-xs text-[#00441F] font-semibold px-2">
                Mensalmente, ocorrem sorteios e lances para definir os contemplados.
              </p>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center relative bg-[#e9ebe4]">
              <div 
                className="w-14 h-14 rounded-full border-2 shadow-sm flex items-center justify-center mb-4 z-10"
                style={{ 
                  borderColor: corPrimaria, 
                  backgroundColor: `${corPrimaria}10`,
                  color: corPrimaria 
                }}
              >
                <span className="material-symbols-outlined text-[28px]">key</span>
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: corPrimaria }}>Contemplação</h3>
              <p className="text-xs text-[#00441F] font-semibold px-2">
                Você recebe a carta de crédito integral para comprar o seu bem.
              </p>
            </div>
          </div>
        </section>

        {/* Deep-Dive Cards Section */}
        <section className="grid grid-cols-2 gap-6 flex-1">
          {/* Card A: Sorteio */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-200 rounded text-gray-700">
                <span className="material-symbols-outlined">casino</span>
              </div>
              <h3 className="text-lg font-bold">Contemplação por Sorteio</h3>
            </div>
            <p className="text-sm text-[#00441F] font-semibold leading-relaxed">
              A forma natural de receber o crédito. Todos os participantes com os pagamentos em dia concorrem em igualdade de condições nas assembleias mensais.
            </p>
          </div>
          {/* Card B: Lances */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col relative overflow-hidden">
            <div 
              className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 opacity-50"
              style={{ backgroundColor: `${corPrimaria}20` }}
            ></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div 
                className="p-2 rounded"
                style={{ backgroundColor: `${corPrimaria}20`, color: corPrimaria }}
              >
                <span className="material-symbols-outlined">rocket_launch</span>
              </div>
              <h3 className="text-lg font-bold">Acelere com Lances</h3>
            </div>
            <p className="text-sm text-[#00441F] font-semibold leading-relaxed relative z-10">
              Não quer depender da sorte? Se você possui uma reserva financeira, pode ofertar um lance (pagamento antecipado de parcelas) para aumentar suas chances.
            </p>
          </div>
        </section>

        {/* Informative Footer Box */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-start gap-4">
             <div className="p-2 bg-gray-200 rounded-full text-[#00441F] font-semibold">
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              <div>
                <h4 className="font-bold mb-1">Transparência Total</h4>
                <p className="text-sm text-[#00441F] font-semibold">No consórcio não existe juros, apenas a taxa de administração que já está diluída nas parcelas mensais, garantindo que você pague um valor justo pelo crédito contratado.</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

