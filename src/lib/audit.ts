import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

type LogAuditEventParams = {
  empresaId?: string | null;
  usuarioId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  payload?: Json;
};

/**
 * Registra um evento de auditoria em `audit_logs` de forma não-bloqueante
 * (via `after()`, após a resposta ser enviada). Falhas são apenas logadas no
 * console e nunca propagadas — nunca deve quebrar o fluxo principal.
 *
 * NUNCA inclua senhas, tokens, cookies ou dados sensíveis no payload.
 */
export function logAuditEvent(params: LogAuditEventParams): void {
  const { empresaId, usuarioId, acao, entidade, entidadeId, payload } = params;

  after(async () => {
    try {
      const supabase = await createClient();
      await supabase.from('audit_logs').insert({
                usuario_id: usuarioId ?? null,
        acao,
        entidade,
        entidade_id: entidadeId ?? null,
        payload: payload ?? null,
      });
    } catch (error) {
      console.error('[audit] Falha ao registrar evento de auditoria:', error);
    }
  });
}
