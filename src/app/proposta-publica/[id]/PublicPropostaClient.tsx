"use client";

import React, { useEffect, useState } from "react";
import { incrementarVisualizacaoAction } from "@/modules/propostas/actions";
import { getFinancingComparisonAction } from "@/app/actions/financingActions";
import LegalFooter from "@/components/layout/LegalFooter";

interface PublicPropostaClientProps {
  proposta: {
    id: string;
    created_at: string;
    status: string;
    visualizacoes: number;
    pdf_url: string | null;
    public_link: string | null;
    empresa: {
      nome_empresa: string;
      logo_url: string | null;
      cor_primaria: string;
      cor_secundaria: string;
      telefone: string | null;
    } | null;
    gerente: {
      nome: string;
      email: string;
      telefone: string | null;
    } | null;
    lead: {
      nome: string;
      telefone: string | null;
    } | null;
    simulacao: {
      id: string;
      credito_total: number;
      produto: string;
      modalidade: string;
      input_json: any;
      output_json: any;
    } | null;
  };
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

export default function PublicPropostaClient({ proposta }: PublicPropostaClientProps) {
  const { id, empresa, gerente, lead, simulacao } = proposta;

  // Increment visualizações count when the page loads
  useEffect(() => {
    incrementarVisualizacaoAction(id);
  }, [id]);

  // Extract dynamic colors or use fallbacks (with security validation)
  const isValidHexColor = (c: string) => /^#[0-9a-fA-F]{3,8}$/.test(c);
  const primaryColor = isValidHexColor(empresa?.cor_primaria ?? '') ? empresa!.cor_primaria! : "#00CF7B";
  const secondaryColor = isValidHexColor(empresa?.cor_secundaria ?? '') ? empresa!.cor_secundaria! : "#FF7A40";

  // Format WhatsApp Link
  const gerenteTelefone = gerente?.telefone || empresa?.telefone || "";
  const cleanedPhone = gerenteTelefone.replace(/\D/g, "");
  const formattedPhone = cleanedPhone ? (cleanedPhone.startsWith("55") ? cleanedPhone : `55${cleanedPhone}`) : "";

  const messageText = encodeURIComponent(
    `Olá, ${gerente?.nome || "Gerente"}! Acabei de analisar a proposta de consórcio personalizada de ${
      simulacao ? formatCurrency(simulacao.credito_total) : "crédito"
    } que você preparou para mim. Gostaria de tirar algumas dúvidas e dar o próximo passo.`
  );
  
  const whatsappUrl = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${messageText}`
    : "#";

  // Translate product types
  const getProductLabel = (prod: string) => {
    switch (prod?.toLowerCase()) {
      case "imovel":
        return "Imobiliário";
      case "auto":
        return "Automóveis";
      case "moto":
        return "Motocicleta";
      case "pesado":
        return "Veículos Pesados";
      case "servico":
        return "Serviços";
      default:
        return prod || "Consórcio";
    }
  };

  const getModalidadeLabel = (mod: string) => {
    switch (mod?.toLowerCase()) {
      case "linear":
        return "Linear Integral";
      case "linear_70":
        return "Linear 70%";
      case "reducao_50":
        return "Redução 50%";
      case "degrau":
        return "Degrau / Escalona";
      case "degrau_70":
        return "Degrau 70%";
      case "pontual":
        return "Pontual / Meia Parcela";
      default:
        return mod?.replace("_", " ").toUpperCase() || "Normal";
    }
  };

  // Get values from simulation inputs
  const input = simulacao?.input_json || {};
  const output = simulacao?.output_json || {};

  const totalLance = Number(input.lanceEmbutido || 0) + Number(input.recursosProprios || 0);
  const cronograma = output.cronograma || output.cotas?.[0]?.cronograma || [];

  const [financingResult, setFinancingResult] = useState<any>(null);
  const [isFinancingLoading, setIsFinancingLoading] = useState(false);

  useEffect(() => {
    async function fetchFinancing() {
      if (!simulacao?.produto || !input?.credito || !input?.prazo) return;
      try {
        setIsFinancingLoading(true);
        const res = await getFinancingComparisonAction({
          assetType: simulacao.produto,
          assetValue: input.credito,
          financingDownPayment: totalLance,
          financingTerm: input.prazo,
        });
        setFinancingResult(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsFinancingLoading(false);
      }
    }
    fetchFinancing();
  }, [simulacao, input, totalLance]);

  return (
    <div
      className="min-h-screen bg-[#e9ebe4] flex flex-col antialiased"
      style={{
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor,
        '--brand-primary-hover': `${primaryColor}dd`,
      } as React.CSSProperties}
    >

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#e9ebe4] border-b border-[#E0E5CF] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-3">
            {empresa?.logo_url ? (
              <img
                src={empresa.logo_url}
                alt={empresa.nome_empresa}
                className="h-10 w-auto object-contain max-w-[200px]"
              />
            ) : (
              <span className="text-xl font-black text-gray-900 tracking-tight">
                {empresa?.nome_empresa || "Meu Parceiro Digital"}
              </span>
            )}
          </div>

          {/* CTA header button */}
          <div className="flex items-center gap-3">
            {proposta.pdf_url && (
              <a
                href={proposta.pdf_url}
                download={`Proposta_${proposta.id.slice(0, 8)}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-[#e9ebe4] text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
              >
                <span>📥</span> Baixar PDF
              </a>
            )}

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
        
