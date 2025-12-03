import { useState, useEffect, useCallback } from 'react';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable' | 'spacious';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    showWidgets: string[];
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  density: 'comfortable',
  notifications: {
    email: true,
    push: true,
    sound: false,
  },
  dashboard: {
    layout: 'grid',
    showWidgets: [],
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
  },
};

export function useUserPreferences(userId?: string) {
  const storageKey = userId ? `manglar-preferences-${userId}` : 'manglar-preferences-guest';

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    return defaultPreferences;
  });

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, ...updates };
        try {
          localStorage.setItem(storageKey, JSON.stringify(newPrefs));
        } catch (error) {
          console.error('Error saving preferences:', error);
        }
        return newPrefs;
      });
    },
    [storageKey]
  );

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  }, [storageKey]);

  // Aplicar preferencias de accesibilidad
  useEffect(() => {
    const root = document.documentElement;
    
    // Tamaño de fuente
    root.style.fontSize = 
      preferences.accessibility.fontSize === 'small' ? '14px' :
      preferences.accessibility.fontSize === 'large' ? '18px' : '16px';
    
    // Alto contraste
    if (preferences.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reducir movimiento
    if (preferences.accessibility.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [preferences.accessibility]);

  // Aplicar densidad
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-density', preferences.density);
  }, [preferences.density]);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  };
}

