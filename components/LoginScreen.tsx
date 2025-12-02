import React, { useState, useEffect } from 'react';
import { authService, User } from '../services/authService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const user = await authService.getSession();
        if (user && isMounted) {
          onLoginSuccess(user);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError('Por favor, ingresa tu usuario y contraseña');
      setIsLoading(false);
      return;
    }

    try {
      const user = await authService.login({
        identifier: identifier.trim(),
        password: password,
      });

      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando sesión...</p>
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
            Ingresa tu usuario o correo electrónico y contraseña para acceder
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
              <Label htmlFor="identifier">Usuario o Email</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="usuario o email@ejemplo.com"
                disabled={isLoading}
                autoComplete="username"
                autoFocus
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

