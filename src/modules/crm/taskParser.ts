/**
 * Parser de Linguagem Natural para o Assistente de Agendamento Comercial
 * Módulo: Minhas Tarefas / CRM
 */

export interface LeadCandidate {
  id: string;
  nome: string;
}

export type FollowupTipo = 'ligacao' | 'whatsapp' | 'reuniao' | 'visita' | 'reuniao_online' | 'reuniao_presencial' | 'email' | 'outros';

export interface ParsedTaskResult {
  rawPrompt: string;
  matchedLead: LeadCandidate | null;
  candidateLeads: LeadCandidate[];
  tipo: FollowupTipo;
  tipoLabel: string;
  dataFollowupIso: string; // Ex: '2026-10-15T14:00' (compatível com input datetime-local)
  dataFollowupFormatted: string; // Ex: 'Quinta-feira, 15/10 às 14:00'
  titulo: string;
  descricao: string;
  confidence: number;
}

const TIPO_LABELS: Record<FollowupTipo, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  reuniao_online: 'Reunião Online',
  reuniao_presencial: 'Reunião Presencial',
  reuniao: 'Reunião Online',
  visita: 'Reunião Presencial',
  email: 'E-mail',
  outros: 'Outros',
};

// Normalização de texto: minúsculas e sem acentos
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Detecta o tipo de tarefa baseado em palavras-chave
 */
function extractTipo(promptNorm: string): FollowupTipo {
  if (/\b(whats|whatsapp|zap|mensagem|msg|enviar msg)\b/.test(promptNorm)) {
    return 'whatsapp';
  }
  if (/\b(reuniao presencial|visita presencial|visita|visitar|presencial|ir ate|visita comercial)\b/.test(promptNorm)) {
    return 'reuniao_presencial';
  }
  if (/\b(reuniao online|online|meet|call|alinhamento|videochamada|zoom|apresentacao|reuniao)\b/.test(promptNorm)) {
    return 'reuniao_online';
  }
  if (/\b(email|e-mail|correio)\b/.test(promptNorm)) {
    return 'email';
  }
  if (/\b(ligar|ligacao|telefonar|chamada|ligue|telefonema)\b/.test(promptNorm)) {
    return 'ligacao';
  }
  return 'ligacao'; // Padrão comercial mais comum
}

/**
 * Identifica o lead / parceiro mencionado no texto
 */
