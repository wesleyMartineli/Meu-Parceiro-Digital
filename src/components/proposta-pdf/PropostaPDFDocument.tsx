import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { PropostaData } from "./CapaProposta";

// Registrando a fonte Montserrat
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aX8.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aX8.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aX8.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aX8.ttf', fontWeight: 700 }, // using 600 as fallback
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    fontFamily: "Montserrat",
  },
  // Capa Styles
  capaBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00441F',
  },
  capaContainer: {
    padding: 40,
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  capaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capaLogoBox: {
    backgroundColor: '#00CF7B',
    padding: 10,
    borderRadius: 8,
  },
  capaLogoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  capaTitleContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#00CF7B',
    paddingLeft: 20,
    marginBottom: 40,
  },
  capaTitle: {
    fontSize: 48,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  capaSubtitle: {
    fontSize: 16,
    color: '#d9dadc',
    marginTop: 10,
  },
  capaGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capaLabel: {
    fontSize: 10,
    color: '#d9dadc',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  capaValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Quem Somos Styles
  section: {
    padding: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  pageNumber: {
    backgroundColor: '#FFF0E6',
    color: '#00CF7B',
    padding: '4 12',
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00441F',
    marginBottom: 10,
  },
  sectionTitleHighlight: {
    color: '#00CF7B',
  },
  textBody: {
    fontSize: 10,
    color: '#585f6c',
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: 'left',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 20,
  },
  adminCard: {
    backgroundColor: '#E0E5CF',
    borderRadius: 8,
    padding: 15,
    width: '23%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e7e8ea',
  },
  adminCardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00441F',
  },
  diferencialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e7e8ea',
    marginBottom: 15,
  },
  diferencialTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00441F',
    marginBottom: 8,
  },
});

export interface PropostaPDFDocumentProps {
  data: PropostaData;
}

  // Helper formats
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  // Como Funciona Styles
  const page3Styles = StyleSheet.create({
    timelineRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 30 },
    timelineStep: { width: '22%' },
    stepIconBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#00CF7B', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    stepTitle: { fontSize: 11, fontWeight: 'bold', color: '#00441F', marginBottom: 5 },
    stepDesc: { fontSize: 9, color: '#585f6c', lineHeight: 1.4 },
    cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    bigCard: { width: '48%', borderWidth: 1, borderColor: '#e7e8ea', borderRadius: 8, padding: 20 },
    bigCardHighlight: { width: '48%', borderWidth: 1, borderColor: '#00CF7B', backgroundColor: '#FFF0E6', borderRadius: 8, padding: 20 },
    bigCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#00441F', marginBottom: 10 },
  });

  // Resumo Styles
  const page4Styles = StyleSheet.create({
    grid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    colMain: { width: '63%' },
    colSide: { width: '34%' },
    card: { borderWidth: 1, borderColor: '#e7e8ea', borderRadius: 8, padding: 15, marginBottom: 15, backgroundColor: '#ffffff' },
    cardDark: { backgroundColor: '#00441F', borderRadius: 8, padding: 15 },
    rowValue: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    label: { fontSize: 8, color: '#585f6c', textTransform: 'uppercase' },
    value: { textAlign: 'right', fontSize: 10, fontWeight: 'bold', color: '#00441F' },
    valueLaranja: { textAlign: 'right', fontSize: 10, fontWeight: 'bold', color: '#00CF7B' },
    totalLabel: { fontSize: 10, color: '#d9dadc', textTransform: 'uppercase' },
    totalValue: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginTop: 5 },
  });

