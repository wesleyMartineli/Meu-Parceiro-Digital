'use client';

import React, { useState, useRef, useMemo } from 'react';
import KpiCards from './KpiCards';
import FiltrosHierarquia from './FiltrosHierarquia';
import PeriodoFilter from './PeriodoFilter';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

interface Usuario { id: string; nome: string; role: string; supervisor_id: string | null; }
interface Negocio { id: string; vendedor_id: string | null; etapa_funil: string; credito: number; titulo?: string | null; created_at: string; updated_at?: string | null; }
interface Lead { id: string; vendedor_id: string | null; created_at: string; origem?: string | null; }
interface Tarefa { id: string; vendedor_id: string | null; created_at: string; }

interface RelatoriosDashboardProps {
  nomeEmpresa: string;
  usuarios: Usuario[];
  negocios: Negocio[];
  leads: Lead[];
  tarefas: Tarefa[];
  currentUserRole: string;
  currentUserId: string;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PIE_COLORS = ['#00CF7B', '#FED7AA', '#F87171', '#9A3412', '#FBBF24', '#E11D48', '#FFEDD5'];

export default function RelatoriosDashboard({ nomeEmpresa, usuarios, negocios, leads, tarefas, currentUserRole, currentUserId }: RelatoriosDashboardProps) {
  // Inicialmente selecionamos todos os gerentes que o FiltroHierarquia definir, mas precisamos de um array vazio no primeiro render
  const [selectedGerentes, setSelectedGerentes] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Filtramos os gerentes gerais para o PDF
  const gerentesCompletos = useMemo(() => usuarios.filter(u => u.role === 'gerente_negocio'), [usuarios]);

  // Cálculos dinâmicos
  const { kpiData, chartData, origemData, negociosDoPeriodo, leadsDoPeriodo, tarefasDoPeriodo } = useMemo(() => {
    
    // Função auxiliar para checar se a data entra no filtro de período
    const isWithinPeriod = (dateString?: string | null) => {
      if (selectedYear === 'all') return true;
      if (!dateString) return false;
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return true;
      if (d.getFullYear().toString() !== selectedYear) return false;
      if (selectedMonth === 'all') return true;
      return d.getMonth().toString() === selectedMonth;
    };

    // Filtra PRIMEIRO pelo período
    const leadsDoPeriodoTemp = leads.filter(l => isWithinPeriod(l.created_at));
    const tarefasDoPeriodoTemp = tarefas.filter(t => isWithinPeriod(t.created_at));
    // Para negócios, usamos a data de criação ou a data de fechamento para cair no mês
    const negociosDoPeriodoTemp = negocios.filter(n => isWithinPeriod(n.created_at) || (n.etapa_funil === 'Ganho' && isWithinPeriod(n.updated_at)));

    // DEPOIS aplica o filtro de gerentes
    const filteredLeads = leadsDoPeriodoTemp.filter(l => l.vendedor_id && selectedGerentes.includes(l.vendedor_id));
    const filteredNegocios = negociosDoPeriodoTemp.filter(n => n.vendedor_id && selectedGerentes.includes(n.vendedor_id));
    const filteredTarefas = tarefasDoPeriodoTemp.filter(t => t.vendedor_id && selectedGerentes.includes(t.vendedor_id));

    const ganhos = filteredNegocios.filter(n => n.etapa_funil === 'Ganho');
    const perdidos = filteredNegocios.filter(n => n.etapa_funil === 'Perdido');
    const emAberto = filteredNegocios.filter(n => n.etapa_funil !== 'Ganho' && n.etapa_funil !== 'Perdido');

    const totalVendas = ganhos.reduce((acc, n) => acc + (n.credito || 0), 0);
    const totalPerdidos = perdidos.reduce((acc, n) => acc + (n.credito || 0), 0);
    const taxaConversao = filteredNegocios.length > 0 ? Math.round((ganhos.length / filteredNegocios.length) * 100) : 0;

    let totalDiasCiclo = 0;
    ganhos.forEach(g => {
       const created = new Date(g.created_at);
       const updated = g.updated_at ? new Date(g.updated_at) : new Date();
       const diffTime = Math.abs(updated.getTime() - created.getTime());
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       totalDiasCiclo += diffDays;
    });
    const cicloMedio = ganhos.length > 0 ? Math.round(totalDiasCiclo / ganhos.length) : 0;

    const kpiData = {
      totalLeads: filteredLeads.length,
      totalClientes: ganhos.length,
      taxaConversao,
      totalVendas,
      totalPerdidos,
      diferenca: totalVendas - totalPerdidos,
      ticketMedio: ganhos.length > 0 ? totalVendas / ganhos.length : 0,
      totalTarefas: filteredTarefas.length,
      quantidadeNegocios: filteredNegocios.length,
      pipelineAberto: emAberto.reduce((acc, n) => acc + (n.credito || 0), 0),
      cicloMedio,
    };

    const currentYear = new Date().getFullYear();
    const monthlySales = Array(12).fill(0);
    
    ganhos.forEach(n => {
      const date = new Date(n.created_at);
      if (date.getFullYear() === currentYear) {
        monthlySales[date.getMonth()] += (n.credito || 0);
      }
    });

    const chartData = MESES.map((name, index) => ({
      name,
      vendas: monthlySales[index]
    })).filter((_, idx) => idx <= new Date().getMonth() || monthlySales[idx] > 0);

    const origensMap = new Map<string, number>();
    filteredLeads.forEach(l => {
      if (l.origem && l.origem.trim() !== '') {
        const origem = l.origem.trim();
        origensMap.set(origem, (origensMap.get(origem) || 0) + 1);
      }
    });
    
    const origemData = Array.from(origensMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { kpiData, chartData, origemData, negociosDoPeriodo: negociosDoPeriodoTemp, leadsDoPeriodo: leadsDoPeriodoTemp, tarefasDoPeriodo: tarefasDoPeriodoTemp };
  }, [selectedGerentes, selectedMonth, selectedYear, leads, negocios, tarefas]);

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

      // --- Cabeçalho ---
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Relatório Gerencial de Vendas', 14, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);

      // Metadados básicos
      pdf.setFont('helvetica', 'bold');
      pdf.text('Empresa:', 14, 28);
      pdf.setFont('helvetica', 'normal');
      pdf.text(nomeEmpresa, 32, 28);

      // Calcular o período
      let periodoTexto = 'Todo o histórico';
      if (selectedYear !== 'all') {
        if (selectedMonth !== 'all') {
          periodoTexto = `${MESES[parseInt(selectedMonth)]} de ${selectedYear}`;
        } else {
          periodoTexto = `Ano de ${selectedYear}`;
        }
      } else {
        const allDates = [...negociosDoPeriodo.map(n => new Date(n.created_at)), ...leadsDoPeriodo.map(l => new Date(l.created_at))].filter(d => !isNaN(d.getTime()));
        if (allDates.length > 0) {
          const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
          periodoTexto = `${minDate.toLocaleDateString('pt-BR')} até ${maxDate.toLocaleDateString('pt-BR')}`;
        }
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text('Período:', 14, 34);
      pdf.setFont('helvetica', 'normal');
      pdf.text(periodoTexto, 30, 34);

      // Gerentes Selecionados
      pdf.setFont('helvetica', 'bold');
      pdf.text('Gerentes:', 14, 40);
      pdf.setFont('helvetica', 'normal');
      let gerentesTexto = selectedGerentes.map(id => gerentesCompletos.find(v => v.id === id)?.nome).join(', ');
      
      // Quebrar linha se houver muitos gerentes
      if (gerentesTexto.length > 85) {
        gerentesTexto = gerentesTexto.substring(0, 85) + '...';
      }
      if (!gerentesTexto) gerentesTexto = "Nenhum selecionado";
      pdf.text(gerentesTexto, 38, 40);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Emissão:', 14, 46);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 32, 46);

      // --- Seção 1: Resumo Executivo ---
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('1. Resumo Executivo', 14, 60);

      autoTable(pdf, {
        startY: 65,
        head: [['Total Leads', 'Clientes', 'Conversão', 'Previsão (Aberto)', 'Ciclo Médio', 'Total Vendas', 'Ticket Médio']],
        body: [[
          kpiData.totalLeads.toString(),
          kpiData.totalClientes.toString(),
          `${kpiData.taxaConversao}%`,
          formatCurrency(kpiData.pipelineAberto),
          `${kpiData.cicloMedio} dias`,
          formatCurrency(kpiData.totalVendas),
          formatCurrency(kpiData.ticketMedio)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [255, 121, 0], textColor: 255, fontStyle: 'bold' },
        styles: { halign: 'center', fontSize: 10 },
      });

      // --- Seção 2: Desempenho por Gerente de Negócios ---
      const sellerStatsRaw = selectedGerentes.map(gerenteId => {
        const gerente = gerentesCompletos.find(v => v.id === gerenteId);
        const leadsDoGerente = leadsDoPeriodo.filter(l => l.vendedor_id === gerenteId);
        const negociosDoGerente = negociosDoPeriodo.filter(n => n.vendedor_id === gerenteId);
        const tarefasDoGerente = tarefasDoPeriodo.filter(t => t.vendedor_id === gerenteId);
        const ganhos = negociosDoGerente.filter(n => n.etapa_funil === 'Ganho');
        
        const vendas = ganhos.reduce((acc, n) => acc + (n.credito || 0), 0);
        const conversao = negociosDoGerente.length > 0 ? Math.round((ganhos.length / negociosDoGerente.length) * 100) : 0;
        const ticketMedio = ganhos.length > 0 ? vendas / ganhos.length : 0;

        return {
          nome: gerente?.nome || 'Desconhecido',
          leads: leadsDoGerente.length,
          ganhos: ganhos.length,
          conversao,
          acoes: tarefasDoGerente.length,
          vendas,
          ticketMedio
        };
      });

      // Ordenar por Vendas Totais
      sellerStatsRaw.sort((a, b) => b.vendas - a.vendas);

      const sellerTableBody = sellerStatsRaw.map(s => [
        s.nome,
        s.leads.toString(),
        s.ganhos.toString(),
        `${s.conversao}%`,
        s.acoes.toString(),
        formatCurrency(s.vendas),
        formatCurrency(s.ticketMedio)
      ]);

      const finalYExecutivo = (pdf as any).lastAutoTable?.finalY || 70;

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text('2. Desempenho por Gerente de Negócios', 14, finalYExecutivo + 15);

      autoTable(pdf, {
        startY: finalYExecutivo + 20,
        head: [['Gerente de Negócios', 'Leads', 'Ganhos', 'Conversão', 'Ações', 'Total Vendas', 'Ticket Médio']],
        body: sellerTableBody,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'right' },
          6: { halign: 'right' },
        }
      });

      // --- Seção 3: Evolução Mensal ---
      const finalYGerentes = (pdf as any).lastAutoTable?.finalY || 150;
      
      let startYMensal = finalYGerentes + 15;
      if (startYMensal > 250) {
        pdf.addPage();
        startYMensal = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text('3. Evolução de Vendas (Mensal)', 14, startYMensal);

      const monthlyTableBody = chartData.map(d => [
        d.name,
        formatCurrency(d.vendas)
      ]);

      autoTable(pdf, {
        startY: startYMensal + 5,
        head: [['Mês', 'Vendas (R$)']],
        body: monthlyTableBody,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: 255 },
        styles: { fontSize: 9, halign: 'center' },
        columnStyles: {
          1: { halign: 'right' }
        }
      });

      // --- Seção 4: Origem dos Leads ---
      const finalYMensal = (pdf as any).lastAutoTable?.finalY || 200;
      let startYOrigem = finalYMensal + 15;
      if (startYOrigem > 250) {
        pdf.addPage();
        startYOrigem = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text('4. Origem dos Leads', 14, startYOrigem);

      const origemTableBody = origemData.map(d => [
        d.name,
        d.value.toString()
      ]);

      autoTable(pdf, {
        startY: startYOrigem + 5,
        head: [['Canal de Origem', 'Quantidade de Leads']],
        body: origemTableBody,
        theme: 'grid',
        headStyles: { fillColor: [255, 121, 0], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'center' }
        }
      });

      // --- Seção 5: Top 5 Maiores Vendas (Big Wins) ---
      const finalYOrigem = (pdf as any).lastAutoTable?.finalY || 200;
      let startYBigWins = finalYOrigem + 15;
      if (startYBigWins > 250) {
        pdf.addPage();
        startYBigWins = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text('5. Top 5 Maiores Vendas (Big Wins)', 14, startYBigWins);

      // Calcular Big Wins baseado nos filtros
      const allGanhos = negociosDoPeriodo.filter(n => n.etapa_funil === 'Ganho' && n.vendedor_id && selectedGerentes.includes(n.vendedor_id));
      const top5Ganhos = allGanhos.sort((a, b) => (b.credito || 0) - (a.credito || 0)).slice(0, 5);

      const bigWinsTableBody = top5Ganhos.map((ganho, index) => {
        const nomeGerenteNegocio = gerentesCompletos.find(v => v.id === ganho.vendedor_id)?.nome || 'Desconhecido';
        return [
          `${index + 1}º`,
          ganho.titulo || 'Negócio sem título',
          nomeGerenteNegocio,
          formatCurrency(ganho.credito || 0)
        ];
      });

      if (bigWinsTableBody.length > 0) {
        autoTable(pdf, {
          startY: startYBigWins + 5,
          head: [['Posição', 'Negócio', 'Gerente de Negócios', 'Valor']],
          body: bigWinsTableBody,
          theme: 'grid',
          headStyles: { fillColor: [225, 29, 72], textColor: 255 }, // Rose-600 para destaque
          styles: { fontSize: 9 },
          columnStyles: {
            0: { halign: 'center', fontStyle: 'bold' },
            3: { halign: 'right', fontStyle: 'bold', textColor: [34, 197, 94] } // Verde
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Nenhum negócio ganho no período.', 14, startYBigWins + 10);
      }

      pdf.save(`relatorio-gerencial-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Ocorreu um erro ao gerar o PDF. Detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios Gerenciais</h1>
          <p className="text-[#00441F] font-semibold">Visão geral e acompanhamento de performance de vendas e retenção.</p>
        </div>
        
        <button
          onClick={handleExportPDF}
          disabled={isExporting || selectedGerentes.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00CF7B] hover:bg-[#E66D00] disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          {isExporting ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span>Exportar PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <PeriodoFilter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChange={(m, y) => {
            setSelectedMonth(m);
            setSelectedYear(y);
          }}
        />
        <FiltrosHierarquia 
          usuarios={usuarios}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onGerentesChange={setSelectedGerentes}
        />
      </div>
      <div ref={dashboardRef} className="bg-[#e9ebe4] p-2 -m-2 rounded-2xl mt-4">
        {selectedGerentes.length === 0 ? (
          <div className="text-center py-12 bg-[#e9ebe4] rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[#00441F] font-semibold font-medium">Selecione pelo menos um gerente (ou um filtro acima) para visualizar os dados.</p>
          </div>
        ) : (
          <>
            <KpiCards data={kpiData} />

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Gráfico principal */}
              <div className="lg:col-span-2 bg-[#e9ebe4] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Evolução de Vendas (Ganhos por Mês)</h3>
                <div className="flex-1 min-h-[350px] w-full">
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[#00441F] font-semibold text-sm">Nenhuma venda registrada neste ano para os gerentes selecionados.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00CF7B" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00CF7B" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)), 'Total Ganhos']}
                        />
                        <Area type="monotone" dataKey="vendas" stroke="#00CF7B" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico de Origem dos Leads */}
              <div className="lg:col-span-1 bg-[#e9ebe4] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Origem dos Leads</h3>
                <div className="flex-1 min-h-[300px] w-full relative">
                  {origemData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[#00441F] font-semibold text-sm">Nenhum lead com origem identificada.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={origemData}
                          cx="50%"
                          cy="45%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {origemData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgb(0,0,0,0.1)' }} 
                          formatter={(value: any) => [value, 'Leads']}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
