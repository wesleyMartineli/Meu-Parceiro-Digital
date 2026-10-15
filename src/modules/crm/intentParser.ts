/**
 * Interpretador de Intenções Comerciais (Intent Parser)
 * Processa as perguntas e comandos do Gerente de Negócios (GN)
 * e gera respostas contextualizadas com dados reais da carteira e cards de recomendação.
 */

import { CommercialRecommendation, CapacityAnalysis, LeadData } from './recommendationEngine';

export type CommercialIntentType =
  | 'ORGANIZE_AGENDA'
  | 'PARTNERS_TODAY'
  | 'TOP_PRODUCERS'
  | 'PROPOSALS_PENDING'
  | 'OPPORTUNITIES_STUCK'
  | 'SUGGEST_MEETINGS'
  | 'AGENDA_CAPACITY'
  | 'PRIORITIZE_PRODUCTION'
  | 'PROACTIVE_BRIEFING'
  | 'GENERAL_COMMERCIAL'
  | 'UNKNOWN';

export interface ParsedCommercialIntent {
  intent: CommercialIntentType;
  confidence: number;
  matchedKeywords: string[];
  suggestedCardsFilter?: (rec: CommercialRecommendation) => boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Detecta a intenção da pergunta do GN utilizando pontuação semântica
 */
export function parseCommercialIntent(userInput: string): ParsedCommercialIntent {
  const norm = normalize(userInput);

  // 0. Saudação / Briefing
  if (
    norm === 'oi' ||
    norm === 'ola' ||
    norm === 'bom dia' ||
    norm === 'boa tarde' ||
    norm === 'briefing' ||
    norm === 'resumo' ||
    norm === 'inicio'
  ) {
    return {
      intent: 'PROACTIVE_BRIEFING',
      confidence: 1,
      matchedKeywords: ['saudacao'],
    };
  }

  // Pontuadores por categoria comercial
  let topProdutoresScore = 0;
  let presencialScore = 0;
  let producaoScore = 0;
  let propostaScore = 0;
  let parceiroScore = 0;
  let capacidadeScore = 0;
  let agendaScore = 0;

  // 1. TOP PRODUTORES / MAIS NEGÓCIOS GERADOS (Alta Prioridade de Detecção)
  if (
    norm.includes('mais produzem') ||
    norm.includes('que mais produzem') ||
    norm.includes('produzem mais') ||
    norm.includes('quem mais produz') ||
    norm.includes('mais produz') ||
    norm.includes('parceiros que produzem') ||
    norm.includes('maior producao') ||
    norm.includes('quem produz mais') ||
    norm.includes('top produtor') ||
    norm.includes('top produtores')
  ) {
    topProdutoresScore += 90;
  }
  if (
    norm.includes('mais negocio') ||
    norm.includes('mais negocios') ||
    norm.includes('negocios gerados') ||
    norm.includes('negocio gerados') ||
    norm.includes('maiores negocios') ||
    norm.includes('volume de negocios') ||
    norm.includes('gerou mais')
  ) {
    topProdutoresScore += 90;
  }
  if (norm.includes('top parceiro') || norm.includes('top parceiros') || norm.includes('melhores parceiros')) {
    topProdutoresScore += 75;
  }

  // 2. Visitas e Reuniões Presenciais
  if (norm.includes('presencial') || norm.includes('presenciais')) presencialScore += 60;
  if (norm.includes('visita') || norm.includes('visitas') || norm.includes('visitar')) presencialScore += 50;
  if (norm.includes('reuniao') || norm.includes('reunioes')) presencialScore += 35;
  if (norm.includes('campo') || norm.includes('externo') || norm.includes('externa') || norm.includes('onde ir')) presencialScore += 35;
  if (norm.includes('agenda presencial') || norm.includes('sugestao presencial') || norm.includes('visita comercial')) presencialScore += 70;

  // 3. Produção Geral / Oportunidades Criadas / Potencial / Metas
  if (norm.includes('producao') || norm.includes('produzir')) producaoScore += 45;
  if (norm.includes('oportunidade') || norm.includes('oportunidades')) producaoScore += 45;
  if (norm.includes('potencial')) producaoScore += 40;
  if (norm.includes('criada') || norm.includes('criadas') || norm.includes('existente') || norm.includes('existentes')) producaoScore += 35;
  if (norm.includes('meta') || norm.includes('bater meta') || norm.includes('fechamento')) producaoScore += 40;
  if (norm.includes('vendas') || norm.includes('conversao') || norm.includes('resultado')) producaoScore += 30;

  // 4. Propostas Comerciais / Simulações / Retorno
  if (norm.includes('proposta') || norm.includes('propostas')) propostaScore += 60;
  if (norm.includes('simulacao') || norm.includes('simulacoes')) propostaScore += 40;
  if (norm.includes('cota') || norm.includes('cotas')) propostaScore += 30;
  if (norm.includes('retorno') || norm.includes('aguardando retorno') || norm.includes('sem retorno')) propostaScore += 45;
  if (norm.includes('follow-up') || norm.includes('followup') || norm.includes('acompanhamento')) propostaScore += 45;

  // 5. Carteira de Parceiros / Quem Procurar / Reativação
  if (norm.includes('parceiro') || norm.includes('parceiros')) parceiroScore += 35;
  if (norm.includes('procurar') || norm.includes('contatar') || norm.includes('quem ligar') || norm.includes('falar')) parceiroScore += 35;
  if (norm.includes('inativo') || norm.includes('inativos') || norm.includes('sem contato') || norm.includes('sumido')) parceiroScore += 60;
  if (norm.includes('reativar') || norm.includes('carteira') || norm.includes('base')) parceiroScore += 35;
  if (norm.includes('hoje') && (norm.includes('quem') || norm.includes('parceiro') || norm.includes('ligar') || norm.includes('contatar'))) parceiroScore += 45;

  // Detecção explícita de busca por parceiros sem contato, sem oportunidades ou sem atividades
  const isAskingWithoutOpportunities =
    norm.includes('sem oportunidade') ||
    norm.includes('sem oportunidades') ||
    norm.includes('nenhuma oportunidade') ||
    norm.includes('sem atividade') ||
    norm.includes('sem atividades') ||
    norm.includes('nenhuma atividade') ||
    norm.includes('sem negocio') ||
    norm.includes('sem negocios') ||
    norm.includes('nenhum negocio') ||
    norm.includes('sem contato') ||
    norm.includes('nao gerei') ||
    norm.includes('nao tem negocio') ||
    norm.includes('nao tem oportunidade') ||
    norm.includes('sem proposta') ||
    norm.includes('nao gerei proposta') ||
    norm.includes('sem tarefa') ||
    norm.includes('sem tarefas') ||
    norm.includes('nenhuma agenda') ||
    norm.includes('agenda de tarefas') ||
    norm.includes('nenhuma tarefa') ||
    norm.includes('sem agenda');

  if (isAskingWithoutOpportunities) {
    parceiroScore += 120;
    topProdutoresScore = 0;
    producaoScore = 0;
  }

  // 6. Capacidade da Agenda / Sobrecarga / Conflitos
  if (norm.includes('capacidade') || norm.includes('limite')) capacidadeScore += 60;
  if (norm.includes('cheia') || norm.includes('lotada') || norm.includes('sobrecarga')) capacidadeScore += 55;
  if (norm.includes('tempo') || norm.includes('espaco') || norm.includes('horario') || norm.includes('livre')) capacidadeScore += 35;
  if (norm.includes('minha agenda esta') || norm.includes('estou sobrecarregado') || norm.includes('conflito')) capacidadeScore += 50;

  // 7. Organizar Agenda / Semana / Planejamento Geral
  if (norm.includes('organize') || norm.includes('organizar') || norm.includes('distribuir')) agendaScore += 50;
  if (norm.includes('semana') || norm.includes('planejar') || norm.includes('planejamento')) agendaScore += 40;
  if (norm.includes('minha agenda') || norm.includes('agenda da semana')) agendaScore += 45;
  if (norm.includes('roteiro') || norm.includes('plano') || norm.includes('sugestao de agenda')) agendaScore += 40;

  // Determinar a maior pontuação
  const scores = [
    { intent: 'TOP_PRODUCERS' as CommercialIntentType, score: topProdutoresScore, filter: (r: CommercialRecommendation) => r.frenteComercial === 'F_TOP_PRODUTORES' || r.score >= 95 },
    { intent: 'SUGGEST_MEETINGS' as CommercialIntentType, score: presencialScore, filter: (r: CommercialRecommendation) => r.tipo === 'visita' || r.tipo === 'reuniao' },
    { intent: 'PRIORITIZE_PRODUCTION' as CommercialIntentType, score: producaoScore, filter: (r: CommercialRecommendation) => r.prioridade === 'alta' || r.referenciaTipo === 'proposta' || r.score >= 80 },
    { intent: 'PROPOSALS_PENDING' as CommercialIntentType, score: propostaScore, filter: (r: CommercialRecommendation) => r.frenteComercial === 'A_PROPOSTAS' || r.referenciaTipo === 'proposta' },
    { intent: 'PARTNERS_TODAY' as CommercialIntentType, score: parceiroScore, filter: (r: CommercialRecommendation) => r.frenteComercial === 'B_CARTEIRA' || r.frenteComercial === 'E_POS_REUNIAO' },
    { intent: 'AGENDA_CAPACITY' as CommercialIntentType, score: capacidadeScore, filter: undefined },
    { intent: 'ORGANIZE_AGENDA' as CommercialIntentType, score: agendaScore, filter: () => true },
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  // Se a pontuação máxima for relevante (>= 30)
  if (best.score >= 30) {
    return {
      intent: best.intent,
      confidence: Math.min(best.score / 100, 0.98),
      matchedKeywords: [best.intent.toLowerCase()],
      suggestedCardsFilter: best.filter,
    };
  }

  // Se tem qualquer termo comercial genérico
  if (
    norm.includes('agenda') ||
    norm.includes('fazer') ||
    norm.includes('sugestao') ||
    norm.includes('sugestoes') ||
    norm.includes('ajuda') ||
    norm.includes('ideia') ||
    norm.includes('comercial') ||
    norm.includes('prioridade')
  ) {
    return {
      intent: 'GENERAL_COMMERCIAL',
      confidence: 0.85,
      matchedKeywords: ['comercial_geral'],
      suggestedCardsFilter: () => true,
    };
  }

  // Fallback seguro com opções
  return {
    intent: 'UNKNOWN',
    confidence: 0.2,
    matchedKeywords: [],
  };
}

export interface AssistantResponsePayload {
  messageText: string;
  filteredRecommendations: CommercialRecommendation[];
  actionPills: { label: string; query: string }[];
}

/**
 * Monta a resposta contextualizada da IA Comercial com templates dinâmicos e dados reais
 */
export function buildAssistantResponse(
  intentResult: ParsedCommercialIntent,
  recommendations: CommercialRecommendation[],
  capacity: CapacityAnalysis,
  stats: {
    totalPropostasParadas: number;
    totalParceirosInativos: number;
    totalOportunidadesCrm: number;
    diasBloqueadosSemana: number;
  },
  leads: LeadData[] = []
): AssistantResponsePayload {
  const commonPills = [
    { label: '🏆 Quem mais produz', query: 'Quero uma agenda com os parceiros que mais produzem.' },
    { label: '💼 Mais negócios gerados', query: 'Quero agenda com parceiro que tem mais negócios gerados.' },
    { label: '🚗 Agenda presencial', query: 'Me dê sugestão de agenda presencial.' },
    { label: '📄 Propostas pendentes', query: 'Quais propostas precisam de acompanhamento?' },
    { label: '🤝 Parceiros sem contato', query: 'Quais parceiros estão sem contato ou sem oportunidades geradas?' },
    { label: '🛡️ Minha capacidade', query: 'Minha agenda está muito cheia?' },
  ];

  switch (intentResult.intent) {
    // 1. TOP PRODUTORES / MAIS NEGÓCIOS GERADOS
    case 'TOP_PRODUCERS': {
      // Ordena leads reais por volume de crédito e número de negócios
      const ranking = [...leads]
        .sort((a, b) => (b.volumeCredito || 0) - (a.volumeCredito || 0) || (b.totalNegocios || 0) - (a.totalNegocios || 0));

      const topRanked = ranking.slice(0, 5);

      let msg = `Identifiquei os parceiros com maior histórico de produção e negócios gerados na sua carteira:\n\n`;
      topRanked.forEach((lead, idx) => {
        const vol = (lead.volumeCredito || 0) > 0 
          ? `R$ ${(lead.volumeCredito || 0).toLocaleString('pt-BR')} em crédito`
          : 'Crédito em simulação';
        msg += `${idx + 1}. **${lead.nome}** — ${lead.totalNegocios || 1} negócio(s) (${vol})\n`;
      });

      msg += `\nPreparei as sugestões de agenda estratégica abaixo para você manter o relacionamento próximo e alavancar novas cotas:`;

      // Filtra recomendações para os top produtores
      let cards = recommendations.filter(r => r.frenteComercial === 'F_TOP_PRODUTORES');
      if (cards.length === 0) {
        const topIds = new Set(topRanked.map(l => l.id));
        cards = recommendations.filter(r => topIds.has(r.leadId));
      }
      if (cards.length === 0) {
        cards = recommendations.slice(0, 4);
      }

      return {
        messageText: msg,
        filteredRecommendations: cards.slice(0, 5),
        actionPills: commonPills,
      };
    }

    // 2. PROACTIVE BRIEFING
    case 'PROACTIVE_BRIEFING': {
      const topProps = recommendations.filter(r => r.frenteComercial === 'A_PROPOSTAS').length;
      const topLeads = recommendations.filter(r => r.frenteComercial === 'B_CARTEIRA').length;
      const topVisitas = recommendations.filter(r => r.tipo === 'visita').length;

      let msg = `Olá! Analisei sua carteira, propostas e a capacidade da sua agenda.\n\n`;

      if (capacity.isClosingPeriod) {
        msg += `⚠️ **Atenção:** Estamos em **período de fechamento comercial**. Visitas presenciais foram congeladas para focar 100% em conversão rápida e follow-up de propostas abertas.\n\n`;
      } else if (capacity.capacityLevel === 'restricted') {
        msg += `📌 **Capacidade de Hoje:** Você já possui compromisso presencial marcado. Reservei seu dia para deslocamento e foco comercial.\n\n`;
      } else if (capacity.capacityLevel === 'blocked') {
        msg += `⛔ **Capacidade de Hoje:** Sua agenda já possui 2 ou mais reuniões presenciais. Nenhuma nova tarefa foi recomendada para hoje para proteger seu tempo.\n\n`;
      }

      msg += `Encontrei **${recommendations.length} oportunidades prioritárias**:\n`;
      if (topProps > 0) msg += `• **${topProps} propostas** aguardando retorno;\n`;
      if (topLeads > 0) msg += `• **${topLeads} parceiros** sem contato recente;\n`;
      if (topVisitas > 0 && !capacity.isClosingPeriod) msg += `• **${topVisitas} oportunidades de visita presencial** em dias livres;\n`;

      msg += `\nVeja as sugestões abaixo. Clique em **Aceitar** para incluir na agenda ou **Reagendar** para ajustar o horário.`;

      return {
        messageText: msg,
        filteredRecommendations: recommendations.slice(0, 4),
        actionPills: commonPills,
      };
    }

    // 3. VISITAS PRESENCIAIS / REUNIÕES
    case 'SUGGEST_MEETINGS': {
      if (capacity.isClosingPeriod) {
        return {
          messageText: `No momento estamos em **período de fechamento comercial**, por isso o motor não recomenda visitas ou reuniões presenciais externas, concentrando seu tempo em fechar as propostas abertas da carteira.\n\nRecomendo priorizar os follow-ups rápidos abaixo:`,
          filteredRecommendations: recommendations.filter(r => r.frenteComercial === 'A_PROPOSTAS').slice(0, 3),
          actionPills: commonPills,
        };
      }

      const meetings = recommendations.filter(r => r.tipo === 'visita' || r.tipo === 'reuniao');
      if (meetings.length > 0) {
        return {
          messageText: `Preparei as seguintes **sugestões de agenda presencial e reuniões estratégicas**, respeitando a regra de no máximo 1 visita por dia para não sobrecarregar seu deslocamento:`,
          filteredRecommendations: meetings,
          actionPills: commonPills,
        };
      }

      return {
        messageText: `Analisei seus parceiros e preparei as seguintes **oportunidades comerciais prioritárias** para atendimento nesta semana:`,
        filteredRecommendations: recommendations.slice(0, 4),
        actionPills: commonPills,
      };
    }

    // 4. PRODUÇÃO & POTENCIAL
    case 'PRIORITIZE_PRODUCTION': {
      let topPriority = recommendations.filter(r => r.prioridade === 'alta' || r.referenciaTipo === 'proposta' || r.score >= 80);
      if (topPriority.length === 0) topPriority = recommendations.slice(0, 4);

      return {
        messageText: `Com certeza! Analisei as oportunidades já criadas no seu painel com foco em **produção comercial e alto potencial de conversão**.\n\nAqui estão as principais ações para movimentar suas negociações e gerar volume de cotas:`,
        filteredRecommendations: topPriority.slice(0, 5),
        actionPills: commonPills,
      };
    }

    // 5. PROPOSTAS PENDENTES
    case 'PROPOSALS_PENDING': {
      const props = recommendations.filter(r => r.frenteComercial === 'A_PROPOSTAS' || r.referenciaTipo === 'proposta');
      if (props.length === 0) {
        return {
          messageText: `Ótima notícia! Não encontrei nenhuma proposta comercial pendente de retorno no seu funil no momento. Veja abaixo outras oportunidades para movimentar a carteira:`,
          filteredRecommendations: recommendations.slice(0, 4),
          actionPills: commonPills,
        };
      }
      return {
        messageText: `Identifiquei **${props.length} propostas comerciais** que precisam de acompanhamento imediato. Realizar follow-up rápido logo após envio ou visualização aumenta a conversão em mais de 40%:`,
        filteredRecommendations: props,
        actionPills: commonPills,
      };
    }

    // 6. PARCEIROS SEM CONTATO (SEM PROPOSTA OU SEM TAREFAS NA AGENDA)
    case 'PARTNERS_TODAY': {
      // 1. Filtra parceiros da carteira onde totalPropostas === 0 OU totalTarefas === 0
      const semContato = leads.filter(l => (l.totalPropostas || 0) === 0 || (l.totalTarefas || 0) === 0);

      // 2. Ordena priorizando quem não tem nem proposta nem tarefa
      const ordenados = [...semContato].sort((a, b) => {
        const aZeroTudo = (a.totalPropostas || 0) === 0 && (a.totalTarefas || 0) === 0 ? 1 : 0;
        const bZeroTudo = (b.totalPropostas || 0) === 0 && (b.totalTarefas || 0) === 0 ? 1 : 0;
        return bZeroTudo - aZeroTudo;
      });

      // 3. Busca recomendações de Frente B correspondentes a esses parceiros
      const idsSemContato = new Set(ordenados.map(l => l.id));
      let cards = recommendations.filter(r => 
        r.frenteComercial === 'B_CARTEIRA' && idsSemContato.has(r.leadId)
      );

      // Se ainda não houver cards de Frente B pré-calculados, gera cards dedicados dinamicamente
      if (cards.length === 0 && ordenados.length > 0) {
        cards = ordenados.slice(0, 5).map(lead => {
          const semProp = (lead.totalPropostas || 0) === 0;
          const semTar = (lead.totalTarefas || 0) === 0;

          let titulo = `Primeiro Contato Comercial - ${lead.nome}`;
          let descricao = `Apresentar a Rodobens e identificar primeiras demandas com ${lead.nome}. Parceiro sem proposta enviada e sem tarefas cadastradas na agenda.`;
          let motivo = `Parceiro cadastrado na carteira sem proposta gerada e sem nenhuma agenda de tarefas registrada.`;
          let tipoLabel = 'Primeiro Contato';

          if (!semProp && semTar) {
            titulo = `Agendar Follow-up de Proposta - ${lead.nome}`;
            descricao = `Acompanhar decisão sobre propostas de consórcio com ${lead.nome}. Parceiro possui proposta enviada mas nenhuma tarefa agendada.`;
            motivo = `Existe proposta gerada para este parceiro, porém nenhuma tarefa ou retorno está agendado na rotina. Risco de esfriamento da negociação.`;
            tipoLabel = 'Follow-up de Proposta';
          } else if (semProp && !semTar) {
            titulo = `Elaborar Proposta Comercial - ${lead.nome}`;
            descricao = `Simular cotas e estruturar proposta comercial para ${lead.nome}. Parceiro já contatado, porém ainda sem propostas registradas.`;
            motivo = `Parceiro com histórico de contato na carteira, porém ainda sem proposta formalizada para fechamento.`;
            tipoLabel = 'Simulação / Proposta';
          }

          return {
            id: `rec-sem-contato-${lead.id}`,
            leadId: lead.id,
            leadNome: lead.nome,
            leadTelefone: lead.telefone,
            tipo: 'ligacao' as const,
            tipoLabel,
            titulo,
            descricao,
            motivo,
            prioridade: 'alta' as const,
            score: 96,
            dataSugerida: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            dataSugeridaFormatada: 'Amanhã às 10:00',
            duracaoEstimadaMinutos: 20,
            frenteComercial: 'B_CARTEIRA' as const,
            referenciaTipo: 'lead_inativo' as const,
            referenciaId: lead.id,
          };
        });
      }

      // Caso realmente todos os parceiros já tenham propostas e tarefas
      if (ordenados.length === 0) {
        return {
          messageText: `Parabéns! Todos os **${leads.length} parceiros** da sua carteira já possuem propostas geradas e tarefas ativas na agenda. Não há parceiros sem contato no momento.`,
          filteredRecommendations: [],
          actionPills: commonPills,
        };
      }

      let msg = `Identifiquei **${ordenados.length} parceiro(s)** na sua carteira que **não possuem proposta gerada OU não têm tarefas na agenda**:\n\n`;
      ordenados.slice(0, 5).forEach((lead, idx) => {
        let motivoStatus = '';
        if ((lead.totalPropostas || 0) === 0 && (lead.totalTarefas || 0) === 0) {
          motivoStatus = 'Sem proposta e sem agenda de tarefas';
        } else if ((lead.totalPropostas || 0) === 0) {
          motivoStatus = 'Sem proposta comercial gerada';
        } else {
          motivoStatus = 'Com proposta, mas sem tarefas agendadas';
        }
        const loc = lead.cidade ? ` (${lead.cidade})` : '';
        msg += `${idx + 1}. **${lead.nome}**${loc} — *${motivoStatus}*\n`;
      });
      msg += `\nPreparei as sugestões de ação abaixo para você preencher a agenda e movimentar esses parceiros:`;

      return {
        messageText: msg,
        filteredRecommendations: cards.slice(0, 5),
        actionPills: commonPills,
      };
    }

    // 7. ORGANIZAR AGENDA
    case 'ORGANIZE_AGENDA': {
      let msg = `Analisei sua semana e distribuí as melhores oportunidades respeitando os limites da sua capacidade diária.\n\n`;
      if (capacity.isClosingPeriod) {
        msg += `Como estamos na reta final de fechamento, priorizei follow-ups por WhatsApp e ligações rápidas para alavancar a produção do mês.\n`;
      } else {
        msg += `Os horários foram selecionados para evitar dias com sobrecarga ou múltiplas visitas presenciais.\n`;
      }
      msg += `\nAbaixo estão as **${Math.min(recommendations.length, 5)} principais ações sugeridas**:`;

      return {
        messageText: msg,
        filteredRecommendations: recommendations.slice(0, 5),
        actionPills: commonPills,
      };
    }

    // 8. CAPACIDADE
    case 'AGENDA_CAPACITY': {
      let msg = `### 🛡️ Diagnóstico de Capacidade da Agenda\n\n`;
      msg += `**Status de Hoje:** ${capacity.capacityLevel === 'available' ? '🟢 Disponível' : capacity.capacityLevel === 'restricted' ? '🟡 Capacidade Restrita' : '🔴 Bloqueado'}\n\n`;
      msg += `• **Tarefas agendadas hoje:** ${capacity.totalTasksCount}\n`;
      msg += `• **Reuniões presenciais hoje:** ${capacity.presencialMeetingsCount}\n`;
      msg += `• **Período de fechamento:** ${capacity.isClosingPeriod ? 'Sim (Prioridade Total em Fechamento)' : 'Não'}\n`;
      msg += `• **Justificativa de proteção:** ${capacity.reason}\n\n`;
      msg += `Regra ativa: ${capacity.maxNewTasksAllowed > 0 ? `Você pode encaixar com segurança até ${capacity.maxNewTasksAllowed} novas atividades sem sobrecarregar sua rotina.` : 'Nenhuma nova atividade recomendada para hoje.'}`;

      return {
        messageText: msg,
        filteredRecommendations: recommendations.slice(0, 3),
        actionPills: commonPills,
      };
    }

    // 9. COMERCIAL GERAL
    case 'GENERAL_COMMERCIAL': {
      return {
        messageText: `Compreendi seu objetivo! Analisei sua carteira, propostas e o potencial de negócios do seu painel. Selecionei as principais atividades de maior impacto para você realizar:`,
        filteredRecommendations: recommendations.slice(0, 4),
        actionPills: commonPills,
      };
    }

    case 'UNKNOWN':
    default: {
      return {
        messageText: `Entendi sua mensagem. Para te apoiar com máxima precisão comercial na sua agenda e carteira, selecionei as principais prioridades disponíveis para ação imediata:`,
        filteredRecommendations: recommendations.slice(0, 4),
        actionPills: commonPills,
      };
    }
  }
}
