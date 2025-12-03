import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Badge } from './badge';

interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsHelp({ open, onOpenChange, shortcuts }: KeyboardShortcutsHelpProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const formatKey = (key: string) => {
    const keyMap: { [key: string]: string } = {
      ctrl: isMac ? '⌘' : 'Ctrl',
      shift: '⇧',
      alt: isMac ? '⌥' : 'Alt',
      enter: '↵',
      escape: 'Esc',
      arrowup: '↑',
      arrowdown: '↓',
      arrowleft: '←',
      arrowright: '→',
    };

    return keyMap[key.toLowerCase()] || key.toUpperCase();
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atajos de Teclado</DialogTitle>
          <DialogDescription>
            Acelera tu trabajo con estos atajos de teclado. Presiona <kbd className="px-2 py-1 bg-muted rounded text-sm">{modKey} + K</kbd> para búsqueda rápida.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono">
                            {formatKey(key)}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground mx-1">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>
            💡 <strong>Tip:</strong> Los atajos funcionan en toda la aplicación. Presiona{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> para cerrar este diálogo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

