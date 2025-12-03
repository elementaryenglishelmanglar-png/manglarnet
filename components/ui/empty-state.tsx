import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Search,
  Inbox,
  GraduationCap,
  ClipboardList
} from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons = {
  students: Users,
  teachers: GraduationCap,
  classes: BookOpen,
  calendar: Calendar,
  documents: FileText,
  search: Search,
  inbox: Inbox,
  evaluation: ClipboardList,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = icon || Inbox;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="rounded-full bg-manglar-orange-light p-4 mb-4">
        <Icon className="h-8 w-8 text-manglar-orange" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-manglar-orange hover:bg-manglar-orange/90"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Componente helper para estados vacíos comunes
export function EmptyStateStudents({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.students}
      title="No hay alumnos registrados"
      description="Comienza agregando tu primer alumno al sistema. Puedes importar múltiples alumnos desde un archivo Excel."
      action={{
        label: 'Agregar Alumno',
        onClick: onAdd,
      }}
    />
  );
}

export function EmptyStateTeachers({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.teachers}
      title="No hay docentes registrados"
      description="Agrega docentes al sistema para poder asignarles clases y gestionar sus horarios."
      action={{
        label: 'Agregar Docente',
        onClick: onAdd,
      }}
    />
  );
}

export function EmptyStateSearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title={`No se encontraron resultados para "${query}"`}
      description="Intenta con otros términos de búsqueda o verifica la ortografía."
    />
  );
}

export function EmptyStateClasses({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.classes}
      title="No hay clases asignadas"
      description="Comienza asignando clases a los docentes para organizar el horario escolar."
      action={{
        label: 'Asignar Clase',
        onClick: onAdd,
      }}
    />
  );
}

