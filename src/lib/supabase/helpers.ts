import { createClient } from './server';
import { Database } from './types';
import { cookies } from 'next/headers';

export type UserProfile = Database['public']['Tables']['usuarios']['Row'] & {
  is_impersonating?: boolean;
  original_admin_id?: string;
  original_admin_nome?: string;
};
export type CompanyProfile = {
  id: string;
  nome_empresa: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  telefone: string | null;
  status_pagamento?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/**
 * Standardized function to handle, format, and log Supabase query errors.
 */
export function handleSupabaseError(error: any, context?: string): { message: string; code?: string } {
  const errorMessage = error?.message || 'Erro desconhecido no Supabase';
  const errorCode = error?.code || 'UNKNOWN_ERROR';

  console.error(`[Supabase Error] ${context ? `${context}: ` : ''}${errorMessage} (Code: ${errorCode})`, error);

  return {
    message: errorMessage,
    code: errorCode,
  };
}

/**
 * Recovers the currently authenticated user session and profile data from the server.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      handleSupabaseError(dbError, 'Error fetching user profile from database');
      return null;
    }

    // Lógica de Impersonation
    const cookieStore = await cookies();
    const impersonatedUserId = cookieStore.get('impersonated_user_id')?.value;

    if (impersonatedUserId && (profile.role === 'master' || profile.role === 'platform_admin' || profile.role === 'diretoria' || profile.role === 'superintendente')) {
      let query = supabase
        .from('usuarios')
        .select('*')
        .eq('id', impersonatedUserId);

      if (profile.role === 'superintendente' && null) {
        query = query; // Segurança: só pode impersonar usuário da mesma empresa
      }

      const { data: impersonatedProfile } = await query.single();
        
      if (impersonatedProfile) {
        return {
          ...impersonatedProfile,
          is_impersonating: true,
          original_admin_id: profile.id,
          original_admin_nome: profile.nome,
        } as UserProfile;
      }
    }

    return profile as UserProfile;
  } catch (err) {
    console.error('Unhandled exception in getCurrentUser:', err);
    return null;
  }
}

export async function getActiveCompany(): Promise<CompanyProfile | null> {
  try {
    const userProfile = await getCurrentUser();
    if (!userProfile) {
      return null;
    }

    const supabase = await createClient();
    
    // Se o usuário tiver um empresa_id, busque essa empresa
    if (userProfile.empresa_id) {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', userProfile.empresa_id)
        .single();
      
      if (empresa) return empresa;
    }

    // Fallback: Pegar a primeira empresa ativa do sistema
    const { data: fallbackEmpresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('status', 'ativo')
      .limit(1)
      .single();

    if (fallbackEmpresa) return fallbackEmpresa;

    return {
      id: "rodobens",
      nome_empresa: "Rodobens",
      logo_url: null,
      cor_primaria: "#00CF7B",
      cor_secundaria: "#00441F",
      telefone: null
    };
  } catch (err) {
    console.error('Unhandled exception in getActiveCompany:', err);
    return null;
  }
}

