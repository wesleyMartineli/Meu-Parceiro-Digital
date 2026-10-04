"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface PropostaItem {
  id: string;
  created_at: string;
  status: string;
  visualizacoes: number;
  pdf_url: string | null;
  public_link: string | null;
  gerente: { nome: string } | null;
  lead: { nome: string } | null;
  simulacao: { credito_total: number; produto: string; modalidade: string } | null;
}

interface PropostasClientProps {
  propostas: PropostaItem[];
  gerenteRole: string;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

function getProductIcon(prod?: string): string {
  switch (prod) {
    case "auto": return "🚗";
    case "moto": return "🏍️";
    case "pesado": return "🚛";
    case "imovel": return "🏠";
    case "servico": return "🔧";
    default: return "📊";
  }
}

export default function PropostasClient({ propostas, gerenteRole }: PropostasClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const total = propostas.length;
    const aprovadas = propostas.filter((p) => p.status === "aprovada").length;
    const enviadas = propostas.filter((p) => p.status === "enviada" || p.status === "pendente").length;
    const totalViews = propostas.reduce((acc, curr) => acc + curr.visualizacoes, 0);

    return { total, aprovadas, enviadas, totalViews };
  }, [propostas]);

  // Filtering
  const filteredPropostas = useMemo(() => {
    return propostas.filter((p) => {
      const matchesSearch =
        (p.lead?.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.gerente?.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMap = p.status === "pendente" ? "enviada" : p.status;
      const matchesStatus = statusFilter === "all" || statusMap === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [propostas, searchTerm, statusFilter]);

  const handleCopyLink = async (id: string, publicLink: string | null) => {
    if (!publicLink) return;
    try {
      const fullUrl = `${window.location.origin}${publicLink}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Falha ao copiar link:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00441F]">Propostas Geradas</h1>
          <p className="text-sm text-[#00441F] font-semibold font-light mt-1">
            Gerencie, visualize métricas de acessos e acompanhe propostas ativas.
          </p>
        </div>
        <Link
          href="/simulador"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00CF7B] hover:bg-[#FF7A40] text-sm font-bold text-white px-5 py-3 shadow-md hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>⚡</span> Nova Proposta / Simulação
        </Link>
      </div>

      {/* KPI Dashboard cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider block">Total Criadas</span>
          <div className="text-2xl font-black text-[#00441F] mt-1">{kpis.total}</div>
        </div>
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider block">Aprovadas pelo Cliente</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{kpis.aprovadas}</div>
        </div>
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider block">Aguardando Retorno</span>
          <div className="text-2xl font-black text-[#00CF7B] mt-1">{kpis.enviadas}</div>
        </div>
        <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-[#00441F] font-semibold uppercase tracking-wider block">Visualizações Públicas</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{kpis.totalViews}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative flex items-center">
          <span className="absolute left-3.5 text-[#00441F] font-semibold text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar por cliente, consultor ou ID da proposta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0E5CF] text-sm text-[#00441F] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all placeholder:text-[#00441F] font-semibold font-medium"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-[#E0E5CF] rounded-xl px-3 py-2.5 text-sm text-[#00441F] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all cursor-pointer font-bold bg-[#e9ebe4]"
          >
            <option value="all">Todos os Status</option>
            <option value="enviada">Aguardando (Enviada)</option>
            <option value="aprovada">Aprovada</option>
            <option value="recusada">Recusada</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#00441F] font-semibold border-b border-gray-150 uppercase tracking-wider font-bold">
                <th className="py-4 px-5 whitespace-nowrap">Cliente</th>
                <th className="py-4 px-5 whitespace-nowrap">Crédito</th>
                <th className="py-4 px-5 whitespace-nowrap">Modalidade</th>
                <th className="py-4 px-5 whitespace-nowrap">Emissão</th>
                {gerenteRole !== "gerente_negocio" && <th className="py-4 px-5 whitespace-nowrap">Consultor</th>}
                <th className="py-4 px-5 whitespace-nowrap text-center">Visualizações</th>
                <th className="py-4 px-5 whitespace-nowrap text-center">Status</th>
                <th className="py-4 px-5 whitespace-nowrap text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPropostas.map((p) => {
                const statusMap = p.status === "pendente" ? "enviada" : p.status;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm">{p.lead?.nome || "Cliente interessado"}</div>
                      <div className="text-[10px] text-[#00441F] font-semibold font-light mt-0.5">ID: {p.id.slice(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-extrabold text-gray-900 text-sm">
                        {p.simulacao?.credito_total ? formatCurrency(p.simulacao.credito_total) : "-"}
                      </div>
                      <div className="text-[10px] text-[#00CF7B] font-bold mt-0.5 flex items-center gap-1">
                        <span>{getProductIcon(p.simulacao?.produto)}</span>
                        <span className="capitalize">{p.simulacao?.produto || "Consórcio"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800 uppercase tracking-wider">
                        {p.simulacao?.modalidade.replace("_", " ") || "Linear"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-[#00441F] font-semibold font-medium">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    {gerenteRole !== "gerente_negocio" && (
                      <td className="py-3.5 px-5 whitespace-nowrap font-bold text-gray-700">
                        {p.gerente?.nome || "-"}
                      </td>
                    )}
                    <td className="py-3.5 px-5 whitespace-nowrap text-center font-extrabold text-[#00441F] font-semibold text-sm">
                      {p.visualizacoes}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-center">
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
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                      {p.public_link && (
                        <button
                          onClick={() => handleCopyLink(p.id, p.public_link)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-[#00441F] font-semibold hover:text-[#00CF7B] hover:border-[#00CF7B]/30 hover:bg-[#FF7A40]/5 transition-colors cursor-pointer"
                          title="Copiar link público para WhatsApp"
                        >
                          <span className="text-xs">{copiedId === p.id ? "✅ Copiado" : "🔗 Copiar Link"}</span>
                        </button>
                      )}
                      {p.pdf_url && (
                        <a
                          href={p.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-[#00441F] font-semibold hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Abrir PDF"
                        >
                          <span className="text-xs">📄 PDF</span>
                        </a>
                      )}
                      <Link
                        href={`/propostas/${p.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-[#00441F]/10 bg-[#00441F]/5 text-[#00441F] hover:bg-[#00441F] hover:text-white font-bold transition-all cursor-pointer"
                        title="Ver Console Detalhado"
                      >
                        <span className="text-xs">Ver Console →</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredPropostas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#00441F] font-semibold font-light text-sm">
                    Nenhuma proposta encontrada correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
