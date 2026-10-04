export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      administradoras: {
        Row: {
          ativa: boolean
          created_at: string
          engine_key: string | null
          id: string
          nome: string
          possui_engine: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          engine_key?: string | null
          id?: string
          nome: string
          possui_engine?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          engine_key?: string | null
          id?: string
          nome?: string
          possui_engine?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          empresa_id: string | null
          entidade: string
          entidade_id: string | null
          id: string
          payload: Json | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          empresa_id?: string | null
          entidade: string
          entidade_id?: string | null
          id?: string
          payload?: Json | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          empresa_id?: string | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          payload?: Json | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          desconto_primeira_parcela: number
          desconto_taxa_adm: number
          id: string
          nome: string
          reducao_meia_parcela_qtd: number
          segmentos: string[]
          status: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          desconto_primeira_parcela?: number
          desconto_taxa_adm?: number
          id?: string
          nome: string
          reducao_meia_parcela_qtd?: number
          segmentos: string[]
          status?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          desconto_primeira_parcela?: number
          desconto_taxa_adm?: number
          id?: string
          nome?: string
          reducao_meia_parcela_qtd?: number
          segmentos?: string[]
          status?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          percentual_comissao: number
          simulacao_id: string | null
          status: string | null
          updated_at: string
          valor_comissao: number
          valor_credito: number
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          percentual_comissao: number
          simulacao_id?: string | null
          status?: string | null
          updated_at?: string
          valor_comissao: number
          valor_credito: number
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          percentual_comissao?: number
          simulacao_id?: string | null
          status?: string | null
          updated_at?: string
          valor_comissao?: number
          valor_credito?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_administradoras: {
        Row: {
          administradora_id: string
          ativa: boolean
          created_at: string
          empresa_id: string
          id: string
        }
        Insert: {
          administradora_id: string
          ativa?: boolean
          created_at?: string
          empresa_id: string
          id?: string
        }
        Update: {
          administradora_id?: string
          ativa?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_administradoras_administradora_id_fkey"
            columns: ["administradora_id"]
            isOneToOne: false
            referencedRelation: "administradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_administradoras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          data_vencimento: string | null
          dominio: string | null
          email_contato: string | null
          endereco: string | null
          estado: string | null
          id: string
          logo_url: string | null
          nome_empresa: string
          numero: string | null
          plano_id: string | null
          razao_social: string | null
          status: Database["public"]["Enums"]["empresa_status"]
          status_pagamento: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          data_vencimento?: string | null
          dominio?: string | null
          email_contato?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_empresa: string
          numero?: string | null
          plano_id?: string | null
          razao_social?: string | null
          status?: Database["public"]["Enums"]["empresa_status"]
          status_pagamento?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          data_vencimento?: string | null
          dominio?: string | null
          email_contato?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_empresa?: string
          numero?: string | null
          plano_id?: string | null
          razao_social?: string | null
          status?: Database["public"]["Enums"]["empresa_status"]
          status_pagamento?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_rates: {
        Row: {
          annual_rate: number
          created_at: string
          id: string
          institution_code: string | null
          institution_name: string
          modality: string
          monthly_rate: number
          person_type: string
          reference_date: string
          source: string | null
          updated_at: string
        }
        Insert: {
          annual_rate: number
          created_at?: string
          id?: string
          institution_code?: string | null
          institution_name: string
          modality: string
          monthly_rate: number
          person_type: string
          reference_date: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          annual_rate?: number
          created_at?: string
          id?: string
          institution_code?: string | null
          institution_name?: string
          modality?: string
          monthly_rate?: number
          person_type?: string
          reference_date?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      followups: {
        Row: {
          created_at: string
          data_followup: string
          descricao: string | null
          empresa_id: string
          id: string
          lead_id: string
          status: string | null
          tipo: string | null
          titulo: string
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          data_followup: string
          descricao?: string | null
          empresa_id: string
          id?: string
          lead_id: string
          status?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          data_followup?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          lead_id?: string
          status?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followups_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cidade: string | null
          codigo_pv: string | null
          created_at: string
          email: string | null
          empresa_id: string
          estado: string | null
          etapa_funil: string | null
          id: string
          nome: string
          nome_responsavel: string | null
          observacoes: string | null
          origem: string | null
          telefone: string | null
          temperatura: string | null
          tipo_parceiro: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          cidade?: string | null
          codigo_pv?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          estado?: string | null
          etapa_funil?: string | null
          id?: string
          nome: string
          nome_responsavel?: string | null
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo_parceiro?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          cidade?: string | null
          codigo_pv?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          estado?: string | null
          etapa_funil?: string | null
          id?: string
          nome?: string
          nome_responsavel?: string | null
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo_parceiro?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          meta_credito: number
          meta_fechamentos: number
          periodo: string
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          meta_credito: number
          meta_fechamentos?: number
          periodo: string
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          meta_credito?: number
          meta_fechamentos?: number
          periodo?: string
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios_crm: {
        Row: {
          administradora: string | null
          cliente_id: string
          created_at: string
          credito: number
          empresa_id: string
          etapa_funil: string
          id: string
          modalidade: string
          motivo_perda: string | null
          origem: string | null
          proposta_id: string | null
          proximo_followup: string | null
          temperatura: string | null
          titulo: string
          ultima_interacao: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          administradora?: string | null
          cliente_id: string
          created_at?: string
          credito?: number
          empresa_id: string
          etapa_funil?: string
          id?: string
          modalidade: string
          motivo_perda?: string | null
          origem?: string | null
          proposta_id?: string | null
          proximo_followup?: string | null
          temperatura?: string | null
          titulo: string
          ultima_interacao?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          administradora?: string | null
          cliente_id?: string
          created_at?: string
          credito?: number
          empresa_id?: string
          etapa_funil?: string
          id?: string
          modalidade?: string
          motivo_perda?: string | null
          origem?: string | null
          proposta_id?: string | null
          proximo_followup?: string | null
          temperatura?: string | null
          titulo?: string
          ultima_interacao?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_crm_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_crm_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_crm_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_crm_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          limite_vendedores: number
          nome: string
          updated_at: string
          valor_mensal: number | null
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          limite_vendedores?: number
          nome: string
          updated_at?: string
          valor_mensal?: number | null
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          limite_vendedores?: number
          nome?: string
          updated_at?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      propostas: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          lead_id: string | null
          negocio_id: string | null
          pdf_url: string | null
          public_link: string | null
          simulacao_id: string | null
          status: string | null
          updated_at: string
          vendedor_id: string | null
          visualizacoes: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          pdf_url?: string | null
          public_link?: string | null
          simulacao_id?: string | null
          status?: string | null
          updated_at?: string
          vendedor_id?: string | null
          visualizacoes?: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          pdf_url?: string | null
          public_link?: string | null
          simulacao_id?: string | null
          status?: string | null
          updated_at?: string
          vendedor_id?: string | null
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "propostas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_crm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacao_cotas: {
        Row: {
          created_at: string
          credito_bruto: number
          credito_liquido: number
          id: string
          lance_embutido: number
          lance_total: number
          modalidade: string
          ordem: number
          parcela_final: number
          parcela_inicial: number
          prazo: number
          produto: string
          recursos_proprios: number
          resultado_json: Json
          saldo_devedor: number
          simulacao_id: string
        }
        Insert: {
          created_at?: string
          credito_bruto: number
          credito_liquido: number
          id?: string
          lance_embutido?: number
          lance_total?: number
          modalidade: string
          ordem: number
          parcela_final: number
          parcela_inicial: number
          prazo: number
          produto: string
          recursos_proprios?: number
          resultado_json: Json
          saldo_devedor?: number
          simulacao_id: string
        }
        Update: {
          created_at?: string
          credito_bruto?: number
          credito_liquido?: number
          id?: string
          lance_embutido?: number
          lance_total?: number
          modalidade?: string
          ordem?: number
          parcela_final?: number
          parcela_inicial?: number
          prazo?: number
          produto?: string
          recursos_proprios?: number
          resultado_json?: Json
          saldo_devedor?: number
          simulacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulacao_cotas_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacoes: {
        Row: {
          administradora_id: string | null
          created_at: string
          credito_liquido: number
          credito_total: number
          empresa_id: string
          engine_key: string
          engine_version: string
          financing_annual_rate_used: number | null
          financing_down_payment: number | null
          financing_monthly_payment: number | null
          financing_monthly_rate_used: number | null
          financing_principal: number | null
          financing_reference_date: string | null
          financing_source: string | null
          financing_term: number | null
          financing_total_paid: number | null
          id: string
          input_json: Json
          lance_embutido: number
          lance_total: number
          lead_id: string | null
          modalidade: string
          negocio_id: string | null
          output_json: Json
          parcela_final: number
          parcela_inicial: number
          produto: string
          recursos_proprios: number
          saldo_devedor: number
          status: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          administradora_id?: string | null
          created_at?: string
          credito_liquido: number
          credito_total: number
          empresa_id: string
          engine_key: string
          engine_version: string
          financing_annual_rate_used?: number | null
          financing_down_payment?: number | null
          financing_monthly_payment?: number | null
          financing_monthly_rate_used?: number | null
          financing_principal?: number | null
          financing_reference_date?: string | null
          financing_source?: string | null
          financing_term?: number | null
          financing_total_paid?: number | null
          id?: string
          input_json: Json
          lance_embutido?: number
          lance_total?: number
          lead_id?: string | null
          modalidade: string
          negocio_id?: string | null
          output_json: Json
          parcela_final: number
          parcela_inicial: number
          produto: string
          recursos_proprios?: number
          saldo_devedor?: number
          status?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          administradora_id?: string | null
          created_at?: string
          credito_liquido?: number
          credito_total?: number
          empresa_id?: string
          engine_key?: string
          engine_version?: string
          financing_annual_rate_used?: number | null
          financing_down_payment?: number | null
          financing_monthly_payment?: number | null
          financing_monthly_rate_used?: number | null
          financing_principal?: number | null
          financing_reference_date?: string | null
          financing_source?: string | null
          financing_term?: number | null
          financing_total_paid?: number | null
          id?: string
          input_json?: Json
          lance_embutido?: number
          lance_total?: number
          lead_id?: string | null
          modalidade?: string
          negocio_id?: string | null
          output_json?: Json
          parcela_final?: number
          parcela_inicial?: number
          produto?: string
          recursos_proprios?: number
          saldo_devedor?: number
          status?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_administradora_id_fkey"
            columns: ["administradora_id"]
            isOneToOne: false
            referencedRelation: "administradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios_crm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          aceite_termos_em: string | null
          ativo: boolean
          avatar_url: string | null
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nome: string
          primeiro_acesso: boolean
          role: Database["public"]["Enums"]["user_role"]
          supervisor_id: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          aceite_termos_em?: string | null
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          empresa_id?: string | null
          id: string
          nome: string
          primeiro_acesso?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          supervisor_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          aceite_termos_em?: string | null
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          primeiro_acesso?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          supervisor_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_empresa: { Args: never; Returns: string }
      get_auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_public_proposal_details: { Args: { p_id: string }; Returns: Json }
      incrementar_visualizacao_proposta: {
        Args: { p_id: string }
        Returns: undefined
      }
      is_active_user: { Args: never; Returns: boolean }
      is_company_suspended: { Args: { emp_id: string }; Returns: boolean }
    }
    Enums: {
      empresa_status: "ativo" | "suspenso"
      user_role:
        | "platform_admin"
        | "empresa_admin"
        | "vendedor"
        | "diretoria"
        | "master"
        | "superintendente"
        | "regional"
        | "gerente_negocio"
        | "ponto_venda"
      usuario_status: "ativo" | "inativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      empresa_status: ["ativo", "suspenso"],
      user_role: [
        "platform_admin",
        "empresa_admin",
        "vendedor",
        "diretoria",
        "master",
        "superintendente",
        "regional",
        "gerente_negocio",
        "ponto_venda",
      ],
      usuario_status: ["ativo", "inativo"],
    },
  },
} as const
