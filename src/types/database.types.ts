export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          provider: string | null
          stripe_customer_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          stripe_customer_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          stripe_customer_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          is_unlimited: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          is_unlimited?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          is_unlimited?: boolean | null
          updated_at?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          model: string
          language: string
          status: string
          duration_seconds: number | null
          questions_answered: number | null
          created_at: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          model: string
          language?: string
          status?: string
          duration_seconds?: number | null
          questions_answered?: number | null
          created_at?: string | null
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          model?: string
          language?: string
          status?: string
          duration_seconds?: number | null
          questions_answered?: number | null
          created_at?: string | null
          ended_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          filename: string
          storage_path: string
          extracted_text: string | null
          token_count: number | null
          is_resume: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          storage_path: string
          extracted_text?: string | null
          token_count?: number | null
          is_resume?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          storage_path?: string
          extracted_text?: string | null
          token_count?: number | null
          is_resume?: boolean | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
