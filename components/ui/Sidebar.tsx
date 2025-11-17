'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardIcon,
  StudentsIcon,
  TeachersIcon,
  CalendarIcon,
  PlanningIcon,
  EvaluationIcon,
  UsersIcon,
  MagicWandIcon,
  MenuIcon,
  CloseIcon,
} from '@/components/Icons';
import type { UserRole } from '@/types';

interface NavLink {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  roles: UserRole[];
  path: string;
}

interface SidebarProps {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navLinks: NavLink[] = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['directivo', 'coordinador', 'docente', 'administrativo'], path: '/dashboard' },
    { id: 'students', label: 'Alumnos', icon: StudentsIcon, roles: ['directivo', 'coordinador', 'administrativo'], path: '/students' },
    { id: 'teachers', label: 'Docentes', icon: TeachersIcon, roles: ['directivo', 'coordinador'], path: '/teachers' },
    { id: 'schedules', label: 'Horarios', icon: CalendarIcon, roles: ['coordinador', 'directivo', 'docente'], path: '/schedules' },
    { id: 'schedule-generator', label: 'Generador de Horarios', icon: MagicWandIcon, roles: ['coordinador', 'directivo'], path: '/schedule-generator' },
    { id: 'team-schedules', label: 'Horarios Equipo', icon: UsersIcon, roles: ['coordinador', 'directivo'], path: '/team-schedules' },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon, roles: ['directivo', 'coordinador', 'docente'], path: '/calendar' },
    { id: 'planning', label: 'Planificaciones', icon: PlanningIcon, roles: ['directivo', 'coordinador', 'docente'], path: '/planning' },
    { id: 'evaluation', label: 'Evaluación', icon: EvaluationIcon, roles: ['directivo', 'coordinador'], path: '/evaluation' },
    { id: 'authorized-users', label: 'Gestión de Usuarios', icon: UsersIcon, roles: ['directivo', 'coordinador'], path: '/authorized-users' },
    { id: 'lapsos-admin', label: 'Gestión de Lapsos', icon: CalendarIcon, roles: ['coordinador', 'directivo'], path: '/lapsos-admin' },
  ];

  const navLinksToRender = useMemo(() => {
    return navLinks.filter(link => link.roles.includes(userRole));
  }, [userRole]);

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-apple-gray-dark text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 lg:p-6 flex justify-between items-center lg:block">
          <div className="text-center flex-1 lg:block">
            <h2 className="text-xl lg:text-2xl font-bold text-white">ManglarNet</h2>
            <p className="text-xs lg:text-sm text-apple-gray font-light">Conexión Pedagógica</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-apple-gray hover:text-white hover:bg-apple-gray-dark rounded-lg transition-apple"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="flex-1 px-2 lg:px-4 overflow-y-auto">
          {navLinksToRender.map(({ id, label, icon: Icon, path }) => (
            <button
              key={id}
              onClick={() => handleNavigate(path)}
              className={`w-full flex items-center gap-3 px-4 lg:px-5 py-3.5 my-1 rounded-lg text-sm font-medium transition-apple ${
                isActive(path)
                  ? 'bg-apple-blue text-white'
                  : 'text-apple-gray hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

