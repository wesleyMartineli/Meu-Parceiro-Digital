/**
 * Motor de Recomendações e Inteligência de Agenda Comercial
 * Módulo: Minhas Tarefas / Meu Parceiro Digital
 *
 * Implementa regras de proteção de capacidade, análise multicanal (propostas, carteira, agenda, CRM)
 * e priorização comercial sem dependência de LLM externa.
 */

export type FollowupTipo = 'ligacao' | 'whatsapp' | 'reuniao' | 'visita' | 'email' | 'outros';

export type PrioridadeNivel = 'alta' | 'media' | 'baixa';

export type FrenteComercial =
  | 'A_PROPOSTAS'
  | 'B_CARTEIRA'
  | 'C_PRODUTIVIDADE'
  | 'D_VISITAS'
  | 'E_POS_REUNIAO'
  | 'F_TOP_PRODUTORES'
  | 'F_METAS';

export interface LeadData {
  id: string;
  nome: string;
  tipo_parceiro?: string;
  etapa_funil?: string;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  created_at?: string;
  updated_at?: string;
  diasSemContato?: number;
  totalNegocios?: number;
  volumeCredito?: number;
  totalPropostas?: number;
  totalTarefas?: number;
}

export interface PropostaData {
  id: string;
  lead_id: string;
  lead_nome?: string;
  status: string;
  created_at: string;
  credito_total?: number;
  produto?: string;
  visualizacoes?: number;
}

export interface NegocioCrmData {
  id: string;
  cliente_id: string;
  titulo: string;
  credito?: number;
  etapa_funil: string;
  proximo_followup?: string | null;
  ultima_interacao?: string | null;
  leads?: {
    id: string;
    nome: string;
    telefone?: string | null;
  };
}

export interface ExistingTask {
  id: string;
  titulo: string;
  descricao?: string | null;
  data_followup: string;
  status: string | null;
  tipo?: string;
  leads?: {
    id: string;
    nome: string;
  };
}

export interface CapacityAnalysis {
  date: string; // YYYY-MM-DD
  isClosingPeriod: boolean;
  presencialMeetingsCount: number;
  totalTasksCount: number;
  capacityLevel: 'available' | 'restricted' | 'blocked';
  maxNewTasksAllowed: number;
  allowedTipos: FollowupTipo[];
  reason: string;
}

export interface CommercialRecommendation {
  id: string;
  leadId: string;
  leadNome: string;
  tipo: FollowupTipo;
  tipoLabel: string;
  titulo: string;
  descricao: string;
  motivo: string;
  prioridade: PrioridadeNivel;
  score: number; // 0 a 100
  dataSugerida: string; // ISO datetime
  dataSugeridaFormatada: string;
  duracaoEstimadaMinutos: number;
  frenteComercial: FrenteComercial;
  referenciaTipo: 'proposta' | 'lead_inativo' | 'pos_reuniao' | 'oportunidade_crm' | 'agenda_livre';
  referenciaId?: string;
  leadTelefone?: string | null;
}

export interface ClosingConfig {
  startDayOfMonth?: number; // Ex: dia 24 do mês em diante
  enabled?: boolean;
}

const TIPO_LABELS: Record<FollowupTipo, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  reuniao: 'Reunião Virtual',
  visita: 'Visita Presencial',
  email: 'E-mail',
  outros: 'Outros',
};

/**
 * Verifica se uma tarefa é uma reunião/visita presencial
 */
export function isPresencialMeeting(task: { tipo?: string; titulo?: string; descricao?: string | null }): boolean {
  if (task.tipo === 'visita') return true;
  const texto = `${task.titulo || ''} ${task.descricao || ''}`.toLowerCase();
  return (
    texto.includes('visita') ||
    texto.includes('presencial') ||
    texto.includes('visita comercial') ||
    texto.includes('ir ate')
  );
}

/**
 * Verifica se a data atual está no período de fechamento comercial
 * Regra: dias finais do mês (configurável, padrão: dia 25 em diante)
 */
