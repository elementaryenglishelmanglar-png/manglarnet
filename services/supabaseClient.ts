import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment
// Support both Vite (import.meta.env) and Next.js (process.env)
const getEnvVar = (viteKey: string, nextKey: string): string => {
  if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
    // Next.js environment
    return process.env[nextKey] || '';
  }
  // Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[viteKey] || '';
  }
  // Fallback to process.env for Node.js
  return process.env[nextKey] || '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ ERROR: Variables de entorno de Supabase no configuradas.\n\n' +
    'Por favor configura las siguientes variables en Vercel:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY\n\n' +
    'Ve a: Settings > Environment Variables en tu proyecto de Vercel';
  
  console.error(errorMsg);
}

// Create Supabase client
// Use placeholder values if env vars are missing to prevent crash
// The app will show errors but won't crash completely
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: !!supabaseUrl && !!supabaseAnonKey,
    persistSession: !!supabaseUrl && !!supabaseAnonKey,
    detectSessionInUrl: !!supabaseUrl && !!supabaseAnonKey,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'apikey': finalKey
    }
  }
});

// Add a flag to check if Supabase is properly configured
(supabase as any).isConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Type definitions for whitelist table
export interface AuthorizedUser {
  id: string;
  email: string;
  role: 'docente' | 'coordinador' | 'directivo' | 'administrativo';
  created_at: string;
  created_by?: string;
}

