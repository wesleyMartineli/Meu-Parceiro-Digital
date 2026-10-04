import { z } from 'zod';

export const createUserSchema = z.object({
  nome: z.string().min(1, 'Por favor, informe o nome.').max(255, 'Nome muito longo.'),
  email: z.string().email('Por favor, informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres.'),
  role: z.enum(['master', 'platform_admin', 'diretoria', 'superintendente', 'regional', 'gerente_negocio', 'ponto_venda']).optional(),
  supervisor_id: z.string().uuid('ID de supervisor inválido.').optional().nullable(),
});

export const userIdSchema = z.string().uuid('ID de usuário inválido.');
