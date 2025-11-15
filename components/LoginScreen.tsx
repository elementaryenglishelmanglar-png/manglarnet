import React, { useState } from 'react';
import { supabase, AuthorizedUser } from '../services/supabaseClient';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; email: string; role: string; fullName?: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Google OAuth
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            // Force account selection screen to allow choosing between multiple Google accounts
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError('Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  // Check if user is authorized after OAuth callback
  const checkAuthorization = async (email: string) => {
    setIsChecking(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const { data: authorizedUser, error: checkError } = await supabase
        .from('authorized_users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error on not found

      // If there's an error and it's not a "not found" error, throw it
      if (checkError) {
        console.error('Database error checking authorization:', {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint,
          fullError: checkError
        });
        
        // Check if it's a permission error (RLS issue)
        if (checkError.code === '42501' || checkError.message?.includes('permission') || checkError.message?.includes('row-level security')) {
          throw new Error('Error de permisos al verificar autorización. Por favor, contacta al administrador.');
        }
        
        // Check if it's a 500 error
        if (checkError.code === 'PGRST301' || checkError.message?.includes('500')) {
          throw new Error('Error del servidor al verificar autorización. Por favor, verifica las políticas RLS en Supabase.');
        }
        
        throw checkError;
      }

      if (!authorizedUser) {
        // User is not in whitelist
        await supabase.auth.signOut();
        setError(`Acceso denegado. El correo "${normalizedEmail}" no está autorizado para acceder a este sistema. Por favor, contacta al administrador.`);
        setIsChecking(false);
        return false;
      }

      // User is authorized, return their role
      setIsChecking(false);
      return authorizedUser.role;
    } catch (err: any) {
      console.error('Error checking authorization:', err);
      const errorMessage = err.message || 'Error al verificar autorización. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
      setIsChecking(false);
      return false;
    }
  };

  // Check session on mount and after OAuth redirect
  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        const role = await checkAuthorization(session.user.email);
        
        if (role) {
          // Get user metadata
          const { data: userData } = await supabase.auth.getUser();
          const fullName = userData.user?.user_metadata?.full_name || 
                          userData.user?.user_metadata?.name ||
                          session.user.email.split('@')[0];

          onLoginSuccess({
            id: session.user.id,
            email: session.user.email,
            role: role,
            fullName: fullName,
          });
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const role = await checkAuthorization(session.user.email);
        
        if (role) {
          const fullName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name ||
                          session.user.email.split('@')[0];

          onLoginSuccess({
            id: session.user.id,
            email: session.user.email,
            role: role,
            fullName: fullName,
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onLoginSuccess]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autorización...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary mb-2">Bienvenido a ManglarNet</h1>
          <p className="text-gray-500">Inicia sesión con tu cuenta de Google</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-base font-medium min-h-[44px]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
              <span className="text-gray-700 font-medium">Conectando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium">Continuar con Google</span>
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Solo usuarios autorizados pueden acceder al sistema.
            <br />
            Si necesitas acceso, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
};

