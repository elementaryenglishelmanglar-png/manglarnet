import React, { useState } from 'react';
import { supabase, AuthorizedUser } from '../services/supabaseClient';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

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
      console.log('Checking authorization for:', normalizedEmail);
      
      // Verificar que Supabase esté configurado
      if (!supabase || !(supabase as any).isConfigured) {
        console.error('Supabase no está configurado correctamente');
        setError('Error de configuración. Verifica que las variables de entorno estén configuradas.');
        setIsChecking(false);
        return false;
      }

      // Verificar que el usuario esté autenticado antes de consultar
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        console.error('Usuario no autenticado o error:', userError);
        setError('No se pudo verificar la autenticación. Por favor, intenta iniciar sesión de nuevo.');
        setIsChecking(false);
        return false;
      }
      
      console.log('Usuario autenticado:', currentUser.email);
      console.log('Ejecutando consulta a authorized_users...');
      console.log('Email a buscar:', normalizedEmail);
      const startTime = Date.now();
      
      // Hacer la consulta con mejor manejo de errores
      let queryResult: any;
      try {
        console.log('Iniciando consulta a authorized_users...');
        
        // Usar una consulta más simple y directa
        // Intentar primero con select específico, si falla, usar select('*')
        try {
          queryResult = await supabase
            .from('authorized_users')
            .select('id, email, role')
            .eq('email', normalizedEmail)
            .maybeSingle();
        } catch (selectError: any) {
          console.warn('Error con select específico, intentando con select(*)...', selectError);
          // Si falla, intentar con select('*')
          queryResult = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();
        }
        
        const elapsedTime = Date.now() - startTime;
        console.log(`Consulta completada en ${elapsedTime}ms`);
        
        if (elapsedTime > 5000) {
          console.warn('⚠️ La consulta tardó más de 5 segundos, esto puede indicar un problema de conexión o RLS');
        }
      } catch (queryError: any) {
        console.error('Error ejecutando consulta:', queryError);
        console.error('Tipo de error:', typeof queryError);
        console.error('Stack:', queryError?.stack);
        setError('Error al consultar la base de datos. Verifica tu conexión y las políticas RLS.');
        setIsChecking(false);
        return false;
      }
      
      const { data: authorizedUser, error: checkError } = queryResult;

      console.log('Authorization check result:', { 
        authorizedUser: authorizedUser ? { email: authorizedUser.email, role: authorizedUser.role } : null, 
        checkError: checkError ? {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint
        } : null
      });

      // If there's an error and it's not a "not found" error, handle it
      if (checkError) {
        console.error('Database error checking authorization:', {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint,
          fullError: checkError
        });
        
        // Si el error es "requested path is invalid", puede ser un problema de configuración
        if (checkError.message?.includes('requested path is invalid') || checkError.message?.includes('invalid')) {
          console.error('Error de ruta inválida - posible problema con la configuración de Supabase');
          setError('Error de configuración de Supabase. Verifica que la URL y la API key sean correctas.');
          setIsChecking(false);
          return false;
        }
        
        // Check if it's a permission error (RLS issue)
        if (checkError.code === '42501' || checkError.message?.includes('permission') || checkError.message?.includes('row-level security')) {
          setError('Error de permisos al verificar autorización. Por favor, contacta al administrador.');
          setIsChecking(false);
          return false;
        }
        
        // Check if it's a 500 error or rate limit
        if (checkError.code === 'PGRST301' || checkError.message?.includes('500') || checkError.message?.includes('429')) {
          setError('Error del servidor al verificar autorización. Por favor, espera unos momentos e intenta de nuevo.');
          setIsChecking(false);
          return false;
        }
        
        // Para otros errores, mostrar mensaje pero no hacer signOut
        setError('Error al verificar autorización. Por favor, intenta de nuevo.');
        setIsChecking(false);
        return false;
      }

      if (!authorizedUser) {
        // User is not in whitelist
        console.log('User not found in authorized_users');
        await supabase.auth.signOut();
        setError(`Acceso denegado. El correo "${normalizedEmail}" no está autorizado para acceder a este sistema. Por favor, contacta al administrador.`);
        setIsChecking(false);
        return false;
      }

      // User is authorized, return their role
      console.log('User authorized with role:', authorizedUser.role);
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
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkSession = async () => {
      try {
        console.log('Checking session...');
        
        // Esperar un momento para que Supabase procese el callback de OAuth
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
          console.log('OAuth callback detectado, esperando procesamiento...');
          // Esperar 1 segundo para que Supabase procese el código
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Limpiar la URL después de esperar
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        console.log('Obteniendo sesión...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (isMounted) {
            setIsChecking(false);
            setError('Error al obtener la sesión. Por favor, intenta de nuevo.');
          }
          return;
        }
        
        console.log('Session found:', session?.user?.email);
        
        if (!session?.user?.email) {
          console.log('No session found, setting isChecking to false');
          if (isMounted) {
            setIsChecking(false);
          }
          return;
        }

        console.log('Calling checkAuthorization for:', session.user.email);
        const role = await checkAuthorization(session.user.email);
        console.log('checkAuthorization returned:', role);
        
        if (role && isMounted) {
          // Get user metadata
          console.log('Getting user metadata...');
          const { data: userData } = await supabase.auth.getUser();
          const fullName = userData.user?.user_metadata?.full_name || 
                          userData.user?.user_metadata?.name ||
                          session.user.email.split('@')[0];

          console.log('Calling onLoginSuccess with role:', role, 'fullName:', fullName);
          onLoginSuccess({
            id: session.user.id,
            email: session.user.email,
            role: role,
            fullName: fullName,
          });
          if (isMounted) {
            setIsChecking(false);
          }
        } else if (isMounted) {
          // Si no hay rol, asegurarse de que isChecking sea false
          console.log('No role returned, setting isChecking to false');
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error in checkSession:', error);
        if (isMounted) {
          setIsChecking(false);
          setError('Error al verificar la sesión. Por favor, intenta de nuevo.');
        }
      }
    };

    // Timeout de seguridad: si después de 15 segundos no se completa, resetear
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Timeout en verificación de autorización después de 15 segundos');
        console.warn('Esto puede indicar un problema con la conexión a Supabase o con las políticas RLS');
        setIsChecking(false);
        setError('La verificación está tomando demasiado tiempo. Verifica tu conexión a internet y las políticas RLS en Supabase. Si el problema persiste, recarga la página.');
      }
    }, 15000);

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      if (event === 'SIGNED_IN' && session?.user?.email && isMounted) {
        const role = await checkAuthorization(session.user.email);
        
        if (role && isMounted) {
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
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setIsChecking(false);
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando autorización...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">
            <span className="text-brand-primary">Bienvenido a ManglarNet</span>
          </CardTitle>
          <CardDescription className="text-base">
            Inicia sesión con tu cuenta de Google
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-11 gap-3"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
                <span className="font-medium">Conectando...</span>
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
                <span className="font-medium">Continuar con Google</span>
              </>
            )}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col">
          <p className="text-xs text-muted-foreground text-center">
            Solo usuarios autorizados pueden acceder al sistema.
            <br />
            Si necesitas acceso, contacta al administrador.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

