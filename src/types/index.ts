import { Database } from './database.types'

export type { Database }

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Credits = Database['public']['Tables']['credits']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
