import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dhxwzcqcpknhefcgcxsh.supabase.co';
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_q5TujQ-Ah0aynUb48RicOg_LQBap9C1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export default supabase;
