import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; email: string; username: string; role: string; fullName?: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa tu usuario y contraseña');
      setIsLoading(false);
      return;
    }

    try {
      // Normalize username (treat as email for Supabase Auth)
      const email = username.includes('@') ? username.toLowerCase().trim() : `${username.toLowerCase().trim()}@manglarnet.local`;
      
      // Sign in with email and password
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!authData.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      // Skip RPC call - it may not exist or may be blocked by RLS
      // We'll check directly in checkAuthorization

      // Check authorization in usuarios table
      const role = await checkAuthorization(authData.user.id, email);
      
      if (role) {
        // Get user details from usuarios table
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('username, role, email, is_active')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          console.error('Error details:', {
            code: userError.code,
            message: userError.message,
            details: userError.details,
            hint: userError.hint
          });
          
          // If user doesn't exist in usuarios table
          if (userError.code === 'PGRST116') {
            // User not found in usuarios table
            setError('Usuario no encontrado en la base de datos. El usuario existe en Supabase Auth pero no en la tabla usuarios. Por favor, ejecuta el script SQL para crear el usuario en la tabla usuarios.');
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
          
          // If it's a permission error (RLS blocking)
          if (userError.code === '42501' || userError.message?.includes('permission') || userError.message?.includes('row-level security')) {
            setError('Error de permisos: Las políticas RLS están bloqueando el acceso. Por favor, ejecuta el script SQL para corregir las políticas RLS.');
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
          
          throw new Error(`Error al verificar usuario: ${userError.message}`);
        }

        if (!userData) {
          throw new Error('Usuario no encontrado en la base de datos');
        }

        if (!userData.is_active) {
          await supabase.auth.signOut();
          setError('Tu cuenta está desactivada. Contacta al administrador.');
          setIsLoading(false);
          return;
        }

        onLoginSuccess({
          id: authData.user.id,
          email: userData.email || email,
          username: userData.username,
          role: userData.role,
          fullName: userData.username,
        });
      } else {
        await supabase.auth.signOut();
        setError('Usuario no autorizado. Asegúrate de que tu usuario esté registrado en la tabla usuarios con rol asignado.');
      }
    } catch (err: any) {
      console.error('Error signing in:', err);
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('Email not confirmed')) {
        setError('Usuario o contraseña incorrectos');
      } else {
        setError(err.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.');
      }
      setIsLoading(false);
    }
  };

  // Check if user is authorized
  const checkAuthorization = async (userId: string, email: string): Promise<string | false> => {
    try {
      console.log('Checking authorization for user:', userId, email);
      
      // Skip RPC call - check directly
      
      // Try to get user from usuarios table
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, username, role, is_active')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if not found

      if (usuarioError) {
        console.error('Error checking usuarios table:', usuarioError);
        console.error('Error details:', {
          code: usuarioError.code,
          message: usuarioError.message,
          details: usuarioError.details,
          hint: usuarioError.hint
        });
        
        // If it's a permission error, it might be RLS blocking access
        if (usuarioError.code === '42501' || usuarioError.message?.includes('permission')) {
          console.error('RLS policy blocking access. User might not have permission to read usuarios table.');
          // Try one more time after a brief delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: retryUsuario, error: retryError } = await supabase
            .from('usuarios')
            .select('id, username, role, is_active')
            .eq('id', userId)
            .maybeSingle();
          
          if (!retryError && retryUsuario && retryUsuario.is_active) {
            console.log('Retry successful, user found:', retryUsuario.username, retryUsuario.role);
            return retryUsuario.role;
          }
        }
        
        return false;
      }

      if (usuario) {
        if (!usuario.is_active) {
          console.log('User is inactive');
          return false;
        }
        console.log('User found in usuarios table:', usuario.username, usuario.role);
        return usuario.role;
      }

      // User not found in usuarios table
      console.log('User not found in usuarios table. User ID:', userId);
      console.log('This usually means:');
      console.log('1. RLS policies are blocking access');
      console.log('2. User does not exist in usuarios table');
      console.log('3. User ID mismatch between auth.users and usuarios');
      return false;
    } catch (err: any) {
      console.error('Error checking authorization:', err);
      return false;
    }
  };

  // Check session on mount
  React.useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          if (isMounted) {
            setIsChecking(false);
          }
          return;
        }

        const role = await checkAuthorization(session.user.id, session.user.email || '');
        
        if (role && isMounted) {
          // Get user details from usuarios table
          const { data: userData } = await supabase
            .from('usuarios')
            .select('username, role, email')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            onLoginSuccess({
              id: session.user.id,
              email: userData.email || session.user.email || '',
              username: userData.username,
              role: userData.role,
              fullName: userData.username,
            });
          } else {
            // Fallback to email-based username
            const email = session.user.email || '';
          onLoginSuccess({
              id: session.user.id,
              email: email,
              username: email.split('@')[0],
            role: role,
              fullName: email.split('@')[0],
            });
          }
        }
        
        if (isMounted) {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error in checkSession:', error);
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && isMounted) {
        setIsChecking(false);
      }
    });

    return () => {
      isMounted = false;
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
            Ingresa tu usuario y contraseña para acceder
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>

          <Button
              type="submit"
            disabled={isLoading}
              className="w-full h-11"
          >
            {isLoading ? (
              <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground mr-2"></div>
                  <span className="font-medium">Iniciando sesión...</span>
              </>
            ) : (
                <span className="font-medium">Iniciar Sesión</span>
            )}
          </Button>
          </form>
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

