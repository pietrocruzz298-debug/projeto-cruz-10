import { createClient } from '@supabase/supabase-js';
import { CRMLead } from './types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = 'crm_kanban_leads';

// SQL para o usuário criar a tabela no Painel do Supabase
export const SUPABASE_SQL_SETUP = `-- Comando SQL para criar a tabela correta no seu editor SQL do Supabase:

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  value NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('Não iniciado', 'Em Andamento', 'Finalizado')) DEFAULT 'Não iniciado',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

-- Ativar segurança de RLS se desejado, ou habilitar políticas públicas para testes rápidos:
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público livre"
ON leads FOR ALL
USING (true)
WITH CHECK (true);
`;

/**
 * Gets leads from Supabase if configured & connected, otherwise returns Local Storage
 * Returns: { data: CRMLead[], source: 'supabase' | 'local', error?: string }
 */
export async function fetchLeads(): Promise<{ data: CRMLead[]; source: 'supabase' | 'local'; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        // Map any null values correctly
        const mappedData: CRMLead[] = data.map((item: any) => ({
          id: item.id,
          title: item.title || '',
          company: item.company || '',
          email: item.email || '',
          phone: item.phone || '',
          value: Number(item.value || 0),
          status: item.status || 'Não iniciado',
          description: item.description || '',
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        
        // Sync to local storage to keep offline backup
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mappedData));
        return { data: mappedData, source: 'supabase' };
      }
    } catch (err: any) {
      console.warn('Falha ao conectar ou ler do Supabase. Utilizando dados locais.', err);
      const localData = getLocalLeads();
      return { 
        data: localData, 
        source: 'local', 
        error: `Supabase Error: ${err.message || 'Verifique se adicionou a tabela "leads" no Supabase.'}` 
      };
    }
  }

  return { data: getLocalLeads(), source: 'local' };
}

/**
 * Inserts a single lead
 */
export async function insertLead(lead: Omit<CRMLead, 'created_at'>): Promise<{ success: boolean; data?: CRMLead; error?: string }> {
  const newLead: CRMLead = {
    ...lead,
    created_at: new Date().toISOString(),
  };

  // 1. Always write to local storage first
  const currentLocal = getLocalLeads();
  currentLocal.unshift(newLead);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentLocal));

  // 2. Write to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          id: newLead.id,
          title: newLead.title,
          company: newLead.company,
          email: newLead.email,
          phone: newLead.phone,
          value: newLead.value,
          status: newLead.status,
          description: newLead.description,
          created_at: newLead.created_at,
        }])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (data && data[0]) {
        return { success: true, data: data[0] as CRMLead };
      }
    } catch (err: any) {
      return { 
        success: true, // we still succeed on local, but communicate the sync warning
        data: newLead,
        error: `Lead salvo localmente, mas falhou ao sincronizar no Supabase: ${err.message}`
      };
    }
  }

  return { success: true, data: newLead };
}

/**
 * Updates a single lead
 */
export async function updateLeadInDb(id: string, updates: Partial<CRMLead>): Promise<{ success: boolean; data?: CRMLead; error?: string }> {
  // 1. Update local storage first
  const currentLocal = getLocalLeads();
  const index = currentLocal.findIndex(l => l.id === id);
  if (index !== -1) {
    currentLocal[index] = { ...currentLocal[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentLocal));
  }

  const updatedLead = currentLocal.find(l => l.id === id);

  // 2. Update Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (data && data[0]) {
        return { success: true, data: data[0] as CRMLead };
      }
    } catch (err: any) {
      return {
        success: true,
        data: updatedLead,
        error: `Lead atualizado localmente, mas falhou ao sincronizar no Supabase: ${err.message}`
      };
    }
  }

  return { success: true, data: updatedLead };
}

/**
 * Deletes a single lead
 */
export async function deleteLeadFromDb(id: string): Promise<{ success: boolean; error?: string }> {
  // 1. Delete from local storage first
  const currentLocal = getLocalLeads();
  const filtered = currentLocal.filter(l => l.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));

  // 2. Delete from Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      return {
        success: true, // Delete succeeded locally, warning shown
        error: `Removido localmente, mas falhou ao sincronizar exclusão no Supabase: ${err.message}`
      };
    }
  }

  return { success: true };
}

function getLocalLeads(): CRMLead[] {
  try {
    const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch {
    return [];
  }
}
