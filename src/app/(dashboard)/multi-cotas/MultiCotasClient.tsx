'use client';

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { calcularMultiplasCotas } from '@/core/calculator/calculatorEngine';
import { SimulacaoInput, SimulacaoResult } from '@/core/calculator/types';
import { saveSimulacaoAction } from '@/modules/simulacoes/actions';
import { createPropostaAction } from '@/modules/propostas/actions';

interface Lead {
  id: string;
  nome: string;
}

interface Administradora {
  id: string;
  nome: string;
  slug: string;
  engine_key: string | null;
}

interface Empresa {
  id: string;
  nome_empresa: string;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  telefone: string | null;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface CotaInputState {
  id: string;
  credito: number;
  prazo: number;
  modalidade: "linear" | "linear_70" | "reducao_50" | "degrau" | "degrau_70" | "pontual" | "reduzida";
  taxaAdm: number;
  fundoReserva: number;
  seguro: number;
  lanceEmbutido: number;
  recursosProprios: number;
  tipoLance: "nenhum" | "%" | "valor" | "parcelas";
  abatimento: "parcela" | "prazo" | "misto";
  mesContemplacao: number;
  mesPontual?: number;
  quantidadeParcelasLance?: number;
  parcelasFuro?: number;
  taxaAdesao?: number;
  prazoTaxaAdesao?: number;
  reducaoCustomizada?: number;
}

interface MultiCotasClientProps {
  leads: Lead[];
  administradoras: Administradora[];
  empresa: Empresa | null;
  usuario: Usuario;
}

const getPrazoCotaMaximo = (produto: string) => {
  if (produto === 'veiculo') return 84;
  if (produto === 'pesado') return 120;
  if (produto === 'servico') return 48;
  return 240;
};

export default function MultiCotasClient({ leads, administradoras, empresa, usuario }: MultiCotasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [savedSimulacaoId, setSavedSimulacaoId] = useState<string | null>(null);

  const [leadId, setLeadId] = useState('');
  const [administradoraId, setAdministradoraId] = useState(
    () => administradoras.find((a) => a.slug === "rodobens" || a.nome.toLowerCase().includes("rodobens"))?.id || ""
  );
  const [produto, setProduto] = useState('imovel');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Lista de cotas inseridas
  const [cotas, setCotas] = useState<CotaInputState[]>([
    {
      id: '1',
      credito: 100000,
      prazo: 200,
      modalidade: 'linear',
      taxaAdm: 20,
      fundoReserva: 2,
      seguro: 0,
      lanceEmbutido: 0,
      recursosProprios: 0,
      tipoLance: '%',
      abatimento: 'parcela',
      mesContemplacao: 12,
      mesPontual: 12,
      quantidadeParcelasLance: 0,
      parcelasFuro: 0,
      taxaAdesao: 2,
      prazoTaxaAdesao: 1,
      reducaoCustomizada: 70,
    },
  ]);

  const [activeTab, setActiveTab] = useState('1');
  const [resultadoConsolidado, setResultadoConsolidado] = useState<SimulacaoResult | null>(null);

  // Calcular consolidados em tempo real
  useEffect(() => {
    const activeAdmin = administradoras.find((a) => a.id === administradoraId);
    const engineKey: string = 'rodobens';

    const inputs: SimulacaoInput[] = cotas.map((c) => ({
      credito: c.credito,
      prazo: c.prazo,
      modalidade: c.modalidade,
      taxaAdm: c.taxaAdm,
      fundoReserva: engineKey === 'rodobens' ? 0 : c.fundoReserva,
      seguro: c.seguro,
      lanceEmbutido: engineKey === 'rodobens' || c.tipoLance === 'nenhum' ? 0 : c.lanceEmbutido,
      recursosProprios: engineKey === 'rodobens' || c.tipoLance === 'nenhum' ? 0 : c.recursosProprios,
      tipoLance: engineKey === 'rodobens' ? 'parcelas' : (c.tipoLance === 'nenhum' ? '%' : c.tipoLance),
      quantidadeParcelasLance: c.quantidadeParcelasLance,
      abatimento: c.abatimento,
      mesContemplacao: c.mesContemplacao,
      mesPontual: c.modalidade === 'pontual' ? c.mesPontual : undefined,
      prazoMaxGrupo: engineKey === 'rodobens' ? getPrazoCotaMaximo(produto) : undefined,
      parcelasFuro: engineKey === 'rodobens' ? c.parcelasFuro : undefined,
      taxaAdesao: engineKey === 'portobank' ? c.taxaAdesao : undefined,
      prazoTaxaAdesao: engineKey === 'portobank' ? c.prazoTaxaAdesao : undefined,
      percentualReducao: c.modalidade === 'reduzida' ? c.reducaoCustomizada : undefined,
    }));

    try {
      const res = calcularMultiplasCotas(inputs, engineKey);
      setResultadoConsolidado(res);
    } catch (e) {
      console.error('Erro ao calcular consolidação:', e);
    }
  }, [cotas, administradoraId, administradoras, produto]);

  const addCota = () => {
    const newId = (Math.max(...cotas.map((c) => Number(c.id))) + 1).toString();
    const lastCota = cotas[cotas.length - 1] || cotas[0];
    
    setCotas([
      ...cotas,
      {
        ...lastCota,
        id: newId,
      },
    ]);
    setActiveTab(newId);
  };

  const duplicarCota = (id: string) => {
    const target = cotas.find((c) => c.id === id);
    if (!target) return;

    const newId = (Math.max(...cotas.map((c) => Number(c.id))) + 1).toString();
    setCotas([
      ...cotas,
      {
        ...target,
        id: newId,
      },
    ]);
    setActiveTab(newId);
  };

  const removeCota = (id: string) => {
    if (cotas.length <= 1) return;
    const filtered = cotas.filter((c) => c.id !== id);
    setCotas(filtered);
    setActiveTab(filtered[0].id);
  };

  const updateCotaField = (id: string, field: keyof CotaInputState, value: any) => {
    setCotas(
      cotas.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          // Ajustes automáticos
          if (field === 'modalidade' && value === 'pontual') {
            updated.mesPontual = produto === 'veiculo' ? 6 : 12;
          }
          return updated;
        }
        return c;
      })
    );
  };

  const saveSimulacao = useCallback(async (): Promise<string | null> => {
    if (!resultadoConsolidado) return null;

    const activeAdmin = administradoras.find((a) => a.id === administradoraId);
    const engineKey: string = 'rodobens';

    const inputsOriginal = cotas.map((c) => ({
      credito: c.credito,
      prazo: c.prazo,
      modalidade: c.modalidade,
      taxaAdm: c.taxaAdm,
      fundoReserva: c.fundoReserva,
      seguro: c.seguro,
      lanceEmbutido: c.lanceEmbutido,
      recursosProprios: c.recursosProprios,
      tipoLance: c.tipoLance,
      abatimento: c.abatimento,
      mesContemplacao: c.mesContemplacao,
      mesPontual: c.modalidade === 'pontual' ? c.mesPontual : undefined,
      quantidadeParcelasLance: c.quantidadeParcelasLance,
      parcelasFuro: c.parcelasFuro,
      taxaAdesao: c.taxaAdesao,
      prazoTaxaAdesao: c.prazoTaxaAdesao,
    }));

    const res = await saveSimulacaoAction({
      leadId: leadId || null,
      administradoraId: administradoraId || null,
      engineKey,
      produto,
      modalidade: 'multi_cotas', // Salvando como modalidade multi_cotas consolidada
      simulacaoResult: resultadoConsolidado,
      inputsOriginal: inputsOriginal,
    });

    if (res.success && res.simulacaoId) {
      setSavedSimulacaoId(res.simulacaoId);
      return res.simulacaoId;
    } else {
      setFeedback({ success: false, message: res.message || 'Erro ao gravar operação.' });
      return null;
    }
  }, [resultadoConsolidado, cotas, administradoraId, administradoras, leadId, produto]);

  const generatePDF = useCallback(async (simId: string): Promise<string> => {
    const { pdf } = await import("@react-pdf/renderer");
    const { PropostaPDFDocument } = await import("@/components/proposta-pdf/PropostaPDFDocument");

    const getDynamicCoverImage = (produto: string, credito: number) => {
      const prod = produto.toLowerCase();
      if (prod === 'auto' || prod === 'automóvel' || prod === 'carro' || prod === 'veiculo') {
        if (credito < 80000) return '/images/propostas/Proposta Auto Popular.png';
        if (credito < 160000) return '/images/propostas/Proposta Auto Premium.png';
        return '/images/propostas/Proposta Auto Luxo.png';
      }
      if (prod === 'moto' || prod === 'motocicleta') {
        if (credito < 25000) return '/images/propostas/Proposta Moto Popular.png';
        if (credito < 50000) return '/images/propostas/Proposta Moto Premium.png';
        return '/images/propostas/Proposta Moto Luxo.png';
      }
      if (prod === 'pesado' || prod === 'veículo pesado' || prod === 'caminhao' || prod === 'caminhão') {
        if (credito < 300000) return '/images/propostas/Proposta Pesado I.png';
        if (credito < 1000000) return '/images/propostas/Proposta Pesado II.png';
        return '/images/propostas/Proposta Pesado III.png';
      }
      if (prod === 'imóvel' || prod === 'imovel') {
        if (credito < 300000) return '/images/propostas/Proposta Imovel Popular.png';
        if (credito < 1000000) return '/images/propostas/Proposta Imovel Premium.png';
        return '/images/propostas/Proposta Imovel Luxo.png';
      }
      return '/images/propostas/Proposta Diversificada.png';
    };

    const leadObj = leads?.find((l) => l.id === leadId);
    const basePath = typeof window !== 'undefined' ? window.location.origin : '';
    const capaBgUrl = basePath + encodeURI(getDynamicCoverImage(produto, resultadoConsolidado?.totalCreditoBruto || 0));

    const activeAdmin = administradoras.find((a) => a.id === administradoraId);

    const finalData = {
      leadNome: leadObj ? leadObj.nome : "Cliente Interessado",
      adminNome: activeAdmin?.nome || "Administradora",
      empresaNome: empresa?.nome_empresa || "Representação",
      gerenteNome: usuario?.nome || "Gerente de Negócios",
      corPrimaria: empresa?.cor_primaria || "#00CF7B",
      empresaLogo: empresa?.logo_url || "",
      capaBgUrl: capaBgUrl,
      simulacaoId: simId,
      produto: produto,
      modalidade: "multi_cotas",
      prazo: cotas[0]?.prazo || 0, // Pegando o prazo da primeira cota como base
      creditoBruto: resultadoConsolidado?.totalCreditoBruto || 0,
      lanceEmbutido: resultadoConsolidado?.totalLanceEmbutido || 0,
      creditoLiquido: resultadoConsolidado?.totalCreditoLiquido || 0,
      recursosProprios: resultadoConsolidado?.totalRecursosProprios || 0,
      lanceOfertado: resultadoConsolidado?.totalLance || 0,
      lanceOfertadoPercentual: resultadoConsolidado?.percentualLanceMedio || 0,
      parcelaInicial: resultadoConsolidado?.totalParcelaInicial || 0,
      parcelaPosContemplacao: resultadoConsolidado?.totalParcelaFinal || 0,
      totalFinal: resultadoConsolidado?.totalFinalPago || 0,
      taxaAdmin: cotas[0]?.taxaAdm || 0, // Baseado na primeira cota
      fundoReserva: cotas[0]?.fundoReserva || 0,
      mesContemplacao: cotas[0]?.mesContemplacao || 0,
      codigo: simId,
      data: new Date().toLocaleDateString("pt-BR"),
      isRodobens: activeAdmin?.engine_key === "rodobens",
    };

    const pdfBlob = await pdf(<PropostaPDFDocument data={finalData as any} />).toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const binary = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < binary.length; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    return window.btoa(binaryString);
  }, [leads, leadId, administradoras, administradoraId, empresa, usuario, produto, resultadoConsolidado, cotas]);

  const handleGerarProposta = useCallback(async () => {
    if (!leadId) {
      setFeedback({ success: false, message: "⚠️ Por favor, selecione um parceiro antes de gerar a proposta." });
      return;
    }

    setIsGeneratingPDF(true);
    setFeedback(null);

    try {
      let simId = savedSimulacaoId;
      if (!simId) {
        simId = await saveSimulacao();
        if (!simId) {
          setIsGeneratingPDF(false);
          return;
        }
      }

      const pdfBase64 = await generatePDF(simId);

      const res = await createPropostaAction({
        leadId,
        simulacaoId: simId,
        pdfBase64,
      });

      if (res.success && res.propostaId) {
        setFeedback({ success: true, message: "✅ Proposta gerada com sucesso! Redirecionando..." });
        router.push(`/propostas/${res.propostaId}`);
      } else {
        setFeedback({ success: false, message: res.message || "Erro ao criar proposta." });
      }
    } catch (e: any) {
      console.error("Erro ao gerar proposta:", e);
      setFeedback({ success: false, message: `Erro ao gerar proposta: ${e.message || "Erro interno"}` });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [leadId, savedSimulacaoId, saveSimulacao, generatePDF, router]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const activeCota = cotas.find((c) => c.id === activeTab) || cotas[0];
  const activeAdmin = administradoras.find((a) => a.id === administradoraId);
  const engineKey: string = 'rodobens';
  const isRodobens = true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00441F]">Simulador Multi-Cotas</h1>
          <p className="text-sm text-[#00441F] font-semibold font-light mt-1">
            Simule múltiplas cotas em paralelo para otimizar os lances, diminuir o custo efetivo e acelerar a contemplação do seu cliente.
          </p>
        </div>
      </div>

      {/* Grid Superior: Dados Gerais e Consolidado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Escolha do Lead e Empresa */}
        <div className="lg:col-span-4 bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#00441F] border-b border-gray-100 pb-2">Informações Gerais</h3>

          <div>
            <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Vincular a um Lead</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
            >
              <option value="">Nenhum lead selecionado</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Administradora Fixa (Rodobens) */}

          <div>
            <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Categoria do Bem</label>
            <select
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
            >
              <option value="imovel">Imóvel</option>
              <option value="veiculo">Veículo / Auto</option>
              <option value="pesado">Pesado / Caminhão</option>
              <option value="servico">Serviço</option>
            </select>
          </div>

          <button
            onClick={handleGerarProposta}
            disabled={isGeneratingPDF || !resultadoConsolidado}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#00CF7B] hover:bg-[#FF7A40] text-sm font-bold text-white px-5 py-3 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPDF ? 'Gerando Proposta...' : 'Gerar Proposta Multi-Cotas'}
          </button>

          {feedback && (
            <div className={`p-4 rounded-xl border text-sm font-semibold ${feedback.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {feedback.message}
            </div>
          )}
        </div>

        {/* Resumo Consolidado Flutuante */}
        <div className="lg:col-span-8 bg-[#00441F] text-white border border-[#E0E5CF]/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-40 w-40 bg-[#00441F]/105 rounded-full filter blur-3xl -mr-16 -mt-16"></div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#00441F] font-semibold">Resultado Consolidado da Operação</h3>
            <span className="text-[10px] bg-[#00CF7B]/20 text-[#00CF7B] px-2 py-0.5 rounded font-bold mt-1.5 inline-block border border-[#00441F]/10">
              {cotas.length} Cota(s) vinculadas
            </span>
          </div>

          {resultadoConsolidado && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-6 border-t border-b border-gray-800 py-6">
              <div>
                <span className="text-[10px] text-[#00441F] font-bold uppercase tracking-wider">Crédito Consolidado</span>
                <div className="text-lg font-extrabold mt-1 text-[#00CF7B]">{formatCurrency(resultadoConsolidado.totalCreditoBruto)}</div>
              </div>

              <div>
                <span className="text-[10px] text-[#00441F] font-bold uppercase tracking-wider">Crédito Líquido Total</span>
                <div className="text-lg font-extrabold mt-1 text-emerald-400">{formatCurrency(resultadoConsolidado.totalCreditoLiquido)}</div>
              </div>

              <div>
                <span className="text-[10px] text-[#00441F] font-bold uppercase tracking-wider">Parcela Inicial</span>
                <div className="text-lg font-extrabold mt-1">{formatCurrency(resultadoConsolidado.totalParcelaInicial)}</div>
              </div>

              <div>
                <span className="text-[10px] text-[#00441F] font-bold uppercase tracking-wider">Lance Total (Médio)</span>
                <div className="text-lg font-extrabold mt-1 text-blue-400">{formatCurrency(resultadoConsolidado.totalLance)}</div>
                <span className="text-[9px] text-[#00441F] font-semibold font-medium">({resultadoConsolidado.percentualLanceMedio.toFixed(1)}%)</span>
              </div>
            </div>
          )}

          <div className="text-xs text-[#00441F] font-semibold font-light flex items-center gap-1.5">
            💡 <span>Fragmentar créditos elevados em cotas menores reduz o lance para contemplação e flexibiliza as regras do plano!</span>
          </div>
        </div>
      </div>

      {/* Seção das Guias de Cotas e Configuração */}
      <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-sm overflow-hidden">
        {/* Barra de Navegação das Guias (Tabs) */}
        <div className="flex border-b border-[#E0E5CF] bg-gray-50/50 p-2 gap-1 items-center overflow-x-auto">
          {cotas.map((cota, idx) => (
            <button
              key={cota.id}
              onClick={() => setActiveTab(cota.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${activeTab === cota.id ? 'bg-[#00441F] text-white border-[#00441F] shadow-sm' : 'bg-[#e9ebe4] hover:bg-gray-50 text-[#00441F] font-semibold border-[#E0E5CF]'}`}
            >
              Cota {idx + 1}
            </button>
          ))}
          <button
            onClick={addCota}
            className="px-3 py-2 text-xs font-bold rounded-lg border border-dashed border-[#00CF7B] text-[#00CF7B] hover:bg-[#FF7A40]/5 transition-all cursor-pointer flex items-center gap-1"
          >
            + Adicionar
          </button>
        </div>

        {/* Formulário da Cota Ativa */}
        {activeCota && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-[#00441F]">Configurar Cota</h4>
                <p className="text-[10px] text-[#00441F] font-semibold">Edite as variáveis específicas desta cota da operação.</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => duplicarCota(activeCota.id)}
                  className="px-3 py-1.5 text-[10px] font-bold rounded bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                >
                  Duplicar Cota
                </button>
                <button
                  type="button"
                  disabled={cotas.length <= 1}
                  onClick={() => removeCota(activeCota.id)}
                  className="px-3 py-1.5 text-[10px] font-bold rounded bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer disabled:opacity-40"
                >
                  Remover Cota
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Crédito */}
              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Crédito Bruto (R$)</label>
                <input
                  type="number"
                  value={activeCota.credito}
                  onChange={(e) => updateCotaField(activeCota.id, 'credito', Number(e.target.value))}
                  className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                />
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Prazo (Meses)</label>
                <input
                  type="number"
                  value={activeCota.prazo}
                  max={produto === 'veiculo' ? 84 : 240}
                  onChange={(e) => updateCotaField(activeCota.id, 'prazo', Number(e.target.value))}
                  className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                />
              </div>

              {/* Rodobens específicos */}
              {isRodobens && (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Parcelas Furo</label>
                  <input
                    type="number"
                    value={activeCota.parcelasFuro || 0}
                    onChange={(e) => updateCotaField(activeCota.id, 'parcelasFuro', Number(e.target.value))}
                    className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                  />
                </div>
              )}

              {/* Modalidade */}
              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Modalidade</label>
                <select
                  value={activeCota.modalidade}
                  onChange={(e) => updateCotaField(activeCota.id, 'modalidade', e.target.value)}
                  className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                >
                  <option value="linear">Linear (100%)</option>
                  <option value="linear_70">Linear 70%</option>
                  <option value="reducao_50">Redução 50%</option>
                  <option value="degrau">Degrau</option>
                  <option value="degrau_70">Degrau 70%</option>
                  <option value="pontual">Pontual (40%)</option>
                  {!isRodobens && <option value="reduzida">Reduzida</option>}
                </select>
              </div>

              {/* Reduzida Customizada */}
              {activeCota.modalidade === 'reduzida' && (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">% da Parcela</label>
                  <input
                    type="number"
                    value={activeCota.reducaoCustomizada || 70}
                    onChange={(e) => updateCotaField(activeCota.id, 'reducaoCustomizada', Number(e.target.value))}
                    className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                  />
                </div>
              )}

              {/* Mês Contemplação / Mês Pontual */}
              {activeCota.modalidade === 'pontual' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Mês Aquisição</label>
                  <select
                    value={activeCota.mesPontual}
                    onChange={(e) => updateCotaField(activeCota.id, 'mesPontual', Number(e.target.value))}
                    className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                  >
                    {Array.from({ length: 19 }, (_, i) => i + (produto === 'veiculo' ? 6 : 12)).map((m) => (
                      <option key={m} value={m}>
                        {m}º Mês
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Mês Contemplação</label>
                  <input
                    type="number"
                    value={activeCota.mesContemplacao}
                    min={1}
                    max={activeCota.prazo}
                    onChange={(e) => updateCotaField(activeCota.id, 'mesContemplacao', Number(e.target.value))}
                    className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                  />
                </div>
              )}
            </div>

            {/* Taxas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-50 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Taxa ADM %</label>
                <input
                  type="number"
                  step="0.01"
                  value={activeCota.taxaAdm}
                  onChange={(e) => updateCotaField(activeCota.id, 'taxaAdm', Number(e.target.value))}
                  className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                />
              </div>

              {!isRodobens && (
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">F. Reserva %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={activeCota.fundoReserva}
                    onChange={(e) => updateCotaField(activeCota.id, 'fundoReserva', Number(e.target.value))}
                    className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Seguro %</label>
                <input
                  type="number"
                  step="0.01"
                  value={activeCota.seguro}
                  onChange={(e) => updateCotaField(activeCota.id, 'seguro', Number(e.target.value))}
                  className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                />
              </div>
            </div>

            {/* PortoBank Adesão */}
            {engineKey === 'portobank' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Taxa de Adesão %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={activeCota.taxaAdesao || 0}
                    onChange={(e) => updateCotaField(activeCota.id, 'taxaAdesao', Number(e.target.value))}
                    className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Prazo Adesão (Meses)</label>
                  <select
                    value={activeCota.prazoTaxaAdesao || 1}
                    onChange={(e) => updateCotaField(activeCota.id, 'prazoTaxaAdesao', Number(e.target.value))}
                    className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                  >
                    <option value={1}>1x</option>
                    <option value={3}>3x</option>
                    <option value={5}>5x</option>
                    <option value={12}>12x</option>
                    <option value={24}>24x</option>
                  </select>
                </div>
              </div>
            )}

            {/* Lances se não for pontual */}
            {activeCota.modalidade !== 'pontual' && (
              <div className="border-t border-gray-50 pt-4 space-y-4">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Lance da Cota</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Tipo Lance */}
                  {!isRodobens && (
                    <div>
                      <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Tipo Lance</label>
                      <select
                        value={activeCota.tipoLance}
                        onChange={(e) => updateCotaField(activeCota.id, 'tipoLance', e.target.value)}
                        className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                      >
                        {engineKey === 'tarraf' ? (
                          <option value="%">Percentual %</option>
                        ) : engineKey === 'portobank' ? (
                          <>
                            <option value="nenhum">Nenhum</option>
                            <option value="%">Percentual %</option>
                          </>
                        ) : (
                          <>
                            <option value="nenhum">Nenhum</option>
                            <option value="%">Percentual %</option>
                            <option value="valor">Valor R$</option>
                            <option value="parcelas">Qtd. Parcelas</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Lance dependendo do tipo */}
                  {(isRodobens || activeCota.tipoLance === 'parcelas') ? (
                    <div>
                      <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Qtd. Parcelas Ofertadas</label>
                      <input
                        type="number"
                        value={activeCota.quantidadeParcelasLance || 0}
                        onChange={(e) => updateCotaField(activeCota.id, 'quantidadeParcelasLance', Number(e.target.value))}
                        className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                      />
                    </div>
                  ) : activeCota.tipoLance !== 'nenhum' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Embutido (Máx 30%)</label>
                        <input
                          type="number"
                          value={activeCota.lanceEmbutido}
                          onChange={(e) => updateCotaField(activeCota.id, 'lanceEmbutido', Number(e.target.value))}
                          className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Próprio</label>
                        <input
                          type="number"
                          value={activeCota.recursosProprios}
                          onChange={(e) => updateCotaField(activeCota.id, 'recursosProprios', Number(e.target.value))}
                          className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                        />
                      </div>
                    </>
                  )}

                  {/* Abatimento */}
                  <div>
                    <label className="block text-xs font-semibold text-[#00441F] font-semibold uppercase tracking-wider">Forma de Amortização</label>
                    <select
                      value={activeCota.abatimento}
                      onChange={(e) => updateCotaField(activeCota.id, 'abatimento', e.target.value)}
                      className="block w-full mt-1.5 rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm text-[#00441F] outline-none focus:border-[#00CF7B]"
                    >
                      <option value="parcela">Reduzir Parcela</option>
                      <option value="prazo">Reduzir Prazo</option>
                      <option value="misto">Misto</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Resultado Individual da Cota */}
            {resultadoConsolidado && resultadoConsolidado.cotas[cotas.indexOf(activeCota)] && (
              <div className="border-t border-gray-100 pt-5 mt-4 bg-gray-50/50 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Resultado desta Cota</h5>
                
                {(() => {
                  const resCota = resultadoConsolidado.cotas[cotas.indexOf(activeCota)];
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[#00441F] font-semibold">Parcela Inicial:</span>
                        <div className="font-bold text-gray-900 mt-0.5">{formatCurrency(resCota.parcelaInicial)}</div>
                      </div>
                      <div>
                        <span className="text-[#00441F] font-semibold">Parcela Final/Regular:</span>
                        <div className="font-bold text-gray-900 mt-0.5">{formatCurrency(resCota.parcelaFinal)}</div>
                      </div>
                      <div>
                        <span className="text-[#00441F] font-semibold">Crédito Líquido:</span>
                        <div className="font-bold text-emerald-700 mt-0.5">{formatCurrency(resCota.creditoLiquido)}</div>
                      </div>
                      <div>
                        <span className="text-[#00441F] font-semibold">Lance Oferecido:</span>
                        <div className="font-bold text-blue-700 mt-0.5">{formatCurrency(resCota.lanceTotalReais)} ({resCota.percentualLance.toFixed(1)}%)</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
