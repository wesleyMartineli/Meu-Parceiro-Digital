"use client";

import React, { useMemo } from "react";
import {
  ComposedChart,
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  Bar,
  Line,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  CustomAnalysisConfig,
  DashboardLead,
  DashboardNegocio,
  DashboardTarefa,
  DataPointAnalysis,
  MetricaDefinicao,
  UsuarioHierarquia
} from "../types";
import {
  executarAnalise,
  formatBRL,
  formatShortBRL,
  formatValor,
  AGRUPAMENTO_LABELS,
  BRAND_CHART_PALETTE,
  BRAND_COLORS
} from "../analyticsEngine";
import {
  Edit3,
  Copy,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Maximize2,
  Package,
  ListTodo
} from "lucide-react";

interface AnalysisCardProps {
  config: CustomAnalysisConfig;
  negocios: DashboardNegocio[];
  tarefas: DashboardTarefa[];
  parceiros: DashboardLead[];
  usuariosHierarquia: UsuarioHierarquia[];
  mounted: boolean;
  onEdit: (config: CustomAnalysisConfig) => void;
  onDuplicate: (config: CustomAnalysisConfig) => void;
  onDelete: (id: string) => void;
  onPointClick: (ponto: DataPointAnalysis, config: CustomAnalysisConfig, defPrimaria: MetricaDefinicao, defSecundaria?: MetricaDefinicao) => void;
}

const PIE_COLORS = BRAND_CHART_PALETTE;

