"use client";

import React from "react";
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
  DashboardNegocio,
  DashboardTarefa,
  DataPointAnalysis,
  MetricaDefinicao
} from "../types";
import { formatBRL, formatShortBRL, formatValor, BRAND_CHART_PALETTE } from "../analyticsEngine";
import { Sparkles, Info, Eye } from "lucide-react";

interface AnalysisViewerProps {
  mounted: boolean;
  config: CustomAnalysisConfig;
  dataPoints: DataPointAnalysis[];
  totalPrimario: number;
  totalSecundario: number;
  defPrimaria: MetricaDefinicao;
  defSecundaria?: MetricaDefinicao;
  onPointClick: (ponto: DataPointAnalysis) => void;
}

const PIE_COLORS = BRAND_CHART_PALETTE;

export default function AnalysisViewer({
  mounted,
  config,
  dataPoints,
  totalPrimario,
  totalSecundario,
  defPrimaria,
  defSecundaria,
  onPointClick,
}: AnalysisViewerProps) {
  const isPrimariaMoeda = defPrimaria.tipoDado === "moeda";
  const isSecundariaMoeda = defSecundaria?.tipoDado === "moeda";

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-gray-200/70 space-y-6">
      {/* 1. Header do Gráfico com Totais em Destaque */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold text-[#00441F]">
              {config.titulo}
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
              Clique nos itens para detalhes (Drilldown)
            </span>
          </div>
          {config.descricao && (
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {config.descricao}
            </p>
          )}
        </div>

        {/* Resumo dos Totais Calculados */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-right">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">
              Total {defPrimaria.labelCurto}
            </span>
            <span className="text-base font-extrabold text-[#00441F]">
              {formatValor(totalPrimario, defPrimaria.tipoDado)}
            </span>
          </div>

          {defSecundaria && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-right">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                Total {defSecundaria.labelCurto}
              </span>
              <span className="text-base font-extrabold text-emerald-600">
                {formatValor(totalSecundario, defSecundaria.tipoDado)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visualização Selecionada */}
      <div className="w-full">
        {config.tipoGrafico === "table" ? (
          /* TABELA ANALÍTICA */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-800">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50/50">
                  <th className="py-3 px-4">Agrupamento</th>
                  <th className="py-3 px-4 text-right">{defPrimaria.label}</th>
                  {defSecundaria && (
                    <th className="py-3 px-4 text-right">{defSecundaria.label}</th>
                  )}
                  <th className="py-3 px-4 text-center">Registros de Origem</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataPoints.map((p) => (
                  <tr
                    key={p.key}
                    onClick={() => onPointClick(p)}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-gray-900 group-hover:text-emerald-700">
                      {p.label}
                      {p.subLabel && (
                        <span className="block text-[10px] font-normal text-gray-500">
                          {p.subLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-[#00441F]">
                      {formatValor(p.valorPrimario, defPrimaria.tipoDado)}
                    </td>
                    {defSecundaria && (
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                        {formatValor(p.valorSecundario, defSecundaria.tipoDado)}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                      {p.tarefas.length} tarefas • {p.negocios.length} negócios
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00CF7B] group-hover:underline">
                        <Eye className="w-3 h-3" /> Ver Detalhes
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRÁFICOS RECHARTS COM CLICK HANDLER */
          <div className="w-full h-88">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                {config.tipoGrafico === "composed" ? (
                  <ComposedChart
                    data={dataPoints}
                    margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        onPointClick(e.activePayload[0].payload as DataPointAnalysis);
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
                      label={{
                        value: defPrimaria.labelCurto,
                        angle: -90,
                        position: "insideLeft",
                        fill: defPrimaria.cor,
                        fontSize: 10,
                      }}
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
                        label={{
                          value: defSecundaria.labelCurto,
                          angle: 90,
                          position: "insideRight",
                          fill: defSecundaria.cor,
                          fontSize: 10,
                        }}
                      />
                    )}
                    <Tooltip
                      formatter={(val: any, name: any) => {
                        const isSecond = name === defSecundaria?.label;
                        const def = isSecond ? defSecundaria : defPrimaria;
                        return [formatValor(Number(val) || 0, def?.tipoDado || "numero"), name];
                      }}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="valorPrimario"
                      name={defPrimaria.label}
                      fill={defPrimaria.cor}
                      radius={[6, 6, 0, 0]}
                      barSize={28}
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
                        dot={{ r: 5, fill: "#ffffff", stroke: defSecundaria.cor, strokeWidth: 2 }}
                        activeDot={{ r: 7 }}
                        cursor="pointer"
                      />
                    )}
                  </ComposedChart>
                ) : config.tipoGrafico === "bar" ? (
                  <BarChart
                    data={dataPoints}
                    margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        onPointClick(e.activePayload[0].payload as DataPointAnalysis);
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
                    <Bar dataKey="valorPrimario" name={defPrimaria.label} fill={defPrimaria.cor} radius={[6, 6, 0, 0]} cursor="pointer" />
                    {defSecundaria && (
                      <Bar dataKey="valorSecundario" name={defSecundaria.label} fill={defSecundaria.cor} radius={[6, 6, 0, 0]} cursor="pointer" />
                    )}
                  </BarChart>
                ) : config.tipoGrafico === "line" ? (
                  <LineChart
                    data={dataPoints}
                    margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        onPointClick(e.activePayload[0].payload as DataPointAnalysis);
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
                    <Line type="monotone" dataKey="valorPrimario" name={defPrimaria.label} stroke={defPrimaria.cor} strokeWidth={3} dot={{ r: 5 }} cursor="pointer" />
                  </LineChart>
                ) : config.tipoGrafico === "area" ? (
                  <AreaChart
                    data={dataPoints}
                    margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        onPointClick(e.activePayload[0].payload as DataPointAnalysis);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={defPrimaria.cor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={defPrimaria.cor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
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
                    <Area type="monotone" dataKey="valorPrimario" name={defPrimaria.label} stroke={defPrimaria.cor} fill="url(#areaGrad)" strokeWidth={3} cursor="pointer" />
                  </AreaChart>
                ) : (
                  /* PIE CHART */
                  <PieChart>
                    <Pie
                      data={dataPoints}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="valorPrimario"
                      onClick={(e) => {
                        if (e && e.payload) onPointClick(e.payload as DataPointAnalysis);
                      }}
                      cursor="pointer"
                    >
                      {dataPoints.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        formatValor(Number(val) || 0, defPrimaria.tipoDado),
                        item.payload.label,
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Carregando análise...
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Rodapé de Insight & Conclusão */}
      <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#00CF7B] shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700">
          <span className="font-extrabold text-[#00441F] block">Leitura Analítica:</span>
          Esta análise examina a distribuição de <strong>{defPrimaria.label}</strong>
          {defSecundaria && (
            <> em cruzamento simultâneo com <strong>{defSecundaria.label}</strong></>
          )} agrupados por <strong>{config.agrupamento.replace("_", " ")}</strong>.
          Você pode clicar em qualquer barra, ponto ou linha para auditar os registros reais de tarefas e negócios.
        </div>
      </div>
    </div>
  );
}
