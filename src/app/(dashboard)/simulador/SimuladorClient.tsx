"use client";

import React, {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { calcularCota } from "@/core/calculator/calculatorEngine";
import { SimulacaoInput, CotaResult } from "@/core/calculator/types";
import { saveSimulacaoAction } from "@/modules/simulacoes/actions";
import { createPropostaAction } from "@/modules/propostas/actions";
import { toPng, toBlob } from 'html-to-image';
import { PropostaPNGDocument } from '@/components/proposta-png/PropostaPNGDocument';

// ─── Zod Validation Schema ───────────────────────────────────────────────────

const simulacaoSchema = z.object({
  credito: z
    .number()
    .min(1000, "Crédito mínimo de R$ 1.000,00")
    .max(1_000_000_000, "Crédito máximo de R$ 1.000.000.000,00"),
  prazo: z
    .number()
    .int()
    .min(6, "Prazo mínimo de 6 meses")
    .max(240, "Prazo máximo de 240 meses"),
  modalidade: z.enum([
    "linear",
    "linear_70",
    "reducao_50",
    "degrau",
    "degrau_70",
    "pontual",
    "reduzida",
  ]),
  taxaAdm: z
    .number()
    .min(0, "Taxa ADM não pode ser negativa")
    .max(30, "Taxa ADM máxima de 30%"),
  fundoReserva: z
    .number()
    .min(0, "Fundo de Reserva não pode ser negativo")
    .max(10, "Fundo de Reserva máximo de 10%"),
  seguro: z
    .number()
    .min(0, "Seguro não pode ser negativo")
    .max(10, "Seguro máximo de 10%"),
  lanceEmbutido: z.number().min(0, "Lance não pode ser negativo"),
  recursosProprios: z
    .number()
    .min(0, "Recursos Próprios não pode ser negativo"),
  tipoLance: z.enum(["valor", "%", "parcelas"]),
  quantidadeParcelasLance: z.number().min(0).optional(),
  abatimento: z.enum(["parcela", "prazo", "misto"]),
  mesContemplacao: z.number().int().min(1, "Mês mínimo é 1"),
  mesPontual: z.number().int().min(1).optional(),
  prazoMaxGrupo: z.number().int().optional(),
  parcelasFuro: z.number().int().min(0).optional(),
  diluirFuro: z.boolean().optional(),
  taxaAdesao: z.number().min(0).optional(),
  prazoTaxaAdesao: z.number().int().min(1).optional(),
});

// ─── Interfaces ──────────────────────────────────────────────────────────────

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

interface SimuladorClientProps {
  leads: Lead[];
  administradoras: Administradora[];
  empresa: Empresa | null;
  usuario: Usuario;
  campanhas?: any[];
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

function formatPropostaCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(val));
}

function getPropostaTitle(prod: string): string {
  switch (prod) {
    case "imovel":
      return "Proposta Imobiliária";
    case "auto":
      return "Proposta Automóvel";
    case "moto":
      return "Proposta Motocicleta";
    case "pesado":
      return "Proposta de Pesados";
    case "servico":
      return "Proposta de Serviços";
    default:
      return "Proposta de Consórcio";
  }
}

