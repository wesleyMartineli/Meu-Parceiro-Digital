'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/helpers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type ActionState = {
  success: boolean;
  message: string;
};

const createMaterialSchema = z.object({
  titulo: z.string().min(2, 'Título é obrigatório.'),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
});

export async function uploadMaterialAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'master' && user.role !== 'platform_admin')) {
      return { success: false, message: 'Não autorizado.' };
    }

    const file = formData.get('arquivo') as File;
    if (!file || file.size === 0) {
      return { success: false, message: 'Arquivo não selecionado ou inválido.' };
    }

    // Validar limite de 50MB (50 * 1024 * 1024)
    if (file.size > 52428800) {
      return { success: false, message: 'O arquivo excede o limite de 50MB.' };
    }

    const rawData = {
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
      categoria: formData.get('categoria') as string,
    };

    const validated = createMaterialSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0].message };
    }

    const supabase = await createClient();

    // 1. Upload do arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `materiais/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('materiais_apoio')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return { success: false, message: `Falha no upload do arquivo: ${uploadError.message || JSON.stringify(uploadError)}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('materiais_apoio')
      .getPublicUrl(filePath);

    // 2. Inserir no banco de dados
    const { error: dbError } = await (supabase as any).from('materiais_apoio').insert({
      titulo: validated.data.titulo,
      descricao: validated.data.descricao || null,
      categoria: validated.data.categoria || null,
      arquivo_url: publicUrlData.publicUrl,
      arquivo_nome: file.name,
      arquivo_tipo: file.type,
      tamanho_bytes: file.size,
      created_by: user.id,
    } as any);

    if (dbError) {
      console.error('Erro no insert:', dbError);
      // Tentativa de rollback do arquivo (opcional)
      await supabase.storage.from('materiais_apoio').remove([filePath]);
      return { success: false, message: `Erro ao salvar no banco: ${dbError.message || JSON.stringify(dbError)}` };
    }

    revalidatePath('/admin-master/materiais-apoio');
    revalidatePath('/materiais-apoio');
    
    return { success: true, message: 'Material salvo com sucesso!' };
  } catch (error) {
    console.error('Action error:', error);
    return { success: false, message: 'Ocorreu um erro inesperado.' };
  }
}

export async function deleteMaterialAction(id: string, fileUrl: string): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'master' && user.role !== 'platform_admin')) {
      return { success: false, message: 'Não autorizado.' };
    }

    const supabase = await createClient();

    // Remover do Storage primeiro
    // Extrair o path do arquivo a partir da URL pública
    const urlParts = fileUrl.split('/materiais_apoio/');
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      const { error: storageError } = await supabase.storage.from('materiais_apoio').remove([filePath]);
      if (storageError) {
        console.error('Erro ao deletar arquivo do storage:', storageError);
        // Mesmo com erro, vamos tentar remover do banco de dados (o arquivo pode já ter sido excluído)
      }
    }

    // Remover do banco
    const { error: dbError } = await (supabase as any).from('materiais_apoio').delete().eq('id', id);

    if (dbError) {
      console.error('Erro ao deletar do DB:', dbError);
      return { success: false, message: 'Erro ao deletar registro do banco.' };
    }

    revalidatePath('/admin-master/materiais-apoio');
    revalidatePath('/materiais-apoio');

    return { success: true, message: 'Material deletado com sucesso!' };
  } catch (error) {
    console.error('Action delete error:', error);
    return { success: false, message: 'Ocorreu um erro inesperado ao deletar.' };
  }
}

export async function getMateriais() {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('materiais_apoio')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar materiais:', error);
    return [];
  }
  return data;
}
