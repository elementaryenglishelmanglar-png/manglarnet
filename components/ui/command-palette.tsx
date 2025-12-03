import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Input } from './input';
import { Search, Users, GraduationCap, Calendar, FileText, Settings, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  students?: Array<{ id_alumno: string; nombres: string; apellidos: string; salon?: string }>;
  teachers?: Array<{ id_docente: string; nombres: string; apellidos: string }>;
  currentView?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  students = [],
  teachers = [],
  currentView = 'dashboard',
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Generar comandos basados en la vista actual y datos disponibles
  const commands = useMemo(() => {
    const baseCommands: CommandItem[] = [
      {
        id: 'dashboard',
        label: 'Ir al Dashboard',
        description: 'Vista principal con estadísticas',
        icon: Home,
        action: () => {
          onNavigate('dashboard');
          onOpenChange(false);
        },
        keywords: ['dashboard', 'inicio', 'principal', 'home'],
        category: 'Navegación',
      },
      {
        id: 'students',
        label: 'Gestión de Alumnos',
        description: 'Ver y gestionar estudiantes',
        icon: GraduationCap,
        action: () => {
          onNavigate('students');
          onOpenChange(false);
        },
        keywords: ['alumnos', 'estudiantes', 'students'],
        category: 'Navegación',
      },
      {
        id: 'teachers',
        label: 'Gestión de Docentes',
        description: 'Ver y gestionar docentes',
        icon: Users,
        action: () => {
          onNavigate('teachers');
          onOpenChange(false);
        },
        keywords: ['docentes', 'teachers', 'profesores'],
        category: 'Navegación',
      },
      {
        id: 'schedules',
        label: 'Horarios',
        description: 'Ver y gestionar horarios',
        icon: Calendar,
        action: () => {
          onNavigate('schedules');
          onOpenChange(false);
        },
        keywords: ['horarios', 'schedules', 'calendario'],
        category: 'Navegación',
      },
      {
        id: 'planning',
        label: 'Planificaciones',
        description: 'Ver y gestionar planificaciones',
        icon: FileText,
        action: () => {
          onNavigate('planning');
          onOpenChange(false);
        },
        keywords: ['planificaciones', 'planning', 'planes'],
        category: 'Navegación',
      },
    ];

    // Agregar estudiantes como resultados de búsqueda
    const studentCommands: CommandItem[] = students.map((student) => ({
      id: `student-${student.id_alumno}`,
      label: `${student.nombres} ${student.apellidos}`,
      description: student.salon ? `Salón: ${student.salon}` : 'Estudiante',
      icon: GraduationCap,
      action: () => {
        onNavigate('students');
        // Aquí podrías agregar lógica para seleccionar el estudiante
        onOpenChange(false);
      },
      keywords: [
        student.nombres.toLowerCase(),
        student.apellidos.toLowerCase(),
        student.salon?.toLowerCase() || '',
        'alumno',
        'estudiante',
      ].filter(Boolean),
      category: 'Estudiantes',
    }));

    // Agregar docentes como resultados de búsqueda
    const teacherCommands: CommandItem[] = teachers.map((teacher) => ({
      id: `teacher-${teacher.id_docente}`,
      label: `${teacher.nombres} ${teacher.apellidos}`,
      description: 'Docente',
      icon: Users,
      action: () => {
        onNavigate('teachers');
        onOpenChange(false);
      },
      keywords: [
        teacher.nombres.toLowerCase(),
        teacher.apellidos.toLowerCase(),
        'docente',
        'profesor',
      ].filter(Boolean),
      category: 'Docentes',
    }));

    return [...baseCommands, ...studentCommands, ...teacherCommands];
  }, [students, teachers, onNavigate, onOpenChange]);

  // Filtrar comandos basados en la búsqueda
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commands.slice(0, 8); // Mostrar solo los primeros 8 si no hay búsqueda
    }

    const query = searchQuery.toLowerCase();
    return commands
      .filter((cmd) => {
        const matchesLabel = cmd.label.toLowerCase().includes(query);
        const matchesDescription = cmd.description?.toLowerCase().includes(query);
        const matchesKeywords = cmd.keywords?.some((kw) => kw.includes(query));
        return matchesLabel || matchesDescription || matchesKeywords;
      })
      .slice(0, 10); // Limitar a 10 resultados
  }, [commands, searchQuery]);

  // Resetear índice cuando cambia la búsqueda
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, filteredCommands.length]);

  // Manejar navegación con teclado
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands]);

  // Atajo de teclado para abrir (Cmd/Ctrl + K) - solo cuando está cerrado
  useEffect(() => {
    if (open) return; // No registrar atajo si ya está abierto
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      
      if (e.key.toLowerCase() === 'k' && ctrlOrCmd && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        onOpenChange(true);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Agrupar comandos por categoría
  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: CommandItem[] } = {};
    filteredCommands.forEach((cmd) => {
      const category = cmd.category || 'Otros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiantes, docentes, navegar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">Esc</span> para cerrar
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados para "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category}>
                  {Object.keys(groupedCommands).length > 1 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {category}
                    </div>
                  )}
                  {items.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-manglar-orange-light text-foreground"
                            : "hover:bg-muted"
                        )}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Navega con ↑↓ y presiona Enter para seleccionar</span>
            <div className="flex items-center gap-4">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>
              <span>para cerrar</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

