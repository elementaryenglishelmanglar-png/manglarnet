import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { Button } from './button';
import { Label } from './label';
import { Switch } from './switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Separator } from './separator';
import { Moon, Sun, Monitor, LayoutGrid, List, Type, Eye, Zap } from 'lucide-react';
import { UserPreferences, useUserPreferences } from '../../hooks/useUserPreferences';
import { useTheme } from '@/hooks/useTheme';

interface UserPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function UserPreferencesDialog({
  open,
  onOpenChange,
  userId,
}: UserPreferencesDialogProps) {
  const { preferences, updatePreferences, resetPreferences } = useUserPreferences(userId);
  const { theme, setTheme } = useTheme();

  const handleUpdate = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    updatePreferences({ [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preferencias de Usuario</DialogTitle>
          <DialogDescription>
            Personaliza tu experiencia en ManglarNet según tus preferencias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Apariencia */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Apariencia</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  value={theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>Claro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>Oscuro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>Sistema</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="density">Densidad de Información</Label>
                  <p className="text-xs text-muted-foreground">
                    Controla el espaciado y tamaño de los elementos
                  </p>
                </div>
                <Select
                  value={preferences.density}
                  onValueChange={(value: 'compact' | 'comfortable' | 'spacious') =>
                    handleUpdate('density', value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compacta</SelectItem>
                    <SelectItem value="comfortable">Cómoda</SelectItem>
                    <SelectItem value="spacious">Espaciosa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notificaciones */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Notificaciones</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-email">Notificaciones por Email</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibe notificaciones importantes por correo
                  </p>
                </div>
                <Switch
                  id="notifications-email"
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) =>
                    handleUpdate('notifications', {
                      ...preferences.notifications,
                      email: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-push">Notificaciones Push</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibe notificaciones en tiempo real
                  </p>
                </div>
                <Switch
                  id="notifications-push"
                  checked={preferences.notifications.push}
                  onCheckedChange={(checked) =>
                    handleUpdate('notifications', {
                      ...preferences.notifications,
                      push: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-sound">Sonidos de Notificación</Label>
                  <p className="text-xs text-muted-foreground">
                    Reproduce sonidos para notificaciones
                  </p>
                </div>
                <Switch
                  id="notifications-sound"
                  checked={preferences.notifications.sound}
                  onCheckedChange={(checked) =>
                    handleUpdate('notifications', {
                      ...preferences.notifications,
                      sound: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Accesibilidad */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Accesibilidad</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="font-size">Tamaño de Fuente</Label>
                  <p className="text-xs text-muted-foreground">
                    Ajusta el tamaño del texto para mejor legibilidad
                  </p>
                </div>
                <Select
                  value={preferences.accessibility.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') =>
                    handleUpdate('accessibility', {
                      ...preferences.accessibility,
                      fontSize: value,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeña</SelectItem>
                    <SelectItem value="medium">Mediana</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">Alto Contraste</Label>
                  <p className="text-xs text-muted-foreground">
                    Aumenta el contraste para mejor visibilidad
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={preferences.accessibility.highContrast}
                  onCheckedChange={(checked) =>
                    handleUpdate('accessibility', {
                      ...preferences.accessibility,
                      highContrast: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduce-motion">Reducir Animaciones</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce las animaciones para mejor accesibilidad
                  </p>
                </div>
                <Switch
                  id="reduce-motion"
                  checked={preferences.accessibility.reduceMotion}
                  onCheckedChange={(checked) =>
                    handleUpdate('accessibility', {
                      ...preferences.accessibility,
                      reduceMotion: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Acciones */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={resetPreferences}
              className="text-muted-foreground"
            >
              Restablecer Preferencias
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Guardar y Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

