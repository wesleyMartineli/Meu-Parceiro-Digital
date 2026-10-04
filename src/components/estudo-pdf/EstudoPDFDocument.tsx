import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { EstudoOperacoesResult } from "@/core/calculator/estudosEngine";
import { CotaResult } from "@/core/calculator/types";

// ─── Fonte ───────────────────────────────────────────────────────────────────
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aX8.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aX8.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aX8.ttf', fontWeight: 700 },
  ]
});

// ─── Estilos ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { fontFamily: 'Montserrat', backgroundColor: '#ffffff', flexDirection: 'column' },
  // Capa
  capaPage: { fontFamily: 'Montserrat', backgroundColor: '#00441F', flexDirection: 'column', padding: 40 },
  capaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 },
  capaLogoBox: { backgroundColor: '#00CF7B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  capaLogoText: { color: '#ffffff', fontSize: 16, fontWeight: 700 },
  capaData: { color: '#d9dadc', fontSize: 9 },
  capaTitleBorder: { borderLeftWidth: 4, borderLeftColor: '#00CF7B', paddingLeft: 20, marginBottom: 50 },
  capaTitleMain: { color: '#ffffff', fontSize: 42, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1 },
  capaTitleSub: { color: '#00CF7B', fontSize: 20, fontWeight: 700, marginTop: 6 },
  capaDesc: { color: '#d9dadc', fontSize: 11, marginTop: 10, lineHeight: 1.4 },
  capaGlass: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 24,
    flexDirection: 'row', justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  capaGlassItem: { alignItems: 'center' },
  capaGlassLabel: { color: '#d9dadc', fontSize: 8, textTransform: 'uppercase', marginBottom: 4 },
  capaGlassValue: { color: '#ffffff', fontSize: 15, fontWeight: 700 },
  capaGlassValueGreen: { color: '#00CF7B', fontSize: 15, fontWeight: 700 },
  capaFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  capaFooterText: { color: '#d9dadc', fontSize: 9 },
  // Seção genérica
  section: { padding: 36 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { backgroundColor: '#E0E5CF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#00441F', fontSize: 8, fontWeight: 700 },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: '#00441F', marginBottom: 4 },
  sectionTitleGreen: { color: '#00CF7B' },
  separator: { height: 2, backgroundColor: '#E0E5CF', marginVertical: 16 },
  // Cards
  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  card: { flex: 1, borderWidth: 1, borderColor: '#E0E5CF', borderRadius: 10, padding: 14, backgroundColor: '#ffffff' },
  cardDark: { flex: 1, borderRadius: 10, padding: 14, backgroundColor: '#00441F' },
  cardLabel: { fontSize: 7, color: '#666', textTransform: 'uppercase', marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: 700, color: '#00441F' },
  cardValueGreen: { fontSize: 14, fontWeight: 700, color: '#00CF7B' },
  cardValueWhite: { fontSize: 14, fontWeight: 700, color: '#ffffff' },
  cardLabelWhite: { fontSize: 7, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 4 },
  // Tabela
  tableHeader: { flexDirection: 'row', backgroundColor: '#00441F', borderRadius: 6, padding: 8, marginBottom: 2 },
  tableHeaderText: { color: '#ffffff', fontSize: 7, fontWeight: 700, flex: 1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 7, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowAlt: { flexDirection: 'row', padding: 7, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#f9fafb' },
  tableRowHL: { flexDirection: 'row', padding: 7, borderBottomWidth: 1, borderBottomColor: '#e0f5eb', backgroundColor: '#e8f8f0' },
  tableCell: { flex: 1, fontSize: 7, color: '#333', textAlign: 'center' },
  tableCellGreen: { flex: 1, fontSize: 7, color: '#00441F', fontWeight: 700, textAlign: 'center' },
  tableCellBlue: { flex: 1, fontSize: 7, color: '#1d4ed8', fontWeight: 700, textAlign: 'center' },
  // Cota card
  cotaCard: { borderWidth: 1, borderColor: '#E0E5CF', borderRadius: 10, padding: 14, marginBottom: 10, backgroundColor: '#ffffff' },
  cotaCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cotaCardTitle: { fontSize: 12, fontWeight: 700, color: '#00441F' },
  cotaBadge: { backgroundColor: '#00441F', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  cotaBadgeText: { color: '#ffffff', fontSize: 7, fontWeight: 700 },
  cotaModalBadge: { backgroundColor: '#E0E5CF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  cotaModalText: { color: '#00441F', fontSize: 7, fontWeight: 700 },
  cotaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cotaRowLabel: { fontSize: 8, color: '#666' },
  cotaRowValue: { fontSize: 8, fontWeight: 700, color: '#00441F' },
  // Timeline
  timelineContainer: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, justifyContent: 'space-between' },
  timelineItem: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#00CF7B', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  timelineDotText: { color: '#ffffff', fontSize: 8, fontWeight: 700 },
  timelineLabel: { fontSize: 7, color: '#00441F', fontWeight: 700, textAlign: 'center' },
  timelineSub: { fontSize: 6, color: '#666', textAlign: 'center', marginTop: 2 },
  timelineMonthBadge: { backgroundColor: '#E0E5CF', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginTop: 3 },
  timelineMonthText: { fontSize: 6, color: '#00441F', fontWeight: 700 },
  timelineLine: { position: 'absolute', top: 14, left: '10%', right: '10%', height: 2, backgroundColor: '#E0E5CF' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBRL = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtMesAno = (d: Date) =>
  new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

const MODALIDADE_LABEL: Record<string, string> = {
  linear: 'Linear (100%)',
  linear_70: 'Linear 70%',
  reducao_50: 'Redução 50%',
  degrau: 'Degrau',
  degrau_70: 'Degrau 70%',
};

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface EstudoPDFData {
  leadNome: string;
  adminNome: string;
  empresaNome: string;
  gerenteNome: string;
  empresaLogo?: string;
  produto: string;
  dataInicio: string;   // "YYYY-MM"
  cotasInput: {
    label: string;
    grupo: string;
    credito: number;
    prazo: number;
    modalidade: string;
    taxaAdm: number;
    mesContemplacao: number;
  }[];
  resultado: EstudoOperacoesResult;
  data: string; // data de emissão formatada
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const EstudoPDFDocument = ({ data }: { data: EstudoPDFData }) => {
  const { resultado, cotasInput } = data;
  const { resumo, timeline, cotas } = resultado;

  // Somente meses relevantes para tabela (contemplações +/- 1 mês, início e fim)
  const mesesContemplacao = cotasInput.map(c => c.mesContemplacao);
  const timelineFiltrada = timeline.filter((t) => {
    const isCont = mesesContemplacao.includes(t.mes);
    const isNear = mesesContemplacao.some(m => Math.abs(m - t.mes) <= 1);
    return isCont || isNear || t.mes <= 2 || t.mes >= timeline.length - 1;
  });

  const cotasOrdenadas = [...cotasInput].sort((a, b) => a.mesContemplacao - b.mesContemplacao);

  return (
    <Document>

      {/* ══════════════════════════════════════
          PÁGINA 1 — CAPA
      ══════════════════════════════════════ */}
      <Page size="A4" style={s.capaPage}>
        {/* Topo */}
        <View style={s.capaTopo}>
          {data.empresaLogo ? (
            <Image src={data.empresaLogo} style={{ maxHeight: 35, maxWidth: 140, objectFit: 'contain' }} />
          ) : (
            <View />
          )}
          <Text style={s.capaData}>Emitido em {data.data}</Text>
        </View>

        {/* Título */}
        <View style={s.capaTitleBorder}>
          <Text style={s.capaTitleMain}>Estudo de{'\n'}Operações</Text>
          <Text style={s.capaTitleSub}>Estratégia em Degrau</Text>
          <Text style={s.capaDesc}>
            Simulação de múltiplas cotas com contemplações distribuídas{'\n'}
            ao longo do tempo para maximizar o crédito do parceiro.
          </Text>
        </View>

        {/* Cards de resumo */}
        <View style={s.capaGlass}>
          <View style={s.capaGlassItem}>
            <Text style={s.capaGlassLabel}>Crédito Bruto Total</Text>
            <Text style={s.capaGlassValueGreen}>{fmtBRL(resumo.creditoBrutoTotal)}</Text>
          </View>
          <View style={s.capaGlassItem}>
            <Text style={s.capaGlassLabel}>Crédito Líquido</Text>
            <Text style={s.capaGlassValue}>{fmtBRL(resumo.creditoLiquidoTotal)}</Text>
          </View>
          <View style={s.capaGlassItem}>
            <Text style={s.capaGlassLabel}>Qtd. Cotas</Text>
            <Text style={s.capaGlassValue}>{cotasInput.length}</Text>
          </View>
          <View style={s.capaGlassItem}>
            <Text style={s.capaGlassLabel}>Prazo</Text>
            <Text style={s.capaGlassValue}>{resumo.prazoContratacao} meses</Text>
          </View>
        </View>

        {/* Rodapé */}
        <View style={s.capaFooter}>
          <Text style={s.capaFooterText}>Parceiro: {data.leadNome}</Text>
          <Text style={s.capaFooterText}>Gerente de Negócios: {data.gerenteNome}</Text>
          <Text style={s.capaFooterText}>Administradora: {data.adminNome}</Text>
        </View>
      </Page>

      {/* ══════════════════════════════════════
          PÁGINA 2 — RESUMO DA OPERAÇÃO
      ══════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          <View style={s.headerRow}>
            <Text style={{ fontSize: 9, color: '#99a0af', textTransform: 'uppercase' }}>Resumo da Operação</Text>
            <View style={s.badge}><Text style={s.badgeText}>PÁGINA 2</Text></View>
          </View>

          <Text style={s.sectionTitle}>
            Visão <Text style={s.sectionTitleGreen}>Consolidada</Text>
          </Text>
          <View style={s.separator} />

          {/* Cards de totais */}
          <View style={s.cardRow}>
            <View style={s.card}>
              <Text style={s.cardLabel}>Crédito Bruto Total</Text>
              <Text style={s.cardValueGreen}>{fmtBRL(resumo.creditoBrutoTotal)}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Crédito Líquido Total</Text>
              <Text style={s.cardValue}>{fmtBRL(resumo.creditoLiquidoTotal)}</Text>
            </View>
          </View>
          <View style={s.cardRow}>
            <View style={s.card}>
              <Text style={s.cardLabel}>Lance Próprio Total</Text>
              <Text style={s.cardValue}>{fmtBRL(resumo.lanceProprioTotal)}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Lance Embutido Total</Text>
              <Text style={s.cardValue}>{fmtBRL(resumo.lanceEmbutidoTotal)}</Text>
            </View>
          </View>

          <View style={s.separator} />

          {/* Linha do tempo das contemplações */}
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#00441F', marginBottom: 8 }}>
            Linha do Tempo das Contemplações
          </Text>
          <View style={{ position: 'relative' }}>
            <View style={s.timelineLine} />
            <View style={s.timelineContainer}>
              {cotasOrdenadas.map((cota, idx) => {
                const [ano, mesStr] = data.dataInicio.split('-').map(Number);
                const dataCont = new Date(ano, mesStr - 1 + cota.mesContemplacao - 1, 1);
                return (
                  <View key={idx} style={s.timelineItem}>
                    <View style={s.timelineDot}>
                      <Text style={s.timelineDotText}>{idx + 1}</Text>
                    </View>
                    <Text style={s.timelineLabel}>{cota.label}</Text>
                    <Text style={s.timelineSub}>{MODALIDADE_LABEL[cota.modalidade] || cota.modalidade}</Text>
                    <View style={s.timelineMonthBadge}>
                      <Text style={s.timelineMonthText}>Mês {cota.mesContemplacao}</Text>
                    </View>
                    <Text style={[s.timelineSub, { marginTop: 2 }]}>{fmtMesAno(dataCont)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={s.separator} />

          {/* Evolução das parcelas */}
          <Text style={{ fontSize: 12, fontWeight: 700, color: '#00441F', marginBottom: 10 }}>
            Evolução das Parcelas Mensais
          </Text>
          {cotasOrdenadas.map((cota, idx) => {
            const mesParcela = cota.mesContemplacao + 1;
            const parcelaEntry = timeline.find(t => t.mes === mesParcela);
            return (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                <Text style={{ fontSize: 8, color: '#555' }}>Após contemplação de {cota.label} (Mês {cota.mesContemplacao}):</Text>
                <Text style={{ fontSize: 8, fontWeight: 700, color: '#d97706' }}>
                  {parcelaEntry ? fmtBRL(parcelaEntry.parcelaMes) : '–'}
                </Text>
              </View>
            );
          })}
        </View>
      </Page>

      {/* ══════════════════════════════════════
          PÁGINA 3 — PROJEÇÃO DE ENTREGA (DEGRAU)
      ══════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          <View style={s.headerRow}>
            <Text style={{ fontSize: 9, color: '#99a0af', textTransform: 'uppercase' }}>Projeção de Entrega</Text>
            <View style={s.badge}><Text style={s.badgeText}>PÁGINA 3</Text></View>
          </View>

          <Text style={s.sectionTitle}>
            Tabela <Text style={s.sectionTitleGreen}>Mês a Mês</Text>
          </Text>
          <Text style={{ fontSize: 8, color: '#666', marginBottom: 10 }}>
            ★ Meses marcados indicam contemplação de uma das cotas.
          </Text>

          {/* Tabela */}
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderText}>Mês</Text>
            <Text style={s.tableHeaderText}>Data</Text>
            <Text style={s.tableHeaderText}>Crédito Bruto</Text>
            <Text style={s.tableHeaderText}>Crédito Líquido</Text>
            <Text style={s.tableHeaderText}>Rec. Próprios</Text>
            <Text style={s.tableHeaderText}>Parcela Total</Text>
          </View>

          {timelineFiltrada.map((t, idx) => {
            const isContMonth = mesesContemplacao.includes(t.mes);
            const rowStyle = isContMonth ? s.tableRowHL : idx % 2 === 0 ? s.tableRow : s.tableRowAlt;
            return (
              <View key={t.mes} style={rowStyle}>
                <Text style={isContMonth ? s.tableCellGreen : s.tableCell}>
                  {isContMonth ? '★ ' : ''}{t.mes}º
                </Text>
                <Text style={s.tableCell}>{fmtMesAno(new Date(t.anoMes))}</Text>
                <Text style={isContMonth ? s.tableCellGreen : s.tableCell}>
                  {t.creditoBrutoMes ? fmtBRL(t.creditoBrutoMes) : '–'}
                </Text>
                <Text style={isContMonth ? s.tableCellGreen : s.tableCell}>
                  {t.creditoLiquidoMes ? fmtBRL(t.creditoLiquidoMes) : '–'}
                </Text>
                <Text style={isContMonth ? s.tableCellBlue : s.tableCell}>
                  {t.recursosPropriosMes ? fmtBRL(t.recursosPropriosMes) : '–'}
                </Text>
                <Text style={[s.tableCell, { fontWeight: 700 }]}>{fmtBRL(t.parcelaMes)}</Text>
              </View>
            );
          })}
        </View>
      </Page>

      {/* ══════════════════════════════════════
          PÁGINA 4 — DETALHE DE CADA COTA
      ══════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.section}>
          <View style={s.headerRow}>
            <Text style={{ fontSize: 9, color: '#99a0af', textTransform: 'uppercase' }}>Detalhamento das Cotas</Text>
            <View style={s.badge}><Text style={s.badgeText}>PÁGINA 4</Text></View>
          </View>

          <Text style={s.sectionTitle}>
            Cotas da <Text style={s.sectionTitleGreen}>Operação</Text>
          </Text>
          <View style={s.separator} />

          {cotasInput.map((cota, idx) => {
            const resCota: CotaResult | undefined = cotas[idx];
            if (!resCota) return null;
            return (
              <View key={idx} style={s.cotaCard}>
                <View style={s.cotaCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.cotaCardTitle}>{cota.label}</Text>
                    {cota.grupo ? (
                      <View style={s.cotaModalBadge}>
                        <Text style={s.cotaModalText}>Grupo {cota.grupo}</Text>
                      </View>
                    ) : null}
                    <View style={s.cotaModalBadge}>
                      <Text style={s.cotaModalText}>{MODALIDADE_LABEL[cota.modalidade] || cota.modalidade}</Text>
                    </View>
                  </View>
                  <View style={s.cotaBadge}>
                    <Text style={s.cotaBadgeText}>🎯 Mês {cota.mesContemplacao}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 20 }}>
                  <View style={{ flex: 1 }}>
                    {[
                      ['Crédito Bruto', fmtBRL(resCota.creditoBruto)],
                      ['Crédito Líquido', fmtBRL(resCota.creditoLiquido)],
                      ['Prazo', `${cota.prazo} meses`],
                      ['Taxa ADM', `${cota.taxaAdm}%`],
                    ].map(([label, val]) => (
                      <View key={label} style={s.cotaRow}>
                        <Text style={s.cotaRowLabel}>{label}</Text>
                        <Text style={s.cotaRowValue}>{val}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    {[
                      ['Parcela Inicial', fmtBRL(resCota.parcelaInicial)],
                      ['Parcela Final', fmtBRL(resCota.parcelaFinal)],
                      ['Lance Total', fmtBRL(resCota.lanceTotalReais)],
                      ['Lance Embutido', fmtBRL(resCota.lanceEmbutidoReais)],
                    ].map(([label, val]) => (
                      <View key={label} style={s.cotaRow}>
                        <Text style={s.cotaRowLabel}>{label}</Text>
                        <Text style={s.cotaRowValue}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Page>

    </Document>
  );
};
