import React from 'react';

// Re-using the same interface from PropostaPDFDocument to avoid redefining
import { PropostaPDFDocumentProps } from '../proposta-pdf/PropostaPDFDocument';

export const PropostaPNGDocument = React.forwardRef<HTMLDivElement, PropostaPDFDocumentProps>(({ data }, ref) => {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const cPrimaria = data.corPrimaria || "#00CF7B";

  // Safe variables for Probabilidade
  const taxaAdmin = data.taxaAdmReal || data.taxaAdmin || 24;
  const prazo = data.prazo || 180;
  const taxaMensal = taxaAdmin / prazo;

  let percentual = data.lanceOfertadoPercentual || 0;
  if (!percentual && data.lanceOfertado && data.creditoBruto) {
    percentual = (data.lanceOfertado / data.creditoBruto) * 100;
  }

  return (
    <div
      ref={ref}
      className="bg-white relative overflow-hidden"
      style={{
        width: '450px',
        fontFamily: 'Inter, system-ui, sans-serif', 
      }}
    >
      {/* HEADER / CAPA */}
      <div 
        className="w-full h-[220px] bg-cover bg-center relative"
        style={{ 
          backgroundImage: `url(${data.capaBgUrl})`,
          backgroundColor: cPrimaria
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="text-white">
            <h1 className="text-2xl font-black uppercase leading-tight mb-1">
              Consórcio<br/>{data.produto}
            </h1>
            <p className="text-sm font-medium text-white/80 uppercase">
              Operação Estruturada
            </p>
          </div>
          {data.empresaLogo && (
            <div className="w-[70px] h-[70px] bg-white rounded-lg p-1.5 shadow-lg flex items-center justify-center">
              <img src={data.empresaLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-5 bg-[#F9FAF8]">

        {/* 1. VISÃO DE CRÉDITO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Visão de Crédito</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Crédito Bruto</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(data.creditoBruto)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Crédito Líquido</p>
              <p className="text-xl font-black" style={{ color: cPrimaria }}>{formatCurrency(data.creditoLiquido)}</p>
            </div>
          </div>
        </div>

        {/* 2. ESTRUTURA E PARCELAS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Oferta de Lance & Parcelas</h2>
          
          {/* Oferta */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Lance ({percentual.toFixed(2)}%)</span>
              <span className="text-lg font-bold text-gray-800">{formatCurrency(data.lanceOfertado)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>Embutido (Da Carta)</span>
              <span className="font-medium text-gray-600">{formatCurrency(data.lanceEmbutido)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Recursos Próprios</span>
              <span className="font-medium text-gray-600">{formatCurrency(data.recursosProprios)}</span>
            </div>
          </div>

          {/* Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Parcela Inicial</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(data.parcelaInicial)}</p>
              {data.taxaAdesaoDiluida ? (
                <p className="text-[9px] text-gray-400 mt-1">S/ fundo: {formatCurrency((data.parcelaInicial || 0) - data.taxaAdesaoDiluida)}</p>
              ) : null}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Pós-Contemplação</p>
              <p className="text-xl font-black" style={{ color: cPrimaria }}>{formatCurrency(data.parcelaPosContemplacao)}</p>
              <p className="text-[9px] text-gray-400 mt-1">{data.prazoPosContemplacao} meses restantes</p>
            </div>
          </div>
        </div>

        {/* 3. PROBABILIDADE E CUSTOS */}
        <div className="bg-[#E0E5CF] rounded-xl p-5 border border-[#C5D0A1]">
          <h2 className="text-[11px] font-bold text-[#00441F] uppercase tracking-wider mb-2">Probabilidade de Êxito</h2>
          <p className="text-xs text-[#00441F]/80 mb-3">Baseado no histórico do grupo.</p>
          
          <div className="flex justify-between items-end border-b border-[#00441F]/10 pb-3 mb-3">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#00441F]/70">Lance Ofertado</p>
              <p className="text-lg font-bold text-[#00441F]">{percentual.toFixed(2)}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-semibold text-[#00441F]/70">Chances</p>
              <p className="text-lg font-black" style={{ color: cPrimaria }}>{data.chancesDeContemplacao || "Alta"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-semibold text-[#00441F]/70 uppercase">Taxa Administrativa</p>
              <p className="text-sm font-bold text-[#00441F]">{data.taxaAdmReal?.toFixed(2) || taxaAdmin}% ({(taxaMensal).toFixed(2)}% a.m.)</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold text-[#00441F]/70 uppercase">Prazo do Grupo</p>
              <p className="text-sm font-bold text-[#00441F]">{prazo} Meses</p>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="p-5 bg-white border-t border-gray-100 flex justify-between items-center">
        <div>
          <p className="text-sm font-bold text-gray-800">{data.gerenteNome}</p>
          <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{data.empresaNome}</p>
          <p className="text-[9px] text-gray-400">Parceiro Autorizado Rodobens</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400">Gerado em</p>
          <p className="text-[10px] font-medium text-gray-600">{data.data}</p>
        </div>
      </div>

    </div>
  );
});

PropostaPNGDocument.displayName = 'PropostaPNGDocument';
