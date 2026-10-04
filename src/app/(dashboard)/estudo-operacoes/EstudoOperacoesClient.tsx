'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { calcularEstudoOperacoes, EstudoOperacoesResult } from '@/core/calculator/estudosEngine';
import { SimulacaoInput, SimulacaoResult } from '@/core/calculator/types';
import { saveSimulacaoAction } from '@/modules/simulacoes/actions';
import { createPropostaAction } from '@/modules/propostas/actions';

// ─── Tipos locais ────────────────────────────────────────────────────────────

interface Lead { id: string; nome: string; }
interface Administradora { id: string; nome: string; slug: string; engine_key: string | null; }
interface Empresa { id: string; nome_empresa: string; logo_url: string | null; cor_primaria: string; cor_secundaria: string; telefone: string | null; }
interface Usuario { id: string; nome: string; email: string; role: string; }

interface CotaEstudo {
  id: string;
  label: string;           // Ex: "Cota 1 – Grupo 1730"
  grupo: string;           // Número/nome do grupo (informativo)
  credito: number;
  prazo: number;
  modalidade: 'linear' | 'linear_70' | 'reducao_50' | 'degrau' | 'degrau_70';
  taxaAdm: number;
  seguro: number;
  quantidadeParcelasLance: number; // Qtd de parcelas de lance (Rodobens)
  lanceEmbutidoPerc: number;       // % embutido (para modo não-Rodobens)
  abatimento: 'parcela' | 'prazo' | 'misto';
  mesContemplacao: number;         // Mês alvo de contemplação (chave do Degrau)
  parcelasFuro: number;
}

