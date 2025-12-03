import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      shortcuts.forEach((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        if (!keyMatches) return;

        // En Mac, Cmd actúa como Ctrl
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

        // Validar modificadores
        const ctrlMatches = shortcut.ctrl ? ctrlOrCmd : !ctrlOrCmd && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action();
        }
      });
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

// Hook para atajos globales de la aplicación
export function useGlobalShortcuts(navigate: (view: string) => void) {
  useKeyboardShortcuts(
    [
      {
        key: 'k',
        ctrl: true,
        action: () => {
          // Abrir búsqueda global (se implementará después)
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            bubbles: true,
          });
          document.dispatchEvent(event);
        },
        description: 'Abrir búsqueda global',
      },
      {
        key: 'n',
        ctrl: true,
        action: () => {
          // Navegar a dashboard
          navigate('dashboard');
        },
        description: 'Ir al Dashboard',
      },
      {
        key: '/',
        action: () => {
          // Buscar en vista actual
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Buscar"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        },
        description: 'Buscar',
      },
      {
        key: '?',
        shift: true,
        action: () => {
          // Mostrar ayuda de atajos (se implementará después)
          console.log('Mostrar ayuda de atajos');
        },
        description: 'Mostrar ayuda',
      },
    ],
    true
  );
}

