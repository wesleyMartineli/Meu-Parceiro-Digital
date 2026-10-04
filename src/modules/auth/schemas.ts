import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Por favor, informe um e-mail válido.'),
  password: z.string().min(1, 'Por favor, informe sua senha.'),
});

export const submitLeadSchema = z.object({
  nome: z.string().min(1, 'Por favor, informe seu nome.').max(255),
  nome_empresa: z.string().min(1, 'Por favor, informe o nome da empresa.').max(255),
  email: z.string().email('Por favor, informe um e-mail válido.'),
  telefone: z.string().optional(),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Por favor, informe um e-mail válido.'),
});

export const passwordChangeSchema = z
  .object({
    password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas informadas não coincidem.',
    path: ['confirmPassword'],
  });

export const signUpSchema = z.object({
  nome: z.string().min(1, 'Por favor, informe seu nome.').max(255),
  email: z.string().email('Por favor, informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres.'),
  nome_empresa: z.string().min(1, 'Por favor, informe o nome da empresa.').max(255),
  telefone: z.string().max(20).optional(),
});
