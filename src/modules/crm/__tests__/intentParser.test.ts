import { parseCommercialIntent, buildAssistantResponse } from '../intentParser';
import { CommercialRecommendation, CapacityAnalysis, LeadData } from '../recommendationEngine';

function testParser() {
  console.log('🧪 Testando novo interpretador de parceiros top produtores...');

  const mockLeads: LeadData[] = [
    {
      id: 'lead-1',
      nome: 'DALBETO BORBRA',
      totalNegocios: 2,
      volumeCredito: 400000,
    },
    {
      id: 'lead-2',
      nome: 'MATTR CONSORCIO',
      totalNegocios: 2,
      volumeCredito: 110000,
    },
    {
      id: 'lead-3',
      nome: 'SARTORI PLANOS E BENEFICIOS',
      totalNegocios: 1,
      volumeCredito: 0,
    },
  ];

  const mockRecommendations: CommercialRecommendation[] = [
    {
      id: 'rec-top-1',
      leadId: 'lead-1',
      leadNome: 'DALBETO BORBRA',
      tipo: 'reuniao',
      tipoLabel: 'Alinhamento Comercial',
      titulo: 'Alinhamento de Alta Produção - DALBETO BORBRA',
      descricao: 'Reunião estratégica',
      motivo: 'Top parceiro da carteira com R$ 400.000 em volume gerado',
      prioridade: 'alta',
      score: 99,
      dataSugerida: '2026-10-16T14:00:00Z',
      dataSugeridaFormatada: 'Sexta-feira, 16/10 às 14:00',
      duracaoEstimadaMinutos: 30,
      frenteComercial: 'F_TOP_PRODUTORES',
      referenciaTipo: 'oportunidade_crm',
    },
    {
      id: 'rec-top-2',
      leadId: 'lead-2',
      leadNome: 'MATTR CONSORCIO',
      tipo: 'reuniao',
      tipoLabel: 'Alinhamento Comercial',
      titulo: 'Alinhamento de Alta Produção - MATTR CONSORCIO',
      descricao: 'Reunião estratégica',
      motivo: 'Top parceiro da carteira com R$ 110.000 em volume gerado',
      prioridade: 'alta',
      score: 98,
      dataSugerida: '2026-10-16T15:30:00Z',
      dataSugeridaFormatada: 'Sexta-feira, 16/10 às 15:30',
      duracaoEstimadaMinutos: 30,
      frenteComercial: 'F_TOP_PRODUTORES',
      referenciaTipo: 'oportunidade_crm',
    },
  ];

  const mockCapacity: CapacityAnalysis = {
    date: '2026-10-15',
    isClosingPeriod: false,
    presencialMeetingsCount: 0,
    totalTasksCount: 1,
    capacityLevel: 'available',
    maxNewTasksAllowed: 7,
    allowedTipos: ['ligacao', 'whatsapp', 'reuniao', 'visita', 'email'],
    reason: 'Dia livre',
  };

  const mockStats = {
    totalPropostasParadas: 2,
    totalParceirosInativos: 3,
    totalOportunidadesCrm: 2,
    diasBloqueadosSemana: 0,
  };

  // Teste 1: Quero uma agenda com os parceiros que mais produzem
  const prompt1 = 'Quero uma agenda com os parceiros que mais produzem';
  const res1 = parseCommercialIntent(prompt1);
  console.log(`\n1. Prompt: "${prompt1}"`);
  console.log(`   -> Intenção: ${res1.intent} (Confiança: ${res1.confidence})`);
  const ans1 = buildAssistantResponse(res1, mockRecommendations, mockCapacity, mockStats, mockLeads);
  console.log(`   -> Mensagem Gerada:\n${ans1.messageText}\n`);
  console.log(`   -> Total Cards: ${ans1.filteredRecommendations.length}`);

  if (res1.intent === 'TOP_PRODUCERS' && ans1.filteredRecommendations.length > 0 && ans1.messageText.includes('DALBETO BORBRA')) {
    console.log('   ✅ PASSOU: Listou DALBETO BORBRA e trouxe cards!');
  } else {
    console.error('   ❌ FALHOU!');
    process.exit(1);
  }

  // Teste 2: Quero agenda com parceiro que tem mais negocio gerados
  const prompt2 = 'Quero agenda com parceiro que tem mais negocio gerados';
  const res2 = parseCommercialIntent(prompt2);
  console.log(`\n2. Prompt: "${prompt2}"`);
  console.log(`   -> Intenção: ${res2.intent} (Confiança: ${res2.confidence})`);
  const ans2 = buildAssistantResponse(res2, mockRecommendations, mockCapacity, mockStats, mockLeads);
  console.log(`   -> Total Cards: ${ans2.filteredRecommendations.length}`);

  if (res2.intent === 'TOP_PRODUCERS' && ans2.filteredRecommendations.length > 0) {
    console.log('   ✅ PASSOU: Detectou intenção e retornou cards!');
  } else {
    console.error('   ❌ FALHOU!');
    process.exit(1);
  }

  // Teste 3: Parceiro sem contato (não deve trazer parceiro com negócios ativos quando estes têm tarefas e propostas)
  const mockLeadsWithInactive: LeadData[] = [
    {
      id: 'lead-1',
      nome: 'DALBETO BORBRA',
      totalNegocios: 2,
      volumeCredito: 400000,
      totalPropostas: 1,
      totalTarefas: 1,
    },
    {
      id: 'lead-2',
      nome: 'MATTR CONSORCIO',
      totalNegocios: 2,
      volumeCredito: 110000,
      totalPropostas: 1,
      totalTarefas: 1,
    },
    {
      id: 'lead-sem-nada',
      nome: 'PARCEIRO ZERO PROPOSTA E TAREFA',
      totalNegocios: 0,
      volumeCredito: 0,
      totalPropostas: 0,
      totalTarefas: 0,
      etapa_funil: 'sem_contato',
    },
  ];

  const prompt3 = 'parceiro sem contato';
  const res3 = parseCommercialIntent(prompt3);
  console.log(`\n3. Prompt: "${prompt3}"`);
  console.log(`   -> Intenção: ${res3.intent} (Confiança: ${res3.confidence})`);
  const ans3 = buildAssistantResponse(res3, mockRecommendations, mockCapacity, mockStats, mockLeadsWithInactive);
  console.log(`   -> Mensagem Gerada:\n${ans3.messageText}\n`);
  console.log(`   -> Cards Retornados:`, ans3.filteredRecommendations.map(r => r.leadNome));

  const hasZeroDealsPartner = ans3.filteredRecommendations.some(r => r.leadNome === 'PARCEIRO ZERO PROPOSTA E TAREFA');

  if (res3.intent === 'PARTNERS_TODAY' && hasZeroDealsPartner) {
    console.log('   ✅ PASSOU: Retornou parceiro sem proposta/tarefa!');
  } else {
    console.error('   ❌ FALHOU no teste 3!');
    process.exit(1);
  }

  // Teste 4: "aqueles que nao gerei nenhuma oportunidade ou atividade"
  const prompt4 = 'quero aqueles que nao gerei nenhuma oportunidade ou atividade';
  const res4 = parseCommercialIntent(prompt4);
  console.log(`\n4. Prompt: "${prompt4}"`);
  console.log(`   -> Intenção: ${res4.intent}`);
  const ans4 = buildAssistantResponse(res4, mockRecommendations, mockCapacity, mockStats, mockLeadsWithInactive);

  if (res4.intent === 'PARTNERS_TODAY' && ans4.filteredRecommendations.every(r => r.leadNome === 'PARCEIRO ZERO PROPOSTA E TAREFA')) {
    console.log('   ✅ PASSOU: Entendeu linguagem natural sobre oportunidade/atividade não gerada!');
  } else {
    console.error('   ❌ FALHOU no teste 4!');
    process.exit(1);
  }

  // Teste 5: "Parceiro sem contato quero que inclua aqueles que nao gerei proposta ou nao teve nenhuma agenda de tarefas"
  const prompt5 = 'Parceiro sem contato quero que inclua aqueles que nao gerei proposta ou nao teve nenhuma agenda de tarefas';
  const res5 = parseCommercialIntent(prompt5);
  console.log(`\n5. Prompt: "${prompt5}"`);
  console.log(`   -> Intenção: ${res5.intent}`);

  const mockLeadsMisto: LeadData[] = [
    { id: '1', nome: 'COM PROPOSTA E COM TAREFA', totalPropostas: 2, totalTarefas: 3 },
    { id: '2', nome: 'SEM PROPOSTA E SEM TAREFA', totalPropostas: 0, totalTarefas: 0 },
    { id: '3', nome: 'COM PROPOSTA MAS SEM TAREFA', totalPropostas: 1, totalTarefas: 0 },
    { id: '4', nome: 'SEM PROPOSTA MAS COM TAREFA', totalPropostas: 0, totalTarefas: 2 },
  ];

  const ans5 = buildAssistantResponse(res5, [], mockCapacity, mockStats, mockLeadsMisto);
  console.log(`   -> Cards Retornados:`, ans5.filteredRecommendations.map(r => r.leadNome));

  const inclui2 = ans5.filteredRecommendations.some(r => r.leadNome === 'SEM PROPOSTA E SEM TAREFA');
  const inclui3 = ans5.filteredRecommendations.some(r => r.leadNome === 'COM PROPOSTA MAS SEM TAREFA');
  const inclui4 = ans5.filteredRecommendations.some(r => r.leadNome === 'SEM PROPOSTA MAS COM TAREFA');
  const naoInclui1 = !ans5.filteredRecommendations.some(r => r.leadNome === 'COM PROPOSTA E COM TAREFA');

  if (res5.intent === 'PARTNERS_TODAY' && inclui2 && inclui3 && inclui4 && naoInclui1) {
    console.log('   ✅ PASSOU: Incluiu corretamente parceiros sem proposta OU sem tarefa, e excluiu quem já tem ambos!');
  } else {
    console.error('   ❌ FALHOU no teste 5!');
    process.exit(1);
  }

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
}

testParser();
