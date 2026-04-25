import { createClient } from '@supabase/supabase-js'

// Estas variáveis serão preenchidas após a conexão com Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      pousadajuliana_hospedes: {
        Row: {
          id: string
          nome_completo: string
          cpf: string
          email: string
          telefone: string
          data_nascimento: string
          data_cadastro: string
        }
        Insert: {
          id?: string
          nome_completo: string
          cpf: string
          email: string
          telefone: string
          data_nascimento: string
          data_cadastro?: string
        }
        Update: {
          id?: string
          nome_completo?: string
          cpf?: string
          email?: string
          telefone?: string
          data_nascimento?: string
          data_cadastro?: string
        }
      }
      pousadajuliana_hospedagens: {
        Row: {
          id: string
          hospede_id: string
          data_entrada: string
          data_saida: string
          data_checkin: string
        }
        Insert: {
          id?: string
          hospede_id: string
          data_entrada: string
          data_saida: string
          data_checkin?: string
        }
        Update: {
          id?: string
          hospede_id?: string
          data_entrada?: string
          data_saida?: string
          data_checkin?: string
        }
      }
      pousadajuliana_administradores: {
        Row: {
          id: string
          usuario: string
          senha: string
          nome: string
        }
        Insert: {
          id?: string
          usuario: string
          senha: string
          nome: string
        }
        Update: {
          id?: string
          usuario?: string
          senha?: string
          nome?: string
        }
      }
    }
  }
}