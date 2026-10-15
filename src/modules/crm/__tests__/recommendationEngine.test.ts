import {
  analyzeDateCapacity,
  checkIsClosingPeriod,
  generateCommercialRecommendations,
  ExistingTask,
  LeadData,
  PropostaData,
} from '../recommendationEngine';

function runTests() {
  console.log('🧪 Iniciando testes do Motor de Recomendações e Capacidade...');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${desc}`);
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  // 1. Teste de Período de Fechamento
  const day20 = new Date(2026, 9, 20); // 20 de outubro
  const day26 = new Date(2026, 9, 26); // 26 de outubro
  assert(!checkIsClosingPeriod(day20, { startDayOfMonth: 24 }), 'Dia 20 NÃO deve ser período de fechamento');
  assert(checkIsClosingPeriod(day26, { startDayOfMonth: 24 }), 'Dia 26 DEVE ser período de fechamento');

  // 2. Teste de Capacidade: Dia sem reuniões presenciais
  const tasksEmpty: ExistingTask[] = [];
  const capEmpty = analyzeDateCapacity(day20, tasksEmpty, { startDayOfMonth: 24 });
  assert(capEmpty.capacityLevel === 'available', 'Dia sem reuniões presenciais deve ser "available"');
  assert(capEmpty.maxNewTasksAllowed > 0, 'Dia livre deve permitir novas tarefas');
  assert(capEmpty.allowedTipos.includes('visita'), 'Dia livre deve permitir visitas');

  // 3. Teste de Capacidade: Dia com 1 reunião presencial
  const tasksOnePresencial: ExistingTask[] = [
    {
      id: '1',
      titulo: 'Visita Comercial na Concessionária',
      data_followup: '2026-10-20T14:00:00Z',
      status: 'pendente',
      tipo: 'visita',
    },
  ];
  const capOne = analyzeDateCapacity(day20, tasksOnePresencial, { startDayOfMonth: 24 });
  assert(capOne.capacityLevel === 'restricted', 'Dia com 1 reunião presencial deve ser "restricted"');
  assert(!capOne.allowedTipos.includes('visita'), 'Dia com 1 visita não deve recomendar mais visitas');
  assert(capOne.maxNewTasksAllowed <= 2, 'Dia com 1 visita deve ter cota de tarefas reduzida');

  // 4. Teste de Capacidade: Dia com 2 reuniões presenciais (BLOQUEADO)
  const tasksTwoPresencial: ExistingTask[] = [
    {
      id: '1',
      titulo: 'Visita Comercial Pela Manhã',
      data_followup: '2026-10-20T10:00:00Z',
      status: 'pendente',
      tipo: 'visita',
    },
    {
      id: '2',
      titulo: 'Reunião Presencial com Diretoria Parceiro',
      data_followup: '2026-10-20T15:00:00Z',
      status: 'pendente',
      tipo: 'reuniao',
      descricao: 'Alinhamento presencial de metas',
    },
  ];
  const capTwo = analyzeDateCapacity(day20, tasksTwoPresencial, { startDayOfMonth: 24 });
  assert(capTwo.capacityLevel === 'blocked', 'Dia com 2 reuniões presenciais deve ser "blocked"');
  assert(capTwo.maxNewTasksAllowed === 0, 'Dia com 2 reuniões presenciais NÃO deve aceitar novas tarefas (0 permitidas)');
  assert(capTwo.allowedTipos.length === 0, 'Lista de tipos permitidos deve ser vazia quando bloqueado');

  // 5. Teste de Fechamento Comercial: Não permitir visitas
  const capClosing = analyzeDateCapacity(day26, tasksEmpty, { startDayOfMonth: 24 });
  assert(capClosing.isClosingPeriod === true, 'Deve identificar período de fechamento');
  assert(!capClosing.allowedTipos.includes('visita'), 'Período de fechamento proíbe visitas presenciais');
  assert(capClosing.allowedTipos.includes('whatsapp'), 'Período de fechamento prioriza follow-ups rápidos');

  // 6. Teste de Geração de Recomendações e Deduplicação
  const mockLeads: LeadData[] = [
    { id: 'lead-1', nome: 'Auto Sul Concessionária', tipo_parceiro: 'concessionaria', diasSemContato: 25 },
    { id: 'lead-2', nome: 'Parceiro com Tarefa Já Marcada', tipo_parceiro: 'corretor' },
  ];
  const mockPropostas: PropostaData[] = [
    {
      id: 'prop-1',
      lead_id: 'lead-1',
      status: 'enviada',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
      credito_total: 150000,
      visualizacoes: 2,
    },
  ];
  const mockExisting: ExistingTask[] = [
    {
      id: 'task-existente',
      titulo: 'Ligação Agendada',
      data_followup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pendente',
      leads: { id: 'lead-2', nome: 'Parceiro com Tarefa Já Marcada' },
    },
  ];

  const result = generateCommercialRecommendations({
    existingTasks: mockExisting,
    leads: mockLeads,
    propostas: mockPropostas,
    negocios: [],
    referenceDate: day20,
    closingConfig: { startDayOfMonth: 24 },
  });

  assert(result.recommendations.length > 0, 'Deve gerar recomendações comerciais válidas');
  const hasPropRec = result.recommendations.some(r => r.referenciaTipo === 'proposta' && r.leadId === 'lead-1');
  assert(hasPropRec, 'Deve gerar recomendação para proposta enviada com visualização');

  const hasDuplicateLead2 = result.recommendations.some(r => r.leadId === 'lead-2');
  assert(!hasDuplicateLead2, 'NÃO deve sugerir tarefas duplicadas para lead que já possui tarefa pendente');

  console.log(`\n📊 Resultado dos Testes: ${passed}/${total} passaram.`);
  if (passed === total) {
    console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n');
  } else {
    process.exit(1);
  }
}

runTests();