export default function AnalysisCard({
  config,
  negocios,
  tarefas,
  parceiros,
  usuariosHierarquia,
  mounted,
  onEdit,
  onDuplicate,
  onDelete,
  onPointClick,
}: AnalysisCardProps) {
  // Executa o processamento com as configurações congeladas da análise
  const { dataPoints, totalPrimario, totalSecundario, defPrimaria, defSecundaria } = useMemo(() => {
    return executarAnalise(config, negocios, tarefas, parceiros, usuariosHierarquia);
  }, [config, negocios, tarefas, parceiros, usuariosHierarquia]);

  const isPrimariaMoeda = defPrimaria.tipoDado === "moeda";
  const isSecundariaMoeda = defSecundaria?.tipoDado === "moeda";

  const periodoLabelMap: Record<string, string> = {
    hoje: "Hoje",
    semana: "Esta Semana",
    mes: "Este Mês",
    "30dias": "Últimos 30 Dias",
    trimestre: "Este Trimestre",
    semestre: "Este Semestre",
    ano: "Ano Atual",
    todos: "Histórico Completo",
    custom: "Personalizado",
  };

  const periodoLabel = periodoLabelMap[config.filtros.periodo || "ano"] || "Período Ativo";

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 space-y-4 hover:shadow-md transition-shadow">
      {/* 1. CABEÇALHO DO CARD DA ANÁLISE */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                config.categoria === "tarefas"
                  ? "bg-[#FF7A40]/15 text-[#FF7A40]"
                  : config.categoria === "negocios"
                  ? "bg-[#00A8E2]/15 text-[#00A8E2]"
                  : "bg-[#00441F] text-[#00CF7B]"
              }`}
            >
              {config.categoria === "tarefas"
                ? "Apenas Tarefas"
                : config.categoria === "negocios"
                ? "Negócios & Produtos"
                : "Cruzamento"}
            </span>

            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5 text-[#00CF7B]" />
              {periodoLabel}
            </span>

            {config.filtros.produtoModalidade && config.filtros.produtoModalidade !== "all" && (
              <span className="px-2 py-0.5 rounded-md bg-[#00A8E2]/10 text-[#00A8E2] text-[10px] font-bold flex items-center gap-1">
                <Package className="w-2.5 h-2.5" />
                {config.filtros.produtoModalidade}
              </span>
            )}

            {config.filtros.tipoTarefa && config.filtros.tipoTarefa !== "all" && (
              <span className="px-2 py-0.5 rounded-md bg-[#FF7A40]/10 text-[#FF7A40] text-[10px] font-bold flex items-center gap-1">
                <ListTodo className="w-2.5 h-2.5" />
                {config.filtros.tipoTarefa}
              </span>
            )}
          </div>

          <h3 className="text-base font-extrabold text-[#00441F]">
            {config.titulo}
          </h3>

          {config.descricao && (
            <p className="text-xs text-gray-500 font-medium">
              {config.descricao}
            </p>
          )}
        </div>

        {/* Ações da Análise Salva */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => onEdit(config)}
            className="p-1.5 text-gray-600 hover:text-[#00441F] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Editar parâmetros congelados desta análise (ex: alterar período, métricas ou filtros)"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDuplicate(config)}
            className="p-1.5 text-gray-600 hover:text-[#00441F] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Duplicar para criar uma variação"
          >
            <Copy className="w-4 h-4" />
          </button>

          {!config.isPreset && (
            <button
              onClick={() => onDelete(config.id)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Excluir esta análise do dashboard"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. TOTAIS DESTA ANÁLISE */}
      <div className="flex items-center justify-between gap-4 py-1.5 px-3 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Total {defPrimaria.labelCurto}:
          </span>
          <span className="font-extrabold text-[#00441F]">
            {formatValor(totalPrimario, defPrimaria.tipoDado)}
          </span>
        </div>

        {defSecundaria && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              Total {defSecundaria.labelCurto}:
            </span>
            <span className="font-extrabold text-[#00CF7B]">
              {formatValor(totalSecundario, defSecundaria.tipoDado)}
            </span>
          </div>
        )}
      </div>

      {/* 3. VISUALIZAÇÃO GRÁFICA INTERATIVA COM CLIQUE PARA AUDITORIA (DRILLDOWN) */}
      <div className="w-full h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            {config.tipoGrafico === "composed" ? (
              <ComposedChart
                data={dataPoints}
                margin={{ top: 15, right: 15, bottom: 15, left: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onPointClick(e.activePayload[0].payload as DataPointAnalysis, config, defPrimaria, defSecundaria);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke={defPrimaria.cor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (isPrimariaMoeda ? formatShortBRL(v) : String(v))}
                />
                {defSecundaria && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={defSecundaria.cor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (isSecundariaMoeda ? formatShortBRL(v) : String(v))}
                  />
                )}
                <Tooltip
                  formatter={(val: any, name: any) => [
                    formatValor(Number(val) || 0, name === defPrimaria.label ? defPrimaria.tipoDado : defSecundaria?.tipoDado || "numero"),
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }} />
                <Bar
                  yAxisId="left"
                  dataKey="valorPrimario"
                  name={defPrimaria.label}
                  fill={defPrimaria.cor}
                  radius={[5, 5, 0, 0]}
                  cursor="pointer"
                />
                {defSecundaria && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="valorSecundario"
                    name={defSecundaria.label}
                    stroke={defSecundaria.cor}
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#ffffff", stroke: defSecundaria.cor, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    cursor="pointer"
                  />
                )}
              </ComposedChart>
            ) : config.tipoGrafico === "bar" ? (
              <BarChart
                data={dataPoints}
                margin={{ top: 15, right: 15, bottom: 15, left: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onPointClick(e.activePayload[0].payload as DataPointAnalysis, config, defPrimaria, defSecundaria);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke={defPrimaria.cor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (isPrimariaMoeda ? formatShortBRL(v) : String(v))}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatValor(Number(val) || 0, defPrimaria.tipoDado),
                    defPrimaria.label,
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }} />
                <Bar
                  dataKey="valorPrimario"
                  name={defPrimaria.label}
                  fill={defPrimaria.cor}
                  radius={[5, 5, 0, 0]}
                  cursor="pointer"
                >
                  {dataPoints.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor || defPrimaria.cor} />
                  ))}
                </Bar>
                {defSecundaria && (
                  <Bar
                    dataKey="valorSecundario"
                    name={defSecundaria.label}
                    fill={defSecundaria.cor}
                    radius={[5, 5, 0, 0]}
                    cursor="pointer"
                  />
                )}
              </BarChart>
            ) : config.tipoGrafico === "line" ? (
              <LineChart
                data={dataPoints}
                margin={{ top: 15, right: 15, bottom: 15, left: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onPointClick(e.activePayload[0].payload as DataPointAnalysis, config, defPrimaria, defSecundaria);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke={defPrimaria.cor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (isPrimariaMoeda ? formatShortBRL(v) : String(v))}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatValor(Number(val) || 0, defPrimaria.tipoDado),
                    defPrimaria.label,
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }} />
                <Line
                  type="monotone"
                  dataKey="valorPrimario"
                  name={defPrimaria.label}
                  stroke={defPrimaria.cor}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  cursor="pointer"
                />
                {defSecundaria && (
                  <Line
                    type="monotone"
                    dataKey="valorSecundario"
                    name={defSecundaria.label}
                    stroke={defSecundaria.cor}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                    cursor="pointer"
                  />
                )}
              </LineChart>
            ) : config.tipoGrafico === "area" ? (
              <AreaChart
                data={dataPoints}
                margin={{ top: 15, right: 15, bottom: 15, left: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onPointClick(e.activePayload[0].payload as DataPointAnalysis, config, defPrimaria, defSecundaria);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke={defPrimaria.cor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (isPrimariaMoeda ? formatShortBRL(v) : String(v))}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatValor(Number(val) || 0, defPrimaria.tipoDado),
                    defPrimaria.label,
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valorPrimario"
                  name={defPrimaria.label}
                  stroke={defPrimaria.cor}
                  fill={defPrimaria.cor}
                  fillOpacity={0.25}
                  cursor="pointer"
                />
              </AreaChart>
            ) : config.tipoGrafico === "pie" ? (
              <PieChart>
                <Tooltip
                  formatter={(val: any) => [
                    formatValor(Number(val) || 0, defPrimaria.tipoDado),
                    defPrimaria.label,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Pie
                  data={dataPoints}
                  dataKey="valorPrimario"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  onClick={(entry: any) => {
                    const payload = (entry?.payload || entry) as unknown as DataPointAnalysis;
                    onPointClick(payload, config, defPrimaria, defSecundaria);
                  }}
                >
                  {dataPoints.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.cor || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              /* TABELA COMPACTA DENTRO DO CARD */
              <div className="overflow-y-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-right">{defPrimaria.labelCurto}</th>
                      {defSecundaria && <th className="py-2 px-3 text-right">{defSecundaria.labelCurto}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dataPoints.map((p) => (
                      <tr
                        key={p.key}
                        onClick={() => onPointClick(p, config, defPrimaria, defSecundaria)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-2 px-3 font-semibold text-gray-800">{p.label}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-[#00441F]">
                          {formatValor(p.valorPrimario, defPrimaria.tipoDado)}
                        </td>
                        {defSecundaria && (
                          <td className="py-2 px-3 text-right font-bold text-emerald-600">
                            {formatValor(p.valorSecundario, defSecundaria.tipoDado)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            Carregando gráfico...
          </div>
        )}
      </div>
    </div>
  );
}
