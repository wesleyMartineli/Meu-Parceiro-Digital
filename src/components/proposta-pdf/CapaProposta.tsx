import React from "react";
import { getPropostaContent } from "@/lib/proposta-content";

export interface PropostaData {
  leadNome: string;
  gerenteNome: string;
  adminNome: string;
  codigo: string;
  data: string;
  produto: string;
  empresaNome: string;
  empresaLogo?: string | null;
  corPrimaria?: string;
  corSecundaria?: string;
  capaBgUrl?: string;

  // Financial fields
  creditoBruto?: number;
  lanceEmbutido?: number;
  recursosProprios?: number;
  lanceOfertado?: number;
  lanceOfertadoPercentual?: number;
  creditoLiquido?: number;
  parcelaInicial?: number;
  parcelaPosContemplacao?: number;
  parcelaPosAdesao?: number;
  prazoTaxaAdesao?: number;
  mesContemplacao?: number;
  taxaAdmin?: number;
  taxaAdmReal?: number;
  temDescontoCampanha?: boolean;
  totalFinal?: number;
  taxaMensal?: number;
  prazo?: number;
  amortizacao?: string;
  chancesOferta?: string | number | null;
  isRodobens?: boolean;
  mediaGrupo?: string | number | null;
  ofertaAtualParaMedia?: number | null;
  taxaAdesaoDiluida?: number;
  parcelaSemFundoReserva?: number;
  prazoPosContemplacao?: number;
  chancesDeContemplacao?: string | number | null;
}

interface CapaPropostaProps {
  data: PropostaData;
}

export function CapaProposta({ data }: CapaPropostaProps) {
  const content = getPropostaContent(data.produto);

  return (
    <div
      className="a4-container rounded-lg shadow-2xl relative flex flex-col mx-auto overflow-hidden bg-[#e9ebe4]"
      style={{
        width: "794px",
        height: "1123px", // A4
      }}
    >
      {/* Hero Background Image Section */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Capa"
          className="w-full h-full object-cover"
          src={content.heroImage}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)",
          }}
        ></div>
      </div>

      {/* Top Header / Logo */}
      <div className="relative z-10 p-8 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img
            src="/brand/meu-parceiro-digital-logo-transparente.png"
            alt="Meu Parceiro Digital | Rodobens"
            className="h-16 object-contain drop-shadow-md"
            onError={(e) => {
              // Fallback se a imagem transparente não carregar bem
              e.currentTarget.src = "/brand/meu-parceiro-digital-logo.png";
              e.currentTarget.className = "h-14 object-contain rounded bg-[#e9ebe4] p-2";
            }}
          />
        </div>
      </div>

      {/* Spacer to push content down */}
      <div className="flex-grow z-10"></div>

      {/* Bottom Content Overlay */}
      <div className="relative z-10 w-full p-8 flex flex-col gap-8">
        {/* Main Title & Headline */}
        <div
          className="flex flex-col gap-4 max-w-2xl pl-4"
          style={{ borderLeft: `4px solid ${data.corPrimaria || "#00CF7B"}` }}
        >
          <h1 className="text-5xl font-bold text-white uppercase leading-[1.1] drop-shadow-md tracking-tight">
            Proposta Comercial de Consórcio
          </h1>
          <p className="text-lg text-gray-200 opacity-90 drop-shadow-sm max-w-xl font-medium leading-relaxed">
            {content.slogan}
          </p>
        </div>

        {/* Client & Proposal Details Card (Glassmorphism) */}
        <div className="bg-[#e9ebe4]/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mt-4 flex flex-col md:flex-row justify-between gap-6">
          {/* Left Col: Client & Admin */}
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 font-semibold">
                Apresentado Para
              </p>
              <p className="text-2xl font-bold text-white">{data.leadNome}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 font-semibold">
                Administradora
              </p>
              <p className="text-base text-white font-medium">{data.adminNome}</p>
            </div>
          </div>

          {/* Right Col: Consultant & Meta */}
          <div className="flex flex-col gap-4 flex-1 md:items-end md:text-right">
            <div>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 font-semibold">
                Gerente de Negócios
              </p>
              <p className="text-base text-white font-medium">{data.gerenteNome}</p>
            </div>
            <div className="flex gap-6 md:justify-end w-full">
              <div>
                <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 font-semibold">
                  Código
                </p>
                <p className="text-sm text-white font-mono bg-black/20 px-2 py-1 rounded">
                  {data.codigo}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 font-semibold">
                  Data
                </p>
                <p className="text-sm text-white font-medium">{data.data}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Line */}
        <div
          className="h-1 w-full rounded-full mt-2"
          style={{
            background: `linear-gradient(to right, ${data.corPrimaria || "#00CF7B"}, transparent)`,
          }}
        ></div>
      </div>
    </div>
  );
}

