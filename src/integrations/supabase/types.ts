export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_description: string
          created_at: string
          id: number
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_description: string
          created_at?: string
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_description?: string
          created_at?: string
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          arquivo_path: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          erro_mensagem: string | null
          id: number
          nome: string
          status: Database["public"]["Enums"]["backup_status"]
          tamanho_bytes: number | null
          tipo: Database["public"]["Enums"]["backup_type"]
        }
        Insert: {
          arquivo_path: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          erro_mensagem?: string | null
          id?: number
          nome: string
          status: Database["public"]["Enums"]["backup_status"]
          tamanho_bytes?: number | null
          tipo: Database["public"]["Enums"]["backup_type"]
        }
        Update: {
          arquivo_path?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          erro_mensagem?: string | null
          id?: number
          nome?: string
          status?: Database["public"]["Enums"]["backup_status"]
          tamanho_bytes?: number | null
          tipo?: Database["public"]["Enums"]["backup_type"]
        }
        Relationships: [
          {
            foreignKeyName: "backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          categoria: string | null
          chave: string
          created_at: string
          descricao: string | null
          editavel: boolean
          id: number
          tipo: Database["public"]["Enums"]["config_type"]
          updated_at: string
          updated_by: string | null
          valor: string
        }
        Insert: {
          categoria?: string | null
          chave: string
          created_at?: string
          descricao?: string | null
          editavel?: boolean
          id?: number
          tipo: Database["public"]["Enums"]["config_type"]
          updated_at?: string
          updated_by?: string | null
          valor: string
        }
        Update: {
          categoria?: string | null
          chave?: string
          created_at?: string
          descricao?: string | null
          editavel?: boolean
          id?: number
          tipo?: Database["public"]["Enums"]["config_type"]
          updated_at?: string
          updated_by?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_category_id: number
          file_mime_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: number
          is_public: boolean
          title: string
          updated_at: string
          uploaded_by_user_id: string | null
          validity_date: string | null
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category_id: number
          file_mime_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: number
          is_public?: boolean
          title: string
          updated_at?: string
          uploaded_by_user_id?: string | null
          validity_date?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category_id?: number
          file_mime_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: number
          is_public?: boolean
          title?: string
          updated_at?: string
          uploaded_by_user_id?: string | null
          validity_date?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          data_evento: string
          id: number
          municipio_id: number | null
          nome: string
          numero_processo: string | null
          objeto: string
          updated_at: string | null
          valor_concedente: number | null
          valor_proponente: number | null
        }
        Insert: {
          created_at?: string | null
          data_evento: string
          id?: number
          municipio_id?: number | null
          nome: string
          numero_processo?: string | null
          objeto: string
          updated_at?: string | null
          valor_concedente?: number | null
          valor_proponente?: number | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string
          id?: number
          municipio_id?: number | null
          nome?: string
          numero_processo?: string | null
          objeto?: string
          updated_at?: string | null
          valor_concedente?: number | null
          valor_proponente?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          created_at: string
          definition: string
          id: number
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: number
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: number
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          cnpj: string
          created_at: string
          email: string | null
          id: number
          mayor_name: string | null
          municipality_classification_id: number | null
          name: string
          phone: string | null
          population: number | null
          region_id: number | null
          regional_nucleus_id: number | null
          secretary_name: string | null
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          email?: string | null
          id?: number
          mayor_name?: string | null
          municipality_classification_id?: number | null
          name: string
          phone?: string | null
          population?: number | null
          region_id?: number | null
          regional_nucleus_id?: number | null
          secretary_name?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          email?: string | null
          id?: number
          mayor_name?: string | null
          municipality_classification_id?: number | null
          name?: string
          phone?: string | null
          population?: number | null
          region_id?: number | null
          regional_nucleus_id?: number | null
          secretary_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_municipality_classification_id_fkey"
            columns: ["municipality_classification_id"]
            isOneToOne: false
            referencedRelation: "municipality_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "municipalities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regioes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "municipalities_regional_nucleus_id_fkey"
            columns: ["regional_nucleus_id"]
            isOneToOne: false
            referencedRelation: "regional_nuclei"
            referencedColumns: ["id"]
          },
        ]
      }
      municipality_classifications: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: number
          is_active: boolean
          subscription_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          is_active?: boolean
          subscription_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          is_active?: boolean
          subscription_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          is_public: boolean
          is_read: boolean
          message: string
          recipient_user_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: number
          is_public?: boolean
          is_read?: boolean
          message: string
          recipient_user_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: number
          is_public?: boolean
          is_read?: boolean
          message?: string
          recipient_user_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      process_attachments: {
        Row: {
          created_at: string
          document_id: number
          id: number
          process_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: number
          id?: number
          process_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: number
          id?: number
          process_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_attachments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_comments: {
        Row: {
          comment: string
          created_at: string
          id: number
          process_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: number
          process_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: number
          process_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_comments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      process_history: {
        Row: {
          change_description: string
          created_at: string
          id: number
          process_id: number
          user_id: string | null
        }
        Insert: {
          change_description: string
          created_at?: string
          id?: number
          process_id: number
          user_id?: string | null
        }
        Update: {
          change_description?: string
          created_at?: string
          id?: number
          process_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_history_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      process_parcels: {
        Row: {
          created_at: string
          id: number
          parcel_number: number
          payment_date: string | null
          process_id: number
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: number
          parcel_number: number
          payment_date?: string | null
          process_id: number
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: number
          parcel_number?: number
          payment_date?: string | null
          process_id?: number
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "process_parcels_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_favorites: {
        Row: {
          id: number
          user_id: string
          process_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          process_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          process_id?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_favorites_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_technical_notes: {
        Row: {
          id: number
          user_id: string
          process_id: number
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          process_id: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          process_id?: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_technical_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_technical_notes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          address: string | null
          created_at: string
          id: number
          last_tramitacao: string | null
          latitude: number | null
          licitado_value: number | null
          link_plataforma_governo: string | null
          longitude: number | null
          municipality_id: number
          object: string
          portaria_number: string | null
          process_number: string
          regional_nucleus_id: number | null
          status_id: number
          total_concedente_value: number
          total_portaria_value: number
          total_proponente_value: number
          updated_at: string
          vigencia_date: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          last_tramitacao?: string | null
          latitude?: number | null
          licitado_value?: number | null
          link_plataforma_governo?: string | null
          longitude?: number | null
          municipality_id: number
          object: string
          portaria_number?: string | null
          process_number: string
          regional_nucleus_id?: number | null
          status_id: number
          total_concedente_value: number
          total_portaria_value: number
          total_proponente_value: number
          updated_at?: string
          vigencia_date: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          last_tramitacao?: string | null
          latitude?: number | null
          licitado_value?: number | null
          link_plataforma_governo?: string | null
          longitude?: number | null
          municipality_id?: number
          object?: string
          portaria_number?: string | null
          process_number?: string
          regional_nucleus_id?: number | null
          status_id?: number
          total_concedente_value?: number
          total_portaria_value?: number
          total_proponente_value?: number
          updated_at?: string
          vigencia_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_regional_nucleus_id_fkey"
            columns: ["regional_nucleus_id"]
            isOneToOne: false
            referencedRelation: "regional_nuclei"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_processos"
            referencedColumns: ["id"]
          },
        ]
      }
      public_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: number
          message: string
          process_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: number
          message: string
          process_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: number
          message?: string
          process_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_alerts_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      regioes: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: number
          nome: string
          sigla: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome: string
          sigla?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: number
          nome?: string
          sigla?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regional_nuclei: {
        Row: {
          acronym: string
          created_at: string
          email: string | null
          id: number
          name: string
          observations: string | null
          phone: string | null
          region_id: number | null
          technical_responsible_name: string | null
          updated_at: string
        }
        Insert: {
          acronym: string
          created_at?: string
          email?: string | null
          id?: number
          name: string
          observations?: string | null
          phone?: string | null
          region_id?: number | null
          technical_responsible_name?: string | null
          updated_at?: string
        }
        Update: {
          acronym?: string
          created_at?: string
          email?: string | null
          id?: number
          name?: string
          observations?: string | null
          phone?: string | null
          region_id?: number | null
          technical_responsible_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_nuclei_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regioes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: number
          role_id: number
        }
        Insert: {
          created_at?: string
          permission_id: number
          role_id: number
        }
        Update: {
          created_at?: string
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessoes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          updated_at: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id: string
          ip_address?: string | null
          token: string
          updated_at?: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          updated_at?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      status_processos: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          descricao: string | null
          id: number
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          nome: string
          ordem: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      backup_status: "processando" | "concluido" | "erro"
      backup_type: "completo" | "incremental" | "manual"
      config_type: "string" | "number" | "boolean" | "json"
      notification_type: "critical" | "important" | "informative"
      transfer_status:
        | "TEV"
        | "Em tramitação"
        | "Concluído"
        | "Convênio Simplificado"
        | "Diligência"
      transfer_type:
        | "obra"
        | "evento"
        | "patrocínio"
        | "termo de referência"
        | "convênio simplificado"
        | "convênio"
        | "convenio_normal"
        | "termo_de_fomento"
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
      backup_status: ["processando", "concluido", "erro"],
      backup_type: ["completo", "incremental", "manual"],
      config_type: ["string", "number", "boolean", "json"],
      notification_type: ["critical", "important", "informative"],
      transfer_status: [
        "TEV",
        "Em tramitação",
        "Concluído",
        "Convênio Simplificado",
        "Diligência",
      ],
      transfer_type: [
        "obra",
        "evento",
        "patrocínio",
        "termo de referência",
        "convênio simplificado",
        "convênio",
        "convenio_normal",
        "termo_de_fomento",
      ],
    },
  },
} as const
