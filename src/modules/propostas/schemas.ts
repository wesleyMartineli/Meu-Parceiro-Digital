import { z } from 'zod';

export const createPropostaSchema = z.object({
  leadId: z.string().uuid('ID de lead inválido.'),
  simulacaoId: z.string().uuid('ID de simulação inválido.'),
  pdfBase64: z.string().min(1, 'Arquivo não informado.'),
  fileType: z.enum(['pdf', 'png']).default('pdf').optional(),
  oportunidadeId: z.string().uuid('ID de oportunidade inválido.').optional().nullable(),
});

export const propostaIdSchema = z.string().uuid('ID de proposta inválido.');