function extractLead(promptNorm: string, leads: LeadCandidate[]): { matched: LeadCandidate | null; candidates: LeadCandidate[] } {
  if (!leads || leads.length === 0) {
    return { matched: null, candidates: [] };
  }

  const scoredLeads: { lead: LeadCandidate; score: number }[] = [];

  for (const lead of leads) {
    const leadNorm = normalizeText(lead.nome);
    if (!leadNorm) continue;

    // 1. Correspondência exata do nome completo
    if (promptNorm.includes(leadNorm)) {
      scoredLeads.push({ lead, score: 100 + leadNorm.length });
      continue;
    }

    // 2. Correspondência por partes do nome (primeiro nome, sobrenome)
    const leadParts = leadNorm.split(/\s+/).filter(p => p.length >= 3);
    let matchCount = 0;
    for (const part of leadParts) {
      const regex = new RegExp(`\\b${part}\\b`, 'i');
      if (regex.test(promptNorm)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      // Se acertou primeiro nome e tem mais de uma palavra
      const isFirstName = leadParts.length > 0 && new RegExp(`\\b${leadParts[0]}\\b`, 'i').test(promptNorm);
      const score = (matchCount * 25) + (isFirstName ? 20 : 0);
      scoredLeads.push({ lead, score });
    }
  }

  scoredLeads.sort((a, b) => b.score - a.score);

  if (scoredLeads.length > 0) {
    const best = scoredLeads[0];
    const candidates = scoredLeads.slice(0, 5).map(s => s.lead);
    // Se a pontuação for suficientemente alta
    if (best.score >= 40) {
      return { matched: best.lead, candidates };
    }
    return { matched: null, candidates };
  }

  return { matched: null, candidates: [] };
}

/**
 * Extrai data e hora em linguagem natural
 */
function extractDateTime(promptNorm: string, now: Date = new Date()): Date {
  const target = new Date(now);
  target.setSeconds(0);
  target.setMilliseconds(0);

  let dateAdjusted = false;

  // 1. Dias relativos diretos
  if (/\bdepois de amanha\b/.test(promptNorm)) {
    target.setDate(target.getDate() + 2);
    dateAdjusted = true;
  } else if (/\bamanha\b/.test(promptNorm)) {
    target.setDate(target.getDate() + 1);
    dateAdjusted = true;
  } else if (/\bhoje\b/.test(promptNorm)) {
    dateAdjusted = true;
  }

  // 2. Dias da semana (ex: "segunda", "terça-feira", "sexta")
  const diasSemana: { [key: string]: number } = {
    domingo: 0,
    segunda: 1,
    'segunda-feira': 1,
    terca: 2,
    'terca-feira': 2,
    quarta: 3,
    'quarta-feira': 3,
    quinta: 4,
    'quinta-feira': 4,
    sexta: 5,
    'sexta-feira': 5,
    sabado: 6,
  };

  for (const [diaStr, dayIndex] of Object.entries(diasSemana)) {
    const regex = new RegExp(`\\b${diaStr}\\b`, 'i');
    if (regex.test(promptNorm) && !dateAdjusted) {
      const currentDay = target.getDay();
      let diff = dayIndex - currentDay;
      if (diff <= 0) diff += 7; // Próximo dia da semana
      target.setDate(target.getDate() + diff);
      dateAdjusted = true;
      break;
    }
  }

  // 3. Daqui a X dias (ex: "daqui a 3 dias")
  const daquiADiasMatch = promptNorm.match(/daqui\s+(?:a\s+)?(\d+)\s+dias/);
  if (daquiADiasMatch && !dateAdjusted) {
    const dias = parseInt(daquiADiasMatch[1], 10);
    if (!isNaN(dias)) {
      target.setDate(target.getDate() + dias);
      dateAdjusted = true;
    }
  }

  // 4. Data explícita (ex: "dia 25", "dia 25/10", "25/10/2026")
  const dataExplicitaMatch = promptNorm.match(/(?:dia\s+)?(\d{1,2})(?:\/(\d{1,2}))?(?:\/(\d{2,4}))?/);
  if (dataExplicitaMatch && (promptNorm.includes('dia ' + dataExplicitaMatch[1]) || dataExplicitaMatch[2])) {
    const dia = parseInt(dataExplicitaMatch[1], 10);
    const mes = dataExplicitaMatch[2] ? parseInt(dataExplicitaMatch[2], 10) - 1 : target.getMonth();
    const ano = dataExplicitaMatch[3] ? parseInt(dataExplicitaMatch[3], 10) : target.getFullYear();

    if (dia >= 1 && dia <= 31) {
      target.setDate(dia);
      target.setMonth(mes);
      if (dataExplicitaMatch[3]) target.setFullYear(ano < 100 ? 2000 + ano : ano);
      dateAdjusted = true;
    }
  }

  // Se a data não foi dita e já passa das 17h, joga para amanhã
  if (!dateAdjusted && now.getHours() >= 17) {
    target.setDate(target.getDate() + 1);
  }

  // 5. Extração de Horário
  let hourAdjusted = false;

  // Formato: "às 14h", "14h30", "às 15:00", "15:30", "10h", "as 9"
  const horaMatch = promptNorm.match(/(?:as|as\s+)?(\d{1,2})(?:[:h](\d{2})|h)?(?:\s*(am|pm))?/i);
  if (horaMatch) {
    let horas = parseInt(horaMatch[1], 10);
    const minutos = horaMatch[2] ? parseInt(horaMatch[2], 10) : 0;
    const ampm = horaMatch[3]?.toLowerCase();

    if (ampm === 'pm' && horas < 12) horas += 12;
    if (ampm === 'am' && horas === 12) horas = 0;

    if (horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59) {
      target.setHours(horas, minutos, 0, 0);
      hourAdjusted = true;
    }
  }

  // Períodos do dia se não houver horário pontual
  if (!hourAdjusted) {
    if (/\b(de manha|pela manha|inicio da manha)\b/.test(promptNorm)) {
      target.setHours(9, 30, 0, 0);
      hourAdjusted = true;
    } else if (/\b(ao meio dia|no almoco|meio-dia)\b/.test(promptNorm)) {
      target.setHours(12, 0, 0, 0);
      hourAdjusted = true;
    } else if (/\b(a tarde|pela tarde|inicio da tarde)\b/.test(promptNorm)) {
      target.setHours(14, 30, 0, 0);
      hourAdjusted = true;
    } else if (/\b(no fim da tarde|fim do dia|ao final do dia|a noite)\b/.test(promptNorm)) {
      target.setHours(17, 30, 0, 0);
      hourAdjusted = true;
    }
  }

  // Padrão comercial
  if (!hourAdjusted) {
    target.setHours(10, 0, 0, 0);
  }

  return target;
}

/**
 * Limpa frases e extrai o assunto/título e descrição
 */
function extractTitleAndDesc(rawPrompt: string, matchedLead: LeadCandidate | null, tipo: FollowupTipo): { titulo: string; descricao: string } {
  const tipoLabel = TIPO_LABELS[tipo];
  const leadName = matchedLead ? matchedLead.nome : '';

  // Limpa comandos do início
  let cleanText = rawPrompt
    .replace(/^(agendar|marcar|criar|cadastrar|favor|lembrar de|lembrete de|preciso|fazer)\s+/i, '')
    .trim();

  // Remove menção ao lead no início para encontrar o objetivo real
  if (matchedLead) {
    const leadFirst = matchedLead.nome.split(' ')[0];
    cleanText = cleanText.replace(new RegExp(`^(?:ligar|mandar\\s+whatsapp|whatsapp|reuniao\\s+online|reuniao\\s+presencial|reuniao|visita|visitar|enviar\\s+email|email)?\\s*(?:para|com|no\\s+parceiro)?\\s*(${matchedLead.nome}|${leadFirst})\\b`, 'i'), '').trim();
  }

  // Procura por objetivo: "para ...", "sobre ...", "cobrando ...", "apresentar ..."
  const topicMatch = cleanText.match(/(?:para|sobre|referente a|a respeito de|cobrando|cobrar|alinhando|alinhar|apresentando|apresentar)\s+(.+)$/i);
  let topic = '';

  if (topicMatch && topicMatch[1]) {
    topic = topicMatch[1]
      .replace(/\b(amanha|hoje|depois de amanha|segunda|terca|quarta|quinta|sexta|sabado|domingo|as\s+\d+h?\d*)\b/gi, '')
      .trim();
    // Limpar conectores residuais
    topic = topic.replace(/^(para|sobre|com)\s+/i, '').replace(/[.,;!?]+$/, '').trim();
  }

  let titulo = '';
  if (leadName && topic) {
    titulo = `${tipoLabel} com ${leadName} - ${capitalize(topic)}`;
  } else if (leadName) {
    titulo = `${tipoLabel} de acompanhamento com ${leadName}`;
  } else if (topic) {
    titulo = `${tipoLabel}: ${capitalize(topic)}`;
  } else {
    titulo = `${tipoLabel} comercial`;
  }

  if (titulo.length > 100) {
    titulo = titulo.substring(0, 97) + '...';
  }

  const descricao = `Agendado via Assistente Inteligente. Contexto original: "${rawPrompt.trim()}"`;

  return { titulo, descricao };
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Função Principal de Análise de Tarefas em Linguagem Natural
 */
export function parseNaturalLanguageTask(prompt: string, leads: LeadCandidate[]): ParsedTaskResult {
  const rawPrompt = prompt.trim();
  const promptNorm = normalizeText(rawPrompt);

  const tipo = extractTipo(promptNorm);
  const { matched, candidates } = extractLead(promptNorm, leads);
  const targetDate = extractDateTime(promptNorm);

  const pad = (n: number) => String(n).padStart(2, '0');
  const dataFollowupIso = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;

  const diasDaSemanaExtenso = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diaSemana = diasDaSemanaExtenso[targetDate.getDay()];
  const dataFormatada = `${diaSemana}, ${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)} às ${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;

  const { titulo, descricao } = extractTitleAndDesc(rawPrompt, matched, tipo);

  let confidence = 0.5;
  if (matched) confidence += 0.3;
  if (/\b(amanha|hoje|depois de amanha|segunda|terca|quarta|quinta|sexta|as \d+h?)\b/i.test(promptNorm)) confidence += 0.2;

  return {
    rawPrompt,
    matchedLead: matched,
    candidateLeads: candidates,
    tipo,
    tipoLabel: TIPO_LABELS[tipo],
    dataFollowupIso,
    dataFollowupFormatted: dataFormatada,
    titulo,
    descricao,
    confidence: Math.min(confidence, 1),
  };
}
