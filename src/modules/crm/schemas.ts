import { z } from 'zod';

const emailOuVazio = z
  .string()
  .nullable()
  .optional()
  .refine((v) => !v || z.string().email().safeParse(v).success, 'E-mail inválido.');

const uuidOuVazio = (msg: string) =>
  z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || z.string().uuid().safeParse(v).success, msg);

export const leadIdSchema = z.string().uuid('ID de lead inválido.');
export const negocioIdSchema = z.string().uuid('ID de negócio inválido.');
export const followupIdSchema = z.string().uuid('ID de tarefa inválido.');

export const createLeadSchema = z.object({
  nome: z.string().trim().min(1, 'O nome é obrigatório.').max(255, 'Nome muito longo.'),
  telefone: z.string().max(20, 'Telefone muito longo.').nullable().optional(),
  email: emailOuVazio,
  etapaFunil: z.string().max(50).nullable().optional(),
  origem: z.string().max(100, 'Origem muito longa.').nullable().optional(),
  observacoes: z.string().max(5000, 'Observação muito longa.').nullable().optional(),
  gerenteId: uuidOuVazio('Gerente de Negócios selecionado é inválido.'),
  tipoParceiro: z.enum(['base', 'lead']).default('base'),
  codigoPv: z.string().max(100).nullable().optional(),
  nomeResponsavel: z.string().max(255).nullable().optional(),
  cidade: z.string().max(255).nullable().optional(),
  estado: z.string().max(2).nullable().optional(),
});

export const updateLeadSchema = createLeadSchema.omit({ etapaFunil: true });

export const updateNegocioStageSchema = z.object({
  negocioId: negocioIdSchema,
  newStage: z.enum(
    ['em_atendimento', 'qualificacao', 'simulacao_apresentada', 'proposta_enviada', 'negociacao', 'ganho', 'perdido'],
    { message: 'Etapa inválida.' },
  ),
  propostaId: z.string().uuid('ID de proposta inválido.').nullable().optional(),
});

export const updateParceiroStageSchema = z.object({
  leadId: leadIdSchema,
  newStage: z.enum(
    ['mapeado', 'em_qualificacao', 'em_nomeacao', 'base_gerando_oportunidades', 'base_em_nutricao', 'base_sem_oportunidades', 'perdido'],
    { message: 'Etapa inválida.' },
  ),
});

export const createFollowupSchema = z.object({
  leadId: leadIdSchema,
  titulo: z.string().trim().min(1, 'O título é obrigatório.').max(255, 'Título muito longo.'),
  descricao: z.string().max(2000, 'Descrição muito longa.').nullable().optional(),
  dataFollowup: z
    .string()
    .min(1, 'A data é obrigatória.')
    .refine((v) => !isNaN(Date.parse(v)), 'Data inválida.'),
  tipo: z.string().max(50).nullable().optional(),
});

export const toggleFollowupStatusSchema = z.object({
  followupId: followupIdSchema,
  leadId: leadIdSchema,
  currentStatus: z.enum(['pendente', 'concluido'], { message: 'Status inválido.' }),
});

export const createNegocioManualSchema = z.object({
  clienteId: leadIdSchema,
  titulo: z.string().trim().min(1, 'O título do negócio é obrigatório.').max(255, 'Título muito longo.'),
  modalidade: z.string().max(50, 'Modalidade muito longa.').nullable().optional(),
  credito: z.number().min(0, 'Crédito não pode ser negativo.').finite('Crédito inválido.'),
  etapaFunil: z.string().max(50).nullable().optional(),
});

export const appendObservationSchema = z.object({
  leadId: leadIdSchema,
  novaObservacao: z.string().trim().min(1, 'A observação não pode ser vazia.').max(5000, 'Observação muito longa.'),
});
