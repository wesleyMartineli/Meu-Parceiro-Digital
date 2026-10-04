import React from "react";
import { getPropostaContent } from "@/lib/proposta-content";
import { PropostaData } from "./CapaProposta";

interface QuemSomosPropostaProps {
  data: PropostaData;
}

export function QuemSomosProposta({ data }: QuemSomosPropostaProps) {
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
      {/* Header */}
      <header className="w-full px-12 py-8 flex justify-between items-center border-b border-gray-200">
        <span className="text-xs text-[#00441F] font-semibold uppercase tracking-widest font-semibold">
          Quem Somos
        </span>
        <span 
          className="text-xs uppercase tracking-widest px-3 py-1 rounded-full font-semibold"
          style={{ color: corPrimaria, backgroundColor: `${corPrimaria}20` }}
        >
          PÁGINA 2
        </span>
      </header>

      {/* Main Content Area */}
      <div className="px-12 py-10 flex-grow flex flex-col gap-8">
        {/* Quem Somos Section */}
        <section className="grid grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold leading-tight">
              Ser o parceiro<br />
              <span style={{ color: corPrimaria }}>do próximo passo.</span>
            </h1>
            <p className="text-sm text-[#00441F] font-semibold leading-relaxed">
              Há mais de 55 anos, a Rodobens atua no mercado de consórcios com tradição e pioneirismo, ajudando pessoas e empresas a transformarem planejamento em conquistas.
            </p>
            <p className="text-sm text-[#00441F] font-semibold leading-relaxed">
              Com uma estrutura sólida, atuação nacional e um amplo portfólio de soluções, a Rodobens oferece caminhos para quem deseja adquirir, construir, investir ou realizar novos projetos de forma planejada.
            </p>
          </div>
          <div className="w-full h-72 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative group">
            <img 
              src={content.quemSomosBg} 
              alt="Quem Somos" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Administradora Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">Cota administrada por</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#00441F] border border-gray-200 rounded-lg p-6 flex items-center justify-center h-20 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xl font-bold text-white uppercase tracking-wider text-center">
                RODOBENS
              </span>
            </div>
          </div>
        </section>

        {/* A força Section */}
        <section className="flex flex-col gap-6 mt-2">
          <h2 className="text-2xl font-bold">A força de quem entende de consórcio</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 p-5 rounded-lg border border-gray-200 bg-[#e9ebe4] shadow-sm">
              <h3 className="text-base font-bold text-[#00441F]">+ de 55 anos de experiência</h3>
              <p className="text-xs text-[#00441F] font-semibold leading-relaxed">Tradição e pioneirismo na administração de consórcios no Brasil.</p>
            </div>
            <div className="flex flex-col gap-2 p-5 rounded-lg border border-gray-200 bg-[#e9ebe4] shadow-sm">
              <h3 className="text-base font-bold text-[#00441F]">+ de 510 mil bens entregues</h3>
              <p className="text-xs text-[#00441F] font-semibold leading-relaxed">Uma história construída ao lado de milhares de clientes e projetos realizados.</p>
            </div>
            <div className="flex flex-col gap-2 p-5 rounded-lg border border-gray-200 bg-[#e9ebe4] shadow-sm">
              <h3 className="text-base font-bold text-[#00441F]">+ de R$ 14 bilhões administrados</h3>
              <p className="text-xs text-[#00441F] font-semibold leading-relaxed">Escala, experiência e estrutura para apoiar diferentes objetivos e momentos de vida.</p>
            </div>
            <div className="flex flex-col gap-2 p-5 rounded-lg border border-gray-200 bg-[#e9ebe4] shadow-sm">
              <h3 className="text-base font-bold text-[#00441F]">Amplo portfólio de produtos</h3>
              <p className="text-xs text-[#00441F] font-semibold leading-relaxed">Soluções para automóveis, imóveis, motos, serviços e outros projetos.</p>
            </div>
          </div>
        </section>
        
        {/* Slogan */}
        <div className="mt-auto pt-2 text-center">
            <p className="text-lg font-bold" style={{ color: corPrimaria }}>Rodobens. Ser o parceiro do próximo passo.</p>
        </div>
      </div>

      {/* Decorative Bottom Accent */}
      <div 
        className="h-2 w-full mt-auto"
        style={{ background: `linear-gradient(to right, ${corPrimaria}, transparent)` }}
      ></div>
    </div>
  );
}

