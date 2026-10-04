'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { z } from 'zod';

const empresaIdSchema = z.string().uuid('ID de empresa inválido.');

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

function validateMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case 'image/png':
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    case 'image/jpeg':
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    case 'image/webp':
      // RIFF nos bytes 0-3, WEBP nos bytes 8-11
      return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
          && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    case 'image/gif':
      // GIF87a ou GIF89a
      return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38
          && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61;
    default:
      return false;
  }
}

export type UploadLogoResult = {
  success: boolean;
  message: string;
  logo_url?: string;
};

/**
 * Recebe o arquivo de logo via FormData, valida magic bytes no servidor,
 * faz upload no Supabase Storage e retorna a URL pública.
 */
export async function uploadLogoAction(formData: FormData): Promise<UploadLogoResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Não autenticado.' };

    const empresaIdParsed = empresaIdSchema.safeParse(formData.get('empresaId'));
    if (!empresaIdParsed.success) {
      return { success: false, message: 'ID de empresa inválido.' };
    }
    const empresaId = empresaIdParsed.data;

    if (user.role !== 'master' && user.id !== empresaId) {
      return { success: false, message: 'Sem permissão para alterar esta empresa.' };
    }

    const file = formData.get('logo') as File | null;
    if (!file || file.size === 0) {
      return { success: false, message: 'Nenhum arquivo selecionado.' };
    }

    if (file.size > MAX_LOGO_BYTES) {
      return { success: false, message: 'Logo deve ter no máximo 2MB.' };
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { success: false, message: 'Formato inválido. Use PNG, JPEG, WEBP ou GIF.' };
    }

    const buffer = await file.arrayBuffer();
    const header = new Uint8Array(buffer.slice(0, 12));

    if (!validateMagicBytes(header, file.type)) {
      return { success: false, message: 'Arquivo inválido ou corrompido.' };
    }

    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `${empresaId}/logo.${ext}`;

    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from('empresas')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('Erro ao fazer upload do logo:', uploadError);
      return { success: false, message: 'Erro no upload. Tente novamente.' };
    }

    const { data: { publicUrl } } = supabase.storage.from('empresas').getPublicUrl(path);

    return { success: true, message: 'Logo enviado com sucesso!', logo_url: publicUrl };
  } catch (err) {
    console.error('Erro interno no upload do logo:', err);
    return { success: false, message: 'Erro interno. Tente novamente.' };
  }
}
