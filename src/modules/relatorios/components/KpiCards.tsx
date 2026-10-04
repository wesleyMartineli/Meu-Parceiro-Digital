import React from 'react';

interface KpiCardsProps {
  data: {
    totalLeads: number;
    totalClientes: number;
    taxaConversao: number;
    totalVendas: number;
    totalPerdidos: number;
    diferenca: number;
    ticketMedio: number;
    totalTarefas: number;
    quantidadeNegocios: number;
    pipelineAberto: number;
    cicloMedio: number;
  };
}

export default function KpiCards({ data }: KpiCardsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const kpis = [
    { label: 'Previsão (Pipeline Aberto)', value: formatCurrency(data.pipelineAberto), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-indigo-600' },
    { label: 'Ciclo Médio (Dias)', value: data.cicloMedio, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-blue-500' },
    { label: 'Total de Leads', value: data.totalLeads, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Total de Clientes (Ganhos)', value: data.totalClientes, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600' },
    { label: 'Taxa de Conversão', value: `${data.taxaConversao}%`, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Total de Vendas', value: formatCurrency(data.totalVendas), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600' },
    { label: 'Total Perdidos', value: formatCurrency(data.totalPerdidos), icon: 'M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6', color: 'text-red-500' },
    { label: 'Diferença', value: formatCurrency(data.diferenca), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
    { label: 'Ticket Médio', value: formatCurrency(data.ticketMedio), icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
    { label: 'Ações (Tarefas)', value: data.totalTarefas, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { label: 'Qtd. Negócios', value: data.quantidadeNegocios, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-[#e9ebe4] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <p className="text-sm font-semibold text-[#00441F] font-semibold mb-1">{kpi.label}</p>
            <h3 className={`text-2xl font-bold ${kpi.color || 'text-gray-900'}`}>{kpi.value}</h3>
          </div>
          <div className={`p-4 rounded-xl ${
            kpi.color?.includes('red') ? 'bg-red-50 text-red-500' : 
            kpi.color?.includes('green') ? 'bg-green-50 text-green-600' :
            'bg-[#00CF7B]/10 text-[#00CF7B]'
          }`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={kpi.icon} />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