export function checkIsClosingPeriod(date: Date, config?: ClosingConfig): boolean {
  if (config && config.enabled === false) return false;
  const startDay = config?.startDayOfMonth ?? 24;
  return date.getDate() >= startDay;
}

/**
 * Analisa a capacidade de uma data específica com base nas regras obrigatórias:
 * 1. Sem reuniões presenciais: permite recomendações normais.
 * 2. Com 1 reunião presencial: reduz drasticamente o volume (máximo 1-2 tarefas leves).
 * 3. Com 2 ou mais reuniões presenciais: BLOQUEIA novas recomendações para esse dia.
 * 4. Período de fechamento: Proíbe visitas e reuniões presenciais novas; prioriza follow-ups rápidos.
 */
export function analyzeDateCapacity(
  date: Date,
  existingTasks: ExistingTask[],
  closingConfig?: ClosingConfig
): CapacityAnalysis {
  const dateStr = date.toISOString().split('T')[0];
  const tasksForDay = existingTasks.filter(t => {
    const tDate = new Date(t.data_followup);
    return tDate.toISOString().split('T')[0] === dateStr;
  });

  const isClosing = checkIsClosingPeriod(date, closingConfig);
  const presencialMeetings = tasksForDay.filter(isPresencialMeeting);
  const presencialCount = presencialMeetings.length;
  const totalCount = tasksForDay.length;

  // Regra 3: 2 ou mais reuniões presenciais -> BLOQUEADO
  if (presencialCount >= 2) {
    return {
      date: dateStr,
      isClosingPeriod: isClosing,
      presencialMeetingsCount: presencialCount,
      totalTasksCount: totalCount,
      capacityLevel: 'blocked',
      maxNewTasksAllowed: 0,
      allowedTipos: [],
      reason: `Dia com ${presencialCount} reuniões presenciais agendadas. Agenda protegida para deslocamento, reuniões e pós-atendimento.`,
    };
  }

  // Regra 2: 1 reunião presencial -> RESTRITO (apenas follow-up rápido/whatsapp)
  if (presencialCount === 1) {
    const allowed = isClosing ? (['whatsapp', 'email'] as FollowupTipo[]) : (['whatsapp', 'ligacao'] as FollowupTipo[]);
    return {
      date: dateStr,
      isClosingPeriod: isClosing,
      presencialMeetingsCount: 1,
      totalTasksCount: totalCount,
      capacityLevel: 'restricted',
      maxNewTasksAllowed: Math.max(0, 2 - totalCount),
      allowedTipos: allowed,
      reason: `Dia com 1 reunião presencial. Capacidade reduzida para preservar foco e deslocamento. Apenas follow-ups essenciais recomendados.`,
    };
  }

  // Regra 4: Período de fechamento -> Sem visitas nem reuniões longas
  if (isClosing) {
    return {
      date: dateStr,
      isClosingPeriod: true,
      presencialMeetingsCount: 0,
      totalTasksCount: totalCount,
      capacityLevel: totalCount >= 6 ? 'restricted' : 'available',
      maxNewTasksAllowed: Math.max(0, 6 - totalCount),
      allowedTipos: ['whatsapp', 'ligacao', 'email'],
      reason: `Período de fechamento comercial ativo. Foco total em follow-ups de propostas em andamento e conversão rápida.`,
    };
  }

  // Regra 1: Dia sem reuniões presenciais -> DISPONÍVEL
  return {
    date: dateStr,
    isClosingPeriod: false,
    presencialMeetingsCount: 0,
    totalTasksCount: totalCount,
    capacityLevel: totalCount >= 8 ? 'restricted' : 'available',
    maxNewTasksAllowed: Math.max(0, 8 - totalCount),
    allowedTipos: ['ligacao', 'whatsapp', 'reuniao', 'visita', 'email'],
    reason: `Dia sem reuniões presenciais. Agenda com boa capacidade para ligações, visitas ou reuniões comerciais.`,
  };
}

/**
 * Formata data legível em português
 */