        {/* Welcome Section */}
        <section className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-transparent to-[#E0E5CF] opacity-10 pointer-events-none" />
          <div className="space-y-2">
            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
              Proposta Personalizada
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#00441F]">
              Olá, <span style={{ color: primaryColor }}>{lead?.nome || "Cliente"}</span>!
            </h1>
            <p className="text-sm text-[#00441F] font-semibold font-medium max-w-2xl leading-relaxed">
              Preparamos uma simulação sob medida com as melhores condições do mercado.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
            {proposta.pdf_url && (
              <a
                href={proposta.pdf_url}
                target="_blank"
                rel="noreferrer"
                style={{ borderColor: primaryColor, color: primaryColor }}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border text-sm font-bold shadow-sm bg-[#e9ebe4] hover:bg-orange-50/20 transition-all text-center"
              >
                <span>📄</span> Visualizar Proposta Completa (PDF)
              </a>
            )}
          </div>
        </section>

        {/* Financial Dashboard Key metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-widest block mb-2">Crédito Contratado</span>
            <div>
              <span className="text-2xl md:text-3xl font-black text-gray-900 block">
                {simulacao ? formatCurrency(simulacao.credito_total) : "—"}
              </span>
              <span className="text-xs text-[#00441F] font-semibold block mt-1">
                Produto: {simulacao ? getProductLabel(simulacao.produto) : "—"}
              </span>
            </div>
          </div>

          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-widest block mb-2">Modalidade do Plano</span>
            <div>
              <span className="text-xl md:text-2xl font-extrabold text-gray-900 block truncate">
                {simulacao ? getModalidadeLabel(simulacao.modalidade) : "—"}
              </span>
              <span className="text-xs text-[#00441F] font-semibold block mt-1">
                Redução de parcela após contemplação
              </span>
            </div>
          </div>

          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-widest block mb-2">Parcela Inicial</span>
            <div>
              <span className="text-2xl md:text-3xl font-black text-[#00441F] block">
                {output.totalParcelaInicial || output.parcelaInicial || output.cotas?.[0]?.parcelaInicial || output.parcelas?.[0]?.valor_total || input.parcela_inicial
                  ? formatCurrency(Number(output.totalParcelaInicial || output.parcelaInicial || output.cotas?.[0]?.parcelaInicial || output.parcelas?.[0]?.valor_total || input.parcela_inicial))
                  : "—"
                }
              </span>
              <span className="text-xs text-emerald-600 font-bold block mt-1 flex items-center gap-1">
                <span>✓</span> Sem juros bancários
              </span>
            </div>
          </div>

          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-widest block mb-2">Prazo de Pagamento</span>
            <div>
              <span className="text-2xl md:text-3xl font-black text-gray-900 block">
                {input.prazo || "—"} <span className="text-sm font-semibold text-[#00441F] font-semibold">meses</span>
              </span>
              <span className="text-xs text-[#00441F] font-semibold block mt-1">
                Com opção de quitação antecipada
              </span>
            </div>
          </div>

        </section>

        {/* Detailed Comparison & Interactive Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side (Col 6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Embedded PDF Viewer */}
            {proposta.pdf_url && (
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800">Visualizar Arquivo Original</span>
                  <a
                    href={proposta.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-black uppercase tracking-wider hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Tela cheia ↗
                  </a>
                </div>
                {proposta.pdf_url.toLowerCase().endsWith('.png') ? (
                  <div className="w-full h-[600px] flex justify-center bg-gray-50 rounded-2xl border border-gray-150 shadow-inner overflow-auto py-4">
                    <img src={proposta.pdf_url} alt="Proposta Simplificada" className="max-w-full h-auto object-contain" />
                  </div>
                ) : (
                  <iframe
                    src={`${proposta.pdf_url}#toolbar=0&navpanes=0`}
                    className="w-full h-[600px] rounded-2xl border border-gray-150 shadow-inner bg-gray-50"
                    title="PDF da Proposta"
                  />
                )}
              </div>
            )}

            {/* Detailed Calculations / Parameters Card */}
            <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📊</span> Detalhamento do Planejamento
              </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Crédito Líquido Estimado</span>
                  <span className="text-base font-extrabold text-gray-800">
                    {output.credito_liquido ? formatCurrency(output.credito_liquido) : formatCurrency(input.credito - (input.lanceEmbutido || 0))}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Saldo Devedor Pós-Contemplação</span>
                  <span className="text-base font-extrabold text-gray-800">
                    {output.saldo_devedor ? formatCurrency(output.saldo_devedor) : "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Custo Efetivo Total (CET)</span>
                  <span className="text-base font-extrabold text-gray-800">
                    {financingResult?.cet ? `${financingResult.cet.toFixed(2)}%` : `${((financingResult?.principal > 0 ? ((financingResult.totalPaid / financingResult.principal) - 1) * 100 : 0)).toFixed(2)}%`}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Abatimento de Lance</span>
                  <span className="text-base font-bold text-gray-700 capitalize">
                    {input.abatimento === "parcela" ? "Reduzir Parcelas" : input.abatimento === "prazo" ? "Reduzir Prazo" : "Misto / Proporcional"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-2">
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Lance Embutido</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {input.lanceEmbutido ? formatCurrency(input.lanceEmbutido) : "Não utilizado"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Recursos Próprios (Lance)</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {input.recursosProprios ? formatCurrency(input.recursosProprios) : "Não utilizado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Strategic Notes */}
            <div className="p-4 rounded-2xl bg-orange-50/30 border border-orange-100/50 space-y-2">
              <h4 className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                <span>💡</span> Estratégia de Contemplação
              </h4>
              <p className="text-xs text-orange-950/80 leading-relaxed font-medium">
                Com base no lance total ofertado ({formatCurrency(totalLance)}), sua cota possui um posicionamento estratégico altamente competitivo. A estimativa de contemplação foi calculada com base na média histórica do grupo.
              </p>
            </div>

            {/* Quick table of installments */}
            {output.parcelas && output.parcelas.length > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                <span className="block text-xs font-bold text-gray-800">Cronograma de Parcelas Estimadas</span>
                <div className="max-h-48 overflow-x-auto overflow-y-auto border border-gray-100 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-[#00441F] font-bold uppercase whitespace-nowrap">Período</th>
                        <th className="px-4 py-2 text-[#00441F] font-bold uppercase whitespace-nowrap">Tipo</th>
                        <th className="px-4 py-2 text-[#00441F] font-bold uppercase text-right whitespace-nowrap">Valor Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                      {output.parcelas.slice(0, 12).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 whitespace-nowrap">Mês {item.periodo_inicio} {item.periodo_fim !== item.periodo_inicio ? `ao ${item.periodo_fim}` : ""}</td>
                          <td className="px-4 py-2 text-[#00441F] font-semibold font-medium capitalize whitespace-nowrap">{item.tipo_parcela === "inicial" ? "Pré-Contemplação" : "Pós-Contemplação"}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">{formatCurrency(item.valor_total)}</td>
                        </tr>
                      ))}
                      {output.parcelas.length > 12 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-center text-[#00441F] font-semibold italic font-medium">
                            + {output.parcelas.length - 12} meses adicionais descritos no PDF da proposta.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Broker Info & PDF Viewer or WhatsApp CTA Card */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Broker profile */}
            <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl p-6 md:p-8 shadow-sm text-center space-y-5">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white flex items-center justify-center text-2xl font-black text-[#00441F] font-semibold shadow-sm">
                  {gerente?.nome ? gerente.nome[0].toUpperCase() : "C"}
                </div>
                <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-widest mt-3 block">Gerente de Negócios</span>
                <h4 className="text-base font-bold text-[#00441F] mt-0.5">{gerente?.nome || "Gerente"}</h4>
                <p className="text-xs text-[#00441F] font-semibold">{gerente?.email || ""}</p>
              </div>


            </div>

          {/* Comparativo com Financiamento */}
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <h4 className="font-extrabold text-lg text-[#002E17] flex items-center gap-2 mb-4">
              Comparativo com Financiamento Bancário
            </h4>

            {isFinancingLoading ? (
              <div className="flex items-center justify-center p-8 text-sm font-semibold text-gray-500 animate-pulse">
                Calculando comparativo com taxas do BCB...
              </div>
            ) : financingResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 my-4">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    Resultados da Comparação
                  </span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-800/70 mb-1">Taxa Mensal (Financ.)</span>
                    <span className="text-xl font-black text-red-600">{financingResult.monthlyRate.toFixed(2)}%</span>
                  </div>
                  <div className="bg-[#002E17]/5 p-4 rounded-xl border border-[#00CF7B]/20 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#002E17]/70 mb-1">Taxa Adm a.m.</span>
                    <span className="text-xl font-black text-[#00CF7B]">
                      {(((output.taxaAdm || 0) / (input.prazo || 1))).toFixed(4)}%
                    </span>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-800/70 mb-1">CET Total (Financ.)</span>
                    <span className="text-xl font-black text-red-600">
                      {financingResult.principal > 0 ? (((financingResult.totalPaid / financingResult.principal) - 1) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                  <div className="bg-[#002E17]/5 p-4 rounded-xl border border-[#00CF7B]/20 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#002E17]/70 mb-1">CET Total (Consórcio)</span>
                    <span className="text-xl font-black text-[#00CF7B]">{((output.taxaAdm || 0) + (output.fundoReserva || 0)).toFixed(2)}%</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Parcela Estimada (Financ.)</span>
                    <span className="text-lg font-bold text-gray-800">{formatCurrency(financingResult.monthlyPayment)}</span>
                  </div>
                  <div className="bg-[#002E17]/5 p-4 rounded-xl border border-[#00CF7B]/20 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#002E17]/70 mb-1">Parcela (Consórcio)</span>
                    <span className="text-lg font-bold text-[#00CF7B]">
                      {formatCurrency(output.parcelas?.[0]?.valor_total || (output.parcelaInicial || 0))}
                    </span>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-800/70 mb-1">Total Pago (Financ.)</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(financingResult.totalPaid + financingResult.downPayment)}</span>
                    <span className="text-[9px] font-medium text-red-800/50 mt-1">Inclui {formatCurrency(financingResult.interestCost)} em juros</span>
                  </div>
                  <div className="bg-[#002E17]/5 p-4 rounded-xl border border-[#00CF7B]/30 flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#002E17]/70 mb-1">Total Pago (Consórcio)</span>
                    <span className="text-lg font-bold text-[#002E17]">{formatCurrency(output.totalPago || 0)}</span>
                  </div>
                </div>
                
                {/* HIGHIGHT BLOCK: Economia no Consórcio */}
                <div className="mt-6 bg-gradient-to-r from-[#002E17] to-[#002f15] p-6 rounded-2xl border border-[#00CF7B]/30 flex flex-col md:flex-row justify-between items-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00CF7B] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="z-10 text-center md:text-left mb-4 md:mb-0">
                    <h5 className="text-[#00CF7B] font-bold uppercase tracking-widest text-xs mb-1">Sua Economia Final</h5>
                    <p className="text-white text-sm opacity-80">Diferença entre o total pago no financiamento vs consórcio</p>
                  </div>
                  <div className="z-10 text-3xl font-black text-[#00CF7B] drop-shadow-md">
                    {formatCurrency((financingResult.totalPaid + financingResult.downPayment) - (output.totalPago || 0))}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-2 text-center bg-gray-50 rounded-lg p-2 border border-dashed border-gray-200">
                  * Referência: Banco Central do Brasil (BCB) - {financingResult.institutionsConsidered} instituições ({financingResult.referenceDate}). Os valores são estimados e representam apenas a média de mercado.
                </div>
              </div>
            ) : null}
          </div>
            {/* Cronograma Detalhado (Placed beside Detalhamento) */}
            {output.cronograma && output.cronograma.length > 0 && (
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📅</span> Cronograma Detalhado de Pagamento ({output.cronograma.length} meses)
                </h3>
                
                <p className="text-xs text-orange-800 font-medium bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                  <strong className="block mb-1">Atenção:</strong>
                  Este cronograma é uma estimativa de evolução e <strong>não contabiliza os reajustes</strong> do bem (sejam eles semestrais ou anuais, a depender do grupo).
                </p>

                <div className="max-h-[500px] overflow-y-auto overflow-x-auto border border-[#E0E5CF] rounded-2xl bg-gray-50/50 custom-scrollbar">
                  <table className="w-full text-left text-[10px] sm:text-xs">
                    <thead className="sticky top-0 bg-gray-100 text-[#002E17] border-b border-gray-200 uppercase tracking-wider font-bold z-10 shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">Mês</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">Nº Parcela</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Amortização</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Taxa ADM</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">F. Reserva</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Seguro</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Adiantamento</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right">Parcela Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {output.cronograma.map((p: any) => (
                        <tr key={p.mes} className="hover:bg-gray-100/50 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap text-center font-semibold text-[#002E17]">
                            {p.mes}º
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center text-gray-900 font-bold">
                            {p.mes}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-gray-700">
                            {p.quitadaPorLance ? "-" : formatCurrency(p.amortizacao)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-gray-700">
                            {p.quitadaPorLance ? "-" : formatCurrency(p.taxaAdm)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-gray-700">
                            {p.quitadaPorLance ? "-" : formatCurrency(p.fundoReserva)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-gray-700">
                            {p.quitadaPorLance ? "-" : formatCurrency(p.seguro || 0)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-gray-700">
                            {p.adiantamento > 0 ? (
                              <span className="text-orange-600 font-bold">
                                {formatCurrency(p.adiantamento)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-right font-bold text-gray-900">
                            {p.quitadaPorLance ? (
                               <span className="text-[#002E17] text-[10px] uppercase font-bold tracking-widest">Lance</span>
                            ) : (
                               formatCurrency(p.total + (p.adiantamento || 0))
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <footer className="bg-[#e9ebe4] border-t border-[#E0E5CF] mt-auto pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2 mb-8">
          <p className="text-xs text-[#00441F] font-semibold font-medium">
            Proposta Comercial gerada eletronicamente através do Sistema Meu Parceiro Digital.
          </p>
          <p className="text-[10px] text-[#00441F] font-semibold">
            © {new Date().getFullYear()} {empresa?.nome_empresa || "Meu Parceiro Digital Corretora"}. Todos os direitos reservados.
          </p>
        </div>
        <LegalFooter />
      </footer>
    </div>
  );
}
