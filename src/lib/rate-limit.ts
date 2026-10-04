import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Se o Upstash não estiver configurado, os limitadores ficam `null` e
// `checkRateLimit` retorna sempre sucesso (no-op) — não bloqueia o app.
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'),
      prefix: 'ratelimit:login',
    })
  : null;

export const passwordResetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '15 m'),
      prefix: 'ratelimit:pwreset',
    })
  : null;

export const registerRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 m'),
      prefix: 'ratelimit:register',
    })
  : null;

/**
 * Lê o IP do cliente a partir do header x-forwarded-for (injetado pela Vercel).
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1';
}

const RATE_LIMIT_MESSAGE =
  'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.';

/**
 * Verifica o rate limit para a chave informada. Se o Upstash não estiver
 * configurado (limiter null), retorna sucesso sem aplicar nenhum limite.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<{ success: boolean; message?: string }> {
  if (!limiter) {
    return { success: true };
  }

  const { success } = await limiter.limit(key);

  if (!success) {
    return { success: false, message: RATE_LIMIT_MESSAGE };
  }

  return { success: true };
}
