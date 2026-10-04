import React from "react";
import { getPropostaContent } from "@/lib/proposta-content";
import { PropostaData } from "./CapaProposta";
import { formatCurrency } from "./ResumoOperacaoProposta";

interface ProximosPassosPropostaProps {
  data: PropostaData;
}

export function ProximosPassosProposta({ data }: ProximosPassosPropostaProps) {
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
      <div className="flex flex-col flex-1 p-12">
        {/* Page Header */}
        <header className="flex justify-between items-end border-b-2 pb-4 mb-8" style={{ borderColor: corPrimaria }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: corPrimaria }}>
              FECHAMENTO COMERCIAL
            </p>
            <h1 className="text-4xl font-bold">Próximos Passos</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#00441F] font-semibold bg-gray-100 px-4 py-1 rounded-full font-bold">
              PÁGINA 8
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-8">
          <section className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Próximo passo para avançar com sua estratégia</h2>
            <p className="text-sm text-[#00441F] font-semibold">Revisamos cuidadosamente seu cenário e estruturamos uma solução de consórcio que alinha previsibilidade financeira com alto poder de alavancagem.</p>
          </section>

          {/* Resumo Estratégico */}
          <section className="bg-gray-50 border rounded-lg p-6 shadow-sm relative overflow-hidden" style={{ borderColor: corPrimaria }}>
            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: corPrimaria }}></div>
            <h3 className="text-xl font-bold mb-6 ml-2">Resumo Estratégico</h3>
            <div className="grid grid-cols-3 gap-6 mb-6 ml-2">
              <div>
                <p className="text-[10px] text-[#00441F] font-semibold uppercase tracking-wider mb-1 font-bold">CATEGORIA</p>
                <p className="text-lg font-bold">{content.label}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#00441F] font-semibold uppercase tracking-wider mb-1 font-bold">ADMINISTRADORA</p>
                <p className="text-lg font-bold">{data.adminNome}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#00441F] font-semibold uppercase tracking-wider mb-1 font-bold">CRÉDITO BRUTO</p>
                <p className="text-lg font-bold" style={{ color: corPrimaria }}>{formatCurrency(data.creditoBruto)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#00441F] font-semibold uppercase tracking-wider mb-1 font-bold">CRÉDITO LÍQUIDO</p>
                <p className="text-lg font-bold">{formatCurrency(data.creditoLiquido)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#00441F] font-semibold uppercase tracking-wider mb-1 font-bold">PARCELA INICIAL</p>
                <p className="text-lg font-bold">{formatCurrency(data.parcelaInicial)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#00441F] font-semibold uppercase tracking-wider mb-1 font-bold">LANCE TOTAL</p>
                <p className="text-lg font-bold">{formatCurrency(data.lanceOfertado)}</p>
              </div>
            </div>
            <div className="bg-[#e9ebe4] p-4 rounded border border-gray-200 ml-2">
              <p className="text-xs text-[#00441F] font-semibold flex items-start gap-2 leading-relaxed">
                <span className="material-symbols-outlined mt-0.5" style={{ color: corPrimaria }}>info</span>
                <span>Esta estratégia foi desenhada para maximizar suas chances de contemplação entre o <strong>1º ao 12º mês</strong>, mantendo a parcela dentro de uma margem segura de fluxo de caixa. O lance embutido aliado ao lance livre otimiza a competitividade.</span>
              </p>
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-[#e9ebe4] border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-8 text-center">Trilha de Sucesso</h3>
            <div className="flex flex-row justify-between items-center relative px-8">
              {/* Line */}
              <div className="absolute top-1/2 left-12 right-12 h-px bg-gray-200 -z-10"></div>
              
              <div className="flex flex-col items-center bg-[#e9ebe4] px-2 text-center">
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center mb-2 shadow-sm font-bold" style={{ backgroundColor: corPrimaria }}>1</div>
                <span className="text-xs font-bold">Validação</span>
              </div>
              <span className="material-symbols-outlined text-gray-300">arrow_forward</span>
              
              <div className="flex flex-col items-center bg-[#e9ebe4] px-2 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-[#00441F] font-semibold flex items-center justify-center mb-2 border border-gray-200 font-bold">2</div>
                <span className="text-xs font-bold text-[#00441F] font-semibold">Ajustes</span>
              </div>
              <span className="material-symbols-outlined text-gray-300">arrow_forward</span>
              
              <div className="flex flex-col items-center bg-[#e9ebe4] px-2 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-[#00441F] font-semibold flex items-center justify-center mb-2 border border-gray-200 font-bold">3</div>
                <span className="text-xs font-bold text-[#00441F] font-semibold">Formalização</span>
              </div>
              <span className="material-symbols-outlined text-gray-300">arrow_forward</span>
              
              <div className="flex flex-col items-center bg-[#e9ebe4] px-2 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-[#00441F] font-semibold flex items-center justify-center mb-2 border border-gray-200 font-bold">4</div>
                <span className="text-xs font-bold text-[#00441F] font-semibold">Acompanhamento</span>
              </div>
            </div>
          </section>

          {/* Assinaturas */}
          <section className="mt-auto flex flex-row justify-between gap-12 pt-8">
            <div className="w-5/12 text-center">
              <div className="border-b border-gray-400 w-full h-12 mb-3"></div>
              <p className="text-xs font-bold uppercase">{data.leadNome || "Assinatura do Cliente"}</p>
              <p className="text-[10px] text-[#00441F] font-semibold mt-1">Data: ___/___/20__</p>
            </div>
            <div className="w-5/12 text-center">
              <div className="border-b border-gray-400 w-full h-12 mb-3"></div>
              <p className="text-xs font-bold uppercase">{data.gerenteNome || "Gerente de Negócios"}</p>
              <p className="text-[10px] text-[#00441F] font-semibold mt-1">Meu Parceiro Digital | Rodobens</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-[9px] uppercase tracking-wider text-[#00441F] font-semibold flex items-center gap-2">
            <strong>Meu Parceiro Digital | Rodobens</strong>
          </div>
          <div className="text-[8px] text-[#00441F] font-semibold text-center uppercase">
            Esta proposta é válida por 5 dias úteis e não constitui garantia de contemplação.<br />
            Valores sujeitos a alteração de acordo com a administradora.
          </div>
        </footer>
      </div>
    </div>
  );
}