function parseCurrencyInput(raw: string): number {
  // Remove tudo que não for dígito ou vírgula/ponto
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  // Converte formato brasileiro (1.234,56) para float
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

function formatCurrencyInput(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && (
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#002E17]/10 to-[#FF7A40]/5 text-lg shrink-0">
          <span className="grayscale">{icon}</span>
        </div>
      )}
      <div>
        <h3 className="text-sm font-bold text-[#002E17] leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-[#002E17] font-semibold font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function CurrencyInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(formatCurrencyInput(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrencyInput(value));
    }
  }, [value, isFocused]);

  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border transition-all ${isFocused ? "border-[#00CF7B] ring-2 ring-[#00CF7B]/10" : "border-[#E0E5CF]"} bg-[#e9ebe4] overflow-hidden`}
      >
        <span className="pl-3 pr-1.5 text-xs font-bold text-[#002E17] font-semibold select-none">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          placeholder={placeholder || "0,00"}
          onFocus={() => {
            setIsFocused(true);
            if (value > 0) {
              setDisplayValue(formatCurrencyInput(value));
            } else {
              setDisplayValue("");
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            const parsed = parseCurrencyInput(displayValue);
            onChange(parsed);
            setDisplayValue(formatCurrencyInput(parsed));
          }}
          onChange={(e) => {
            setDisplayValue(e.target.value);
            const parsed = parseCurrencyInput(e.target.value);
            onChange(parsed);
          }}
          disabled={disabled}
          className={`flex-1 py-2.5 pr-3 text-sm text-[#002E17] bg-transparent outline-none font-semibold placeholder:text-gray-300 placeholder:font-medium ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );
}

function PercentageInput({
  label,
  value,
  onChange,
  step = 0.5,
  min = 0,
  max = 100,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const decrement = () =>
    onChange(Math.max(min, Number((value - step).toFixed(2))));
  const increment = () =>
    onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className={`flex items-center rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] overflow-hidden transition-all ${disabled ? "opacity-60 bg-gray-50" : "focus-within:border-[#00CF7B] focus-within:ring-2 focus-within:ring-[#00CF7B]/10"}`}>
        <button
          type="button"
          onClick={decrement}
          disabled={disabled}
          className="px-2.5 py-2.5 text-[#002E17] font-semibold hover:text-[#00CF7B] hover:bg-[#FF7A40]/5 transition-colors cursor-pointer font-bold text-sm leading-none select-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Diminuir ${label}`}
        >
          −
        </button>
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`flex-1 text-center py-2.5 text-sm text-[#002E17] bg-transparent outline-none font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? "cursor-not-allowed" : ""}`}
        />
        <span className="text-xs font-bold text-[#002E17] font-semibold select-none pr-1">
          %
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={disabled}
          className="px-2.5 py-2.5 text-[#002E17] font-semibold hover:text-[#00CF7B] hover:bg-[#FF7A40]/5 transition-colors cursor-pointer font-bold text-sm leading-none select-none disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function LanceHistogram({
  prazo,
  escolhidas,
  furo,
}: {
  prazo: number;
  escolhidas: number;
  furo: number;
}) {
  return (
    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between text-[10px] font-bold text-[#002E17] font-semibold mb-2">
        <span>Início (0)</span>
        <span>Fim ({prazo})</span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden flex">
        {/* Fill for chosen parcels */}
        <div
          className="h-full bg-[#00CF7B] transition-all duration-300"
          style={{ width: `${Math.min((escolhidas / prazo) * 100, 100)}%` }}
        />
        {/* Fill for hole (furo) */}
        {furo > 0 && (
          <div
            className="h-full bg-red-500 transition-all duration-300 opacity-80"
            style={{ width: `${Math.min((furo / prazo) * 100, 100)}%` }}
            title={`Furo: ${furo} parcelas`}
          />
        )}
      </div>
      <div className="flex justify-between items-center mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00CF7B]" />
          <span className="font-medium text-gray-700">
            Ofertadas: {escolhidas}
          </span>
        </div>
        {furo > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="font-medium text-gray-700">Furo: {furo}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-center py-2 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap px-2 ${
            value === opt.value
              ? "bg-[#e9ebe4] text-[#00CF7B] shadow-sm"
              : "text-[#002E17] font-semibold hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ResultCard({
  label,
  value,
  accent,
  badge,
  badgeColor,
}: {
  label: string;
  value: string;
  accent?: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00CF7B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="text-[10px] font-bold text-[#002E17] font-semibold uppercase tracking-wider block">
        {label}
      </span>
      <div
        className={`text-lg font-extrabold mt-1 ${accent || "text-[#002E17]"}`}
      >
        {value}
      </div>
      {badge && (
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-2 inline-block ${badgeColor || "bg-gray-100 text-[#002E17] font-semibold"}`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function ValidationErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
      {errors.map((err, i) => (
        <p
          key={i}
          className="text-xs text-red-600 font-medium flex items-center gap-1.5"
        >
          <span className="text-red-400">⚠</span> {err}
        </p>
      ))}
    </div>
  );
}

// ─── Products Config ─────────────────────────────────────────────────────────

const PRODUTOS = [
  { value: "auto", label: "Auto", icon: "🚗", prazoMax: 84 },
  { value: "moto", label: "Moto", icon: "🏍️", prazoMax: 84 },
  { value: "pesado", label: "Pesados / Caminhões", icon: "🚛", prazoMax: 100 },
  { value: "imovel", label: "Imóvel", icon: "🏠", prazoMax: 240 },
  { value: "servico", label: "Serviços", icon: "🔧", prazoMax: 180 },
] as const;

const MODALIDADES = [
  { value: "linear", label: "Linear / Integral (100%)" },
  { value: "linear_70", label: "Linear / Integral 70%" },
  { value: "reducao_50", label: "Redução 50%" },
  { value: "degrau", label: "Degrau" },
  { value: "degrau_70", label: "Degrau 70%" },
  { value: "pontual", label: "Pontual (40%)" },
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SimuladorClient({
  leads,
  administradoras,
  empresa,
  usuario,
  campanhas = [],
}: SimuladorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedSimulacaoId, setSavedSimulacaoId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Estados do Modal de Personalização
  const [isPersonalizarModalOpen, setIsPersonalizarModalOpen] = useState(false);
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
  const [customEmpresaNome, setCustomEmpresaNome] = useState(empresa?.nome_empresa || "Representação");
  const [customCorPrimaria, setCustomCorPrimaria] = useState(empresa?.cor_primaria || "#00CF7B");
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  
  const [isGeneratingPNG, setIsGeneratingPNG] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  // ── Step 1: Administradora
  const [administradoraId, setAdministradoraId] = useState(() => {
    const rodobens = administradoras.find(
      (a) => a.slug === "rodobens" || a.nome.toLowerCase().includes("rodobens")
    );
    return rodobens?.id || "rodobens-virtual";
  });
  const activeAdmin = useMemo(
    () => {
      if (administradoraId === 'rodobens-virtual') return { id: 'rodobens-virtual', nome: 'Rodobens', slug: 'rodobens', engine_key: 'rodobens' } as Administradora;
      if (administradoraId === 'universal-virtual') return { id: 'universal-virtual', nome: 'Universal', slug: 'universal', engine_key: 'universal' } as Administradora;
      return administradoras.find((a) => a.id === administradoraId);
    },
    [administradoras, administradoraId],
  );
  const engineKey = activeAdmin?.engine_key || "rodobens";
  const isRodobens = engineKey === "rodobens";

  // ── Step 2: Lead & Produto
  const [leadId, setLeadId] = useState("");

  useEffect(() => {
    if (leadId) {
      const leadObj = leads?.find((l) => l.id === leadId);
      if (leadObj) {
        setCustomEmpresaNome(leadObj.nome);
      }
    }
  }, [leadId, leads]);

  const [produto, setProduto] = useState("imovel");
  const produtoConfig =
    PRODUTOS.find((p) => p.value === produto) || PRODUTOS[3];

  // 👉 Step 3: Financial Inputs
  const [credito, setCredito] = useState(400000);
  const [campanhaId, setCampanhaId] = useState("");
  const [campanhaId2, setCampanhaId2] = useState("");

  const [financingResult, setFinancingResult] = useState<any>(null);
  const [isFinancingLoading, setIsFinancingLoading] = useState(false);

  const [quantidadeCotas, setQuantidadeCotas] = useState(1);
  const [prazo, setPrazo] = useState(180);
  const [prazoMaxGrupo, setPrazoMaxGrupo] = useState(216);
  const [modalidade, setModalidade] = useState<
    "linear" | "linear_70" | "reducao_50" | "degrau" | "degrau_70" | "pontual" | "reduzida"
  >("linear");
  const [reducaoCustomizada, setReducaoCustomizada] = useState(70);
  const [taxaAdm, setTaxaAdm] = useState(24);
  const [fundoReserva, setFundoReserva] = useState(0);
  const [seguro, setSeguro] = useState(0);
  const [taxaAdesao, setTaxaAdesao] = useState(2);
  const [prazoTaxaAdesao, setPrazoTaxaAdesao] = useState(1);
  const [baseCalculoLance, setBaseCalculoLance] = useState<"integral" | "reduzida">("integral");

  const getPrazoCotaMaximo = (categoria: string) => {
    switch (categoria) {
      case "auto": return 96;
      case "pesado": return 120;
      case "imovel": return 216;
      case "servico": return 48;
      default: return 96;
    }
  };

  const campanhaAtiva = campanhas.find(c => c.id === campanhaId);
  const campanhaAtiva2 = campanhas.find(c => c.id === campanhaId2);
  const descontoPerc1 = (campanhaAtiva?.desconto_taxa_adm || 0) / 100;
  const descontoPerc2 = (campanhaAtiva2?.desconto_taxa_adm || 0) / 100;
  const descontoPerc = Math.min(1, descontoPerc1 + descontoPerc2);
  const taxaAdmReal = Math.max(0, taxaAdm * (1 - descontoPerc));
  const temDescontoCampanha = descontoPerc > 0;
  const reducaoMeiaParcelaQtd = Math.max(
    campanhaAtiva?.reducao_meia_parcela_qtd || 0,
    campanhaAtiva2?.reducao_meia_parcela_qtd || 0
  );
  const descontoPrimeiraParcela = Math.min(
    100, 
    (campanhaAtiva?.desconto_primeira_parcela || 0) + (campanhaAtiva2?.desconto_primeira_parcela || 0)
  );

  const getPrazoCotaMinimo = (categoria: string) => {
    return 12;
  };

  const converterParcelas = (
    parcelasGrupo: number,
    parcelasEscolhidas: number,
    prazoCota: number,
    prazoMaxGrupo: number
  ) => {
    if (prazoCota >= prazoMaxGrupo) return parcelasEscolhidas;
    return Math.ceil((parcelasEscolhidas * prazoMaxGrupo) / prazoCota);
  };

  // ── Step 4: Lance
  const [tipoContemplacao, setTipoContemplacao] = useState<"sorteio" | "lance">("lance");
  const [tipoLance, setTipoLance] = useState<"nenhum" | "valor" | "%" | "parcelas">("nenhum");
  const [lanceEmbutido, setLanceEmbutido] = useState(0);
  const [totalOfertado, setTotalOfertado] = useState<number | null>(null);
  const [recursosProprios, setRecursosProprios] = useState(0);
  const [quantidadeParcelasLance, setQuantidadeParcelasLance] = useState(144);
  const [parcelasFuro, setParcelasFuro] = useState(0);
  const [diluirFuro, setDiluirFuro] = useState(false);
  const [parcelasReferenciaGrupo, setParcelasReferenciaGrupo] = useState(70);
  const [mediaMes1, setMediaMes1] = useState(0);
  const [mediaMes2, setMediaMes2] = useState(0);
  const [mediaMes3, setMediaMes3] = useState(0);
  
  const mediaGrupo = (() => {
    let qtd = 0;
    let sum = 0;
    if (mediaMes1 > 0) { sum += mediaMes1; qtd++; }
    if (mediaMes2 > 0) { sum += mediaMes2; qtd++; }
    if (mediaMes3 > 0) { sum += mediaMes3; qtd++; }
    return qtd > 0 ? sum / qtd : 0;
  })();
  const [abatimento, setAbatimento] = useState<"parcela" | "prazo" | "misto">(
    "parcela",
  );
  const [mesContemplacao, setMesContemplacao] = useState(1);
  const [mesPontual, setMesPontual] = useState(12);

  // ── Resultados
  const [resultado, setResultado] = useState<CotaResult | null>(null);

  // ── Cálculos auxiliares para exibição pontual
  const FC_linear = credito / prazo;
  const TA_linear = (credito * (taxaAdm / 100)) / prazo;
  const FR_linear = (credito * (fundoReserva / 100)) / prazo;
  const SE_linear = (credito * (seguro / 100)) / prazo;
  const parcelaBaseLinear = FC_linear + TA_linear + FR_linear + SE_linear;
  const parcelasPontualNecessarias = Math.round(prazo * 0.4);
  const parcelasPontualAntecipar = Math.max(
    parcelasPontualNecessarias - mesPontual,
    0,
  );
  const valorAdiantamentoPontual = parcelasPontualAntecipar * parcelaBaseLinear;
  
  const resultadoExibicao = useMemo(() => {
    if (!resultado) return null;
    const factor = quantidadeCotas || 1;
    const creditoBruto = resultado.creditoBruto * factor;
    const creditoLiquido = resultado.creditoLiquido * factor;
    const recursosPropriosReais = resultado.recursosPropriosReais * factor;
    const saldoLiquido = creditoLiquido - recursosPropriosReais;
    const taxaAdmTotalReais = creditoBruto * (taxaAdm / 100);
    const taxaAmSobSaldoLiquido = saldoLiquido > 0 ? ((taxaAdmTotalReais / saldoLiquido) / prazo) * 100 : 0;

    return {
      ...resultado,
      creditoBruto,
      creditoLiquido,
      parcelaInicial: resultado.parcelaInicial * factor,
      parcelaFinal: resultado.parcelaFinal * factor,
      lanceEmbutidoReais: resultado.lanceEmbutidoReais * factor,
      recursosPropriosReais,
      lanceTotalReais: resultado.lanceTotalReais * factor,
      saldoDevedorInicial: resultado.saldoDevedorInicial * factor,
      totalPago: resultado.totalPago * factor,
      saldoLiquido,
      taxaAmSobSaldoLiquido,
      cronograma: resultado.cronograma.map(p => ({
        ...p,
        amortizacao: Number((p.amortizacao * factor).toFixed(2)),
        taxaAdm: Number((p.taxaAdm * factor).toFixed(2)),
        fundoReserva: Number((p.fundoReserva * factor).toFixed(2)),
        seguro: Number((p.seguro * factor).toFixed(2)),
        total: Number((p.total * factor).toFixed(2)),
        saldoDevedor: Number((p.saldoDevedor * factor).toFixed(2)),
        adiantamento: Number((p.adiantamento * factor).toFixed(2)),
      }))
    };
  }, [resultado, quantidadeCotas, taxaAdm, prazo]);

  useEffect(() => {
    let active = true;
    async function fetchFinancing() {
      setIsFinancingLoading(true);
      try {
        const { getFinancingComparisonAction } = await import('@/app/actions/financingActions');
        const res = await getFinancingComparisonAction({
          assetType: produto,
          assetValue: credito,
          financingDownPayment: resultadoExibicao?.lanceTotalReais || 0,
          financingTerm: prazo
        });
        if (active) setFinancingResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsFinancingLoading(false);
      }
    }
    fetchFinancing();
    return () => { active = false; };
  }, [produto, credito, resultadoExibicao?.lanceTotalReais, prazo]);


  const [showCronograma, setShowCronograma] = useState(false);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ── Ajustes dinâmicos baseados no produto
  useEffect(() => {
    if (isRodobens) {
      const maxPrazo = getPrazoCotaMaximo(produto);
      const minPrazo = getPrazoCotaMinimo(produto);
      setPrazoMaxGrupo(maxPrazo);
      if (prazo > maxPrazo) setPrazo(maxPrazo);
      if (prazo < minPrazo) setPrazo(minPrazo);
      
      if (produto === "auto" || produto === "moto" || produto === "pesado") {
        setMesPontual(6);
      } else {
        setMesPontual(12);
      }
    } else {
      if (produto === "auto" || produto === "moto") {
        if (prazo > 84) setPrazo(60);
        setMesContemplacao(Math.min(mesContemplacao, 60));
        setMesPontual(6);
      } else if (produto === "pesado") {
        if (prazo > 100) setPrazo(80);
        setMesContemplacao(Math.min(mesContemplacao, 80));
        setMesPontual(6);
      } else if (produto === "imovel") {
        setMesPontual(12);
      } else if (produto === "servico") {
        if (prazo > 180) setPrazo(120);
        setMesPontual(12);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto, isRodobens]);

  // ── Modalidade: se não for Rodobens, forçar linear
  useEffect(() => {
    if (!isRodobens && modalidade !== "linear" && modalidade !== "reduzida") {
      setModalidade("linear");
    }
  }, [isRodobens, modalidade]);

  // ── Forçar tipoLance
  useEffect(() => {
    if (isRodobens) {
      setTipoLance("parcelas");
    } else if (engineKey === "tarraf") {
      if (tipoLance !== "%") {
        setTipoLance("%");
        setLanceEmbutido(0);
        setRecursosProprios(0);
        setQuantidadeParcelasLance(0);
        setTotalOfertado(null);
      }
    } else if (engineKey === "portobank") {
      if (tipoLance !== "nenhum" && tipoLance !== "%") {
        setTipoLance("%");
        setLanceEmbutido(0);
        setRecursosProprios(0);
        setQuantidadeParcelasLance(0);
        setTotalOfertado(null);
      }
    }
  }, [isRodobens, engineKey, tipoLance]);

  // ── Produto: se for Pontual, não permite Moto nem Serviço
  useEffect(() => {
    if (modalidade === "pontual") {
      if (produto === "moto" || produto === "servico") {
        setProduto("auto");
      }
    }
  }, [modalidade, produto]);

  // ── Rodobens: não tem Fundo de Reserva
  useEffect(() => {
    if (isRodobens) {
      setFundoReserva(0);
    }
  }, [isRodobens]);

  // ── Cálculo reativo
  useEffect(() => {
    if (!administradoraId) {
      setResultado(null);
      return;
    }

    setSavedSimulacaoId(null);

    const inputData: SimulacaoInput = {
      credito,
      prazo: isRodobens ? prazo : Math.min(prazo, produtoConfig.prazoMax),
      modalidade: reducaoMeiaParcelaQtd > 0 ? "reducao_50" : (isRodobens ? modalidade : "linear"),
      taxaAdm: taxaAdmReal,
      fundoReserva,
      seguro,
      percentualReducao: !isRodobens && modalidade === "reduzida" ? reducaoCustomizada : undefined,
      lanceEmbutido: (tipoContemplacao === "sorteio" || tipoLance === "nenhum") ? 0 : lanceEmbutido,
      recursosProprios: (tipoContemplacao === "sorteio" || tipoLance === "nenhum") ? 0 : recursosProprios,
      tipoLance: (tipoContemplacao === "sorteio" || tipoLance === "nenhum") ? "%" : tipoLance,
      quantidadeParcelasLance:
        (tipoContemplacao === "sorteio") ? 0 : (tipoLance === "parcelas" ? quantidadeParcelasLance : undefined),
      abatimento,
      mesContemplacao,
      mesPontual: modalidade === "pontual" ? mesPontual : undefined,
      prazoMaxGrupo: isRodobens ? prazoMaxGrupo : undefined,
      parcelasFuro: isRodobens ? parcelasFuro : undefined,
      diluirFuro: isRodobens ? diluirFuro : undefined,
      taxaAdesao: engineKey === "portobank" ? taxaAdesao : undefined,
      prazoTaxaAdesao: engineKey === "portobank" ? prazoTaxaAdesao : undefined,
      baseCalculoLance,
    };

    // Validar com Zod
    const result = simulacaoSchema.safeParse(inputData);
    if (!result.success) {
      setValidationErrors(result.error.issues.map((i) => i.message));
      return;
    }
    setValidationErrors([]);

    try {
      const res = calcularCota(inputData, engineKey);
      
      // Aplicar desconto na primeira parcela se a campanha definir
      if (descontoPrimeiraParcela > 0) {
        const fatorDesconto = 1 - (descontoPrimeiraParcela / 100);
        res.parcelaInicial = res.parcelaInicial * fatorDesconto;
        if (res.cronograma && res.cronograma.length > 0) {
          res.cronograma[0].total = res.cronograma[0].total * fatorDesconto;
        }
      }

      setResultado(res);
    } catch (e) {
      console.error("Erro no cálculo:", e);
    }
  }, [
    administradoras,
    campanhas,
    campanhaId,
    campanhaId2,
    administradoraId,
    credito,
    prazo,
    modalidade,
    taxaAdm,
    fundoReserva,
    seguro,
    lanceEmbutido,
    recursosProprios,
    tipoLance,
    quantidadeParcelasLance,
    baseCalculoLance,
    abatimento,
    mesContemplacao,
    mesPontual,
    engineKey,
    isRodobens,
    produtoConfig.prazoMax,
    prazoMaxGrupo,
    parcelasFuro,
    diluirFuro,
    reducaoCustomizada,
    tipoContemplacao,
  ]);

  // ── Salvar Simulação Helper
  const saveSimulacao = useCallback(async (): Promise<string | null> => {
    if (!resultado || !resultadoExibicao) return null;

    const inputData = {
      credito,
      prazo,
      modalidade: isRodobens ? modalidade : "linear",
      taxaAdm,
      fundoReserva,
      seguro,
      lanceEmbutido,
      recursosProprios,
      tipoLance,
      quantidadeParcelasLance:
        tipoLance === "parcelas" ? quantidadeParcelasLance : undefined,
      abatimento,
      mesContemplacao,
      mesPontual: modalidade === "pontual" ? mesPontual : undefined,
      prazoMaxGrupo: isRodobens ? prazoMaxGrupo : undefined,
      parcelasFuro: isRodobens ? parcelasFuro : undefined,
      diluirFuro: isRodobens ? diluirFuro : undefined,
      taxaAdesao: engineKey === "portobank" ? taxaAdesao : undefined,
      prazoTaxaAdesao: engineKey === "portobank" ? prazoTaxaAdesao : undefined,
      quantidadeCotas,
    };

    const simulacaoResultData = {
      totalCreditoBruto: resultadoExibicao.creditoBruto,
      totalCreditoLiquido: resultadoExibicao.creditoLiquido,
      totalLanceEmbutido: resultadoExibicao.lanceEmbutidoReais,
      totalRecursosProprios: resultadoExibicao.recursosPropriosReais,
      totalLance: resultadoExibicao.lanceTotalReais,
      percentualLanceMedio: resultadoExibicao.percentualLance,
      totalParcelaInicial: resultadoExibicao.parcelaInicial,
      totalParcelaFinal: resultadoExibicao.parcelaFinal,
      totalFinalPago: resultadoExibicao.totalPago,
      cotas: [resultadoExibicao],
    };

    const res = await saveSimulacaoAction({
      leadId: leadId || null,
      administradoraId: administradoraId || null,
      engineKey,
      produto,
      modalidade: isRodobens ? modalidade : "linear",
      simulacaoResult: simulacaoResultData,
      inputsOriginal: inputData,
    });

    if (res.success && res.simulacaoId) {
      setSavedSimulacaoId(res.simulacaoId);
      return res.simulacaoId;
    } else {
      setFeedback({
        success: false,
        message: res.message || "Erro ao gravar simulação.",
      });
      return null;
    }
  }, [
    resultado,
    resultadoExibicao,
    credito,
    prazo,
    modalidade,
    taxaAdm,
    fundoReserva,
    seguro,
    lanceEmbutido,
    recursosProprios,
    tipoLance,
    quantidadeParcelasLance,
    abatimento,
    mesContemplacao,
    mesPontual,
    leadId,
    administradoraId,
    engineKey,
    produto,
    isRodobens,
    prazoMaxGrupo,
    parcelasFuro,
    diluirFuro,
    quantidadeCotas,
    tipoContemplacao,
  ]);

  const handleSaveSimulacao = useCallback(async () => {
    startTransition(async () => {
      setFeedback(null);
      const simId = await saveSimulacao();
      if (simId) {
        setFeedback({
          success: true,
          message: "✅ Simulação gravada com sucesso!",
        });
        router.refresh();
      }
    });
  }, [saveSimulacao, router]);

  // ── Geração do PDF da Proposta
  const generatePDF = useCallback(async (simId: string): Promise<string> => {
    const { pdf } = await import("@react-pdf/renderer");
    const { PropostaPDFDocument } = await import("@/components/proposta-pdf/PropostaPDFDocument");

      const getDynamicCoverImage = (produto: string) => {
        const prod = produto.toLowerCase();
        if (prod === 'auto' || prod === 'automóvel' || prod === 'carro' || prod === 'veiculo') {
          return '/images/propostas/Capa Proposta/Capa Consorcio Automoveis.png';
        }
        if (prod === 'moto' || prod === 'motocicleta') {
          return '/images/propostas/Capa Proposta/Capa Consorcio Motos.png';
        }
        if (prod === 'pesado' || prod === 'veículo pesado' || prod === 'caminhao' || prod === 'caminhão') {
          return '/images/propostas/Capa Proposta/Capa Consorcio Caminhão.png';
        }
        if (prod === 'imóvel' || prod === 'imovel') {
          return '/images/propostas/Capa Proposta/Capa Consorcio Imoveis.png';
        }
        if (prod === 'serviço' || prod === 'servico') {
          return '/images/propostas/Capa Proposta/Capa Consorcio Serviço.png';
        }
        return '/images/propostas/Capa Proposta/Capa Consorcio Automoveis.png';
      };

      const leadObj = leads?.find((l) => l.id === leadId);
      const basePath = typeof window !== 'undefined' ? window.location.origin : '';
      const capaBgUrl = basePath + encodeURI(getDynamicCoverImage(produto));

    const isRodobensPDF = engineKey === "rodobens";
    let ofertaAtualPdf = 0;
    let chancesOfertaPdf = "";

    if (mediaGrupo > 0) {
      const margem = 5;
      if (isRodobensPDF) {
        ofertaAtualPdf = (prazo < (prazoMaxGrupo || prazo))
          ? Math.round((quantidadeParcelasLance / prazo) * (prazoMaxGrupo || prazo))
          : quantidadeParcelasLance;
      } else {
        ofertaAtualPdf = resultadoExibicao?.percentualLance || 0;
      }
      
      if (ofertaAtualPdf >= mediaGrupo + margem) chancesOfertaPdf = "Alta";
      else if (ofertaAtualPdf >= mediaGrupo - margem) chancesOfertaPdf = "Média";
      else chancesOfertaPdf = "Baixa";
    }

    const finalData = {
      leadNome: leadObj ? leadObj.nome : "Cliente Interessado",
      adminNome: activeAdmin?.nome || "Administradora",
      empresaNome: customEmpresaNome || empresa?.nome_empresa || "Representação",
      gerenteNome: usuario?.nome || "Gerente de Negócios",
      corPrimaria: customCorPrimaria || empresa?.cor_primaria || "#00CF7B",
      empresaLogo: customLogoUrl,
      capaBgUrl: capaBgUrl,
      simulacaoId: simId,
      produto: produto,
      modalidade: modalidade,
      prazo: prazo,
      creditoBruto: credito,
      lanceEmbutido: resultadoExibicao?.lanceEmbutidoReais || 0,
      creditoLiquido: resultadoExibicao?.creditoLiquido || credito,
      recursosProprios: resultadoExibicao?.recursosPropriosReais || 0,
      lanceOfertado: resultadoExibicao?.lanceTotalReais || 0,
      lanceOfertadoPercentual: resultadoExibicao?.percentualLance || 0,
      parcelaInicial: resultadoExibicao?.parcelaInicial || 0,
      parcelaPosContemplacao: resultadoExibicao?.parcelaFinal || 0,
      parcelaPosAdesao: resultadoExibicao?.parcelaPosAdesao,
      prazoTaxaAdesao: prazoTaxaAdesao,
      totalFinal: resultadoExibicao?.totalPago || 0,
      taxaAdmin: taxaAdm,
      taxaAdmReal: taxaAdmReal,
      temDescontoCampanha: temDescontoCampanha,
      fundoReserva: fundoReserva,
      mesContemplacao: mesContemplacao,
      codigo: simId,
      data: new Date().toLocaleDateString("pt-BR"),
      // Novos dados para Estimativa
      mediaGrupo: mediaGrupo > 0 ? mediaGrupo : undefined,
      ofertaAtualParaMedia: ofertaAtualPdf,
      chancesOferta: chancesOfertaPdf,
      isRodobens: isRodobensPDF,
    };

    const pdfBlob = await pdf(<PropostaPDFDocument data={finalData as any} />).toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const binary = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < binary.length; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    return window.btoa(binaryString);
  }, [
    leads, leadId, activeAdmin, empresa, usuario, produto, modalidade,
    prazo, credito, lanceEmbutido, resultadoExibicao, taxaAdm,
    fundoReserva, mesContemplacao, customEmpresaNome, customCorPrimaria, customLogoUrl
  ]);

  const handleGerarProposta = useCallback(async () => {
    if (!leadId) {
      setFeedback({
        success: false,
        message: "⚠️ Por favor, selecione um Parceiro antes de gerar a proposta.",
      });
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

      // Gerar PDF em base64
      const pdfBase64 = await generatePDF(simId);

      // Chamar a Server Action para criar proposta e upload
      const res = await createPropostaAction({
        leadId,
        simulacaoId: simId,
        pdfBase64,
      });

      if (res.success && res.propostaId) {
        setFeedback({
          success: true,
          message: "✅ Proposta gerada com sucesso! Redirecionando...",
        });
        router.push(`/propostas/${res.propostaId}`);
      } else {
        setFeedback({
          success: false,
          message: res.message || "Erro ao criar proposta.",
        });
      }
    } catch (e: any) {
      console.error("Erro ao gerar proposta:", e);
      setFeedback({
        success: false,
        message: `Erro ao gerar proposta: ${e.message || "Erro interno"}`,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [leadId, savedSimulacaoId, saveSimulacao, generatePDF, router]);

  const handleCopiarPropostaSimplificada = useCallback(async () => {
    if (!leadId) {
      setFeedback({
        success: false,
        message: "⚠️ Por favor, selecione um Parceiro antes de gerar a proposta.",
      });
      return;
    }

    if (!resultCardRef.current) return;

    setIsGeneratingPNG(true);
    setFeedback({
      success: true,
      message: "⏳ Gerando imagem da proposta...",
    });

    try {
      // 1. Capture as Blob
      const blob = await toBlob(resultCardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (!blob) throw new Error("Erro ao gerar imagem");

      // 2. Copy to clipboard with Fallback
      try {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob })
        ]);
        setFeedback({ success: true, message: "✅ Proposta copiada para a área de transferência!" });
      } catch (clipboardErr) {
        console.warn("Falha no clipboard, fazendo download da imagem...", clipboardErr);
        // Fallback: faz o download direto da imagem
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `proposta-simplificada.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setFeedback({ success: true, message: "✅ Imagem salva no seu computador! (Cópia direta bloqueada pelo navegador)" });
      }

      // 3. Upload to server asynchronously (do not block user)
      let simId = savedSimulacaoId;
      if (!simId) simId = await saveSimulacao();
      
      if (simId) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          await createPropostaAction({
            leadId,
            simulacaoId: simId,
            pdfBase64: base64data,
            fileType: 'png',
          });
        };
      }
    } catch (e: any) {
      console.error("Erro ao copiar proposta PNG:", e);
      setFeedback({
        success: false,
        message: `Erro ao copiar proposta: ${e.message || "Tente novamente ou verifique as permissões do navegador."}`,
      });
    } finally {
      setIsGeneratingPNG(false);
      setIsPersonalizarModalOpen(false);
    }
  }, [leadId, savedSimulacaoId, saveSimulacao, router]);

  // (Auxiliary calculations moved to top of component)

  // ─── RENDER ────────────────────────────────────────────────────────────────
const leadObj = leads?.find((l) => l.id === leadId);
  const propostaData = useMemo(() => {
    return {
      leadNome: leadObj ? leadObj.nome : "Cliente Interessado",
      adminNome: activeAdmin?.nome || "Administradora",
      empresaNome: empresa?.nome_empresa || "Meu Parceiro Digital",
      gerenteNome: usuario?.nome || "Gerente de Negócios",
      corPrimaria: empresa?.cor_primaria || "#00CF7B",
      simulacaoId: savedSimulacaoId || "",
      produto: produto,
      modalidade: modalidade,
      prazo: prazo,
      creditoBruto: credito,
      lanceEmbutido: (lanceEmbutido || 0) * 100,
      creditoLiquido: resultadoExibicao?.creditoLiquido || credito,
      lanceLivre: resultadoExibicao?.recursosPropriosReais || 0,
      lanceOfertado: resultadoExibicao?.lanceTotalReais || 0,
      parcelaInicial: resultadoExibicao?.parcelaInicial || 0,
      parcelaPosContemplacao: resultadoExibicao?.parcelaFinal || 0,
      taxaAdmin: taxaAdm,
      fundoReserva: fundoReserva,
      mesContemplacao: mesContemplacao,
      codigo: savedSimulacaoId || "RASCUNHO",
      data: savedSimulacaoId ? new Date().toLocaleDateString("pt-BR") : "RASCUNHO",
    };
  }, [leadObj, activeAdmin, empresa, usuario, savedSimulacaoId, produto, modalidade, prazo, credito, lanceEmbutido, resultadoExibicao, taxaAdm, fundoReserva, mesContemplacao]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Título da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002E17]">
            Simulador de Consórcio
          </h1>
          <p className="text-sm text-[#002E17] font-semibold font-light mt-1">
            Selecione a administradora, configure os parâmetros e obtenha
            resultados em tempo real.
          </p>
        </div>
        <Link
          href="/propostas"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#E0E5CF] px-5 py-2.5 text-sm font-bold text-[#002E17] hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Ver minhas propostas
        </Link>
      </div>

      {/* Administradora Fixa (Rodobens) */}

      {/* ═══════════════════════════════════════════════════════════════════════
          SEÇÕES DE SIMULAÇÃO
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─── PAINEL LATERAL DE CONFIGURAÇÃO ─────────────────────────────── */}
          <div className="lg:col-span-4 space-y-5">
            {/* SEÇÃO: Parceiro & Produto */}
            <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
              <SectionHeader
                title="Parceiro & Produto"
                subtitle="Vínculo com o parceiro e tipo de consórcio"
              />

              {/* Vincular Parceiro */}
              <div>
                <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                  Vincular a um Parceiro
                </label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="block w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all cursor-pointer"
                >
                  <option value="">Nenhum parceiro selecionado</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Produto - Cards de seleção */}
              <div>
                <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-2">
                  Tipo de Produto
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRODUTOS.filter(p => !(modalidade === "pontual" && (p.value === "moto" || p.value === "servico"))).map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setProduto(p.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        produto === p.value
                          ? "border-[#00CF7B] bg-[#00CF7B]/5 text-[#00CF7B] shadow-sm"
                          : "border-[#E0E5CF] text-[#002E17] font-semibold hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-base leading-none grayscale">{p.icon}</span>
                      <span className="leading-tight text-center text-[10px]">
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SEÇÃO: Inputs Financeiros */}
            <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
              <SectionHeader
                title="Parâmetros Financeiros"
                subtitle="Valores principais da simulação"
              />


              {/* Crédito Bruto & Qtd. Cotas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <CurrencyInput
                    label="Crédito Bruto"
                    value={credito}
                    onChange={setCredito}
                    placeholder="200.000,00"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                    Qtd. Cotas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantidadeCotas}
                    onChange={(e) => setQuantidadeCotas(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10"
                  />
                </div>
              </div>

              {/* Prazo */}
              {isRodobens ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                      Prazo Cota (Meses)
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={prazoMaxGrupo}
                      value={prazo}
                      onChange={(e) => setPrazo(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Ex: 60"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                      Maior Prazo Grupo
                    </label>
                    <input
                      type="number"
                      min={prazo}
                      max={400}
                      value={prazoMaxGrupo}
                      onChange={(e) => setPrazoMaxGrupo(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Ex: 216"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5" title="Preencha caso exista Furo (geralmente Prazo Grupo - Prazo Cota)">
                      Parcelas Furo
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={prazoMaxGrupo}
                      value={parcelasFuro}
                      onChange={(e) => setParcelasFuro(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Ex: 0"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={diluirFuro}
                        onChange={(e) => setDiluirFuro(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[#E0E5CF] text-[#00CF7B] focus:ring-[#00CF7B]"
                      />
                      <span className="text-[10px] text-[#002E17] font-medium">Diluir furo nas parcelas</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                    Prazo (Grupo) - Máx: {produtoConfig.prazoMax}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={6}
                      max={produtoConfig.prazoMax}
                      value={prazo}
                      onChange={(e) => setPrazo(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              )}

              {/* Modalidade */}
              <div>
                <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                  Modalidade do Plano
                </label>
                {isRodobens ? (
                  <select
                    value={modalidade}
                    onChange={(e) =>
                      setModalidade(e.target.value as typeof modalidade)
                    }
                    className="block w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all cursor-pointer"
                  >
                    {MODALIDADES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={modalidade === "reduzida" ? "reduzida" : "linear"}
                      onChange={(e) => setModalidade(e.target.value as typeof modalidade)}
                      className="block w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all cursor-pointer"
                    >
                      <option value="linear">Parcela Integral (100%)</option>
                      <option value="reduzida">Parcela Reduzida</option>
                    </select>
                    
                    {modalidade === "reduzida" && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5" title="Insira o percentual que você irá PAGAR da parcela (ex: 70 para pagar 70% do plano)">
                          % a Pagar na Parcela (Ex: 70 = paga 70% do plano)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={reducaoCustomizada}
                          onChange={(e) => setReducaoCustomizada(Number(e.target.value))}
                          className="w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Taxas */}
              <div
                className={`grid gap-2 ${isRodobens ? "grid-cols-2" : "grid-cols-3"}`}
              >
                <PercentageInput
                  label="Taxa ADM"
                  value={taxaAdm}
                  onChange={setTaxaAdm}
                  step={0.5}
                  max={30}
                />
                {!isRodobens && (
                  <PercentageInput
                    label="F. Reserva"
                    value={fundoReserva}
                    onChange={setFundoReserva}
                    step={0.25}
                    max={10}
                  />
                )}
                <div>
                  <label className="block text-[10px] font-semibold text-[#002E17] uppercase tracking-wider mb-1.5">
                    Seguro
                  </label>
                  <select
                    value={seguro}
                    onChange={(e) => setSeguro(Number(e.target.value))}
                    className="block w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all cursor-pointer"
                  >
                    <option value={0}>0%</option>
                    <option value={0.03090}>0,03090%</option>
                    <option value={0.03245}>0,03245%</option>
                    <option value={0.03860}>0,03860%</option>
                    <option value={0.04020}>0,04020%</option>
                    <option value={0.04054}>0,04054%</option>
                    <option value={0.07530}>0,07530%</option>
                    <option value={0.08280}>0,08280%</option>
                    <option value={0.08697}>0,08697%</option>
                    <option value={0.14780}>0,14780%</option>
                    <option value={0.15196}>0,15196%</option>
                  </select>
                </div>
              </div>

              {/* Campanhas */}
              <div className="pt-2 flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#002E17] uppercase tracking-wider mb-1.5">
                    Campanha Vigente 1 (Opcional)
                  </label>
                  <div className="relative">
                    <select
                      value={campanhaId}
                      onChange={(e) => setCampanhaId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10"
                    >
                      <option value="">Nenhuma campanha selecionada</option>
                      {campanhas
                        .filter(c => c.segmentos.includes(produto))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#002E17]">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#002E17] uppercase tracking-wider mb-1.5">
                    Campanha Vigente 2 (Opcional)
                  </label>
                  <div className="relative">
                    <select
                      value={campanhaId2}
                      onChange={(e) => setCampanhaId2(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10"
                    >
                      <option value="">Nenhuma campanha selecionada</option>
                      {campanhas
                        .filter(c => c.segmentos.includes(produto))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#002E17]">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {engineKey === "portobank" && (
                <div className="grid gap-2 grid-cols-2 mt-4 pt-4 border-t border-gray-100">
                  <PercentageInput
                    label="Taxa de Adesão"
                    value={taxaAdesao}
                    onChange={setTaxaAdesao}
                    step={0.5}
                    max={20}
                  />
                  <div>
                    <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                      Prazo Adesão (Meses)
                    </label>
                    <select
                      value={prazoTaxaAdesao}
                      onChange={(e) => setPrazoTaxaAdesao(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] font-semibold outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10"
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


            </div>



            {/* SEÇÃO: Lance & Amortização */}
            {modalidade !== "pontual" && (
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
                <SectionHeader
                  title="Contemplação"
                  subtitle="Selecione o formato da contemplação"
                />

                <div className="mb-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoContemplacao("sorteio")}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition-all ${tipoContemplacao === "sorteio" ? "bg-[#00CF7B] text-white border-[#00CF7B]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                    >
                      Sorteio
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoContemplacao("lance")}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition-all ${tipoContemplacao === "lance" ? "bg-[#00CF7B] text-white border-[#00CF7B]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                    >
                      Lance
                    </button>
                  </div>
                </div>

                {tipoContemplacao === "lance" && (
                  <div className="space-y-4 pt-2 border-t border-[#E0E5CF]">
                    <SectionHeader
                      title="Oferta de Lance"
                      subtitle="Defina o formato e valores do lance"
                    />

                {isRodobens && (

                  <div className="mb-4">
                    <label className="block text-[10px] font-semibold text-[#002E17] uppercase tracking-wider mb-2">
                      Base de Cálculo do Lance
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBaseCalculoLance("integral")}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition-all ${baseCalculoLance === "integral" ? "bg-[#00CF7B] text-white border-[#00CF7B]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                      >
                        Parcela Integral (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaseCalculoLance("reduzida")}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition-all ${baseCalculoLance === "reduzida" ? "bg-[#00CF7B] text-white border-[#00CF7B]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                      >
                        Parcela Reduzida (70%)
                      </button>
                    </div>
                  </div>
                )}

                {/* Tipo de Lance (Oculto na Rodobens) */}
                {!isRodobens && (
                  <div>
                    <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-2">
                      Formato do Lance
                    </label>
                    <select
                      value={tipoLance}
                      onChange={(e) => {
                        const val = e.target.value as "nenhum" | "valor" | "%" | "parcelas";
                        setTipoLance(val);
                        // Reset lance parameters
                        setLanceEmbutido(0);
                        setRecursosProprios(0);
                        setQuantidadeParcelasLance(0);
                        setTotalOfertado(null);
                      }}
                      className="block w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all cursor-pointer"
                    >
                      {engineKey === "tarraf" ? (
                        <>
                          <option value="%">Percentual (%)</option>
                        </>
                      ) : engineKey === "portobank" ? (
                        <>
                          <option value="nenhum">Selecione o formato do lance...</option>
                          <option value="%">Percentual (%)</option>
                        </>
                      ) : (
                        <>
                          <option value="nenhum">Selecione o formato do lance...</option>
                          <option value="%">Percentual (%)</option>
                          <option value="valor">Valor (R$)</option>
                          <option value="parcelas">Qtd. Parcelas</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {(tipoLance !== "nenhum" || isRodobens) && (
                  <>
                    {/* Master Input for Percentual Total (Non-Rodobens only) */}
                {tipoLance === "%" && !isRodobens && (
                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3 mb-4">
                    <PercentageInput
                      label="Percentual Total Ofertado (%)"
                      value={Number(lanceEmbutido) + Number(recursosProprios)}
                      onChange={(val) => {
                        setLanceEmbutido(Math.min(val, 30));
                        setRecursosProprios(Math.max(0, val - 30));
                      }}
                      step={1}
                      max={100}
                    />
                    <p className="text-[10px] text-[#002E17] font-semibold font-medium leading-relaxed">
                      O sistema preenche automaticamente até 30% no Lance Embutido e aloca o restante em Recursos Próprios.
                    </p>
                  </div>
                )}

                {/* Master Input for Valor Total (Non-Rodobens only) */}
                {tipoLance === "valor" && !isRodobens && (
                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3 mb-4">
                    <CurrencyInput
                      label="Valor Total Ofertado (R$)"
                      value={((credito * lanceEmbutido) / 100) + Number(recursosProprios)}
                      onChange={(val) => {
                        const total = Math.max(0, val);
                        const maxEmbutidoRs = credito * 0.30;
                        const embutidoRs = Math.min(total, maxEmbutidoRs);
                        setLanceEmbutido((embutidoRs / credito) * 100);
                        setRecursosProprios(Math.max(0, total - embutidoRs));
                      }}
                      placeholder="0,00"
                    />
                    <p className="text-[10px] text-[#002E17] font-semibold font-medium leading-relaxed">
                      O sistema aloca automaticamente até 30% do crédito no Lance Embutido e o restante em Recursos Próprios.
                    </p>
                  </div>
                )}

                {/* Master Input for Qtd Parcelas Total (Sua Oferta) */}
                {(tipoLance === "parcelas" || isRodobens) && (
                  <div className="space-y-1 mb-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#002E17] uppercase tracking-wider mb-1.5">
                        Sua Oferta {isRodobens ? "no Grupo (Parcelas)" : "(%)"}
                      </label>
                      <div className="relative flex items-center bg-[#e9ebe4] rounded-xl border border-[#E0E5CF] focus-within:border-[#00CF7B] focus-within:ring-2 focus-within:ring-[#00CF7B]/10 transition-all overflow-hidden">
                        <input
                          type="number"
                          min={0}
                          max={isRodobens ? (prazoMaxGrupo || 216) : 100}
                          value={isRodobens ? (quantidadeParcelasLance ? Math.round((quantidadeParcelasLance / prazo) * (prazoMaxGrupo || prazo)) : "") : ((resultadoExibicao?.percentualLance || 0).toFixed(2).replace(".00", ""))}
                          onChange={(e) => {
                            const total = Number(e.target.value);
                            if (isRodobens) {
                              const cotaTotal = (total / (prazoMaxGrupo || prazo)) * prazo;
                              setQuantidadeParcelasLance(cotaTotal);
                            } else {
                              const baseSeguroUI = credito + (credito * (taxaAdm / 100)) + (credito * (fundoReserva / 100));
                              const parcelaBase = ((credito / prazo) + (credito * (taxaAdm / 100) / prazo) + (credito * (fundoReserva / 100) / prazo) + (baseSeguroUI * (seguro / 100)));
                              const maxEmbutidoRs = credito * 0.30;
                              const maxEmbutidoParcelas = maxEmbutidoRs / parcelaBase;
                              const embutidoParcelas = Math.min(total, maxEmbutidoParcelas);
                              const embutidoRs = embutidoParcelas * parcelaBase;
                              setLanceEmbutido((embutidoRs / credito) * 100);
                              setQuantidadeParcelasLance(Math.max(0, Math.round(total - embutidoParcelas)));
                            }
                          }}
                          className="w-full bg-transparent px-3 py-2.5 text-sm font-semibold text-[#002E17] outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

            {/* Embutido — SEMPRE em % (máx 30%) */}
                <div className="space-y-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#002E17] uppercase tracking-wider mb-1.5">
                      Lance Embutido (máx 30%)
                    </label>
                    <div className="relative flex items-center bg-[#e9ebe4] rounded-xl border border-[#E0E5CF] focus-within:border-[#00CF7B] focus-within:ring-2 focus-within:ring-[#00CF7B]/10 transition-all overflow-hidden">
                      <input
                        type="number"
                        value={lanceEmbutido === 0 ? "" : lanceEmbutido}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val < 0) val = 0;
                          if (val > 30) val = 30;
                          
                          if (tipoLance === "valor") {
                            const currentTotalRs = (credito * lanceEmbutido / 100) + Number(recursosProprios);
                            const embutidoRs = credito * (val / 100);
                            setRecursosProprios(Math.max(0, currentTotalRs - embutidoRs));
                          } else if (tipoLance === "parcelas" && !isRodobens) {
                            const baseSeguroUI = credito + (credito * (taxaAdm / 100)) + (credito * (fundoReserva / 100));
                            const parcelaBase = ((credito / prazo) + (credito * (taxaAdm / 100) / prazo) + (credito * (fundoReserva / 100) / prazo) + (baseSeguroUI * (seguro / 100)));
                            const embutidoRsAnterior = credito * (lanceEmbutido / 100);
                            const embutidoParcelasAnterior = embutidoRsAnterior / parcelaBase;
                            const currentTotalParcelas = embutidoParcelasAnterior + quantidadeParcelasLance;
                            
                            const novoEmbutidoRs = credito * (val / 100);
                            const novoEmbutidoParcelas = novoEmbutidoRs / parcelaBase;
                            setQuantidadeParcelasLance(Math.max(0, Math.round(currentTotalParcelas - novoEmbutidoParcelas)));
                          } else if (tipoLance === "%") {
                            const currentTotalPct = lanceEmbutido + Number(recursosProprios);
                            setRecursosProprios(Math.max(0, currentTotalPct - val));
                          }
                          
                          setLanceEmbutido(val);
                        }}
                        placeholder="0"
                        className="w-full bg-transparent px-3 py-2.5 text-sm font-semibold text-[#002E17] outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 text-[#002E17] font-bold text-sm pointer-events-none">%</span>
                    </div>
                  </div>
                  {(tipoLance === "valor" || tipoLance === "parcelas") && lanceEmbutido > 0 && (
                    <p className="text-[10px] text-[#00CF7B] font-semibold px-1 mt-1">
                      {lanceEmbutido}% Equivale a {tipoLance === "valor" 
                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(credito * (lanceEmbutido / 100))
                        : `≈ ${Math.round((credito * (lanceEmbutido / 100)) / (isRodobens ? ((credito / prazoMaxGrupo) + (credito * (taxaAdm / 100) / prazoMaxGrupo) + (credito * (seguro / 100) / prazoMaxGrupo)) : ((credito / prazo) + (credito * (taxaAdm / 100) / prazo) + (credito * (fundoReserva / 100) / prazo) + (credito * (seguro / 100) / prazo))))} parcelas`}
                    </p>
                  )}
                </div>

                {/* Campos variáveis conforme tipoLance */}
                {tipoLance === "%" && (
                  <PercentageInput
                    label="Recursos Próprios (%)"
                    value={recursosProprios}
                    onChange={setRecursosProprios}
                    step={1}
                    max={100}
                    disabled={true}
                  />
                )}

                {tipoLance === "valor" && (
                  <CurrencyInput
                    label="Recursos Próprios (R$)"
                    value={recursosProprios}
                    onChange={setRecursosProprios}
                    placeholder="0,00"
                    disabled={true}
                  />
                )}


                {/* Input de Validação de Estimativa */}
                {tipoLance !== "nenhum" && (
                  <div className="mt-6 mb-6 bg-[#00CF7B]/5 border border-[#00CF7B]/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-[#00CF7B] mb-3 flex items-center gap-1.5">
                      <span>📊</span> Simulador de Oferta e Estimativa
                    </h4>
                    <p className="text-[10px] text-[#002E17] font-semibold mb-4">
                      Preencha o histórico do grupo e defina sua oferta para avaliar suas chances reais.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <label className="block text-[9px] font-semibold text-[#002E17] uppercase mb-1">Mês -3</label>
                        <input type="number" min={0} value={mediaMes3 || ""} onChange={(e) => setMediaMes3(Number(e.target.value))} className="w-full rounded-lg border border-[#00CF7B]/20 bg-[#e9ebe4] px-2 py-1.5 text-xs text-center text-[#002E17] font-bold outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-[#002E17] uppercase mb-1">Mês -2</label>
                        <input type="number" min={0} value={mediaMes2 || ""} onChange={(e) => setMediaMes2(Number(e.target.value))} className="w-full rounded-lg border border-[#00CF7B]/20 bg-[#e9ebe4] px-2 py-1.5 text-xs text-center text-[#002E17] font-bold outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-[#002E17] uppercase mb-1">Mês -1</label>
                        <input type="number" min={0} value={mediaMes1 || ""} onChange={(e) => setMediaMes1(Number(e.target.value))} className="w-full rounded-lg border border-[#00CF7B]/20 bg-[#e9ebe4] px-2 py-1.5 text-xs text-center text-[#002E17] font-bold outline-none focus:border-[#00CF7B] focus:ring-1 focus:ring-[#00CF7B]" placeholder="0" />
                      </div>
                    </div>

                    {mediaGrupo > 0 && (
                      <p className="text-[14px] text-[#002E17] font-semibold mb-4 text-center">
                        Média do Grupo: <span className="font-bold text-[#00CF7B]">{mediaGrupo.toFixed(1)} {isRodobens ? "parcelas" : "%"}</span>
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#00CF7B]/10">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#002E17] uppercase tracking-wider mb-1.5">
                          Qtd. de Parcelas
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={isRodobens ? prazoMaxGrupo : prazo}
                          value={Number.isInteger(quantidadeParcelasLance) ? quantidadeParcelasLance : Number(quantidadeParcelasLance.toFixed(2))}
                          disabled={true}
                          className="w-full rounded-lg border border-[#E0E5CF] bg-gray-50 px-3 py-2 text-sm text-[#002E17] font-bold outline-none transition-all cursor-not-allowed opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="flex flex-col justify-center bg-white border border-[#00CF7B]/10 rounded-lg p-2.5 shadow-sm">
                        <label className="block text-[9px] font-semibold text-[#002E17] uppercase mb-0.5">
                          Chances da Oferta
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            if (!mediaGrupo || mediaGrupo === 0) return <span className="text-sm font-extrabold text-[#002E17] font-semibold">-</span>;
                            
                            let ofertaAtual = 0;
                            let margem = 0;
                            
                            if (isRodobens) {
                              ofertaAtual = (prazo < (prazoMaxGrupo || prazo))
                                ? Math.round((quantidadeParcelasLance / prazo) * (prazoMaxGrupo || prazo))
                                : quantidadeParcelasLance;
                              margem = 5; // Margem de 5 parcelas
                            } else {
                              ofertaAtual = resultadoExibicao?.percentualLance || 0;
                              margem = 5; // Margem fixa em %
                            }
                            
                            if (ofertaAtual >= mediaGrupo + margem) return <span className="text-sm font-extrabold text-green-500">Alta</span>;
                            if (ofertaAtual >= mediaGrupo - margem) return <span className="text-sm font-extrabold text-yellow-500">Média</span>;
                            return <span className="text-sm font-extrabold text-red-500">Baixa</span>;
                          })()}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
                
                {/* Módulo de Conversão de Lance — Rodobens */}
                {isRodobens && prazo < prazoMaxGrupo && quantidadeParcelasLance > 0 && (
                  <div className="mt-2 bg-[#00CF7B]/5 border border-[#00CF7B]/20 rounded-xl p-4 mb-4">
                    <h4 className="text-xs font-bold text-[#00CF7B] mb-3 flex items-center gap-1.5">
                      <span>🔄</span> Conversão de Lance (Cota Reduzida)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col justify-center bg-[#e9ebe4] border border-gray-100 rounded-lg p-2.5">
                        <label className="block text-[9px] font-semibold text-[#002E17] font-semibold uppercase mb-0.5">
                          Parcelas na Sua Cota
                        </label>
                        <span className="text-lg font-bold text-[#002E17]">
                          {Number.isInteger(quantidadeParcelasLance) ? quantidadeParcelasLance : quantidadeParcelasLance.toFixed(2).replace('.', ',')}
                        </span>
                        <p className="text-[9px] text-[#002E17] font-semibold mt-0.5">de {prazo} meses</p>
                      </div>
                      <div className="flex flex-col justify-center bg-[#e9ebe4] border border-[#00CF7B]/10 rounded-lg p-2.5 shadow-sm">
                        <label className="block text-[9px] font-semibold text-[#002E17] font-semibold uppercase mb-0.5">
                          Equivale no Grupo
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#00CF7B]">
                            {Math.round((quantidadeParcelasLance / prazo) * prazoMaxGrupo)}
                          </span>
                          <span className="text-[10px] font-semibold text-[#002E17] font-semibold leading-tight">
                            parcelas
                          </span>
                        </div>
                        <p className="text-[9px] text-[#002E17] font-semibold mt-0.5 leading-tight">
                          de {prazoMaxGrupo} meses
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Mês de Contemplação */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                    Mês Estimado de Contemplação
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={prazo}
                      step={1}
                      value={mesContemplacao}
                      onChange={(e) =>
                        setMesContemplacao(Number(e.target.value))
                      }
                      className="flex-1 h-1.5 accent-[#00CF7B] cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#002E17] w-14 text-center">
                      {mesContemplacao}º mês
                    </span>
                  </div>
                </div>

                {/* Amortização */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-2">
                    Amortização do Lance
                  </label>
                  <SegmentedControl
                    options={[
                      { value: "parcela" as const, label: "Em Parcelas" },
                      { value: "prazo" as const, label: "Em Prazo" },
                      { value: "misto" as const, label: "50% + 50%" },
                    ]}
                    value={abatimento}
                    onChange={setAbatimento}
                  />
                </div>

              </>
            )}
          </div>
        )}
      </div>
    )}

            {/* Seção pontual */}
            {modalidade === "pontual" && (
              <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl p-5 shadow-sm space-y-4">
                <SectionHeader
                  title="Entrega Pontual"
                  subtitle="Configure a aquisição programada"
                />

                <div>
                  <label className="block text-[10px] font-semibold text-[#002E17] font-semibold uppercase tracking-wider mb-1.5">
                    Mês Programado de Aquisição
                  </label>
                  <select
                    value={mesPontual}
                    onChange={(e) => setMesPontual(Number(e.target.value))}
                    className="block w-full rounded-xl border border-[#E0E5CF] bg-[#e9ebe4] px-3 py-2.5 text-sm text-[#002E17] outline-none focus:border-[#00CF7B] focus:ring-2 focus:ring-[#00CF7B]/10 transition-all cursor-pointer"
                  >
                    {Array.from(
                      { length: 19 },
                      (_, i) =>
                        i +
                        (produto === "auto" ||
                        produto === "moto" ||
                        produto === "pesado"
                          ? 6
                          : 12),
                    ).map((m) => (
                      <option key={m} value={m}>
                        {m}º Mês
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-orange-50 border border-orange-200/60 rounded-xl p-3">
                  <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
                    O cliente programa a entrega no{" "}
                    <strong>{mesPontual}º mês</strong>. Para isso, precisará ter
                    pago <strong>40% do plano</strong>.
                    {parcelasPontualAntecipar > 0 && (
                      <span>
                        {" "}
                        Adiantamento de{" "}
                        <strong>
                          {formatCurrency(valorAdiantamentoPontual)}
                        </strong>{" "}
                        (≈ {parcelasPontualAntecipar} parcelas antecipadas).
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ─── PAINEL PRINCIPAL DE RESULTADOS ─────────────────────────────── */}
          <div className="lg:col-span-8 space-y-5">
            {/* Erros de Validação */}
            <ValidationErrors errors={validationErrors} />

            {resultadoExibicao && (
              <div className="space-y-6">
                {/* Seção Superior de Resultados: Card de Proposta (Meu Parceiro Digital) + Painel Estratégico/Ações */}
                <div className="flex flex-col gap-6">

                  {/* Coluna da Esquerda: Card de Proposta Detalhado (Meu Parceiro Digital Style) */}
                  <div className="w-full">
                    <div ref={resultCardRef} className="bg-[#002E17] text-white rounded-3xl shadow-xl border border-zinc-800 flex flex-col relative overflow-hidden">
                      
                      {/* ─── CUSTOM HEADER ORIGINAL IMAGE ─── */}
                      <div className="w-full relative overflow-hidden flex flex-col">
                         <img 
                           src="/images/header-proposta.png" 
                           alt="Header Rodobens" 
                           className="w-full h-auto object-cover -mt-6 md:-mt-10 scale-[1.04] origin-top"
                         />
                      </div>

                      {/* ─── RESTO DO CONTEÚDO ─── */}
                      <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 flex flex-col gap-4 relative -mt-2 md:-mt-4">
                        {/* Efeito decorativo blur no fundo */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00CF7B]/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Header do Produto (Menor agora que temos o banner) */}
                        <div>
                          <h3 className="text-xl md:text-2xl font-black tracking-tight mt-0.5 text-white">
                            {getPropostaTitle(produto)}
                          </h3>
                        </div>

                      {/* Lista de Métricas Principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-semibold opacity-80 text-gray-300">Modelo de Cálculo</span>
                          <span className="text-base font-extrabold text-[#00CF7B]">
                            {isRodobens
                              ? MODALIDADES.find((m) => m.value === modalidade)?.label || "Linear"
                              : modalidade === "reduzida" ? `Reduzida (${reducaoCustomizada}%)` : "Integral (100%)"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-semibold opacity-80 text-gray-300">Total da Operação</span>
                          <span className="text-base font-extrabold text-white">
                            {formatPropostaCurrency(resultadoExibicao.creditoBruto)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">Prazo</span>
                            <span className="text-base font-extrabold text-white">{prazo} meses</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">Parcelas Furo</span>
                            <span className="text-base font-extrabold text-white">{parcelasFuro || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">Taxa Adm</span>
                            <span className="text-base font-extrabold text-white">
                              {temDescontoCampanha ? (
                                <>
                                  <span className="line-through opacity-50 mr-2 text-sm">{taxaAdm}%</span>
                                  <span className="text-green-400">{taxaAdmReal.toFixed(2)}%</span>
                                </>
                              ) : (
                                `${taxaAdm}%`
                              )}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">Seguro Prestamista</span>
                            <span className="text-base font-extrabold text-white">{seguro}%</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">
                              Parcela Inicial {resultadoExibicao.parcelaPosAdesao ? '(c/ Adesão)' : ''}
                            </span>
                            <span className="text-base font-extrabold text-[#00CF7B]">
                              {formatPropostaCurrency(resultadoExibicao.parcelaInicial)}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">Total Final Pago</span>
                            <span className="text-base font-extrabold text-[#00CF7B]">
                              {formatPropostaCurrency(resultadoExibicao.totalPago)}
                            </span>
                          </div>
                        </div>

                        {resultadoExibicao.parcelaPosAdesao && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-2 mt-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold opacity-80 text-gray-300">
                                Parcela após {prazoTaxaAdesao}x da adesão
                              </span>
                              <span className="text-base font-extrabold text-white">
                                {formatPropostaCurrency(resultadoExibicao.parcelaPosAdesao)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-[#e9ebe4]/10 flex-1"></div>
                        <span className="text-[10px] uppercase font-bold text-[#00CF7B] tracking-widest">
                          {modalidade === 'pontual' ? 'Adiantamento Programado' : (tipoContemplacao === 'sorteio' ? 'Contemplação por Sorteio' : 'Oferta de Lance')}
                        </span>
                        <div className="h-px bg-[#e9ebe4]/10 flex-1"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
                        {modalidade !== 'pontual' && tipoContemplacao === 'lance' && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">Percentual Lance (Grupo)</span>
                            <span className="text-base font-extrabold text-white">
                              {resultadoExibicao.percentualLance.toFixed(2)}%
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-semibold opacity-80 text-gray-300">Crédito Líquido</span>
                          <span className="text-base font-extrabold text-white">
                            {formatPropostaCurrency(resultadoExibicao.creditoLiquido)}
                          </span>
                        </div>
                        
                        {modalidade !== 'pontual' && (
                          <>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs font-semibold opacity-80 text-gray-300">
                                {tipoContemplacao === 'sorteio' ? (resultadoExibicao.lanceTotalReais > 0 ? 'Pagamento Exigido no Sorteio (Furo)' : 'Pagamento na Contemplação') : 'Valor Total de Lance'}
                              </span>
                              <span className="text-base font-extrabold text-white">
                                {formatPropostaCurrency(resultadoExibicao.lanceTotalReais)}
                              </span>
                            </div>
                            {tipoContemplacao === 'lance' && (
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-xs font-semibold opacity-80 text-gray-300">Embutido (Uso Cota)</span>
                                <span className="text-base font-extrabold text-white">
                                  {lanceEmbutido}% ({formatPropostaCurrency(resultadoExibicao.lanceEmbutidoReais)})
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {modalidade === 'pontual' ? (
                          <div className="flex justify-between items-center border-b border-white/5 pb-2 md:col-span-2">
                            <span className="text-xs font-semibold opacity-80 text-gray-300">Adiantamento Pontual (Mês {mesPontual})</span>
                            <span className="text-base font-extrabold text-white">
                              {formatPropostaCurrency((resultadoExibicao.adiantamento || 0) * quantidadeCotas)}
                            </span>
                          </div>
                        ) : (
                          tipoContemplacao === 'lance' && (
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs font-semibold opacity-80 text-gray-300">Lance Recursos Próprios</span>
                              <span className="text-base font-extrabold text-white">
                                {formatPropostaCurrency(resultadoExibicao.recursosPropriosReais)}
                              </span>
                            </div>
                          )
                        )}

                        {modalidade !== 'pontual' && (
                          resultadoExibicao.parcelaPosContemplacaoInicial ? (
                            <div className="space-y-3 pt-1 md:col-span-2">
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-[11px] font-semibold opacity-80 text-gray-300">Parcela Pós-Contemplação (até {Math.ceil(prazo / 2)})</span>
                                <span className="text-[13px] md:text-base font-extrabold text-[#FF9025]">
                                  {formatPropostaCurrency(resultadoExibicao.parcelaPosContemplacaoInicial)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-semibold opacity-80 text-gray-300">Parcela de {Math.ceil(prazo / 2) + 1} até {prazo}</span>
                                <span className="text-[13px] md:text-base font-extrabold text-[#FF9025]">
                                  {formatPropostaCurrency(resultadoExibicao.parcelaFinal)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center pt-1 md:col-span-2">
                              <span className="text-xs font-semibold opacity-80 text-gray-300">Parcela Pós-Contemplação</span>
                              <span className="text-base font-extrabold text-[#FF9025]">
                                {formatPropostaCurrency(resultadoExibicao.parcelaFinal)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Botões de Ação & Feedback */}
                  <div className="space-y-3 mt-2 flex flex-col items-end">
                    <div className="w-full max-w-sm flex gap-3">
                      <button
                        onClick={() => {
                          handleCopiarPropostaSimplificada();
                        }}
                        disabled={isPending || isGeneratingPNG || validationErrors.length > 0}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00CF7B] hover:bg-[#FF7A40] text-[11px] font-bold text-white px-2 py-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        {isGeneratingPNG ? "Copiando..." : "Copiar Simplificada"}
                      </button>
                      <button
                        onClick={() => {
                          if (!leadId) {
                            setFeedback({ success: false, message: "⚠️ Por favor, selecione um parceiro." });
                            return;
                          }
                          setIsDisclaimerAccepted(false);
                          setIsPersonalizarModalOpen(true);
                        }}
                        disabled={isPending || isGeneratingPDF || validationErrors.length > 0}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#002E17] hover:bg-[#003317] text-[11px] font-bold text-white px-2 py-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        {isGeneratingPDF ? "Gerando..." : "Proposta Completa"}
                      </button>
                    </div>

                    {/* Feedback */}
                    {feedback && (
                      <div
                        className={`w-full max-w-sm p-3 rounded-xl border text-sm font-semibold transition-all text-center ${
                          feedback.success
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        {feedback.message}
                      </div>
                    )}
                  </div>


                {/* Seção Inferior: Cronograma Detalhado (Largura Total) */}
                <div className="bg-[#e9ebe4] border border-[#E0E5CF] rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowCronograma(!showCronograma)}
                    className="w-full flex items-center justify-between p-5 font-bold text-[#002E17] text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>📅</span>
                      Cronograma Detalhado de Pagamento (
                      {resultadoExibicao.cronograma.length} meses)
                    </span>
                    <span
                      className={`text-xs text-[#002E17] font-semibold uppercase tracking-wider transition-transform ${showCronograma ? "rotate-180" : ""}`}
                    >
                      {showCronograma ? "▲ Ocultar" : "▼ Visualizar"}
                    </span>
                  </button>

                  {showCronograma && (
                    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-[#002E17] font-semibold border-b border-gray-150 uppercase tracking-wider font-semibold sticky top-0 z-10">
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
                          {resultadoExibicao.cronograma.map((p) => (
                            <tr
                              key={p.mes}
                              className={`hover:bg-gray-50/70 transition-colors ${p.mes === mesContemplacao ? "bg-orange-50/30 font-bold" : ""}`}
                            >
                              <td className="py-2.5 px-4 whitespace-nowrap text-center text-[#002E17] font-semibold">
                                {p.mes}º
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-center text-gray-900 font-bold">
                                {p.mes}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.amortizacao)}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.taxaAdm)}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.fundoReserva)}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {p.quitadaPorLance ? <span className="text-gray-300">-</span> : formatCurrency(p.seguro)}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {p.adiantamento > 0 ? (
                                  <span className="text-orange-600 font-bold">
                                    {formatCurrency(p.adiantamento)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap font-bold text-gray-900">
                                {p.quitadaPorLance ? (
                                  <span className="text-[#002E17] font-semibold italic uppercase tracking-wider text-[10px]">LANCE</span>
                                ) : (
                                  formatCurrency(p.total + p.adiantamento)
                                )}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-[#002E17] font-semibold">
                                {formatCurrency(p.saldoDevedor)}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap text-center">
                                {p.mes === mesContemplacao ? (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-800 uppercase tracking-wide">
                                    Contemplação
                                  </span>
                                ) : p.contemplado ? (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                                    Pós
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-[#002E17] font-semibold uppercase tracking-wide">
                                    Pré
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                  {/* Coluna da Direita: Box Estratégico, Botão de Salvar e Feedback */}
                  <div className="w-full space-y-5">
                    {/* Box Estratégico da Modalidade */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-[#E0E5CF] rounded-2xl p-5 text-sm text-[#002E17]">
                      <h4 className="font-extrabold text-sm mb-1.5 flex items-center gap-2">
                        Resultado Estratégico —{" "}
                        <span className="text-[#00CF7B] capitalize">
                          {modalidade === "linear" ? "Linear / Integral" : modalidade === "linear_70" ? "Linear / Integral 70" : modalidade.replace("_", " ")}
                        </span>
                      </h4>

                      {modalidade === "pontual" && (
                        <p className="text-xs text-[#002E17] font-semibold leading-relaxed font-light">
                          O cliente programa a entrega no{" "}
                          <strong>{mesPontual}º mês</strong>. Para isso, ele precisa
                          ter pago <strong>40% do plano</strong>. Ele pagará as
                          parcelas normais até o mês {mesPontual}, e no {mesPontual}
                          º mês aportará um adiantamento no valor de{" "}
                          <strong>
                            {formatCurrency((resultadoExibicao.adiantamento || 0) * quantidadeCotas)}
                          </strong>{" "}
                          (equivalente a antecipar {resultadoExibicao.parcelasAntecipadas || 0}{" "}
                          parcelas). Dessa forma, o prazo final restante será
                          reduzido em {resultadoExibicao.parcelasAntecipadas || 0} meses.
                        </p>
                      )}

                      {(modalidade === "linear_70" ||
                        modalidade === "reducao_50" ||
                        modalidade === "degrau_70" ||
                        modalidade === "reduzida") && (
                        <p className="text-xs text-[#002E17] font-semibold leading-relaxed font-light">
                          {modalidade === "reduzida" ? (
                            <>
                              O cliente inicia o plano pagando um valor reduzido da parcela, equivalente a <strong>{reducaoCustomizada}% do crédito total</strong>. Essa estratégia facilita a entrada comercial e alivia o fluxo de caixa inicial. No momento da contemplação (estimado para o mês {mesContemplacao}), a diferença acumulada será recalculada e diluída de forma sustentável no saldo devedor restante.
                            </>
                          ) : (
                            <>
                              O cliente inicia pagando parcelas reduzidas. No mês
                              estimado de contemplação (mês {mesContemplacao}), o saldo
                              das diferenças acumuladas será somado ao saldo devedor
                              restante e diluído nas parcelas restantes. Isso facilita a
                              entrada comercial do cliente e readequa o plano
                              pós-contemplação de forma sustentável.
                            </>
                          )}
                          {abatimento === "misto" &&
                            " A amortização mista (50% parcela + 50% prazo) oferece equilíbrio entre valor da parcela e prazo total."}
                        </p>
                      )}

                      {modalidade === "degrau" && (
                        <p className="text-xs text-[#002E17] font-semibold leading-relaxed font-light">
                          A taxa de administração é concentrada nos primeiros 50% do
                          prazo total (meses 1 a {Math.ceil(prazo / 2)}), elevando
                          as parcelas iniciais. Na segunda metade do prazo, as
                          parcelas caem por não possuírem mais taxa de
                          administração, oferecendo um alívio financeiro futuro.
                        </p>
                      )}

                      {modalidade === "linear" && (
                        <p className="text-xs text-[#002E17] font-semibold leading-relaxed font-light">
                          Cálculo linear / integral tradicional. Todas as taxas (fundo comum,
                          administração e reserva) são distribuídas igualmente e de
                          forma constante durante todo o prazo do plano. Modelo
                          estável e previsível, ideal para perfis conservadores.
                        </p>
                      )}
                    </div>

                  </div>

                </div>
                {/* BLOCO: Comparativo com Financiamento */}
                <div className="bg-white border border-[#E0E5CF] rounded-2xl p-6 shadow-sm space-y-4">
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
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#002E17]/70 mb-1">Taxa Adm a.m. (Consórcio)</span>
                          <span className="text-xl font-black text-[#00CF7B]">
                            {temDescontoCampanha ? (
                              <>
                                <span className="line-through opacity-50 mr-2 text-sm text-[#002E17]/50">{(taxaAdm / prazo).toFixed(4)}%</span>
                                {(taxaAdmReal / prazo).toFixed(4)}%
                              </>
                            ) : (
                              `${(taxaAdm / prazo).toFixed(4)}%`
                            )}
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
                          <span className="text-xl font-black text-[#00CF7B]">{(taxaAdm + fundoReserva).toFixed(2)}%</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Parcela Estimada (Financ.)</span>
                          <span className="text-lg font-bold text-gray-800">{formatCurrency(financingResult.monthlyPayment)}</span>
                        </div>
                        <div className="bg-[#002E17]/5 p-4 rounded-xl border border-[#00CF7B]/20 flex flex-col justify-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#002E17]/70 mb-1">Parcela (Consórcio)</span>
                          <span className="text-lg font-bold text-[#00CF7B]">{formatCurrency(resultadoExibicao.parcelaInicial)}</span>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex flex-col justify-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-red-800/70 mb-1">Total Pago (Financ.)</span>
                          <span className="text-lg font-bold text-red-700">{formatCurrency(financingResult.totalPaid + financingResult.downPayment)}</span>
                          <span className="text-[9px] font-medium text-red-800/50 mt-1">Inclui {formatCurrency(financingResult.interestCost)} em juros</span>
                        </div>
                        <div className="bg-[#002E17]/5 p-4 rounded-xl border border-[#00CF7B]/30 flex flex-col justify-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#002E17]/70 mb-1">Total Pago (Consórcio)</span>
                          <span className="text-lg font-bold text-[#002E17]">{formatCurrency(resultadoExibicao.totalPago)}</span>
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
                          {formatCurrency((financingResult.totalPaid + financingResult.downPayment) - resultadoExibicao.totalPago)}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-2 text-center bg-gray-50 rounded-lg p-2 border border-dashed border-gray-200">
                        * Referência: Banco Central do Brasil (BCB) - {financingResult.institutionsConsidered} instituições ({financingResult.referenceDate}). Os valores são estimados e representam apenas a média de mercado, não garantindo a aprovação de crédito ou taxas exatas de nenhuma instituição financeira específica no momento da contratação.
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center p-4">Não foi possível carregar as taxas de financiamento.</div>
                  )}
                </div>

              </div>
            )}

            {/* Estado vazio - Sem resultado (quando não há administradora) */}
            {!resultado && validationErrors.length === 0 && (
              <div className="bg-[#e9ebe4] border border-dashed border-[#E0E5CF] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">📊</span>
                <h3 className="text-sm font-bold text-[#002E17] mb-1">
                  Aguardando parâmetros
                </h3>
                <p className="text-xs text-[#002E17] font-semibold font-light max-w-xs">
                  Preencha os campos de simulação no painel lateral para gerar
                  os resultados em tempo real.
                </p>
              </div>
            )}
          </div>
        </div>

      {/* Modal de Personalização */}
      {isPersonalizarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#e9ebe4] rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#002E17]">Personalizar Proposta</h3>
              <button onClick={() => setIsPersonalizarModalOpen(false)} className="text-[#002E17] font-semibold hover:text-[#002E17] font-semibold">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#002E17] font-semibold mb-1">Nome da Representação</label>
                <input
                  type="text"
                  value={customEmpresaNome}
                  onChange={(e) => setCustomEmpresaNome(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00CF7B]/20 focus:border-[#00CF7B] outline-none"
                  placeholder="Ex: Minha Corretora Consórcios"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#002E17] font-semibold mb-1 mt-4">Logo da Representação (Opcional)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCustomLogoUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setCustomLogoUrl("");
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00CF7B]/20 focus:border-[#00CF7B] outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
                />
                {customLogoUrl && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <span>✓ Logo carregada com sucesso</span>
                    <button onClick={() => setCustomLogoUrl("")} className="text-red-500 hover:underline ml-auto">Remover</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#002E17] mb-2">Cor Predominante da Capa</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Verde-escuro', hex: '#002E17' },
                    { name: 'Verde-vivo', hex: '#00CF7B' },
                    { name: 'Laranja', hex: '#FF7A40' },
                    { name: 'Azul', hex: '#00A8E2' },
                    { name: 'Rosa', hex: '#EF6FD4' }
                  ].map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setCustomCorPrimaria(color.hex)}
                      title={color.name}
                      className={`w-8 h-8 rounded-full flex-shrink-0 transition-all duration-200 ${
                        customCorPrimaria?.toUpperCase() === color.hex
                          ? 'ring-2 ring-offset-2 ring-[#002E17] scale-110 shadow-sm'
                          : 'ring-1 ring-gray-200 hover:scale-105 hover:ring-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-4">
                <p className="text-xs text-orange-800 font-medium leading-relaxed">
                  💡 A capa será montada dinamicamente com as imagens do produto <b>{produto.toUpperCase()}</b> no valor de <b>{formatCurrency(credito)}</b>.
                  A cota sairá com selo de administração pela parceira <b>{activeAdmin?.nome || "Administradora"}</b>.
                </p>
              </div>

              <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                <div className="relative flex items-center pt-0.5">
                  <input
                    type="checkbox"
                    checked={isDisclaimerAccepted}
                    onChange={(e) => setIsDisclaimerAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#00CF7B] focus:ring-[#00CF7B]/20"
                  />
                </div>
                <p className="text-[10px] text-[#002E17] font-semibold font-medium leading-relaxed text-justify">
                  Declaro que possuo autorização do cliente para uso de dados, ciência das políticas de privacidade da ferramenta, e concordo que a simulação e os cálculos do PDF são apenas uma estimativa baseada em parâmetros manuais que não representam uma promessa oficial da administradora.
                </p>
              </label>

            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setIsPersonalizarModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-[#002E17] font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={!isDisclaimerAccepted || isGeneratingPDF || isGeneratingPNG}
                onClick={() => {
                  setIsPersonalizarModalOpen(false);
                  handleGerarProposta();
                }}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white bg-[#002E17] hover:bg-[#003317] transition-colors cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {isGeneratingPDF ? "Gerando..." : "Gerar PDF Completo"}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