interface EstudoOperacoesClientProps {
  leads: Lead[];
  administradoras: Administradora[];
  empresa: Empresa | null;
  usuario: Usuario;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtMesAno = (d: Date) =>
  d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

const MODALIDADE_LABEL: Record<string, string> = {
  linear: 'Linear (100%)',
  linear_70: 'Linear 70%',
  reducao_50: 'Redução 50%',
  degrau: 'Degrau',
  degrau_70: 'Degrau 70%',
};

function getPrazoCotaMaximo(produto: string) {
  if (produto === 'veiculo') return 84;
  if (produto === 'pesado') return 120;
  return 240;
}

const defaultCota = (id: string, num: number): CotaEstudo => ({
  id,
  label: `Cota ${num}`,
  grupo: '',
  credito: 1500000,
  prazo: 180,
  modalidade: 'degrau',
  taxaAdm: 24.5,
  seguro: 0,
  quantidadeParcelasLance: 0,
  lanceEmbutidoPerc: 30,
  abatimento: 'parcela',
  mesContemplacao: num * 2, // distribui por padrão
  parcelasFuro: 0,
});

// ─── Componente Principal ────────────────────────────────────────────────────

export default function EstudoOperacoesClient({
  leads, administradoras, empresa, usuario,
}: EstudoOperacoesClientProps) {
  const router = useRouter();


  // ─── Estado Global ──────────────────────────────────────────────────────
  const [leadId, setLeadId] = useState('');
  const [produto, setProduto] = useState('imovel');
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // ─── Cotas ──────────────────────────────────────────────────────────────
  const [cotas, setCotas] = useState<CotaEstudo[]>([
    defaultCota('1', 1),
    defaultCota('2', 2),
  ]);
  const [activeTab, setActiveTab] = useState('1');

  // ─── Resultado do Cálculo ────────────────────────────────────────────────
  const [resultado, setResultado] = useState<EstudoOperacoesResult | null>(null);
  const [viewMode, setViewMode] = useState<'resumo' | 'timeline' | 'cotas'>('resumo');

  // ─── Modal de Aviso de Desenvolvimento ───────────────────────────────────
  const [showDevModal, setShowDevModal] = useState(true);

  // ─── PDF (mesmo padrão do simulador) ─────────────────────────────────────
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [savedSimulacaoId, setSavedSimulacaoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Monta o SimulacaoResult consolidado a partir do resultado do estudo
  const buildSimulacaoResult = useCallback((): SimulacaoResult | null => {
    if (!resultado) return null;
    const { resumo, cotas: cotasCalc } = resultado;
    return {
      totalCreditoBruto: resumo.creditoBrutoTotal,
      totalCreditoLiquido: resumo.creditoLiquidoTotal,
      totalLanceEmbutido: resumo.lanceEmbutidoTotal,
      totalRecursosProprios: resumo.lanceProprioTotal,
      totalLance: resumo.lanceEmbutidoTotal + resumo.lanceProprioTotal,
      percentualLanceMedio: 0,
      totalParcelaInicial: resumo.parcelaMediaAntes,
      totalParcelaFinal: resumo.parcelaPosContemplacao,
      totalFinalPago: cotasCalc.reduce((s, c) => s + c.totalPago, 0),
      cotas: cotasCalc,
    };
  }, [resultado]);

  // 1. Salva a simulação no banco (igual ao simulador)
  const saveSimulacao = useCallback(async (): Promise<string | null> => {
    const simResult = buildSimulacaoResult();
    if (!simResult) return null;

    const inputsOriginal = cotas.map((c) => ({
      label: c.label,
      grupo: c.grupo,
      credito: c.credito,
      prazo: c.prazo,
      modalidade: c.modalidade,
      taxaAdm: c.taxaAdm,
      seguro: c.seguro,
      mesContemplacao: c.mesContemplacao,
      quantidadeParcelasLance: c.quantidadeParcelasLance,
      abatimento: c.abatimento,
    }));

    const res = await saveSimulacaoAction({
      leadId: leadId || null,
      administradoraId: administradoras.find((a) =>
        a.slug === 'rodobens' || a.nome.toLowerCase().includes('rodobens')
      )?.id || null,
      engineKey: 'rodobens',
      produto,
      modalidade: 'estudo_operacoes',
      simulacaoResult: simResult,
      inputsOriginal,
    });

    if (res.success && res.simulacaoId) {
      setSavedSimulacaoId(res.simulacaoId);
      return res.simulacaoId;
    }
    setFeedback({ success: false, message: res.message || 'Erro ao salvar simulação.' });
    return null;
  }, [resultado, cotas, leadId, produto, administradoras, buildSimulacaoResult]);

  // 2. Gera o PDF em base64 (igual ao simulador)
  const generatePDF = useCallback(async (simId: string): Promise<string> => {
    const { pdf } = await import('@react-pdf/renderer');
    const { EstudoPDFDocument } = await import('@/components/estudo-pdf/EstudoPDFDocument');

    if (!resultado) throw new Error('Sem resultado para gerar PDF');

    const leadNome = leads.find((l) => l.id === leadId)?.nome || 'Estudo de Operações';
    const [ano, mesStr] = dataInicio.split('-').map(Number);

    const getCoverImage = (prod: string) => {
      if (prod === 'veiculo') return '/images/propostas/Capa Proposta/Capa Consorcio Automoveis.png';
      if (prod === 'pesado') return '/images/propostas/Capa Proposta/Capa Consorcio Caminhão.png';
      return '/images/propostas/Capa Proposta/Capa Consorcio Imoveis.png';
    };
    const basePath = typeof window !== 'undefined' ? window.location.origin : '';
    const capaBgUrl = basePath + getCoverImage(produto);

    const pdfData = {
      leadNome,
      adminNome: 'Rodobens',
      empresaNome: empresa?.nome_empresa || 'Representação',
      gerenteNome: usuario?.nome || 'Gerente de Negócios',
      empresaLogo: empresa?.logo_url || undefined,
      produto,
      dataInicio,
      cotasInput: cotas.map((c) => ({
        label: c.label,
        grupo: c.grupo,
        credito: c.credito,
        prazo: c.prazo,
        modalidade: c.modalidade,
        taxaAdm: c.taxaAdm,
        mesContemplacao: c.mesContemplacao,
      })),
      resultado,
      data: new Date().toLocaleDateString('pt-BR'),
      simulacaoId: simId,
      capaBgUrl,
    };

    const pdfBlob = await pdf(<EstudoPDFDocument data={pdfData} />).toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const binary = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < binary.length; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    return window.btoa(binaryString);
  }, [resultado, leads, leadId, empresa, usuario, produto, dataInicio, cotas]);

  // 3. Handler principal — igual ao simulador: salva → PDF → createProposta → redireciona
  const handleGerarProposta = useCallback(async () => {
    if (!leadId) {
      setFeedback({ success: false, message: '⚠️ Por favor, selecione um Parceiro antes de gerar a proposta.' });
      return;
    }

    setIsGeneratingPDF(true);
    setFeedback(null);

    try {
      let simId = savedSimulacaoId;
      if (!simId) {
        simId = await saveSimulacao();
        if (!simId) { setIsGeneratingPDF(false); return; }
      }

      const pdfBase64 = await generatePDF(simId);

      const res = await createPropostaAction({ leadId, simulacaoId: simId, pdfBase64 });

      if (res.success && res.propostaId) {
        setFeedback({ success: true, message: '✅ Proposta gerada com sucesso! Redirecionando...' });
        router.push(`/propostas/${res.propostaId}`);
      } else {
        setFeedback({ success: false, message: res.message || 'Erro ao criar proposta.' });
      }
    } catch (e: any) {
      console.error('Erro ao gerar proposta:', e);
      setFeedback({ success: false, message: `Erro ao gerar proposta: ${e.message || 'Erro interno'}` });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [leadId, savedSimulacaoId, saveSimulacao, generatePDF, router]);

  // ─── Calcular em tempo real ──────────────────────────────────────────────
  useEffect(() => {
    const prazoMax = getPrazoCotaMaximo(produto);

    const inputs: SimulacaoInput[] = cotas.map((c) => ({
      credito: c.credito,
      prazo: c.prazo,
      modalidade: c.modalidade,
      taxaAdm: c.taxaAdm,
      fundoReserva: 0,  // Rodobens não usa fundo de reserva
      seguro: c.seguro,
      lanceEmbutido: 0,
      recursosProprios: 0,
      tipoLance: 'parcelas',
      quantidadeParcelasLance: c.quantidadeParcelasLance,
      abatimento: c.abatimento,
      mesContemplacao: c.mesContemplacao,
      prazoMaxGrupo: prazoMax,
      parcelasFuro: c.parcelasFuro,
    }));

    try {
      const [ano, mes] = dataInicio.split('-').map(Number);
      const res = calcularEstudoOperacoes(inputs, new Date(ano, mes - 1, 1), 'rodobens');
      setResultado(res);
    } catch (e) {
      console.error('Erro ao calcular estudo de operações:', e);
    }
  }, [cotas, produto, dataInicio]);

  // ─── CRUD de Cotas ──────────────────────────────────────────────────────
  const addCota = () => {
    const num = cotas.length + 1;
    const newId = Date.now().toString();
    const last = cotas[cotas.length - 1];
    const newCota: CotaEstudo = {
      ...defaultCota(newId, num),
      credito: last?.credito ?? 1500000,
      prazo: last?.prazo ?? 180,
      taxaAdm: last?.taxaAdm ?? 24.5,
      modalidade: last?.modalidade ?? 'degrau',
      mesContemplacao: (last?.mesContemplacao ?? 0) + 2,
    };
    setCotas([...cotas, newCota]);
    setActiveTab(newId);
  };

  const removeCota = (id: string) => {
    if (cotas.length <= 1) return;
    const filtered = cotas.filter((c) => c.id !== id);
    setCotas(filtered);
    if (activeTab === id) setActiveTab(filtered[0].id);
  };

  const duplicarCota = (id: string) => {
    const src = cotas.find((c) => c.id === id);
    if (!src) return;
    const newId = Date.now().toString();
    const newCota: CotaEstudo = {
      ...src,
      id: newId,
      label: `${src.label} (cópia)`,
      mesContemplacao: src.mesContemplacao + 2,
    };
    setCotas([...cotas, newCota]);
    setActiveTab(newId);
  };

  const updateField = <K extends keyof CotaEstudo>(id: string, field: K, value: CotaEstudo[K]) => {
    setCotas(cotas.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  // ─── Cota ativa ─────────────────────────────────────────────────────────
  const activeCota = cotas.find((c) => c.id === activeTab) || cotas[0];

  // ─── Resumo Geral ────────────────────────────────────────────────────────
  const resumo = resultado?.resumo;
  const timeline = resultado?.timeline ?? [];

  // Parcela total no mês 1 (antes de qualquer contemplação)
  const parcelaTotalMes1 = timeline[0]?.parcelaMes ?? 0;
  // Parcela total depois que TODAS foram contempladas
  const ultimoMesComParcela = [...timeline].reverse().find((t) => t.parcelaMes > 0);
  const parcelaTotalFinal = ultimoMesComParcela?.parcelaMes ?? 0;

  // Meses em que ocorrem contemplações
  const mesesContemplacao = cotas
    .slice()
    .sort((a, b) => a.mesContemplacao - b.mesContemplacao)
    .map((c) => c.mesContemplacao);

  // Crédito líquido acumulado no fim
  const ultimaTimeline = timeline[timeline.length - 1];
  const creditoLiquidoAcumulado = ultimaTimeline?.saldoLiquidoMensal ?? 0;

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-[#00441F] relative">
      {/* ── Modal de Confirmação: Em Desenvolvimento ── */}
      {showDevModal && (
        <div className="fixed inset-0 bg-[#00441F]/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-3xl max-w-md w-full shadow-2xl p-6 text-[#00441F] text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-[#00441F]">
                Aviso do Sistema
              </h3>
              <p className="text-base font-bold text-[#00441F] leading-relaxed">
                Módulo ainda em desenvolvimento. Deseja prosseguir?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold transition-all cursor-pointer shadow-sm"
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00CF7B] hover:bg-[#00441F] text-white text-sm font-bold transition-all cursor-pointer shadow-md hover:shadow-lg"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Estudo de Operações – Degrau</h1>
          <p className="text-sm font-medium mt-1 text-[#00441F]/70">
            Monte uma operação com múltiplas cotas em planos diferentes (Degrau, Linear, Reduzido) distribuídas ao longo do tempo.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          >
            <option value="">Nenhum lead</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <select
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            className="rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          >
            <option value="imovel">Imóvel</option>
            <option value="veiculo">Veículo / Auto</option>
            <option value="pesado">Pesado / Caminhão</option>
          </select>
          <input
            type="month"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            title="Mês de início da operação"
            className="rounded-lg border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
          />
          <button
            onClick={handleGerarProposta}
            disabled={isGeneratingPDF || !resultado}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00CF7B] hover:bg-[#00441F] text-white text-sm font-bold px-4 py-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Gerando Proposta...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Gerar Proposta
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Feedback (igual ao simulador) ── */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm font-semibold ${feedback.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {feedback.message}
        </div>
      )}

      {/* ── Cards de Resumo ── */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Crédito Bruto Total', value: fmtBRL(resumo.creditoBrutoTotal), color: 'text-[#00441F]' },
            { label: 'Crédito Líquido Total', value: fmtBRL(resumo.creditoLiquidoTotal), color: 'text-emerald-700' },
            { label: 'Lance Próprio Total', value: fmtBRL(resumo.lanceProprioTotal), color: 'text-blue-700' },
            { label: 'Lance Embutido Total', value: fmtBRL(resumo.lanceEmbutidoTotal), color: 'text-purple-700' },
          ].map((card) => (
            <div key={card.label} className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00441F]/60">{card.label}</span>
              <div className={`text-xl font-extrabold mt-1 ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Grid Principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Painel de Cotas ── */}
        <div className="lg:col-span-5 bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-sm overflow-hidden">

          {/* Tabs das cotas */}
          <div className="flex border-b border-[#E0E5CF] bg-gray-50/50 p-2 gap-1 items-center overflow-x-auto">
            {cotas.map((cota, idx) => (
              <button
                key={cota.id}
                onClick={() => setActiveTab(cota.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === cota.id
                    ? 'bg-[#00441F] text-white border-[#00441F]'
                    : 'bg-[#e9ebe4] text-[#00441F] border-[#E0E5CF] hover:bg-gray-50'
                }`}
              >
                {cota.label || `Cota ${idx + 1}`}
              </button>
            ))}
            <button
              onClick={addCota}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-dashed border-[#00CF7B] text-[#00CF7B] hover:bg-green-50 cursor-pointer"
            >
              + Adicionar
            </button>
          </div>

          {/* Form da cota ativa */}
          {activeCota && (
            <div className="p-5 space-y-5">
              {/* Ações */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => duplicarCota(activeCota.id)} className="text-[10px] px-2.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 font-bold cursor-pointer">
                    Duplicar
                  </button>
                  <button
                    onClick={() => removeCota(activeCota.id)}
                    disabled={cotas.length <= 1}
                    className="text-[10px] px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 font-bold cursor-pointer disabled:opacity-40"
                  >
                    Remover
                  </button>
                </div>
              </div>

              {/* ── Label e Grupo ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Label da Cota</label>
                  <input
                    type="text"
                    value={activeCota.label}
                    onChange={(e) => updateField(activeCota.id, 'label', e.target.value)}
                    placeholder="Ex: Cota 1"
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Nº do Grupo</label>
                  <input
                    type="text"
                    value={activeCota.grupo}
                    onChange={(e) => updateField(activeCota.id, 'grupo', e.target.value)}
                    placeholder="Ex: 1730"
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                  />
                </div>
              </div>

              {/* ── Crédito e Prazo ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Crédito Bruto (R$)</label>
                  <input
                    type="number"
                    value={activeCota.credito}
                    onChange={(e) => updateField(activeCota.id, 'credito', Number(e.target.value))}
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Prazo (Meses)</label>
                  <input
                    type="number"
                    value={activeCota.prazo}
                    max={getPrazoCotaMaximo(produto)}
                    onChange={(e) => updateField(activeCota.id, 'prazo', Number(e.target.value))}
                    className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                  />
                </div>
              </div>

              {/* ── Modalidade (PLANO) — Destaque Visual ── */}
              <div className="bg-[#00441F]/5 border border-[#00441F]/15 rounded-xl p-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#00441F]">Plano da Cota</h4>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1">Modalidade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(MODALIDADE_LABEL).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => updateField(activeCota.id, 'modalidade', key as CotaEstudo['modalidade'])}
                        className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer text-left ${
                          activeCota.modalidade === key
                            ? 'bg-[#00441F] text-white border-[#00441F]'
                            : 'bg-white/60 text-[#00441F] border-[#E0E5CF] hover:bg-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descrição da modalidade escolhida */}
                <div className="text-[10px] text-[#00441F]/70 font-medium bg-white/50 rounded-lg px-3 py-2 border border-[#E0E5CF]">
                  {activeCota.modalidade === 'degrau' && '📉 Degrau: Taxa ADM concentrada na 1ª metade. Parcela cai pela metade após o meio do prazo.'}
                  {activeCota.modalidade === 'degrau_70' && '📉 Degrau 70%: Degrau com pagamento reduzido a 70% antes da contemplação.'}
                  {activeCota.modalidade === 'linear' && '📊 Linear (100%): Parcela integral durante todo o prazo.'}
                  {activeCota.modalidade === 'linear_70' && '📊 Linear 70%: Paga 70% da parcela antes de ser contemplado.'}
                  {activeCota.modalidade === 'reducao_50' && '📊 Redução 50%: Parcela reduzida a 50% antes da contemplação.'}
                </div>
              </div>

              {/* ── Mês de Contemplação — Coração do Degrau ── */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🎯</span>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                    Mês Alvo de Contemplação
                  </label>
                </div>
                <input
                  type="number"
                  value={activeCota.mesContemplacao}
                  min={1}
                  max={activeCota.prazo}
                  onChange={(e) => updateField(activeCota.id, 'mesContemplacao', Number(e.target.value))}
                  className="block w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-bold outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-blue-700 mt-1.5">
                  Este é o mês em que o crédito desta cota será liberado na Projeção de Entrega.
                </p>
              </div>

              {/* ── Lance (Rodobens: Parcelas) ── */}
              <div className="border-t border-[#E0E5CF] pt-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider">Lance da Cota</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Qtd. Parcelas Lance</label>
                    <input
                      type="number"
                      value={activeCota.quantidadeParcelasLance}
                      min={0}
                      onChange={(e) => updateField(activeCota.id, 'quantidadeParcelasLance', Number(e.target.value))}
                      className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Forma de Amortização</label>
                    <select
                      value={activeCota.abatimento}
                      onChange={(e) => updateField(activeCota.id, 'abatimento', e.target.value as CotaEstudo['abatimento'])}
                      className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                    >
                      <option value="parcela">Reduzir Parcela</option>
                      <option value="prazo">Reduzir Prazo</option>
                      <option value="misto">Misto (50/50)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Taxas ── */}
              <div className="border-t border-[#E0E5CF] pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Taxa ADM %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={activeCota.taxaAdm}
                      onChange={(e) => updateField(activeCota.id, 'taxaAdm', Number(e.target.value))}
                      className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Seguro %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={activeCota.seguro}
                      onChange={(e) => updateField(activeCota.id, 'seguro', Number(e.target.value))}
                      className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Parcelas Furo</label>
                    <input
                      type="number"
                      value={activeCota.parcelasFuro}
                      min={0}
                      onChange={(e) => updateField(activeCota.id, 'parcelasFuro', Number(e.target.value))}
                      className="block w-full rounded-lg border border-[#E0E5CF] bg-white/50 px-3 py-2 text-sm outline-none focus:border-[#00CF7B]"
                    />
                  </div>
                </div>
              </div>

              {/* ── Resultado individual da cota ── */}
              {resultado && resultado.cotas[cotas.indexOf(activeCota)] && (() => {
                const resCota = resultado.cotas[cotas.indexOf(activeCota)];
                return (
                  <div className="bg-[#00441F]/5 border border-[#00441F]/15 rounded-xl p-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider mb-3">Resultado desta Cota</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[#00441F]/60 font-semibold">Parcela Inicial:</span>
                        <div className="font-bold mt-0.5">{fmtBRL(resCota.parcelaInicial)}</div>
                      </div>
                      <div>
                        <span className="text-[#00441F]/60 font-semibold">Parcela Final:</span>
                        <div className="font-bold mt-0.5">{fmtBRL(resCota.parcelaFinal)}</div>
                      </div>
                      <div>
                        <span className="text-[#00441F]/60 font-semibold">Crédito Líquido:</span>
                        <div className="font-bold text-emerald-700 mt-0.5">{fmtBRL(resCota.creditoLiquido)}</div>
                      </div>
                      <div>
                        <span className="text-[#00441F]/60 font-semibold">Lance Total:</span>
                        <div className="font-bold text-blue-700 mt-0.5">{fmtBRL(resCota.lanceTotalReais)}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Painel de Projeção ── */}
        <div className="lg:col-span-7 space-y-4">

          {/* Tabs de Visualização */}
          <div className="flex gap-2 border-b border-[#E0E5CF] pb-2">
            {[
              { key: 'resumo', label: '📊 Resumo Operação' },
              { key: 'timeline', label: '📅 Projeção de Entrega' },
              { key: 'cotas', label: '📋 Cotas Detalhadas' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key as typeof viewMode)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === tab.key
                    ? 'bg-[#00441F] text-white'
                    : 'bg-[#e9ebe4] text-[#00441F] border border-[#E0E5CF] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── RESUMO OPERAÇÃO ── */}
          {viewMode === 'resumo' && resumo && (
            <div className="space-y-4">

              {/* Linha do tempo visual de contemplações */}
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold mb-4">Linha do Tempo das Contemplações</h3>
                <div className="relative">
                  {/* Trilha */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#E0E5CF]" />
                  <div className="flex justify-between relative z-10">
                    {cotas.slice().sort((a, b) => a.mesContemplacao - b.mesContemplacao).map((cota, idx) => {
                      const totalMeses = Math.max(...cotas.map(c => c.mesContemplacao), 1);
                      const [ano, mesInicio] = dataInicio.split('-').map(Number);
                      const dataCont = new Date(ano, mesInicio - 1 + cota.mesContemplacao - 1, 1);

                      return (
                        <div key={cota.id} className="flex flex-col items-center gap-2" style={{ width: `${100 / cotas.length}%` }}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
                            activeTab === cota.id
                              ? 'bg-[#00441F] text-white border-[#00441F]'
                              : 'bg-white text-[#00441F] border-[#00CF7B]'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-bold">{cota.label}</div>
                            <div className="text-[10px] text-[#00441F]/60">{MODALIDADE_LABEL[cota.modalidade]}</div>
                            <div className="text-[10px] font-bold text-blue-700">Mês {cota.mesContemplacao}</div>
                            <div className="text-[10px] text-[#00441F]/50">{fmtMesAno(dataCont)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cards de Análise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3">Parcelas ao Longo do Tempo</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#00441F]/70 font-medium">Mês 1 (antes de contemplações):</span>
                      <span className="font-bold">{fmtBRL(parcelaTotalMes1)}</span>
                    </div>
                    {cotas.slice().sort((a, b) => a.mesContemplacao - b.mesContemplacao).map((cota) => {
                      const mesParcela = (cota.mesContemplacao || 1) + 1;
                      const parcelaEntry = timeline.find(t => t.mes === mesParcela);
                      if (!parcelaEntry) return null;
                      return (
                        <div key={cota.id} className="flex justify-between text-sm border-t border-[#E0E5CF] pt-2">
                          <span className="text-[#00441F]/70 font-medium">
                            Após {cota.label} (Mês {cota.mesContemplacao}):
                          </span>
                          <span className="font-bold text-amber-700">{fmtBRL(parcelaEntry.parcelaMes)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-sm border-t border-[#E0E5CF] pt-2">
                      <span className="text-[#00441F]/70 font-medium">Parcela final (pós todas):</span>
                      <span className="font-bold text-emerald-700">{fmtBRL(parcelaTotalFinal)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#00441F] text-white rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Resumo Financeiro</h3>
                  {[
                    { label: 'Crédito Bruto Total', value: fmtBRL(resumo.creditoBrutoTotal) },
                    { label: 'Crédito Líquido Total', value: fmtBRL(resumo.creditoLiquidoTotal) },
                    { label: 'Lance Próprio Total', value: fmtBRL(resumo.lanceProprioTotal) },
                    { label: 'Lance Embutido Total', value: fmtBRL(resumo.lanceEmbutidoTotal) },
                    { label: 'Qtd. Cotas na Operação', value: cotas.length.toString() },
                    { label: 'Prazo da Operação', value: `${resumo.prazoContratacao} meses` },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm border-b border-white/10 pb-2">
                      <span className="text-white/70">{item.label}</span>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PROJEÇÃO DE ENTREGA (TIMELINE) ── */}
          {viewMode === 'timeline' && (
            <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E0E5CF]">
                <h3 className="text-sm font-bold">Projeção de Entrega Mês a Mês</h3>
                <p className="text-[10px] text-[#00441F]/60 mt-0.5">
                  Apenas os meses com eventos relevantes são exibidos. Colunas de crédito aparecem no mês da contemplação.
                </p>
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#00441F] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold">Mês</th>
                      <th className="px-3 py-2 text-left font-bold">Data</th>
                      <th className="px-3 py-2 text-right font-bold">Crédito Bruto</th>
                      <th className="px-3 py-2 text-right font-bold">Crédito Líquido</th>
                      <th className="px-3 py-2 text-right font-bold">Rec. Próprios</th>
                      <th className="px-3 py-2 text-right font-bold">Parcela Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline
                      .filter((t) => {
                        // Mostra meses de contemplação + 2 antes e 2 depois, mais meses com variação de parcela
                        const isCont = mesesContemplacao.includes(t.mes);
                        const isNearCont = mesesContemplacao.some(m => Math.abs(m - t.mes) <= 1);
                        const isFirst = t.mes <= 2;
                        const isLast = t.mes >= timeline.length - 1;
                        return isCont || isNearCont || isFirst || isLast;
                      })
                      .map((t, idx) => {
                        const isContMonth = mesesContemplacao.includes(t.mes);
                        return (
                          <tr
                            key={t.mes}
                            className={`border-b border-[#E0E5CF] ${isContMonth ? 'bg-emerald-50 font-bold' : idx % 2 === 0 ? 'bg-white/30' : ''}`}
                          >
                            <td className="px-3 py-2">
                              {isContMonth && <span className="text-emerald-600 mr-1">★</span>}
                              {t.mes}º
                            </td>
                            <td className="px-3 py-2 text-[#00441F]/60">{fmtMesAno(new Date(t.anoMes))}</td>
                            <td className="px-3 py-2 text-right">
                              {t.creditoBrutoMes ? <span className="text-emerald-700">{fmtBRL(t.creditoBrutoMes)}</span> : '–'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {t.creditoLiquidoMes ? <span className="text-emerald-700">{fmtBRL(t.creditoLiquidoMes)}</span> : '–'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {t.recursosPropriosMes ? <span className="text-blue-700">{fmtBRL(t.recursosPropriosMes)}</span> : '–'}
                            </td>
                            <td className="px-3 py-2 text-right font-bold">{fmtBRL(t.parcelaMes)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── COTAS DETALHADAS ── */}
          {viewMode === 'cotas' && resultado && (
            <div className="space-y-3">
              {cotas.map((cota, idx) => {
                const resCota = resultado.cotas[idx];
                if (!resCota) return null;
                return (
                  <div key={cota.id} className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-sm">{cota.label}</h4>
                        <div className="flex gap-2 mt-1">
                          {cota.grupo && (
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                              Grupo {cota.grupo}
                            </span>
                          )}
                          <span className="text-[10px] bg-[#00441F]/10 text-[#00441F] px-2 py-0.5 rounded font-bold">
                            {MODALIDADE_LABEL[cota.modalidade]}
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                            🎯 Contemplação: Mês {cota.mesContemplacao}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveTab(cota.id); setViewMode('resumo'); }}
                        className="text-[10px] px-3 py-1.5 rounded-lg bg-[#00441F] text-white font-bold cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: 'Crédito Bruto', value: fmtBRL(resCota.creditoBruto) },
                        { label: 'Crédito Líquido', value: fmtBRL(resCota.creditoLiquido), highlight: 'text-emerald-700' },
                        { label: 'Parcela Inicial', value: fmtBRL(resCota.parcelaInicial) },
                        { label: 'Parcela Final', value: fmtBRL(resCota.parcelaFinal), highlight: 'text-amber-700' },
                        { label: 'Lance Total', value: fmtBRL(resCota.lanceTotalReais), highlight: 'text-blue-700' },
                        { label: 'Lance Embutido', value: fmtBRL(resCota.lanceEmbutidoReais) },
                        { label: 'Rec. Próprios', value: fmtBRL(resCota.recursosPropriosReais) },
                        { label: 'Total Pago', value: fmtBRL(resCota.totalPago) },
                      ].map((item) => (
                        <div key={item.label}>
                          <span className="text-[#00441F]/60 font-semibold">{item.label}:</span>
                          <div className={`font-bold mt-0.5 ${item.highlight || ''}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