export function formatDataPtBr(date: Date): string {
  const diaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][date.getDay()];
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${diaSemana}, ${dia}/${mes} às ${horas}:${minutos}`;
}

/**
 * Encontra a melhor janela de horário comercial disponível
 */
export function findAvailableSlot(
  baseDate: Date,
  targetTipo: FollowupTipo,
  durationMinutes: number,
  existingTasks: ExistingTask[],
  closingConfig?: ClosingConfig
): Date | null {
  const candidateSlotsHours = [9.5, 10.5, 14, 15.5, 16.5]; // 09:30, 10:30, 14:00, 15:30, 16:30

  // Tenta nos próximos 7 dias úteis
  const testDate = new Date(baseDate);
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const curDate = new Date(testDate);
    curDate.setDate(testDate.getDate() + dayOffset);

    // Pular fins de semana
    if (curDate.getDay() === 0 || curDate.getDay() === 6) continue;

    const capacity = analyzeDateCapacity(curDate, existingTasks, closingConfig);

    // Se o dia estiver bloqueado ou não permitir o tipo de atividade, avança
    if (capacity.capacityLevel === 'blocked' || capacity.maxNewTasksAllowed <= 0) {
      continue;
    }
    if (!capacity.allowedTipos.includes(targetTipo)) {
      continue;
    }

    const curDateStr = curDate.toISOString().split('T')[0];
    const tasksToday = existingTasks.filter(t => new Date(t.data_followup).toISOString().split('T')[0] === curDateStr);

    for (const h of candidateSlotsHours) {
      const hour = Math.floor(h);
      const min = (h % 1) * 60;

      const slotStart = new Date(curDate);
      slotStart.setHours(hour, min, 0, 0);

      // Não sugerir horários já passados
      if (slotStart.getTime() <= Date.now() + 15 * 60 * 1000) {
        continue;
      }

      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      // Checa colisão com tarefas existentes
      const hasConflict = tasksToday.some(t => {
        const tStart = new Date(t.data_followup).getTime();
        const tEnd = tStart + 30 * 60 * 1000; // Assume 30 min padrão
        return slotStart.getTime() < tEnd && slotEnd.getTime() > tStart;
      });

      if (!hasConflict) {
        return slotStart;
      }
    }
  }

  // Fallback: amanhã às 10h
  const fallback = new Date(baseDate);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

export interface EngineInputData {
  existingTasks: ExistingTask[];
  leads: LeadData[];
  propostas: PropostaData[];
  negocios: NegocioCrmData[];
  referenceDate?: Date;
  closingConfig?: ClosingConfig;
}

/**
 * MOTOR PRINCIPAL DE RECOMENDAÇÕES COMERCIAIS
 */
export function generateCommercialRecommendations(input: EngineInputData): {
  recommendations: CommercialRecommendation[];
  capacitySummary: CapacityAnalysis;
  stats: {
    totalPropostasParadas: number;
    totalParceirosInativos: number;
    totalOportunidadesCrm: number;
    diasBloqueadosSemana: number;
  };
} {
  const now = input.referenceDate || new Date();
  const existingTasks = input.existingTasks || [];
  const leads = input.leads || [];
  const propostas = input.propostas || [];
  const negocios = input.negocios || [];
  const closingConfig = input.closingConfig || { startDayOfMonth: 24, enabled: true };

  const todayCapacity = analyzeDateCapacity(now, existingTasks, closingConfig);

  const recommendations: CommercialRecommendation[] = [];

  // Conjunto para evitar tarefas duplicadas para o mesmo lead no mesmo período
  const leadsComTarefaPendente = new Set<string>();
  for (const t of existingTasks) {
    if (t.status !== 'concluido' && t.leads?.id) {
      leadsComTarefaPendente.add(t.leads.id);
    }
  }

  // --- FRENTE A: PROPOSTAS COMERCIAIS PENDENTES ---
  // Identifica propostas recentes que precisam de acompanhamento
  for (const prop of propostas) {
    if (!prop.lead_id) continue;
    if (leadsComTarefaPendente.has(prop.lead_id)) continue;

    const leadInfo = leads.find(l => l.id === prop.lead_id);
    const leadNome = leadInfo?.nome || prop.lead_nome || 'Parceiro';
    const createdAt = new Date(prop.created_at);
    const diasCriacao = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Proposta sem fechamento com mais de 2 dias ou visualizada sem resposta
    if (prop.status === 'enviada' || prop.status === 'criada' || prop.status === 'visualizada' || prop.status === 'pendente') {
      const isUrgent = diasCriacao >= 3 || (prop.visualizacoes && prop.visualizacoes > 0);
      const prioridade: PrioridadeNivel = isUrgent ? 'alta' : 'media';
      const score = 85 + (isUrgent ? 10 : 0) + Math.min(diasCriacao * 2, 5);

      const tipo: FollowupTipo = todayCapacity.isClosingPeriod ? 'whatsapp' : 'ligacao';
      const slot = findAvailableSlot(now, tipo, 20, existingTasks, closingConfig);
      if (!slot) continue;

      recommendations.push({
        id: `rec-prop-${prop.id}`,
        leadId: prop.lead_id,
        leadNome,
        leadTelefone: leadInfo?.telefone,
        tipo,
        tipoLabel: TIPO_LABELS[tipo],
        titulo: `Follow-up de Proposta Comercial - ${leadNome}`,
        descricao: `Acompanhar decisão sobre a proposta de consórcio (${prop.produto || 'Crédito'}${prop.credito_total ? ` - R$ ${prop.credito_total.toLocaleString('pt-BR')}` : ''}). Proposta criada há ${diasCriacao} dias.`,
        motivo: prop.visualizacoes && prop.visualizacoes > 0
          ? `O parceiro visualizou a proposta e ainda não fechou. Momento ideal para tirar dúvidas e fechar negócio.`
          : `Proposta enviada há ${diasCriacao} dias sem retorno registrado. Ação essencial para manter o funil aquecido.`,
        prioridade,
        score,
        dataSugerida: slot.toISOString(),
        dataSugeridaFormatada: formatDataPtBr(slot),
        duracaoEstimadaMinutos: 20,
        frenteComercial: 'A_PROPOSTAS',
        referenciaTipo: 'proposta',
        referenciaId: prop.id,
      });

      leadsComTarefaPendente.add(prop.lead_id);
    }
  }

  // --- FRENTE B: CARTEIRA DE PARCEIROS SEM CONTATO (SEM PROPOSTA OU SEM TAREFAS NA AGENDA) ---
  for (const lead of leads) {
    if (leadsComTarefaPendente.has(lead.id)) continue;

    const semProposta = (lead.totalPropostas || 0) === 0;
    const semTarefas = (lead.totalTarefas || 0) === 0;

    // Se NÃO gerou proposta OU NÃO tem nenhuma agenda de tarefas
    if (semProposta || semTarefas) {
      const slot = findAvailableSlot(now, 'ligacao', 20, existingTasks, closingConfig);
      if (!slot) continue;

      let titulo = `Primeiro Contato Comercial - ${lead.nome}`;
      let descricao = `Apresentar a Rodobens e identificar primeiras demandas com ${lead.nome}. Parceiro sem proposta enviada e sem tarefas cadastradas na agenda.`;
      let motivo = `Parceiro cadastrado na carteira sem proposta gerada e sem nenhuma agenda de tarefas registrada.`;
      let tipoLabel = 'Primeiro Contato';
      let score = 96;

      if (!semProposta && semTarefas) {
        titulo = `Agendar Follow-up de Proposta - ${lead.nome}`;
        descricao = `Acompanhar decisão sobre propostas de consórcio com ${lead.nome}. Parceiro possui proposta enviada mas nenhuma tarefa agendada.`;
        motivo = `Existe proposta gerada para este parceiro, porém nenhuma tarefa ou retorno está agendado na rotina. Risco de esfriamento da negociação.`;
        tipoLabel = 'Follow-up de Proposta';
        score = 97;
      } else if (semProposta && !semTarefas) {
        titulo = `Elaborar Proposta Comercial - ${lead.nome}`;
        descricao = `Simular cotas e estruturar proposta comercial para ${lead.nome}. Parceiro já contatado, porém ainda sem propostas registradas.`;
        motivo = `Parceiro com histórico de contato na carteira, porém ainda sem proposta formalizada para fechamento.`;
        tipoLabel = 'Simulação / Proposta';
        score = 95;
      }

      recommendations.push({
        id: `rec-lead-sem-contato-${lead.id}`,
        leadId: lead.id,
        leadNome: lead.nome,
        leadTelefone: lead.telefone,
        tipo: 'ligacao',
        tipoLabel,
        titulo,
        descricao,
        motivo,
        prioridade: 'alta',
        score,
        dataSugerida: slot.toISOString(),
        dataSugeridaFormatada: formatDataPtBr(slot),
        duracaoEstimadaMinutos: 20,
        frenteComercial: 'B_CARTEIRA',
        referenciaTipo: 'lead_inativo',
        referenciaId: lead.id,
      });

      leadsComTarefaPendente.add(lead.id);
    }
  }

  // --- FRENTE D: REUNIÕES E VISITAS ESTRATÉGICAS ---
  // Se a agenda do dia ou da semana tem espaço e não está em fechamento
  if (!todayCapacity.isClosingPeriod) {
    let visitasSugeridasCount = 0;
    const virtualTasks: ExistingTask[] = [...existingTasks];

    for (const lead of leads) {
      if (visitasSugeridasCount >= 3) break; // Até 3 visitas distribuídas na semana
      if (leadsComTarefaPendente.has(lead.id)) continue;

      const slot = findAvailableSlot(now, 'visita', 60, virtualTasks, closingConfig);
      if (slot) {
        const slotCapacity = analyzeDateCapacity(slot, virtualTasks, closingConfig);
        if (slotCapacity.capacityLevel === 'available' && slotCapacity.presencialMeetingsCount === 0) {
          recommendations.push({
            id: `rec-visita-${lead.id}`,
            leadId: lead.id,
            leadNome: lead.nome,
            leadTelefone: lead.telefone,
            tipo: 'visita',
            tipoLabel: TIPO_LABELS['visita'],
            titulo: `Visita Comercial Presencial - ${lead.nome}`,
            descricao: `Apresentar novidades das cotas Rodobens e estreitar relacionamento com ${lead.nome}${lead.cidade ? ` (${lead.cidade})` : ''}.`,
            motivo: `Oportunidade de visita presencial estratégica em dia livre de outros deslocamentos, maximizando a produção do parceiro.`,
            prioridade: 'media',
            score: 78,
            dataSugerida: slot.toISOString(),
            dataSugeridaFormatada: formatDataPtBr(slot),
            duracaoEstimadaMinutos: 60,
            frenteComercial: 'D_VISITAS',
            referenciaTipo: 'agenda_livre',
            referenciaId: lead.id,
          });

          leadsComTarefaPendente.add(lead.id);
          visitasSugeridasCount++;

          // Adiciona nas tarefas virtuais para que os próximos slots evitem o mesmo dia
          virtualTasks.push({
            id: `virtual-visita-${lead.id}`,
            titulo: `Visita Presencial ${lead.nome}`,
            data_followup: slot.toISOString(),
            status: 'pendente',
            tipo: 'visita',
          });
        }
      }
    }
  }

  // --- FRENTE E: PÓS-REUNIÃO RECENTE ---
  // Identifica tarefas de tipo reunião ou visita concluídas nos últimos 3 dias sem tarefa subsequente
  const recentMeetings = existingTasks.filter(t => {
    if (!t.leads?.id) return false;
    const isMeeting = t.tipo === 'reuniao' || t.tipo === 'visita';
    const taskDate = new Date(t.data_followup);
    const diffHours = (now.getTime() - taskDate.getTime()) / (1000 * 60 * 60);
    return isMeeting && diffHours >= 0 && diffHours <= 72; // Últimas 72h
  });

  for (const meet of recentMeetings) {
    const leadId = meet.leads!.id;
    if (leadsComTarefaPendente.has(leadId)) continue;

    const leadInfo = leads.find(l => l.id === leadId);
    const leadNome = leadInfo?.nome || meet.leads!.nome;

    const slot = findAvailableSlot(now, 'whatsapp', 15, existingTasks, closingConfig);
    if (!slot) continue;

    recommendations.push({
      id: `rec-pos-reuniao-${meet.id}`,
      leadId,
      leadNome,
      leadTelefone: leadInfo?.telefone,
      tipo: 'whatsapp',
      tipoLabel: TIPO_LABELS['whatsapp'],
      titulo: `Alinhamento Pós-Reunião - ${leadNome}`,
      descricao: `Enviar mensagem agradecendo a reunião recente e consolidando os próximos passos combinados.`,
      motivo: `Reunião realizada recentemente. Consolidar o pós-atendimento rápido aumenta em mais de 60% a taxa de conversão.`,
      prioridade: 'alta',
      score: 92,
      dataSugerida: slot.toISOString(),
      dataSugeridaFormatada: formatDataPtBr(slot),
      duracaoEstimadaMinutos: 15,
      frenteComercial: 'E_POS_REUNIAO',
      referenciaTipo: 'pos_reuniao',
      referenciaId: meet.id,
    });

    leadsComTarefaPendente.add(leadId);
  }

  // --- FRENTE F: TOP PARCEIROS POR PRODUÇÃO E NEGÓCIOS GERADOS ---
  const topProdutores = [...leads]
    .filter(l => (l.totalNegocios && l.totalNegocios > 0) || (l.volumeCredito && l.volumeCredito > 0))
    .sort((a, b) => (b.volumeCredito || 0) - (a.volumeCredito || 0) || (b.totalNegocios || 0) - (a.totalNegocios || 0));

  for (const lead of topProdutores.slice(0, 5)) {
    const slot = findAvailableSlot(now, 'reuniao', 30, existingTasks, closingConfig);
    if (!slot) continue;

    const volFormatado = (lead.volumeCredito || 0) > 0 
      ? `R$ ${(lead.volumeCredito || 0).toLocaleString('pt-BR')}`
      : `${lead.totalNegocios} negócio(s)`;

    recommendations.push({
      id: `rec-top-produtor-${lead.id}`,
      leadId: lead.id,
      leadNome: lead.nome,
      leadTelefone: lead.telefone,
      tipo: 'reuniao',
      tipoLabel: 'Alinhamento Comercial',
      titulo: `Alinhamento de Alta Produção - ${lead.nome}`,
      descricao: `Reunião estratégica com ${lead.nome}. Destaque na carteira com ${lead.totalNegocios || 1} negócio(s) gerado(s) e volume de ${volFormatado}.`,
      motivo: `Top parceiro da carteira (${lead.totalNegocios || 1} negócios / ${volFormatado}). Manter relacionamento próximo com quem mais produz maximiza a produção de cotas do GN.`,
      prioridade: 'alta',
      score: 99,
      dataSugerida: slot.toISOString(),
      dataSugeridaFormatada: formatDataPtBr(slot),
      duracaoEstimadaMinutos: 30,
      frenteComercial: 'F_TOP_PRODUTORES',
      referenciaTipo: 'oportunidade_crm',
      referenciaId: lead.id,
    });
  }

  // Ordena por maior pontuação (score)
  recommendations.sort((a, b) => b.score - a.score);

  // Calcula estatísticas
  let diasBloqueados = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (analyzeDateCapacity(d, existingTasks, closingConfig).capacityLevel === 'blocked') {
      diasBloqueados++;
    }
  }

  return {
    recommendations,
    capacitySummary: todayCapacity,
    stats: {
      totalPropostasParadas: propostas.filter(p => p.status === 'enviada' || p.status === 'criada' || p.status === 'visualizada').length,
      totalParceirosInativos: leads.filter(l => (l.diasSemContato || 0) >= 14).length,
      totalOportunidadesCrm: negocios.length,
      diasBloqueadosSemana: diasBloqueados,
    },
  };
}
