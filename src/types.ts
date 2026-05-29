export interface CRMLead {
  id: string; // uuid or string
  title: string; // Contact Name / Client Name
  company: string; // Company Name
  email: string;
  phone: string;
  value: number; // Deal value
  status: 'Não iniciado' | 'Em Andamento' | 'Finalizado';
  description: string;
  created_at: string;
  updated_at?: string;
}

export type LeadStatus = CRMLead['status'];

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  useLocalStorageFallback: boolean;
}
