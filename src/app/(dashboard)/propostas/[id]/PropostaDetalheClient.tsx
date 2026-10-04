"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePropostaStatusAction } from "@/modules/propostas/actions";

interface PropostaDetail {
  id: string;
  created_at: string;
  status: string;
  visualizacoes: number;
  pdf_url: string | null;
  public_link: string | null;
  empresa: { nome_empresa: string; cor_primaria: string; cor_secundaria?: string | null; logo_url: string | null; telefone?: string | null } | null;
  gerente: { nome: string; email: string; telefone: string | null } | null;
  lead: { id: string; nome: string; telefone: string | null; observacoes: string | null } | null;
  simulacao: {
    id: string;
    credito_total: number;
    produto: string;
    modalidade: string;
    input_json: any;
    output_json: any;
  } | null;
}

interface PropostaDetalheClientProps {
  proposta: PropostaDetail;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

/** Force-convert lab/oklch/oklab/lch colors to RGB for html2canvas compatibility */
function forceRGBColors(root: HTMLElement) {
  const colorProps = ["color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "textDecorationColor", "boxShadow"] as const;
  const allEls = [root, ...Array.from(root.querySelectorAll("*"))] as HTMLElement[];
  const tempDiv = document.createElement("div");
  tempDiv.style.display = "none";
  document.body.appendChild(tempDiv);
  for (const el of allEls) {
    if (!el.style) continue;
    const computed = window.getComputedStyle(el);
    for (const prop of colorProps) {
      const val = computed[prop as any] as string;
      if (val && /\b(lab|oklch|oklab|lch)\(/i.test(val)) {
        tempDiv.style.color = val;
        (el.style as any)[prop] = window.getComputedStyle(tempDiv).color;
      }
    }
  }
  document.body.removeChild(tempDiv);
}

export default function PropostaDetalheClient({ proposta }: PropostaDetalheClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  const primaryColor = proposta.empresa?.cor_primaria || "#00CF7B";
  const secondaryColor = proposta.empresa?.cor_secundaria || "#00CF7B";

  const handleDownloadCard = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const element = document.getElementById("whatsapp-card-target-full");
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        // @ts-ignore
        scale: 1,
        backgroundColor: "#0F1317",
        onclone: (_doc: Document, clonedEl: HTMLElement) => { forceRGBColors(clonedEl); },
      });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `Proposta_Card_${proposta.id.slice(0, 8).toUpperCase()}.png`;
      link.click();
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
    }
  };

  const handleCopyCardToClipboard = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const element = document.getElementById("whatsapp-card-target-full");
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        // @ts-ignore
        scale: 1,
        backgroundColor: "#0F1317",
        onclone: (_doc: Document, clonedEl: HTMLElement) => { forceRGBColors(clonedEl); },
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopiedCard(true);
          setTimeout(() => setCopiedCard(false), 2000);
        } catch (err) {
          console.error("Erro ao copiar imagem para clipboard:", err);
          alert("Não foi possível copiar a imagem automaticamente. Você pode baixá-la usando o botão 'Baixar PNG'.");
        }
      }, "image/png");
    } catch (error) {
      console.error("Erro ao gerar imagem para cópia:", error);
    }
  };

  const handleCopyLink = async () => {
    if (!proposta.public_link) return;
    try {
      const fullUrl = `${window.location.origin}${proposta.public_link}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = (newStatus: "enviada" | "aprovada" | "recusada") => {
    startTransition(async () => {
      setFeedback(null);
      const res = await updatePropostaStatusAction(proposta.id, newStatus);
      if (res.success) {
        setFeedback({ success: true, message: `Status alterado para ${newStatus} com sucesso!` });
        router.refresh();
      } else {
        setFeedback({ success: false, message: res.message || "Erro ao atualizar status." });
      }
    });
  };

  const statusMap = proposta.status === "pendente" ? "enviada" : proposta.status;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/propostas"
              className="text-[#00441F] font-semibold hover:text-[#00441F] font-semibold transition-colors text-sm font-bold flex items-center gap-1"
            >
              <span>←</span> Voltar
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-widest">Console da Proposta</span>
          </div>
          <h1 className="text-2xl font-bold text-[#00441F] mt-1.5 flex items-center gap-2.5">
            Proposta #{proposta.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {proposta.public_link && (
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-[#e9ebe4] text-xs font-bold text-gray-700 px-4 py-2.5 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <span>{copied ? "✅ Copiado" : "🔗 Copiar Link Público"}</span>
            </button>
          )}


          {statusMap !== "aprovada" && (
            <button
              onClick={() => handleUpdateStatus("aprovada")}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white px-4 py-2.5 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <span>✅</span> Aprovar Proposta
            </button>
          )}

          {statusMap !== "recusada" && (
            <button
              onClick={() => handleUpdateStatus("recusada")}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-[#FF7A40] text-xs font-bold text-white px-4 py-2.5 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <span>❌</span> Recusar Proposta
            </button>
          )}
        </div>
      </div>

      {/* Feedback Panel */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
            feedback.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Embedded PDF Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#00441F] flex items-center gap-2">
                <span>📄</span> Visualização da Proposta Gerada
              </h3>
              {proposta.pdf_url && (
                <a
                  href={proposta.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#00CF7B] hover:underline"
                >
                  Abrir em nova aba ↗
                </a>
              )}
            </div>

            {proposta.pdf_url ? (
              proposta.pdf_url.toLowerCase().endsWith('.png') ? (
                <div className="w-full bg-gray-50 flex justify-center p-8 rounded-xl border border-gray-150 shadow-inner overflow-auto h-[650px]">
                  <img src={proposta.pdf_url} alt="Proposta Simplificada" className="max-w-full rounded shadow-sm border border-gray-200 object-contain" />
                </div>
              ) : (
                <iframe
                  src={`${proposta.pdf_url}#toolbar=0&navpanes=0`}
                  className="w-full h-[650px] rounded-xl border border-gray-150 shadow-inner bg-gray-50"
                  title="Visualização da Proposta"
                />
              )
            ) : (
              <div className="w-full h-[400px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50 text-[#00441F] font-semibold">
                <span>⚠️ Arquivo não disponível</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Proposta Details and Metrics */}
        <div className="lg:col-span-4 space-y-5">
          {/* Status & Views Card */}
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider">Status & Acessos</h3>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs text-[#00441F] font-semibold">Status Atual</span>
              <div>
                {statusMap === "aprovada" && (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    Aprovada
                  </span>
                )}
                {statusMap === "recusada" && (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                    Recusada
                  </span>
                )}
                {statusMap === "enviada" && (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                    Enviada
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#00441F] font-semibold">Visualizações do Parceiro</span>
              <span className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <span className="text-blue-500">👁️</span> {proposta.visualizacoes}
              </span>
            </div>
          </div>

          {/* Lead Information Card */}
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider">Dados do Parceiro</h3>
            {proposta.lead ? (
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Nome</span>
                  <Link
                    href={`/crm/${proposta.lead.id}`}
                    className="text-sm font-bold text-[#00441F] hover:text-[#00CF7B] hover:underline"
                  >
                    {proposta.lead.nome}
                  </Link>
                </div>
                {proposta.lead.telefone && (
                  <div>
                    <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Telefone</span>
                    <span className="text-sm font-semibold text-gray-700">{proposta.lead.telefone}</span>
                  </div>
                )}
                {proposta.lead.observacoes && (
                  <div>
                    <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Observações do Funil</span>
                    <p className="text-xs text-[#00441F] font-semibold mt-1 leading-relaxed italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      "{proposta.lead.observacoes}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-[#00441F] font-semibold">Nenhum lead vinculado.</span>
            )}
          </div>

          {/* Broker/Gerente de Negócios Information Card */}
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider">Gerente de Negócios Responsável</h3>
            {proposta.gerente ? (
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Nome</span>
                  <span className="text-sm font-bold text-gray-900">{proposta.gerente.nome}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Email</span>
                  <span className="text-sm font-semibold text-[#00441F] font-semibold">{proposta.gerente.email}</span>
                </div>
                {proposta.gerente.telefone && (
                  <div>
                    <span className="block text-[10px] font-bold text-[#00441F] font-semibold uppercase">Contato</span>
                    <span className="text-sm font-semibold text-[#00441F] font-semibold">{proposta.gerente.telefone}</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-[#00441F] font-semibold">Sem informações de gerente.</span>
            )}
          </div>

          {/* Finance Overview Card */}
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#00441F] font-semibold uppercase tracking-wider">Dados da Cota</h3>
            {proposta.simulacao ? (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-xs text-[#00441F] font-semibold">Crédito Contratado</span>
                  <span className="font-extrabold text-gray-900">{formatCurrency(proposta.simulacao.credito_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#00441F] font-semibold">Produto</span>
                  <span className="font-bold text-gray-800 capitalize">{proposta.simulacao.produto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#00441F] font-semibold">Modalidade</span>
                  <span className="font-bold text-gray-800 uppercase text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                    {proposta.simulacao.modalidade.replace("_", " ")}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-[#00441F] font-semibold">Dados da simulação não encontrados.</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabela do Cronograma Previsto */}
      {proposta.simulacao?.output_json?.cronograma && proposta.simulacao.output_json.cronograma.length > 0 && (
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#00441F] mb-4 flex items-center gap-1.5">
            <span>📅</span> Cronograma Previsto da Cota
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[#00441F] font-semibold border-b border-gray-150 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 whitespace-nowrap text-center">Mês</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">Nº Parcela</th>
                  <th className="py-3 px-4 whitespace-nowrap">Amortização</th>
                  <th className="py-3 px-4 whitespace-nowrap">Taxa ADM</th>
                  <th className="py-3 px-4 whitespace-nowrap">F. Reserva</th>
                  <th className="py-3 px-4 whitespace-nowrap">Seguro</th>
                  <th className="py-3 px-4 whitespace-nowrap">Adiantamento</th>
                  <th className="py-3 px-4 whitespace-nowrap">Parcela Total</th>
                  <th className="py-3 px-4 whitespace-nowrap">Saldo Devedor</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proposta.simulacao.output_json.cronograma.map((p: any) => (
                  <tr
                    key={p.mes}
                    className={`hover:bg-gray-50/70 transition-colors ${p.contemplado && !p.quitadaPorLance ? "bg-orange-50/30" : ""}`}
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap text-center text-[#00441F] font-semibold">{p.mes}º</td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-center text-gray-900 font-bold">{p.mes}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.amortizacao)}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.taxaAdm)}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.fundoReserva)}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.seguro)}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{p.adiantamento > 0 ? <span className="text-orange-600 font-bold">{formatCurrency(p.adiantamento)}</span> : "-"}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap font-bold text-gray-900">{p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.total)}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap font-semibold text-[#00441F] font-semibold">{formatCurrency(p.saldoDevedor)}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-center">
                      {p.quitadaPorLance ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-[#00441F] font-semibold uppercase tracking-wider">
                          Quitada
                        </span>
                      ) : p.contemplado ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
                          Contemplado
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wider">
                          A Pagar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden offscreen target element for html2canvas capture */}
      <div
        id="whatsapp-card-target-full"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "1080px",
          height: "1920px",
          zIndex: -50,
          pointerEvents: "none",
        }}
      >
        <CardContent proposta={proposta} primaryColor={primaryColor} secondaryColor={secondaryColor} />
      </div>

      {/* Modal for 9:16 Card Preview & Export */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#e9ebe4] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Card de Compartilhamento Rápido (9:16)</h3>
                <p className="text-xs text-[#00441F] font-semibold mt-0.5 font-medium">
                  Gere uma imagem de alta qualidade perfeita para envio rápido pelo WhatsApp
                </p>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-[#00441F] font-semibold hover:text-[#00441F] font-bold text-xl p-2 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-items-center">
              {/* Preview Container */}
              <div className="md:col-span-6 flex flex-col items-center">
                <span className="text-xs font-bold text-[#00441F] font-semibold uppercase tracking-widest mb-3">Pré-visualização (Story)</span>
                
                {/* 9:16 Frame */}
                <div className="w-[360px] h-[640px] relative overflow-hidden rounded-2xl border border-gray-300 shadow-2xl bg-[#0F1317]">
                  <div
                    className="absolute top-0 left-0 origin-top-left pointer-events-none"
                    style={{
                      width: "1080px",
                      height: "1920px",
                      transform: "scale(0.333333)",
                    }}
                  >
                    <CardContent proposta={proposta} primaryColor={primaryColor} secondaryColor={secondaryColor} />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="md:col-span-6 space-y-6 w-full max-w-md">
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1.5">
                    <span>💡</span> Dica do Gerente de Negócios
                  </h4>
                  <p className="text-xs text-orange-950/80 leading-relaxed font-semibold">
                    Este card substitui o envio do PDF completo para parceiros que desejam um resumo comercial imediato.
                  </p>
                  <ul className="text-xs text-gray-700 list-disc list-inside space-y-1 font-medium">
                    <li>O formato ocupa a tela cheia do celular do parceiro.</li>
                    <li>Utilize o **Copiar Imagem** para colar direto no WhatsApp Web (Ctrl+V).</li>
                    <li>Utilize o **Baixar Imagem** para enviar pelo celular.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCopyCardToClipboard}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-sm font-bold text-white px-5 py-3.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>{copiedCard ? "✅ Copiado!" : "📋 Copiar Imagem"}</span>
                  </button>
                  
                  <button
                    onClick={handleDownloadCard}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-[#e9ebe4] text-sm font-bold text-gray-700 px-5 py-3.5 shadow-sm hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <span>📥</span> Baixar Imagem (PNG)
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setShowCardModal(false)}
                    className="text-xs font-bold text-[#00441F] font-semibold hover:text-[#00441F] font-semibold hover:underline"
                  >
                    Fechar Visualização
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de conteúdo do Card 9:16
function CardContent({
  proposta,
  primaryColor,
  secondaryColor,
}: {
  proposta: PropostaDetail;
  primaryColor: string;
  secondaryColor: string;
}) {
  const input = proposta.simulacao?.input_json || {};
  const output = proposta.simulacao?.output_json || {};

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

  const getAbatimentoLabel = (ab: string) => {
    switch (ab?.toLowerCase()) {
      case "parcela":
        return "Reduzir Parcelas";
      case "prazo":
        return "Reduzir Prazo";
      case "misto":
        return "Misto / Proporcional";
      default:
        return ab || "Padrão";
    }
  };

  const formattedValue = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0, // Cards rápidos ficam melhores sem centavos
    }).format(val);
  };

  // Financial Parameter extractions
  const creditoTotal = proposta.simulacao?.credito_total || output.totalCreditoBruto || 0;
  const prazo = input.prazo || output.cotas?.[0]?.prazo || 0;
  const parcelaInicial = input.parcela_inicial || output.totalParcelaInicial || output.parcelas?.[0]?.valor_total || 0;
  const parcelaFinal = output.totalParcelaFinal || output.parcela_final || 0;
  const lanceTotal = output.totalLance || (Number(input.lanceEmbutido || 0) + Number(input.recursosProprios || 0));
  const lanceEmbutido = output.lanceEmbutido || output.totalLanceEmbutido || input.lanceEmbutido || 0;
  const recursosProprios = output.recursosProprios || output.totalRecursosProprios || input.recursosProprios || 0;
  const creditoLiquido = output.totalCreditoLiquido || output.credito_liquido || (creditoTotal - lanceEmbutido);
  const saldoDevedor = output.totalCreditoBruto || output.saldo_devedor || creditoTotal;
  const abatimento = input.abatimento || "";
  const modalidade = proposta.simulacao?.modalidade || "";
  const produto = proposta.simulacao?.produto || "";

  // Bid percentage representation
  const lancePercent = creditoTotal > 0 ? Math.round((lanceTotal / creditoTotal) * 100) : 0;

  // Convert primary hex to rgb to use in overlay gradient glow
  const hexToRgb = (hex: string) => {
    const match = hex.replace("#", "").match(/.{1,2}/g);
    if (match && match.length === 3) {
      return `${parseInt(match[0], 16)}, ${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}`;
    }
    return "255, 121, 0";
  };
  const primaryRGB = hexToRgb(primaryColor);

  return (
    <div
      style={{
        width: "1080px",
        height: "1920px",
        padding: "85px 75px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `radial-gradient(circle at 80% 10%, rgba(${primaryRGB}, 0.22) 0%, rgba(15, 19, 23, 1) 65%), #0F1317`,
        fontFamily: "'Montserrat', 'Inter', sans-serif",
        color: "#FFFFFF",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative subtle border light */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "10px",
          background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
        }}
      />

      {/* Background grid line overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.007) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.007) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* --- TOP SECTION --- */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {proposta.empresa?.logo_url ? (
              <img
                src={proposta.empresa.logo_url}
                alt={proposta.empresa.nome_empresa}
                crossOrigin="anonymous"
                style={{
                  maxHeight: "95px",
                  maxWidth: "420px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "50px", fontWeight: "900", letterSpacing: "-1px" }}>
                  <span style={{ color: primaryColor }}>{proposta.empresa?.nome_empresa || "Facit"}</span>
                  <span style={{ color: "#FFFFFF" }}>Con</span>
                </span>
                <span style={{ fontSize: "16px", letterSpacing: "5px", color: "#9CA3AF", marginTop: "2px", fontWeight: "600" }}>
                  CONSÓRCIOS INTELIGENTES
                </span>
              </div>
            )}
          </div>

          {/* Badge */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: primaryColor,
              backgroundColor: `rgba(${primaryRGB}, 0.08)`,
              border: `1.5px solid rgba(${primaryRGB}, 0.25)`,
              padding: "12px 30px",
              borderRadius: "100px",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Proposta Rápida
          </div>
        </div>

        {/* Lead Details */}
        <div style={{ marginBottom: "60px" }}>
          <span style={{ fontSize: "22px", fontWeight: "800", color: primaryColor, letterSpacing: "4px", textTransform: "uppercase" }}>
            Apresentado para
          </span>
          <h2 style={{ fontSize: "68px", fontWeight: "900", color: "#FFFFFF", margin: "10px 0 15px 0", letterSpacing: "-1.5px", lineHeight: "1.1" }}>
            {proposta.lead?.nome || "Parceiro Especial"}
          </h2>
          <div style={{ height: "5px", width: "160px", backgroundColor: primaryColor, borderRadius: "10px" }} />
        </div>

        {/* --- MAIN NUMBERS HIGHLIGHT --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginBottom: "50px" }}>
          {/* Credit Block */}
          <div
            style={{
              background: `linear-gradient(135deg, rgba(${primaryRGB}, 0.16) 0%, rgba(255, 255, 255, 0.02) 100%)`,
              border: `1.5px solid rgba(${primaryRGB}, 0.35)`,
              borderRadius: "32px",
              padding: "50px 55px",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.35)",
            }}
          >
            <span style={{ fontSize: "22px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "2px", textTransform: "uppercase" }}>
              Crédito Contratado
            </span>
            <div style={{ fontSize: "96px", fontWeight: "900", color: "#FFFFFF", marginTop: "10px", lineHeight: "1", letterSpacing: "-2px" }}>
              {formattedValue(creditoTotal)}
            </div>
            <div style={{ display: "flex", gap: "25px", marginTop: "25px", fontSize: "24px", color: "#9CA3AF", fontWeight: "700" }}>
              <span>Produto: <strong style={{ color: "#FFF" }}>{getProductLabel(produto)}</strong></span>
              <span>•</span>
              <span>Plano: <strong style={{ color: "#FFF" }}>{getModalidadeLabel(modalidade)}</strong></span>
            </div>
          </div>

          {/* Prazo & Parcela Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            {/* Parcela Inicial */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "24px",
                padding: "35px 40px",
              }}
            >
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Parcela Pré-Contemp.
              </span>
              <div style={{ fontSize: "52px", fontWeight: "900", color: primaryColor, marginTop: "10px" }}>
                {formattedValue(parcelaInicial)}
              </div>
            </div>

            {/* Prazo */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "24px",
                padding: "35px 40px",
              }}
            >
              <span style={{ fontSize: "20px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Prazo de Pagamento
              </span>
              <div style={{ fontSize: "52px", fontWeight: "900", color: "#FFFFFF", marginTop: "10px" }}>
                {prazo} <span style={{ fontSize: "26px", color: "#9CA3AF", fontWeight: "600" }}>meses</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- DETAILED 2x2 PARAMETERS GRID --- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "40px" }}>
          {/* Item 1: Lance Total */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "24px 30px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1px" }}>
              LANCE TOTAL ESTIMADO
            </span>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
              {formattedValue(lanceTotal)}
              <span style={{ fontSize: "22px", color: primaryColor, marginLeft: "10px", fontWeight: "900" }}>
                {lancePercent}%
              </span>
            </div>
          </div>

          {/* Item 2: Abatimento */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "24px 30px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1px" }}>
              DESTINAÇÃO DO LANCE
            </span>
            <div style={{ fontSize: "34px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
              {getAbatimentoLabel(abatimento)}
            </div>
          </div>

          {/* Item 3: Lance Embutido */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "24px 30px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1px" }}>
              LANCE EMBUTIDO UTILIZADO
            </span>
            <div style={{ fontSize: "34px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
              {lanceEmbutido > 0 ? formattedValue(lanceEmbutido) : "Não Utilizado"}
            </div>
          </div>

          {/* Item 4: Recursos Próprios */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "24px 30px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1px" }}>
              LANCE COM RECURSOS PRÓPRIOS
            </span>
            <div style={{ fontSize: "34px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
              {recursosProprios > 0 ? formattedValue(recursosProprios) : "Não Utilizado"}
            </div>
          </div>

          {/* Item 5: Crédito Líquido */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "24px 30px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1px" }}>
              CRÉDITO LÍQUIDO DISPONÍVEL
            </span>
            <div style={{ fontSize: "34px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
              {formattedValue(creditoLiquido)}
            </div>
          </div>

          {/* Item 6: Parcela Pós-Contemplação */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "24px 30px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1px" }}>
              PARCELA PÓS-CONTEMP. (ESTIMADA)
            </span>
            <div style={{ fontSize: "34px", fontWeight: "800", color: primaryColor, marginTop: "8px" }}>
              {parcelaFinal > 0 ? formattedValue(parcelaFinal) : formattedValue(parcelaInicial)}
            </div>
          </div>
        </div>

        {/* Strategic Note */}
        <div
          style={{
            borderLeft: `6px solid ${primaryColor}`,
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "16px",
            padding: "30px 38px",
          }}
        >
          <p style={{ fontSize: "20px", lineHeight: "1.5", color: "#E5E7EB", margin: 0, fontWeight: "600" }}>
            💡 <strong style={{ color: primaryColor }}>Planejamento Financeiro Inteligente:</strong> Cota com posicionamento estratégico baseado no histórico recente do grupo. Sem juros abusivos de financiamento.
          </p>
        </div>
      </div>

      {/* --- FOOTER SECTION --- */}
      <div
        style={{
          borderTop: "1.5px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Consultant Details */}
        <div>
          <span style={{ fontSize: "16px", fontWeight: "800", color: "#9CA3AF", letterSpacing: "1px", textTransform: "uppercase" }}>
            Fale com seu Gerente de Negócios
          </span>
          <h4 style={{ fontSize: "36px", fontWeight: "900", color: "#FFFFFF", margin: "5px 0", letterSpacing: "-0.5px" }}>
            {proposta.gerente?.nome || "Especialista Meu Parceiro Digital"}
          </h4>
          <span style={{ fontSize: "26px", color: primaryColor, fontWeight: "800" }}>
            {proposta.gerente?.telefone || ""}
          </span>
        </div>

        {/* Branding & Visual Link */}
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "16px", color: "#9CA3AF", fontWeight: "600" }}>
            Acesse a proposta interativa:
          </span>
          <br />
          <div
            style={{
              marginTop: "8px",
              fontSize: "20px",
              fontWeight: "800",
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1.5px solid rgba(255, 255, 255, 0.1)",
              padding: "12px 28px",
              borderRadius: "12px",
              display: "inline-block",
            }}
          >
            {proposta.public_link
              ? `Meu Parceiro Digital.com/proposta-publica/${proposta.id.slice(0, 8).toUpperCase()}`
              : "Meu Parceiro Digital.com"}
          </div>
        </div>
      </div>
    </div>
  );
}
