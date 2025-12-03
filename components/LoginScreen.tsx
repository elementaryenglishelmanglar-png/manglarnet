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
      <div className="min-h-screen bg-gradient-to-br from-manglar-orange-light via-background to-manglar-green-light flex flex-col justify-center items-center px-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-manglar-orange to-manglar-green flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white font-bold text-2xl">M</span>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-manglar-orange border-t-transparent"></div>
              <p className="text-muted-foreground font-medium">Verificando sesión...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-manglar-orange-light via-background to-manglar-green-light flex flex-col justify-center items-center px-4">
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          {/* Logo/Identidad */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-manglar-orange to-manglar-green flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
          </div>
          <CardTitle className="text-3xl mb-2">
            <span className="bg-gradient-to-r from-manglar-orange to-manglar-green bg-clip-text text-transparent">
              Bienvenido a ManglarNet
            </span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Sistema de gestión pedagógica del
            <br />
            <span className="font-semibold text-manglar-green">Colegio Integral El Manglar</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-md">
                <p className="text-sm text-destructive font-medium">{error}</p>
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
              className="w-full h-11 bg-manglar-orange hover:bg-manglar-orange/90 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  <span className="font-medium">Iniciando sesión...</span>
                </>
              ) : (
                <span className="font-medium">Iniciar Sesión</span>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col pt-6">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-apple-gray-light to-transparent mb-4"></div>
          <p className="text-xs text-muted-foreground text-center">
            Solo usuarios autorizados pueden acceder al sistema.
            <br />
            <span className="text-manglar-green">Si necesitas acceso, contacta al administrador.</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