export const PropostaPDFDocument = ({ data }: PropostaPDFDocumentProps) => {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 121, 0';
  };
  const cPrimaria = data.corPrimaria || '#00CF7B';
  const cSecundaria = `rgba(${hexToRgb(cPrimaria)}, 0.08)`;

  const basePath = typeof window !== 'undefined' ? window.location.origin : '';
  
  const getSegmentName = () => {
    if (!data.capaBgUrl) return 'Segmento';
    let name = data.capaBgUrl.split('/').pop() || '';
    name = name.replace('Capa Consorcio ', '').replace('Proposta ', '').replace('.png', '').replace('%20', ' ');
    return name;
  };

  return (
  <Document>
    {/* PAGE 1: CAPA */}
    <Page size="A4" style={styles.page}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        {data.capaBgUrl ? (
          <Image src={data.capaBgUrl} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
        ) : (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00441F' }} />
        )}
      </View>

      {/* OVERLAYS ABSOLUTOS DA CAPA */}
      
      {/* (O topo agora fica totalmente livre, pois a Representação desceu para o rodapé) */}

      {/* 2. Segmento */}
      <View style={{ position: 'absolute', bottom: 30, left: 25, width: 120, alignItems: 'center' }}>
        <Text style={{ color: '#e0e0e0', fontSize: 9, marginBottom: 4 }}>Segmento</Text>
        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>{getSegmentName().toUpperCase()}</Text>
      </View>

      {/* 3. Administradora Referência */}
      <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ color: '#e0e0e0', fontSize: 9, marginBottom: 4 }}>Administrado por</Text>
        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>{data.adminNome.toUpperCase()}</Text>
      </View>

      {/* 4. Data Emissão */}
      <View style={{ position: 'absolute', bottom: 30, right: 38, width: 120, alignItems: 'center' }}>
        <Text style={{ color: '#e0e0e0', fontSize: 9, marginBottom: 4 }}>Data Emissão</Text>
        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>{data.data}</Text>
      </View>

      {/* 5. Representação (Removido a pedido) */}
    </Page>

    {/* PAGE 2: QUEM SOMOS */}
    <Page size="A4" style={styles.page}>
      <View style={[styles.section, { paddingTop: 30, paddingBottom: 20 }]}>
        <View style={[styles.headerRow, { marginBottom: 20 }]}>
          <Text style={{ fontSize: 10, color: '#99a0af', textTransform: 'uppercase' }}>Quem Somos</Text>
          <Text style={[styles.pageNumber, { backgroundColor: cSecundaria, color: cPrimaria }]}>PÁGINA 2 DE 6</Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <View>
            <Text style={styles.sectionTitle}>Ser o parceiro{"\n"}<Text style={[styles.sectionTitleHighlight, { color: cPrimaria }]}>do próximo passo.</Text></Text>
            <Text style={styles.textBody}>Há mais de 55 anos, a Rodobens atua no mercado de consórcios com tradição e pioneirismo, ajudando pessoas e empresas a transformarem planejamento em conquistas.</Text>
            <Text style={styles.textBody}>Com uma estrutura sólida, atuação nacional e um amplo portfólio de soluções, a Rodobens oferece caminhos para quem deseja adquirir, construir, investir ou realizar novos projetos de forma planejada.</Text>
          </View>
        </View>

        <View style={{ marginTop: 15 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>Cota Administrada Por</Text>
          <View style={[styles.gridContainer, { marginTop: 10 }]}>
            <View style={[styles.adminCard, { backgroundColor: '#00441F' }]}><Text style={[styles.adminCardText, { color: '#ffffff' }]}>RODOBENS</Text></View>
          </View>
        </View>

        <View style={{ marginTop: 15 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>A força de quem entende de consórcio</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <View style={[styles.diferencialCard, { padding: 15, marginBottom: 10, backgroundColor: '#e9ebe4' }]}>
              <Text style={styles.diferencialTitle}>+ de 55 anos de experiência</Text>
              <Text style={styles.textBody}>Tradição e pioneirismo na administração de consórcios no Brasil.</Text>
            </View>
            <View style={[styles.diferencialCard, { padding: 15, marginBottom: 10, backgroundColor: '#e9ebe4' }]}>
              <Text style={styles.diferencialTitle}>+ de 510 mil bens entregues</Text>
              <Text style={styles.textBody}>Uma história construída ao lado de milhares de clientes e projetos realizados.</Text>
            </View>
            <View style={[styles.diferencialCard, { padding: 15, marginBottom: 10, backgroundColor: '#e9ebe4' }]}>
              <Text style={styles.diferencialTitle}>+ de R$ 14 bilhões administrados</Text>
              <Text style={styles.textBody}>Escala, experiência e estrutura para apoiar diferentes objetivos e momentos de vida.</Text>
            </View>
            <View style={[styles.diferencialCard, { padding: 15, marginBottom: 10, backgroundColor: '#e9ebe4' }]}>
              <Text style={styles.diferencialTitle}>Amplo portfólio de produtos</Text>
              <Text style={styles.textBody}>Soluções para automóveis, imóveis, motos, serviços e outros projetos.</Text>
            </View>
          </View>
        </View>
        
        {/* Slogan */}
        <View style={{ marginTop: 'auto', paddingTop: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: cPrimaria }}>Rodobens. Ser o parceiro do próximo passo.</Text>
        </View>
      </View>
    </Page>
    {/* PAGE 3: RESUMO DA OPERAÇÃO */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={{ fontSize: 10, color: '#99a0af', textTransform: 'uppercase' }}>Proposta Financeira</Text>
          <Text style={[styles.pageNumber, { backgroundColor: cSecundaria, color: cPrimaria }]}>PÁGINA 3 DE 6</Text>
        </View>

        <Text style={styles.sectionTitle}>Informações da Operação</Text>

        <View style={[page3Styles.bigCardHighlight, { width: '100%', borderColor: cPrimaria, backgroundColor: cSecundaria }]}>
          <Text style={page3Styles.bigCardTitle}>Visão Geral da Simulação</Text>
          <Text style={styles.textBody}>Detalhamento dos valores e condições para aquisição planejada.</Text>
        </View>

        <View style={page4Styles.grid}>
          <View style={page4Styles.colMain}>
            <View style={{ ...page4Styles.card, width: '100%' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 15 }}>PLANEJAMENTO COTA</Text>
              
              <View style={page4Styles.rowValue}>
                <Text style={page4Styles.label}>Crédito Bruto</Text>
                <Text style={page4Styles.value}>{formatCurrency(data.creditoBruto)}</Text>
              </View>
              <View style={page4Styles.rowValue}>
                <Text style={page4Styles.label}>Lance Embutido</Text>
                <Text style={page4Styles.value}>{formatCurrency(data.lanceEmbutido)}</Text>
              </View>
              <View style={page4Styles.rowValue}>
                <Text style={page4Styles.label}>Recursos Próprios</Text>
                <Text style={page4Styles.value}>{formatCurrency(data.recursosProprios)}</Text>
              </View>
              <View style={page4Styles.rowValue}>
                <Text style={page4Styles.label}>Lance Ofertado Total</Text>
                <Text style={page4Styles.value}>{formatCurrency(data.lanceOfertado)}</Text>
              </View>
            </View>

            {data.adminNome?.toLowerCase().includes("porto bank") ? (
              <>
                <View style={{ ...page4Styles.card, width: '100%', paddingVertical: 15 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: cPrimaria, marginBottom: 5 }}>CRÉDITO LÍQUIDO</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: cPrimaria }}>{formatCurrency(data.creditoLiquido)}</Text>
                </View>

                <View style={{ ...page4Styles.card, width: '100%', paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ width: '48%' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>PARCELA INICIAL (C/ ADESÃO)</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00441F', marginBottom: 2 }}>{formatCurrency(data.parcelaInicial)}</Text>
                    <Text style={{ fontSize: 8, color: '#585f6c' }}>Pós-Contemplação {formatCurrency(data.parcelaPosContemplacao)}</Text>
                  </View>
                  <View style={{ width: '48%' }}>
                    {data.parcelaPosAdesao ? (
                      <>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>PARCELA APÓS {data.prazoTaxaAdesao || 0}X DA ADESÃO</Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00441F', marginBottom: 2 }}>{formatCurrency(data.parcelaPosAdesao)}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>PARCELA NORMAL (SEM ADESÃO)</Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00441F', marginBottom: 2 }}>{formatCurrency(data.parcelaInicial)}</Text>
                      </>
                    )}
                  </View>
                </View>

                <View style={{ ...page4Styles.card, width: '100%' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 15 }}>DADOS TÉCNICOS</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '31%' }}>
                      <Text style={page4Styles.label}>Taxa Adm. Total</Text>
                      {data.temDescontoCampanha ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, textDecoration: 'line-through', color: '#888', marginRight: 4 }}>{data.taxaAdmin}%</Text>
                          <Text style={[page4Styles.value, { textAlign: 'left', color: '#00CF7B' }]}>{data.taxaAdmReal?.toFixed(2)}%</Text>
                        </View>
                      ) : (
                        <Text style={[page4Styles.value, { textAlign: 'left' }]}>{data.taxaAdmin}%</Text>
                      )}
                    </View>
                    <View style={{ width: '31%' }}>
                      <Text style={page4Styles.label}>Taxa Mensal</Text>
                      {data.temDescontoCampanha && data.taxaAdmReal && data.prazo ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, textDecoration: 'line-through', color: '#888', marginRight: 4 }}>{(data.taxaAdmin! / data.prazo).toFixed(2)}%</Text>
                          <Text style={[page4Styles.valueLaranja, { color: '#00CF7B', textAlign: 'left' }]}>{(data.taxaAdmReal / data.prazo).toFixed(2)}% A.M.</Text>
                        </View>
                      ) : (
                        <Text style={[page4Styles.valueLaranja, { color: cPrimaria, width: '100%', textAlign: 'left' }]}>{data.taxaAdmin && data.prazo ? (data.taxaAdmin / data.prazo).toFixed(2) : '0,00'}% A.M.</Text>
                      )}
                    </View>
                    <View style={{ width: '31%' }}>
                      <Text style={page4Styles.label}>Prazo</Text>
                      <Text style={[page4Styles.value, { textAlign: 'left' }]}>{data.prazo} meses</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ ...page4Styles.card, width: '48%', paddingVertical: 15 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: cPrimaria, marginBottom: 5 }}>CRÉDITO LÍQUIDO</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: cPrimaria }}>{formatCurrency(data.creditoLiquido)}</Text>
                  </View>

                  <View style={{ ...page4Styles.card, width: '48%', paddingVertical: 15 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>PARCELA INICIAL</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00441F', marginBottom: 2 }}>{formatCurrency(data.parcelaInicial)}</Text>
                    <Text style={{ fontSize: 8, color: '#585f6c' }}>Pós-Contemplação {formatCurrency(data.parcelaPosContemplacao)}</Text>
                  </View>
                </View>

                <View style={{ ...page4Styles.card, width: '100%' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 15 }}>DADOS TÉCNICOS</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '31%' }}>
                      <Text style={page4Styles.label}>Taxa Adm. Total</Text>
                      {data.temDescontoCampanha ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, textDecoration: 'line-through', color: '#888', marginRight: 4 }}>{data.taxaAdmin}%</Text>
                          <Text style={[page4Styles.value, { textAlign: 'left', color: '#00CF7B' }]}>{data.taxaAdmReal?.toFixed(2)}%</Text>
                        </View>
                      ) : (
                        <Text style={[page4Styles.value, { textAlign: 'left' }]}>{data.taxaAdmin}%</Text>
                      )}
                    </View>
                    <View style={{ width: '31%' }}>
                      <Text style={page4Styles.label}>Taxa Mensal</Text>
                      {data.temDescontoCampanha && data.taxaAdmReal && data.prazo ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, textDecoration: 'line-through', color: '#888', marginRight: 4 }}>{(data.taxaAdmin! / data.prazo).toFixed(2)}%</Text>
                          <Text style={[page4Styles.valueLaranja, { color: '#00CF7B', textAlign: 'left' }]}>{(data.taxaAdmReal / data.prazo).toFixed(2)}% A.M.</Text>
                        </View>
                      ) : (
                        <Text style={[page4Styles.valueLaranja, { color: cPrimaria, width: '100%', textAlign: 'left' }]}>{data.taxaAdmin && data.prazo ? (data.taxaAdmin / data.prazo).toFixed(2) : '0,00'}% A.M.</Text>
                      )}
                    </View>
                    <View style={{ width: '31%' }}>
                      <Text style={page4Styles.label}>Prazo</Text>
                      <Text style={[page4Styles.value, { textAlign: 'left' }]}>{data.prazo} meses</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={page4Styles.colSide}>
            <View style={page4Styles.card}>
              <Text style={page4Styles.label}>Dados do Grupo</Text>
              <View style={{ backgroundColor: '#f2f4f6', padding: 10, borderRadius: 5, marginTop: 10 }}>
                <Text style={{ fontSize: 8, color: '#585f6c', textTransform: 'uppercase' }}>Prazo Máximo do Grupo</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{data.prazo} meses</Text>
              </View>
            </View>

            <View style={[page4Styles.card, { backgroundColor: cSecundaria, borderColor: cPrimaria, marginBottom: 0 }]}>
              <Text style={[page4Styles.label, { color: cPrimaria }]}>Estimativa de Contemplação</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#00441F', marginVertical: 10 }}>{data.mesContemplacao}º mês</Text>
              <Text style={{ fontSize: 8, color: cPrimaria }}>*Sujeito a variações do grupo.</Text>
            </View>
          </View>
        </View>

        {/* Total Final Pago Banner Largo */}
        <View style={{ ...page4Styles.cardDark, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
          <View style={{ width: '60%' }}>
            <Text style={page4Styles.totalLabel}>Total Final Pago</Text>
            <Text style={{ fontSize: 7, color: '#d9dadc', marginTop: 5 }}>Valor base para fins de simulação. Consulte o memorial descritivo.</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'right' }}>
            {formatCurrency(data.totalFinal || ((data.parcelaInicial || 0) * (data.prazo || 0)))}
          </Text>
        </View>
      </View>
    </Page>
    {/* PAGE 4: ESTRATÉGIA DE LANCE */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={{ fontSize: 10, color: '#99a0af', textTransform: 'uppercase' }}>ESTRATÉGIA</Text>
          <Text style={[styles.pageNumber, { backgroundColor: cSecundaria, color: cPrimaria }]}>PÁGINA 4 DE 6</Text>
        </View>

        <Text style={styles.sectionTitle}>Estratégia de Lance</Text>
        <Text style={[styles.textBody, { fontSize: 10, textAlign: 'left' }]}>Uma alocação inteligente de recursos visando a aceleração da sua contemplação. Esta proposta foi desenhada para maximizar suas chances no curto prazo, equilibrando fluxo de caixa e competitividade no grupo.</Text>

        <View style={{ ...page4Styles.card, backgroundColor: '#f2f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#585f6c' }}>CRÉDITO LÍQUIDO DISPONÍVEL</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#00441F' }}>{formatCurrency(data.creditoLiquido)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <View style={{ ...page4Styles.card, width: '31%', backgroundColor: '#E0E5CF' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#585f6c', marginBottom: 20 }}>LANCE EMBUTIDO</Text>
            <Text style={{ fontSize: 10, color: '#99a0af', marginBottom: 5 }}>Valor da Carta Utilizado</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00441F' }}>{formatCurrency(data.lanceEmbutido)}</Text>
          </View>
          
          <View style={{ ...page4Styles.card, width: '31%', backgroundColor: '#E0E5CF' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#585f6c', marginBottom: 20 }}>RECURSOS PRÓPRIOS</Text>
            <Text style={{ fontSize: 10, color: '#99a0af', marginBottom: 5 }}>Capital imediato</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#00441F' }}>{formatCurrency(data.recursosProprios)}</Text>
          </View>

          <View style={{ ...page4Styles.card, width: '34%', backgroundColor: cPrimaria, borderColor: cPrimaria }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff', marginBottom: 20 }}>LANCE TOTAL OFERTADO</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(data.lanceOfertado)}</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 5, marginTop: 10, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 10, color: '#ffffff' }}>{data.lanceOfertadoPercentual?.toFixed(2) || '0.00'}% da Carta</Text>
            </View>
          </View>
        </View>

        <View style={{ borderLeftWidth: 4, borderLeftColor: cPrimaria, paddingLeft: 15, backgroundColor: '#E0E5CF', padding: 15, borderRadius: 5, marginTop: 10 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#00441F', marginBottom: 5 }}>RECOMENDAÇÃO ESTRATÉGICA</Text>
          <Text style={[styles.textBody, { fontSize: 9.5, textAlign: 'left' }]}>&quot;Nesta estratégia, parte da oferta é composta por lance embutido e parte por recursos próprios, aumentando a competitividade da operação e reduzindo a necessidade de capital imediato.&quot;</Text>
        </View>

        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00441F', marginTop: 30, marginBottom: 15 }}>IMPACTO NA CONTEMPLAÇÃO</Text>
        {(() => {
          let probabilidade = data.chancesOferta;
          const percentual = data.lanceOfertadoPercentual || 0;

          if (!probabilidade) {
            // Fallback se não usar a estimativa
            if (percentual >= 40) probabilidade = 'Alta';
            else if (percentual >= 25) probabilidade = 'Média';
            else probabilidade = 'Baixa';
          }

          let probColor = '#ef4444'; // Vermelho
          let barColors = [probColor, '#e7e8ea', '#e7e8ea'];

          if (probabilidade === 'Alta') {
            probColor = cPrimaria;
            barColors = [cPrimaria, cPrimaria, cPrimaria];
          } else if (probabilidade === 'Média') {
            probColor = '#f59e0b'; // Amarelo/Laranja
            barColors = [probColor, probColor, '#e7e8ea'];
          } else {
            probabilidade = 'Baixa';
          }

          return (
            <View style={page4Styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#00441F' }}>Probabilidade de Êxito</Text>
                  {data.mediaGrupo ? (
                    <Text style={{ fontSize: 10, color: '#585f6c', marginTop: 5 }}>
                      Baseado na média do grupo de {data.mediaGrupo}{data.isRodobens ? ' parcelas' : '%'} e na sua oferta de {data.ofertaAtualParaMedia}{data.isRodobens ? ' parcelas convertidas' : '%'}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 10, color: '#585f6c', marginTop: 5 }}>
                      Baseado no lance de {data.lanceOfertadoPercentual?.toFixed(2) || '0.00'}% ofertado
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: probColor }}>{probabilidade}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 15, height: 8, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ flex: 1, backgroundColor: barColors[0], marginRight: 2 }} />
                <View style={{ flex: 1, backgroundColor: barColors[1], marginRight: 2 }} />
                <View style={{ flex: 1, backgroundColor: barColors[2] }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <Text style={{ fontSize: 8, color: probabilidade === 'Baixa' ? probColor : '#99a0af', fontWeight: probabilidade === 'Baixa' ? 'bold' : 'normal' }}>Baixa</Text>
                <Text style={{ fontSize: 8, color: probabilidade === 'Média' ? probColor : '#99a0af', fontWeight: probabilidade === 'Média' ? 'bold' : 'normal' }}>Média</Text>
                <Text style={{ fontSize: 8, color: probabilidade === 'Alta' ? probColor : '#99a0af', fontWeight: probabilidade === 'Alta' ? 'bold' : 'normal' }}>Alta</Text>
              </View>
            </View>
          );
        })()}
      </View>
    </Page>

    {/* PAGE 5: OPERAÇÃO COMPLETA (RESUMO EXECUTIVO) */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={{ fontSize: 10, color: '#99a0af', textTransform: 'uppercase' }}>OPERAÇÃO COMPLETA</Text>
          <Text style={[styles.pageNumber, { backgroundColor: cSecundaria, color: cPrimaria }]}>PÁGINA 5 DE 6</Text>
        </View>

        <Text style={styles.sectionTitle}>Resumo Executivo da Operação</Text>
        <Text style={[styles.textBody, { fontSize: 10, textAlign: 'left', marginBottom: 15 }]}>Visão consolidada da sua estrutura de consórcio, contemplando detalhes do crédito, parcelamento e a estratégia de lance.</Text>

        {/* Bloco Superior: Créditos */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ ...page4Styles.card, width: '48%', backgroundColor: '#00441F' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 }}>CRÉDITO BRUTO</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(data.creditoBruto)}</Text>
          </View>
          <View style={{ ...page4Styles.card, width: '48%', backgroundColor: cPrimaria, borderColor: cPrimaria }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 }}>CRÉDITO LÍQUIDO DISPONÍVEL</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(data.creditoLiquido)}</Text>
          </View>
        </View>

        {/* Bloco Central: Lance e Parcelas */}
        <View style={{ ...page4Styles.card, width: '100%', marginBottom: 10, backgroundColor: '#f2f4f6' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00441F', marginBottom: 15 }}>ESTRUTURA DA OFERTA E PAGAMENTO</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#585f6c', marginBottom: 5 }}>LANCE TOTAL OFERTADO</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00441F' }}>{formatCurrency(data.lanceOfertado)}</Text>
              <Text style={{ fontSize: 8, color: '#99a0af', marginTop: 2 }}>{data.lanceOfertadoPercentual?.toFixed(2) || '0.00'}% da Carta</Text>
              
              <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 15 }}>
                <View>
                  <Text style={{ fontSize: 8, color: '#585f6c' }}>Embutido</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.lanceEmbutido)}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 8, color: '#585f6c' }}>Rec. Próprios</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.recursosProprios)}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: '48%', borderLeftWidth: 1, borderLeftColor: '#d9dadc', paddingLeft: 15 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#585f6c', marginBottom: 5 }}>PARCELA INICIAL</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00441F' }}>{formatCurrency(data.parcelaInicial)}</Text>
              <Text style={{ fontSize: 8, color: '#99a0af', marginTop: 2 }}>Pós-Contemplação: {formatCurrency(data.parcelaPosContemplacao)}</Text>

              {data.parcelaPosAdesao ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 8, color: '#585f6c' }}>Após {data.prazoTaxaAdesao || 0}x adesão</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(data.parcelaPosAdesao)}</Text>
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 8, color: '#585f6c' }}>Prazo Total</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.prazo} meses</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bloco Inferior: Probabilidade e Resumo */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '58%' }}>
            {(() => {
              let probabilidade = data.chancesOferta;
              const percentual = data.lanceOfertadoPercentual || 0;
              if (!probabilidade) {
                if (percentual >= 40) probabilidade = 'Alta';
                else if (percentual >= 25) probabilidade = 'Média';
                else probabilidade = 'Baixa';
              }
              let probColor = '#ef4444'; 
              let barColors = [probColor, '#e7e8ea', '#e7e8ea'];
              if (probabilidade === 'Alta') { probColor = cPrimaria; barColors = [cPrimaria, cPrimaria, cPrimaria]; }
              else if (probabilidade === 'Média') { probColor = '#f59e0b'; barColors = [probColor, probColor, '#e7e8ea']; }
              else { probabilidade = 'Baixa'; }

              return (
                <View style={page4Styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00441F' }}>Probabilidade de Êxito</Text>
                      <Text style={{ fontSize: 8, color: '#585f6c', marginTop: 5 }}>
                        {data.mediaGrupo ? `Baseado na média do grupo e oferta atual.` : `Baseado no lance de ${percentual.toFixed(2)}%`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: probColor }}>{probabilidade}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 10, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ flex: 1, backgroundColor: barColors[0], marginRight: 2 }} />
                    <View style={{ flex: 1, backgroundColor: barColors[1], marginRight: 2 }} />
                    <View style={{ flex: 1, backgroundColor: barColors[2] }} />
                  </View>
                </View>
              );
            })()}
          </View>

          <View style={{ width: '38%' }}>
            <View style={{ ...page4Styles.card, backgroundColor: cSecundaria, borderColor: cPrimaria, marginBottom: 10, padding: 12 }}>
              <Text style={[page4Styles.label, { color: cPrimaria }]}>Estimativa</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#00441F', marginVertical: 5 }}>{data.mesContemplacao}º mês</Text>
            </View>
            <View style={{ ...page4Styles.cardDark, padding: 12 }}>
              <Text style={{ fontSize: 8, color: '#d9dadc' }}>Total Final Pago</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', marginTop: 2 }}>{formatCurrency(data.totalFinal || ((data.parcelaInicial || 0) * (data.prazo || 0)))}</Text>
            </View>
          </View>
        </View>
      </View>
    </Page>

    {/* PAGE 6: PRÓXIMOS PASSOS */}
    <Page size="A4" style={styles.page}>
      <View style={{ ...styles.section, justifyContent: 'space-between' }}>
        <View>
          <View style={styles.headerRow}>
            <Text style={{ fontSize: 10, color: '#99a0af', textTransform: 'uppercase' }}>FORMALIZAÇÃO</Text>
            <Text style={[styles.pageNumber, { backgroundColor: cSecundaria, color: cPrimaria }]}>PÁGINA 6 DE 6</Text>
          </View>

          <Text style={{ ...styles.sectionTitle, textAlign: 'center' }}>Próximo passo para avançar com sua estratégia</Text>
          <Text style={{ ...styles.textBody, textAlign: 'center', paddingHorizontal: 40, marginBottom: 30 }}>Revisamos cuidadosamente seu cenário e estruturamos uma solução de consórcio que alinha previsibilidade financeira com alto poder de alavancagem.</Text>

          <View style={{ borderWidth: 1, borderColor: cPrimaria, borderRadius: 8, padding: 20, marginBottom: 30 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00441F', marginBottom: 15 }}>Resumo Estratégico</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <View>
                <Text style={{ fontSize: 8, color: '#585f6c', textTransform: 'uppercase' }}>Categoria</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.produto}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 8, color: '#585f6c', textTransform: 'uppercase' }}>Administradora</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.adminNome}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 8, color: '#585f6c', textTransform: 'uppercase' }}>Crédito Líquido</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{formatCurrency(data.creditoLiquido)}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 8, color: cPrimaria, textTransform: 'uppercase' }}>Parcela Inicial</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: cPrimaria }}>{formatCurrency(data.parcelaInicial)}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: cSecundaria, padding: 10, borderRadius: 5 }}>
              <Text style={{ fontSize: 10, color: cPrimaria, fontWeight: 'bold' }}>Esta estratégia foi desenhada para maximizar suas chances de contemplação mantendo a parcela dentro de uma margem segura de fluxo de caixa.</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'column' }}>
            <View style={{ ...page4Styles.card, width: '100%', backgroundColor: '#E0E5CF', marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#00441F', marginBottom: 5 }}>Gerente de Negócios</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: cPrimaria, marginBottom: 5 }}>{data.gerenteNome}</Text>
                <Text style={{ fontSize: 12, color: '#585f6c', marginTop: 10 }}>Data: {data.data}</Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                {data.empresaLogo && (
                  <View style={{ width: 70, height: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', marginBottom: 5 }}>
                    <Image src={data.empresaLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </View>
                )}
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#00441F' }}>{data.empresaNome}</Text>
                <Text style={{ fontSize: 8, color: '#585f6c', marginTop: 2 }}>Parceiro Autorizado Rodobens</Text>
              </View>
            </View>

            <View style={{ ...page4Styles.card, width: '100%', backgroundColor: cPrimaria, borderColor: cPrimaria, paddingVertical: 30 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 }}>Vamos avançar com essa estratégia?</Text>
              <Text style={{ fontSize: 14, color: '#ffffff', lineHeight: 1.5 }}>Seu próximo passo é confirmar o interesse para iniciarmos o processo de reserva da cota no grupo selecionado.</Text>
            </View>
          </View>
        </View>

        {/* Aviso Legal de Responsabilidade */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#e7e8ea', paddingTop: 15, marginTop: 20 }}>
          <Text style={{ fontSize: 7, color: '#99a0af', textAlign: 'justify', lineHeight: 1.3 }}>
            AVISO: Ao gerar esta proposta, o usuário declara que os dados, taxas, prazos e informações comerciais foram inseridos sob sua responsabilidade. O sistema atua apenas como ferramenta de cálculo estimativo e não representa qualquer administradora direta de consórcio.
          </Text>
        </View>
      </View>
    </Page>
  </Document>
  );
};

