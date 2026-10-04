import React from "react";
import { PropostaData } from "./CapaProposta";
import { formatCurrency } from "./ResumoOperacaoProposta";

interface CronogramaPropostaProps {
  data: PropostaData;
}

export function CronogramaProposta({ data }: CronogramaPropostaProps) {
  const corPrimaria = data.corPrimaria || "#00CF7B";

  // Simulate a few months for the projection table
  const projecaoMeses = Array.from({ length: 8 }).map((_, index) => {
    const mes = index + 1;
    // Mock values based on the initial parcel
    const isReajuste = mes >= 3;
    const isContemplacao = mes === (data.mesContemplacao || 1);
    
    // Simulate slight increase on month 3 for INCC
    const multiplier = isReajuste ? 1.015 : 1; 
    const parcela = (data.parcelaInicial || 0) * multiplier;
    
    // Approximate breakdown
    const taxaAdm = parcela * 0.17;
    const fundoReserva = parcela * 0.04;
    const fundoComum = parcela - taxaAdm - fundoReserva;

    return {
      mes: mes.toString().padStart(2, '0'),
      fundoComum,
      taxaAdm,
      fundoReserva,
      parcela,
      isReajuste: mes === 3,
      isContemplacao,
    };
  });

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
              CRONOGRAMA
            </p>
            <h1 className="text-4xl font-bold">Projeção Mensal</h1>
            <p className="text-sm text-[#00441F] font-semibold mt-2">Visão dos primeiros meses do plano de consórcio.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#00441F] font-semibold bg-gray-100 px-4 py-1 rounded-full font-bold">
              PÁGINA 7
            </span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6 mb-8 flex-grow">
          {/* Highlights Cards (Bento) */}
          <div className="col-span-4 flex flex-col gap-6">
            {/* Evolução do Saldo */}
            <div className="bg-[#e9ebe4] border border-gray-200 rounded-lg p-6 shadow-sm relative overflow-hidden">
              <div 
                className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: corPrimaria }}
              ></div>
              <h3 className="text-[10px] font-bold text-[#00441F] font-semibold mb-2 uppercase tracking-wider">Evolução do Saldo (Mês 12)</h3>
              <div className="text-2xl font-bold mb-1">{formatCurrency((data.creditoBruto || 0) * 1.042)}</div>
              <div className="flex items-center text-xs font-bold" style={{ color: corPrimaria }}>
                <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                <span>+ 4.2% projetado</span>
              </div>
            </div>

            {/* Parcela Total */}
            <div className="bg-[#e9ebe4] border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-[10px] font-bold text-[#00441F] font-semibold mb-2 uppercase tracking-wider">Parcela Mensal Inicial</h3>
              <div className="text-2xl font-bold mb-1">{formatCurrency(data.parcelaInicial)}</div>
              <div className="text-xs text-[#00441F] font-semibold">Incluso taxa de adm ({data.taxaAdmin || 0}%) e fundo reserva.</div>
            </div>

            {/* Contemplação */}
            <div 
              className="rounded-lg p-6 shadow-sm border"
              style={{ backgroundColor: `${corPrimaria}10`, borderColor: `${corPrimaria}40` }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: corPrimaria }}>Contemplação Estimada</h3>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: corPrimaria }}>star</span>
              </div>
              <div className="text-2xl font-bold mb-1 text-gray-900">{data.mesContemplacao || 1}º mês</div>
              <div className="text-xs text-[#00441F] font-semibold">Baseado no histórico do grupo e lance ofertado.</div>
            </div>
          </div>

          {/* Cronograma Table */}
          <div className="col-span-8 bg-[#e9ebe4] border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold">Projeção Inicial</h2>
              <span className="text-[10px] font-bold text-[#00441F] font-semibold bg-[#e9ebe4] border border-gray-200 px-2 py-1 rounded">Grupo de Simulação</span>
            </div>
            <div className="overflow-x-auto flex-1 p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-3 font-bold text-[#00441F] font-semibold uppercase tracking-wider">Mês</th>
                    <th className="py-2 px-3 font-bold text-[#00441F] font-semibold uppercase tracking-wider">Fundo Comum</th>
                    <th className="py-2 px-3 font-bold text-[#00441F] font-semibold uppercase tracking-wider">Taxa Adm.</th>
                    <th className="py-2 px-3 font-bold text-[#00441F] font-semibold uppercase tracking-wider text-right">Parcela Total</th>
                  </tr>
                </thead>
                <tbody>
                  {projecaoMeses.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-gray-100 ${item.isReajuste ? 'bg-gray-50' : ''} ${item.isContemplacao ? 'bg-orange-50' : ''}`}
                    >
                      <td className="py-3 px-3 font-medium">
                        <span className={item.isContemplacao ? "font-bold" : ""} style={item.isContemplacao ? { color: corPrimaria } : {}}>
                          {item.mes}
                          {item.isReajuste && " (Reajuste)"}
                          {item.isContemplacao && " (Estimativa Contemplação)"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#00441F] font-semibold">{formatCurrency(item.fundoComum)}</td>
                      <td className="py-3 px-3 text-[#00441F] font-semibold">{formatCurrency(item.taxaAdm)}</td>
                      <td className="py-3 px-3 text-right font-bold" style={item.isContemplacao ? { color: corPrimaria } : {}}>
                        {formatCurrency(item.parcela)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t border-gray-200 pt-4 flex items-start gap-3 mt-auto">
          <span className="material-symbols-outlined text-[#00441F] font-semibold text-[20px] mt-0.5">info</span>
          <p className="text-xs text-[#00441F] font-semibold max-w-3xl leading-relaxed">
            * Os valores apresentados são simulações baseadas nas taxas atuais e no histórico do grupo. O reajuste pelo INCC é estimado.<br />
            O cronograma completo, incluindo as {data.prazo} parcelas, será disponibilizado no fechamento do contrato.
          </p>
        </div>
      </div>
    </div>
  );
}

