import { z } from 'zod';

export const createPropostaSchema = z.object({
  leadId: z.string().uuid('ID de lead inválido.'),
  simulacaoId: z.string().uuid('ID de simulação inválido.'),
  pdfBase64: z.string().min(1, 'Arquivo não informado.'),
  fileType: z.enum(['pdf', 'png']).default('pdf').optional(),
});

export const propostaIdSchema = z.string().uuid('ID de proposta inválido.');
