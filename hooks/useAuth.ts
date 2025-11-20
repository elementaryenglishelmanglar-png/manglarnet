import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService, User } from '../services/authService';

/**
 * Custom hook for authentication
 * Manages user session and provides auth state
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        // Check initial session
        const checkSession = async () => {
            try {
                const currentUser = await authService.getSession();
                if (isMounted) {
                    setUser(currentUser);
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('Session check error:', err);
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                if (event === 'SIGNED_IN' && session) {
                    try {
                        const currentUser = await authService.getSession();
                        setUser(currentUser);
                    } catch (err: any) {
                        console.error('Auth state change error:', err);
                        setError(err.message);
                        setUser(null);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        hasPermission: (permission: string) => authService.hasPermission(user, permission),
        hasRole: (roles: string[]) => authService.hasRole(user, roles),
        isAdmin: () => authService.isAdmin(user),
    };
}
