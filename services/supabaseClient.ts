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

// Log environment variables status (solo en desarrollo)
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  console.log('🔧 Supabase Config Check:');
  console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ No configurado');
  console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurado' : '❌ No configurado');
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    console.log('  URL:', supabaseUrl);
  }
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ ERROR: Variables de entorno de Supabase no configuradas.\n\n' +
    'Por favor crea un archivo .env.local en la raíz del proyecto con:\n' +
    'VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=tu-anon-key\n\n' +
    'Luego reinicia el servidor de desarrollo (npm run dev)';
  
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
    flowType: 'pkce',
    // Asegurar que el apikey se envíe en todas las peticiones de auth
    debug: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': finalKey,
      'Authorization': `Bearer ${finalKey}`
    }
  }
});

// Add a flag to check if Supabase is properly configured
(supabase as any).isConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Type definitions for whitelist table (deprecated - use usuarios table instead)
export interface AuthorizedUser {
  id: string;
  email: string;
  role: 'docente' | 'coordinador' | 'directivo';
  created_at: string;
  created_by?: string;
}

