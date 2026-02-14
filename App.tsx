
import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { StudentsIcon, TeachersIcon, PlusIcon, CloseIcon, EditIcon, DeleteIcon, ChevronDownIcon, LogoutIcon, PlanningIcon, SparklesIcon, UserCircleIcon, UsersIcon, ClipboardCheckIcon, SendIcon, BellIcon, EvaluationIcon, MenuIcon } from './components/Icons';
import { AlertTriangle, AlertCircle, XCircle, Heart, UserMinus } from 'lucide-react';
import { Button } from './components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { InputField } from './components/ui/InputField';
import { Separator } from './components/ui/separator';
import { Skeleton, LoadingSpinner } from './components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { useToast } from './components/ui/toast';
import { ConfirmDialog } from './components/ui/confirm-dialog';
import { EmptyStateTeachers } from './components/ui/empty-state';
import { Breadcrumbs } from './components/ui/breadcrumbs';
import { ThemeToggle } from './components/ui/theme-toggle';
import { HelpTooltip } from './components/ui/help-tooltip';
import { OnboardingTour } from './components/ui/onboarding-tour';
import { UserPreferencesDialog } from './components/ui/user-preferences-dialog';
import { KeyboardShortcutsHelp } from './components/ui/keyboard-shortcuts-help';
import { CommandPalette } from './components/ui/command-palette';
import { useGlobalShortcuts, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Home, Settings } from 'lucide-react';








import { getAIPlanSuggestions } from './services/geminiService';
import { supabase } from './services/supabaseClient';
// Lazy loading para componentes pesados
const LoginScreen = lazy(() => import('./components/LoginScreen').then(module => ({ default: module.LoginScreen })));
const AuthorizedUsersView = lazy(() => import('./components/AuthorizedUsersView').then(module => ({ default: module.AuthorizedUsersView })));
import BulkImportModal from './components/students/BulkImportModal';
import { GestionIndicadores } from './components/students/GestionIndicadores';
import StudentDetailView from './components/students/StudentDetailView';
import StudentListView from './components/students/StudentListView';

import { getWeekFromDate, formatDateRange } from './services/weekCalculator';
import {
    alumnosService,
    docentesService,
    clasesService,
    planificacionesService,
    notificacionesService,
    aulasService,
    type Alumno,
    type Clase,
    type Aula,

    type Docente,
    type Planificacion,
    type Notification,
} from './services/supabaseDataService';


interface Assignment {
    subject: string;
    grade: string;
    nivel_ingles?: string;
    id_aula?: string;
}



// --- DATABASE SCHEMA TYPES ---
// Based on the provided PostgreSQL schema

type UserRole = 'docente' | 'coordinador' | 'directivo' | 'administrativo';

interface Usuario {
    id: string; // UUID
    email: string;
    username: string; // Username/nickname
    role: UserRole;
    // Mapped from docentes table for convenience
    docenteId?: string; // UUID
    fullName?: string;
}


const ASIGNATURAS_POR_NIVEL = {
    "Nivel Preescolar": [
        "Personal y Social", "RelaciÃ³n con el ambiente", "ComunicaciÃ³n y RepresentaciÃ³n", "InglÃ©s", "EDUCACIÃ“N FÃSICA Y DEPORTE", "MÃºsica", "Arte", "FrancÃ©s", "RobÃ³tica", "ComputaciÃ³n", "Ajedrez"
    ],
    "Nivel Primaria": [
        "MatemÃ¡ticas (EAC)", "MatemÃ¡ticas (AC)", "MatemÃ¡ticas (OB)", "MatemÃ¡ticas (Prob)", "MatemÃ¡ticas (EV)", "MatemÃ¡ticas (GeometrÃ­a)", "Lenguaje (AC)", "Lenguaje (EAC)", "Lenguaje (CL)", "Lenguaje (LO)", "Lenguaje (PT)", "Lenguaje (Gram)", "Ciencias", "Sociales", "Proyecto", "InglÃ©s (reading)", "InglÃ©s (Use of English)", "InglÃ©s (Writting)", "InglÃ©s (Speaking)", "InglÃ©s (Project)", "InglÃ©s (Basic)", "InglÃ©s (Lower)", "InglÃ©s (Upper)", "EvaluaciÃ³n", "FrancÃ©s", "Literatura", "MÃºsica", "Arte", "TecnologÃ­a (RobÃ³tica)", "TecnologÃ­a (ComputaciÃ³n)", "TecnologÃ­a (financiera)", "Ajedrez", "Ed, FÃ­sica y Deporte", "Valores", "ADP", "Taller MaÃ±anero", "MetacogciÃ³n", "Psicomotricidad", "Conciencia fonolÃ³gica", "Club (Estudiantina)", "Club (Teatro)", "Club (Ajedrez)", "English Club (Board Games Club)", "English Club (Reading Club)", "English Club (Entertainment Club)", "English Club (Drawing and Animation Club)"
    ],
    "Nivel Bachillerato": [
        "MATEMATICA", "FÃ­sica", "FÃSICA (InglÃ©s)", "QUÃMICA", "BIOLOGÃA", "EDUCACIÃ“N FÃSICA Y DEPORTE", "CASTELLANO", "GHC (GeografÃ­a, Historia y CiudadanÃ­a)", "INGLES", "FRANCES", "COMPUTACION", "ARTE Y PATRIMONIO", "MUSICA", "HUB (Gastronomia)", "HUB (MUN)", "HUB (MÃºsica)", "HUB (RobÃ³tica/ProgramaciÃ³n)", "HUB (Arte)", "ELECTIVA (Oratoria)", "ELECTIVA (Inteligencia Artificial)", "ELECTIVA (Seguridad y PrevenciÃ³n de Emergencias)", "ELECTIVA (EdiciÃ³n videos)", "ELECTIVA (Lab de Soluciones Verdes)", "SISTEMAS AMBIENTALES", "TDC (TeorÃ­a del Conocimiento)", "CAS (Creatividad, Actividad y Servicio)", "MONOGRAFIA", "GESTION EMPRESARIAL", "CIENCIAS DE LA TIERRA"
    ]
};

const GRADOS = [
    "Maternal", "Pre-Kinder", "Kinder", "Preparatorio",
    "1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado",
    "1er AÃ±o", "2do AÃ±o", "3er AÃ±o", "4to AÃ±o", "5to AÃ±o",
    "Niveles de InglÃ©s (5to-6to)" // Special option for English levels across 5th and 6th grade
];

// FunciÃ³n helper para generar aÃ±os escolares desde 2025-2026 hasta 2040-2041
const generateAnosEscolares = (): string[] => {
    const anos: string[] = [];
    for (let inicio = 2025; inicio <= 2040; inicio++) {
        anos.push(`${inicio}-${inicio + 1}`);
    }
    return anos;
};

const ANOS_ESCOLARES = generateAnosEscolares();


// Paleta de colores refinada para materias - Mejor accesibilidad y consistencia







// FunciÃ³n para calcular las clases de hoy


// --- HELPER FUNCTIONS ---

const getWeekNumber = (startDate: Date): number => {
    const today = new Date();
    const start = new Date(startDate);
    const diff = today.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const calculatedWeek = Math.floor(diff / oneWeek) + 1;
    // A school term is 18 weeks. Clamp the week number to be within 1-18.
    return Math.min(18, Math.max(1, calculatedWeek));
};

// FunciÃ³n para calcular las clases de hoy

const Header: React.FC<{
    title: string;
    currentUser: Usuario;
    onLogout: () => void;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMenuToggle?: () => void;
    setShowPreferences: (show: boolean) => void;
}> = ({ title, currentUser, onLogout, notifications, onNotificationClick, onMenuToggle, setShowPreferences }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const unreadCount = useMemo(() =>
        notifications.filter(n => !n.isRead && n.recipientId === currentUser.docenteId).length,
        [notifications, currentUser.docenteId]
    );

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " aÃ±os";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " dÃ­as";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return Math.floor(seconds) + " segundos";
    }

    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(n => n.recipientId === currentUser.docenteId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notifications, currentUser.docenteId]);

    return (
        <header className="bg-card p-4 flex justify-between items-center sticky top-0 z-30 border-b shadow-sm">
            <div className="flex items-center gap-3">
                {onMenuToggle && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuToggle}
                        className="lg:hidden hover:text-manglar-orange hover:bg-manglar-orange-light"
                        aria-label="Toggle menu"
                    >
                        <MenuIcon className="h-6 w-6" />
                    </Button>
                )}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-manglar-orange to-manglar-orange/80 items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate tracking-tight">{title}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreferences(true)}
                    className="hover:bg-manglar-orange-light focus-ring"
                    aria-label="Preferencias"
                >
                    <Settings className="h-5 w-5" />
                </Button>
                {currentUser.role === 'docente' && (
                    <Popover open={isNotificationsOpen} onOpenChange={setNotificationsOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative hover:text-manglar-orange focus-ring"
                                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
                                aria-expanded={isNotificationsOpen}
                            >
                                <BellIcon className="h-6 w-6" aria-hidden="true" />
                                {unreadCount > 0 && (
                                    <span
                                        className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-manglar-orange ring-2 ring-background animate-pulse-gentle"
                                        aria-hidden="true"
                                    />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <Card className="border-0 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Notificaciones</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-96 overflow-y-auto">
                                        {filteredNotifications.length > 0 ? (
                                            filteredNotifications.map(n => (
                                                <button
                                                    key={n.id}
                                                    onClick={() => { onNotificationClick(n); setNotificationsOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-manglar-orange-light transition-colors border-b last:border-0 focus-ring rounded ${!n.isRead ? 'bg-manglar-orange-light border-l-4 border-manglar-orange' : ''
                                                        }`}
                                                    aria-label={`${n.title}. ${n.message}`}
                                                    role="menuitem"
                                                >
                                                    <p className="font-semibold text-foreground">{n.title}</p>
                                                    <p className="text-muted-foreground text-xs font-light mt-1">{n.message}</p>
                                                    <p className="text-right text-xs text-muted-foreground font-light mt-1">
                                                        {timeSince(n.timestamp)} ago
                                                    </p>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8 font-light text-sm">
                                                No hay notificaciones.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </PopoverContent>
                    </Popover>
                )}
                <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 text-left h-auto p-2 focus-ring"
                            aria-label="MenÃº de usuario"
                            aria-expanded={isMenuOpen}
                            aria-haspopup="true"
                        >
                            <div className="hidden sm:block text-left">
                                <p className="font-semibold text-foreground text-sm sm:text-base">{currentUser.fullName}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground font-light capitalize">{currentUser.role}</p>
                            </div>
                            <div className="sm:hidden">
                                <UserCircleIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            </div>
                            <ChevronDownIcon className="hidden sm:block h-4 w-4" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" role="menu" aria-label="MenÃº de usuario">
                        <DropdownMenuItem
                            onClick={onLogout}
                            className="cursor-pointer focus-ring"
                            role="menuitem"
                            aria-label="Cerrar sesiÃ³n"
                        >
                            <LogoutIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                            Cerrar SesiÃ³n
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

const Sidebar: React.FC<{
    activeView: string;
    onNavigate: (view: string) => void;
    userRole: UserRole;
    isOpen: boolean;
    onClose: () => void;
}> = ({ activeView, onNavigate, userRole, isOpen, onClose }) => {
    interface NavLink {
        id: string;
        label: string;
        icon: React.FC<{ className?: string }>;
        roles: UserRole[];
        category?: string;
    }

    interface NavCategory {
        id: string;
        label: string;
        roles: UserRole[];
    }

    const navLinks: NavLink[] = [
        // ðŸ‘¥ GestiÃ³n
        { id: 'students', label: 'Alumnos', icon: StudentsIcon, roles: ['directivo', 'coordinador', 'administrativo'], category: 'gestion' },
        { id: 'teachers', label: 'Docentes', icon: TeachersIcon, roles: ['directivo', 'coordinador'], category: 'gestion' },
        { id: 'authorized-users', label: 'GestiÃ³n de Usuarios', icon: UsersIcon, roles: ['directivo', 'coordinador'], category: 'gestion' },

        // ðŸ“… PlanificaciÃ³n
        { id: 'planning', label: 'Planificaciones', icon: PlanningIcon, roles: ['directivo', 'coordinador', 'docente'], category: 'planificacion' },

        // âœ… EvaluaciÃ³n
        { id: 'indicadores', label: 'EvaluaciÃ³n Indicadores', icon: ClipboardCheckIcon, roles: ['directivo', 'coordinador'], category: 'evaluacion' },
    ];

    const categories: NavCategory[] = [
        { id: 'gestion', label: 'GestiÃ³n', roles: ['directivo', 'coordinador', 'administrativo'] },
        { id: 'planificacion', label: 'PlanificaciÃ³n', roles: ['directivo', 'coordinador', 'docente'] },
        { id: 'evaluacion', label: 'EvaluaciÃ³n', roles: ['directivo', 'coordinador'] },
    ];

    // Filtrar links basado en el rol del usuario
    const navLinksToRender = useMemo(() => {
        return navLinks.filter(link => link.roles.includes(userRole));
    }, [userRole]);

    const categoriesToRender = useMemo(() => {
        return categories.filter(cat => {
            const hasLinksInCategory = navLinksToRender.some(link => link.category === cat.id);
            return hasLinksInCategory;
        });
    }, [navLinksToRender]);

    const getLinksByCategory = (categoryId: string) => {
        return navLinksToRender.filter(link => link.category === categoryId);
    };

    const handleNavigate = (view: string) => {
        onNavigate(view);
        onClose(); // Close mobile menu after navigation
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
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gradient-to-b from-apple-gray-dark to-[#151518] text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Header con logo/identidad */}
                <div className="p-4 lg:p-6 flex justify-between items-center border-b border-white/10">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-manglar-orange to-manglar-orange/80 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">M</span>
                            </div>
                            <h2 className="text-xl lg:text-2xl font-bold text-white">ManglarNet</h2>
                        </div>
                        <p className="text-xs text-apple-gray font-light ml-10">Colegio El Manglar</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden text-apple-gray hover:text-white hover:bg-white/10"
                        aria-label="Close menu"
                    >
                        <CloseIcon />
                    </Button>
                </div>

                {/* NavegaciÃ³n agrupada */}
                <nav className="flex-1 px-3 lg:px-4 py-4 overflow-y-auto" aria-label="MenÃº de navegaciÃ³n">
                    {categoriesToRender.map((category) => {
                        const links = getLinksByCategory(category.id);
                        if (links.length === 0) return null;

                        return (
                            <div key={category.id} className="mb-6">
                                <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider px-3 mb-2" id={`nav-category-${category.id}`}>
                                    {category.label}
                                </h3>
                                <div className="space-y-1" role="group" aria-labelledby={`nav-category-${category.id}`}>
                                    {links.map(({ id, label, icon: Icon }) => (
                                        <Button
                                            key={id}
                                            variant="ghost"
                                            onClick={() => handleNavigate(id)}
                                            className={`w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium transition-apple hover-lift-smooth focus-ring ${activeView === id
                                                ? 'bg-manglar-orange text-white shadow-lg shadow-manglar-orange/20'
                                                : 'text-apple-gray hover:bg-white/10 hover:text-white'
                                                }`}
                                            aria-label={label}
                                            aria-current={activeView === id ? 'page' : undefined}
                                            role="menuitem"
                                        >
                                            <Icon className={`h-5 w-5 flex-shrink-0 ${activeView === id ? 'text-white' : ''}`} aria-hidden="true" />
                                            <span className="text-left">{label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

// ============================================
// [REMOVED] Coordinator Dashboard Widgets were here

// ============================================

const StudentFormModal: React.FC<{
    student: Alumno | null;
    onClose: () => void;
    onSave: (student: Alumno) => void;
}> = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Alumno, 'id_alumno' | 'hermanos'>>({
        nombres: student?.nombres || '',
        apellidos: student?.apellidos || '',
        email_alumno: student?.email_alumno || '',
        lugar_nacimiento: student?.lugar_nacimiento || '',
        estado: student?.estado || '',
        fecha_nacimiento: student?.fecha_nacimiento || '',
        cedula_escolar: student?.cedula_escolar || '',
        condicion: student?.condicion || 'Regular',
        genero: student?.genero || 'Niño',
        salon: student?.salon || GRADOS[0],
        grupo: student?.grupo || 'Grupo 1',
        info_madre: {
            nombre: student?.info_madre?.nombre || '',
            email: student?.info_madre?.email || '',
            telefono: student?.info_madre?.telefono || '',
        },
        info_padre: {
            nombre: student?.info_padre?.nombre || '',
            email: student?.info_padre?.email || '',
            telefono: student?.info_padre?.telefono || '',
        },
        nivel_ingles: student?.nivel_ingles || 'Basic',
    });

    const [hermanosStr, setHermanosStr] = useState(student?.hermanos?.join(', ') || '');

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value,
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalStudentData: Alumno = {
            ...formData,
            hermanos: hermanosStr.split(',').map(s => s.trim()).filter(Boolean),
            id_alumno: student?.id_alumno || '', // ID is handled by parent
        };
        onSave(finalStudentData);
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-6 lg:p-10">
                <DialogHeader className="px-6 pt-6 sm:px-0 sm:pt-0">
                    <DialogTitle className="text-2xl sm:text-3xl">{student ? 'Editar Alumno' : 'AÃ±adir Alumno'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8 px-6 pb-6 sm:px-0 sm:pb-0">
                    {/* Personal Info */}
                    <div className="pb-8">
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Datos Personales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} required />
                            <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                            <InputField label="Email Alumno" name="email_alumno" type="email" value={formData.email_alumno} onChange={handleChange} required />
                            <InputField label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} required />
                            <InputField as="select" label="GÃ©nero" name="genero" value={formData.genero} onChange={handleChange}>
                                <option value="NiÃ±o">NiÃ±o</option>
                                <option value="NiÃ±a">NiÃ±a</option>
                            </InputField>
                            <InputField label="Lugar de Nacimiento" name="lugar_nacimiento" value={formData.lugar_nacimiento} onChange={handleChange} />
                            <InputField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
                        </div>
                    </div>
                    <Separator />
                    {/* Academic Info */}
                    <div className="pb-8">
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Datos AcadÃ©micos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField label="CÃ©dula Escolar" name="cedula_escolar" value={formData.cedula_escolar} onChange={handleChange} />
                            <InputField as="select" label="SalÃ³n/Grado" name="salon" value={formData.salon} onChange={handleChange}>
                                {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                            </InputField>
                            <InputField as="select" label="Grupo" name="grupo" value={formData.grupo} onChange={handleChange}>
                                <option value="Grupo 1">Grupo 1</option>
                                <option value="Grupo 2">Grupo 2</option>
                            </InputField>
                            <InputField as="select" label="CondiciÃ³n" name="condicion" value={formData.condicion} onChange={handleChange}>
                                <option value="Regular">Regular</option>
                                <option value="Nuevo Ingreso">Nuevo Ingreso</option>
                            </InputField>
                            <InputField as="select" label="Nivel de InglÃ©s" name="nivel_ingles" value={formData.nivel_ingles} onChange={handleChange}>
                                <option value="Basic">Basic</option>
                                <option value="Lower">Lower</option>
                                <option value="Upper">Upper</option>
                                <option value="Advanced">Advanced</option>
                                <option value="IB">IB</option>
                            </InputField>
                            <InputField label="Hermanos (separados por coma)" name="hermanos" value={hermanosStr} onChange={(e) => setHermanosStr(e.target.value)} />
                        </div>
                    </div>
                    <Separator />
                    {/* Parent Info */}
                    <div>
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Datos de Representantes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="py-6 space-y-4">
                                <h4 className="font-semibold text-foreground">Madre</h4>
                                <InputField label="Nombre Completo" name="info_madre.nombre" value={formData.info_madre.nombre} onChange={handleChange} required />
                                <InputField label="Email" name="info_madre.email" type="email" value={formData.info_madre.email} onChange={handleChange} required />
                                <InputField label="TelÃ©fono" name="info_madre.telefono" value={formData.info_madre.telefono} onChange={handleChange} required />
                            </div>
                            <div className="py-6 space-y-4">
                                <h4 className="font-semibold text-foreground">Padre</h4>
                                <InputField label="Nombre Completo" name="info_padre.nombre" value={formData.info_padre.nombre} onChange={handleChange} />
                                <InputField label="Email" name="info_padre.email" type="email" value={formData.info_padre.email} onChange={handleChange} />
                                <InputField label="TelÃ©fono" name="info_padre.telefono" value={formData.info_padre.telefono} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    {/* Actions */}
                    <DialogFooter className="px-6 pb-6 sm:px-0 sm:pb-0 mt-8">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Guardar Alumno</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


const TeacherFormModal: React.FC<{
    teacher: Docente | null;
    clases: Clase[];
    aulas: Aula[];
    onClose: () => void;
    onSave: (teacher: Docente, assignments: Assignment[]) => void;
}> = ({ teacher, clases, aulas, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Docente, 'id_docente' | 'id_usuario'>>({
        nombres: teacher?.nombres || '',
        apellidos: teacher?.apellidos || '',
        email: teacher?.email || '',
        telefono: teacher?.telefono || '',
        especialidad: teacher?.especialidad || '',
    });

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

    // Cargar asignaciones existentes cuando se edita un docente
    useEffect(() => {
        const loadExistingAssignments = async () => {
            if (!teacher) {
                setAssignments([]);
                return;
            }

            setIsLoadingAssignments(true);
            try {
                const anoEscolar = '2025-2026'; // TODO: Obtener del contexto
                const loadedAssignments: Assignment[] = [];

                // 1. Cargar clases regulares (no inglÃ©s de niveles 5to-6to)
                const regularClasses = clases.filter(c => {
                    if (c.id_docente_asignado !== teacher.id_docente) return false;
                    // Excluir clases consolidadas de inglÃ©s 5to-6to (que tienen nivel_ingles: null y skill_rutina)
                    const isConsolidatedEnglish = (c.nombre_materia?.toLowerCase().includes('inglÃ©s') ||
                        c.nombre_materia?.toLowerCase().includes('ingles')) &&
                        (c.grado_asignado === '5to Grado' || c.grado_asignado === '6to Grado') &&
                        (c as any).nivel_ingles === null && (c as any).skill_rutina;
                    return !isConsolidatedEnglish;
                });

                regularClasses.forEach(c => {
                    loadedAssignments.push({
                        subject: c.nombre_materia,
                        grade: c.grado_asignado,
                        nivel_ingles: undefined,
                        id_aula: c.id_aula || undefined
                    });
                });

                // 2. Cargar asignaciones de inglÃ©s de niveles (5to-6to) desde asignacion_docente_nivel_ingles
                const { data: englishAssignments, error: englishError } = await supabase
                    .from('asignacion_docente_nivel_ingles')
                    .select('nivel_ingles')
                    .eq('id_docente', teacher.id_docente)
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (englishError) {
                    console.error('Error loading English level assignments:', englishError);
                } else if (englishAssignments) {
                    // Cargar aulas para cada nivel
                    const { data: aulasData } = await supabase
                        .from('asignacion_aula_nivel_ingles')
                        .select('nivel_ingles, id_aula')
                        .eq('ano_escolar', anoEscolar)
                        .eq('activa', true);

                    const aulasMap: { [nivel: string]: string } = {};
                    if (aulasData) {
                        aulasData.forEach(item => {
                            aulasMap[item.nivel_ingles] = item.id_aula;
                        });
                    }

                    // Crear asignaciones para cada nivel de inglÃ©s (5to y 6to grado)
                    englishAssignments.forEach(assignment => {
                        ['5to Grado', '6to Grado'].forEach(grade => {
                            loadedAssignments.push({
                                subject: 'InglÃ©s',
                                grade: grade,
                                nivel_ingles: assignment.nivel_ingles,
                                id_aula: aulasMap[assignment.nivel_ingles] || undefined
                            });
                        });
                    });
                }

                setAssignments(loadedAssignments);
            } catch (error) {
                console.error('Error loading assignments:', error);
            } finally {
                setIsLoadingAssignments(false);
            }
        };

        loadExistingAssignments();
    }, [teacher, clases]);
    const [currentSubject, setCurrentSubject] = useState('');
    const [currentGrade, setCurrentGrade] = useState('');
    const [currentNivelIngles, setCurrentNivelIngles] = useState('');
    const [currentAula, setCurrentAula] = useState(''); // Aula para asignaciones regulares
    const [englishLevelAulas, setEnglishLevelAulas] = useState<{ [nivel: string]: string }>({}); // Aulas por nivel para inglÃ©s
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar aulas asignadas para inglÃ©s de niveles al editar un docente
    useEffect(() => {
        const loadEnglishLevelAulas = async () => {
            if (!teacher) {
                setEnglishLevelAulas({});
                return;
            }

            try {
                const anoEscolar = '2025-2026'; // TODO: Obtener del contexto
                const { data, error } = await supabase
                    .from('asignacion_aula_nivel_ingles')
                    .select('nivel_ingles, id_aula')
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (error) throw error;

                // Crear objeto con nivel -> id_aula
                const aulasMap: { [nivel: string]: string } = {};
                if (data) {
                    data.forEach(item => {
                        aulasMap[item.nivel_ingles] = item.id_aula;
                    });
                }
                setEnglishLevelAulas(aulasMap);
            } catch (error) {
                console.error('Error loading English level aulas:', error);
            }
        };

        loadEnglishLevelAulas();
    }, [teacher]);

    // Helper functions for English logic
    const esInglesPrimaria = (subject: string): boolean => {
        const lowerSubject = subject.toLowerCase();
        return lowerSubject.includes('inglÃ©s') || lowerSubject.includes('ingles') ||
            lowerSubject.includes('english');
    };

    const esGradoAlto = (grade: string): boolean => {
        return grade === '5to Grado' || grade === '6to Grado';
    };

    const esNivelIngles = (subject: string): boolean => {
        const lowerSubject = subject.toLowerCase();
        return lowerSubject.includes('inglÃ©s basic') ||
            lowerSubject.includes('inglÃ©s lower') ||
            lowerSubject.includes('inglÃ©s upper') ||
            lowerSubject.includes('ingles basic') ||
            lowerSubject.includes('ingles lower') ||
            lowerSubject.includes('ingles upper');
    };

    const extraerNivelDeMateria = (subject: string): string | null => {
        const lowerSubject = subject.toLowerCase();
        if (lowerSubject.includes('basic')) return 'Basic';
        if (lowerSubject.includes('lower')) return 'Lower';
        if (lowerSubject.includes('upper')) return 'Upper';
        return null;
    };

    // Obtener asignaturas disponibles segÃºn la especialidad
    const getAvailableSubjects = useMemo(() => {
        const especialidad = formData.especialidad;

        // Si es Teacher, solo mostrar inglÃ©s
        if (especialidad === 'Teacher') {
            return [
                { value: 'InglÃ©s', label: 'InglÃ©s' },
                { value: 'InglÃ©s Basic', label: 'InglÃ©s Basic' },
                { value: 'InglÃ©s Lower', label: 'InglÃ©s Lower' },
                { value: 'InglÃ©s Upper', label: 'InglÃ©s Upper' }
            ];
        }

        // Si es Docente GuÃ­a o Integralidad, mostrar todas las asignaturas de primaria (excepto inglÃ©s de niveles)
        if (especialidad === 'Docente GuÃ­a' || especialidad === 'Integralidad') {
            const primariaSubjects = ASIGNATURAS_POR_NIVEL['Nivel Primaria'] || [];
            // Filtrar asignaturas de inglÃ©s de niveles (Basic, Lower, Upper) pero mantener InglÃ©s general
            const filtered = primariaSubjects.filter(subj => {
                const lower = subj.toLowerCase();
                return !lower.includes('inglÃ©s (basic)') &&
                    !lower.includes('inglÃ©s (lower)') &&
                    !lower.includes('inglÃ©s (upper)');
            });

            // Agrupar por categorÃ­as
            const grouped: { [key: string]: Array<{ value: string, label: string }> } = {
                'MatemÃ¡ticas': [],
                'Lenguaje': [],
                'Ciencias y Sociales': [],
                'InglÃ©s': [],
                'Especialidades': [],
                'Otros': []
            };

            filtered.forEach(subj => {
                const subjLower = subj.toLowerCase();
                if (subjLower.includes('matemÃ¡ticas')) {
                    grouped['MatemÃ¡ticas'].push({ value: subj, label: subj });
                } else if (subjLower.includes('lenguaje') || subjLower.includes('literatura')) {
                    grouped['Lenguaje'].push({ value: subj, label: subj });
                } else if (subjLower.includes('ciencias') || subjLower.includes('sociales') || subjLower.includes('proyecto')) {
                    grouped['Ciencias y Sociales'].push({ value: subj, label: subj });
                } else if (subjLower.includes('inglÃ©s')) {
                    grouped['InglÃ©s'].push({ value: subj, label: subj });
                } else if (subjLower.includes('mÃºsica') || subjLower.includes('arte') || subjLower.includes('tecnologÃ­a') ||
                    subjLower.includes('fÃ­sica') || subjLower.includes('deporte') || subjLower.includes('valores') ||
                    subjLower.includes('francÃ©s') || subjLower.includes('ajedrez')) {
                    grouped['Especialidades'].push({ value: subj, label: subj });
                } else {
                    grouped['Otros'].push({ value: subj, label: subj });
                }
            });

            return grouped;
        }

        // Si es Especialista, mostrar todas las asignaturas
        if (especialidad === 'Especialista') {
            const primariaSubjects = ASIGNATURAS_POR_NIVEL['Nivel Primaria'] || [];
            const grouped: { [key: string]: Array<{ value: string, label: string }> } = {
                'MatemÃ¡ticas': [],
                'Lenguaje': [],
                'Ciencias y Sociales': [],
                'InglÃ©s': [],
                'Especialidades': [],
                'Otros': []
            };

            primariaSubjects.forEach(subj => {
                const subjLower = subj.toLowerCase();
                if (subjLower.includes('matemÃ¡ticas')) {
                    grouped['MatemÃ¡ticas'].push({ value: subj, label: subj });
                } else if (subjLower.includes('lenguaje') || subjLower.includes('literatura')) {
                    grouped['Lenguaje'].push({ value: subj, label: subj });
                } else if (subjLower.includes('ciencias') || subjLower.includes('sociales') || subjLower.includes('proyecto')) {
                    grouped['Ciencias y Sociales'].push({ value: subj, label: subj });
                } else if (subjLower.includes('inglÃ©s')) {
                    grouped['InglÃ©s'].push({ value: subj, label: subj });
                } else if (subjLower.includes('mÃºsica') || subjLower.includes('arte') || subjLower.includes('tecnologÃ­a') ||
                    subjLower.includes('fÃ­sica') || subjLower.includes('deporte') || subjLower.includes('valores') ||
                    subjLower.includes('francÃ©s') || subjLower.includes('ajedrez')) {
                    grouped['Especialidades'].push({ value: subj, label: subj });
                } else {
                    grouped['Otros'].push({ value: subj, label: subj });
                }
            });

            return grouped;
        }

        // Si no hay especialidad seleccionada, no mostrar nada
        return null;
    }, [formData.especialidad]);

    const requiereNivelIngles = (subject: string, grade: string): boolean => {
        return esInglesPrimaria(subject) && esGradoAlto(grade);
    };

    // Validation function for English assignments
    const validarAsignacionIngles = (
        subject: string,
        grade: string,
        nivelIngles: string,
        assignments: Assignment[]
    ): { valida: boolean; error?: string } => {
        if (!esInglesPrimaria(subject)) {
            return { valida: true };
        }

        // Para 1er-4to: Solo puede haber un docente de inglÃ©s por grado
        if (!esGradoAlto(grade)) {
            const existeDocente = assignments.some(
                a => a.subject === subject && a.grade === grade
            );
            if (existeDocente) {
                return {
                    valida: false,
                    error: `Ya existe un docente de inglÃ©s asignado a ${grade}. En grados 1er-4to solo puede haber un docente de inglÃ©s por grado.`
                };
            }
            return { valida: true };
        }

        // Para 5to-6to: Debe tener nivel y no puede haber duplicados del mismo nivel
        if (!nivelIngles || nivelIngles === '') {
            return {
                valida: false,
                error: 'Para grados 5to y 6to, debe seleccionar un nivel de inglÃ©s (Basic, Lower o Upper)'
            };
        }

        const existeNivel = assignments.some(
            a => a.subject === subject &&
                a.grade === grade &&
                a.nivel_ingles === nivelIngles
        );
        if (existeNivel) {
            return {
                valida: false,
                error: `Ya existe un docente asignado al nivel ${nivelIngles} para ${grade}`
            };
        }

        return { valida: true };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Si cambia la especialidad, limpiar la asignatura seleccionada
        if (name === 'especialidad') {
            setCurrentSubject('');
            setCurrentGrade('');
            setCurrentNivelIngles('');
            setCurrentAula('');
        }
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.nombres.trim()) {
            newErrors.nombres = 'Los nombres son requeridos';
        }
        if (!formData.apellidos.trim()) {
            newErrors.apellidos = 'Los apellidos son requeridos';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El email no es vÃ¡lido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddAssignment = () => {
        const subjectError = !currentSubject.trim() ? 'Seleccione una asignatura' : '';

        // Si es un nivel de inglÃ©s, no requiere selecciÃ³n de grado manual
        if (!esNivelIngles(currentSubject)) {
            const gradeError = !currentGrade.trim() ? 'Seleccione un grado' : '';
            if (subjectError || gradeError) {
                setErrors(prev => ({
                    ...prev,
                    assignment: subjectError || gradeError
                }));
                return;
            }
        }

        // Si es un nivel de inglÃ©s, extraer el nivel y agregar ambos grados automÃ¡ticamente
        if (esNivelIngles(currentSubject)) {
            const nivel = extraerNivelDeMateria(currentSubject);
            if (!nivel) {
                setErrors(prev => ({
                    ...prev,
                    assignment: 'Error al detectar el nivel de inglÃ©s'
                }));
                return;
            }

            // Validar que no exista este nivel ya asignado
            // Buscar por "InglÃ©s" como subject y nivel_ingles
            const existeNivel5to = assignments.some(a =>
                (a.subject === 'InglÃ©s' || a.subject === currentSubject) &&
                a.grade === '5to Grado' &&
                a.nivel_ingles === nivel
            );
            const existeNivel6to = assignments.some(a =>
                (a.subject === 'InglÃ©s' || a.subject === currentSubject) &&
                a.grade === '6to Grado' &&
                a.nivel_ingles === nivel
            );

            if (existeNivel5to || existeNivel6to) {
                setErrors(prev => ({
                    ...prev,
                    assignment: `Ya existe un docente asignado al nivel ${nivel} para 5to o 6to grado`
                }));
                return;
            }

            // Agregar ambos grados automÃ¡ticamente
            // Usar "InglÃ©s" como subject base y el nivel en nivel_ingles
            // Para inglÃ©s de niveles, el aula se asignarÃ¡ usando asignacion_aula_nivel_ingles
            setAssignments(prev => [...prev,
            {
                subject: 'InglÃ©s',
                grade: '5to Grado',
                nivel_ingles: nivel,
                id_aula: englishLevelAulas[nivel] || undefined // Aula para este nivel
            },
            {
                subject: 'InglÃ©s',
                grade: '6to Grado',
                nivel_ingles: nivel,
                id_aula: englishLevelAulas[nivel] || undefined // Mismo aula para ambos grados
            }
            ]);
        } else {
            // Para inglÃ©s regular (1er-4to) o otras materias
            // ValidaciÃ³n especial para inglÃ©s en 5to-6to
            if (requiereNivelIngles(currentSubject, currentGrade)) {
                if (!currentNivelIngles || currentNivelIngles === '') {
                    setErrors(prev => ({
                        ...prev,
                        assignment: 'Para inglÃ©s en 5to y 6to grado, debe seleccionar un nivel'
                    }));
                    return;
                }
            }

            // Validar asignaciÃ³n de inglÃ©s
            const validacion = validarAsignacionIngles(
                currentSubject,
                currentGrade,
                currentNivelIngles,
                assignments
            );

            if (!validacion.valida) {
                setErrors(prev => ({
                    ...prev,
                    assignment: validacion.error || 'Error en la asignaciÃ³n'
                }));
                return;
            }

            // Verificar si ya existe esta combinaciÃ³n (considerando nivel para inglÃ©s en 5to-6to)
            const exists = requiereNivelIngles(currentSubject, currentGrade)
                ? assignments.some(a =>
                    a.subject === currentSubject &&
                    a.grade === currentGrade &&
                    a.nivel_ingles === currentNivelIngles
                )
                : assignments.some(a =>
                    a.subject === currentSubject &&
                    a.grade === currentGrade
                );

            if (exists) {
                setErrors(prev => ({
                    ...prev,
                    assignment: 'Esta asignaciÃ³n ya estÃ¡ agregada'
                }));
                return;
            }

            // Agregar la asignatura normal
            setAssignments(prev => [...prev, {
                subject: currentSubject.trim(),
                grade: currentGrade.trim(),
                nivel_ingles: requiereNivelIngles(currentSubject, currentGrade)
                    ? currentNivelIngles
                    : undefined,
                id_aula: currentAula || undefined // Incluir aula si estÃ¡ asignada
            }]);
        }

        // Limpiar campos
        setCurrentSubject('');
        setCurrentGrade('');
        setCurrentNivelIngles('');
        setCurrentAula(''); // Limpiar aula tambiÃ©n
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.assignment;
            return newErrors;
        });
    };

    const handleRemoveAssignment = (index: number) => {
        setAssignments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar formulario
        if (!validateForm()) {
            return;
        }

        // Validar que haya al menos una asignatura
        if (assignments.length === 0) {
            setErrors(prev => ({
                ...prev,
                assignment: 'Debe agregar al menos una asignatura y grado'
            }));
            return;
        }

        setIsSubmitting(true);
        try {
            const finalTeacherData: Docente = {
                ...formData,
                id_docente: teacher?.id_docente || `docente-${Date.now()}`,
                id_usuario: teacher?.id_usuario || undefined
            };
            await onSave(finalTeacherData, assignments);
        } catch (error) {
            console.error('Error in form submission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 sm:p-6 lg:p-10">
                <DialogHeader className="px-6 pt-6 sm:px-0 sm:pt-0">
                    <DialogTitle className="text-2xl sm:text-3xl">{teacher ? 'Editar Docente' : 'AÃ±adir Docente'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 px-6 pb-6 sm:px-0 sm:pb-0">
                    {/* InformaciÃ³n Personal */}
                    <div>
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight pb-4">InformaciÃ³n Personal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputField
                                    label="Nombres"
                                    name="nombres"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.nombres && (
                                    <p className="mt-1 text-sm text-destructive">{errors.nombres}</p>
                                )}
                            </div>
                            <div>
                                <InputField
                                    label="Apellidos"
                                    name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.apellidos && (
                                    <p className="mt-1 text-sm text-destructive">{errors.apellidos}</p>
                                )}
                            </div>
                            <div>
                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>
                            <div>
                                <InputField
                                    label="TelÃ©fono"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <InputField
                                    label="Especialidad"
                                    name="especialidad"
                                    value={formData.especialidad}
                                    onChange={handleChange}
                                    as="select"
                                >
                                    <option value="">Seleccione una especialidad</option>
                                    <option value="Docente GuÃ­a">Docente GuÃ­a</option>
                                    <option value="Integralidad">Integralidad</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Especialista">Especialista</option>
                                </InputField>
                            </div>
                        </div>
                    </div>

                    <Separator />
                    {/* Asignaturas y Grados */}
                    <div className="pt-6">
                        <h3 className="text-xl font-semibold mb-6 text-foreground tracking-tight">Asignaturas y Grados</h3>
                        {isLoadingAssignments && teacher && (
                            <Card className="mb-4 bg-primary/5 border-primary/20">
                                <CardContent className="p-3">
                                    <p className="text-sm text-primary">Cargando asignaciones existentes...</p>
                                </CardContent>
                            </Card>
                        )}
                        <div className="bg-apple-gray-light p-4 rounded-lg border border-apple-gray-light">
                            <div className="flex flex-wrap items-end gap-4 mb-4">
                                <div className="flex-grow min-w-[200px]">
                                    <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                        Asignatura <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={currentSubject}
                                        onChange={e => {
                                            const selectedSubject = e.target.value;
                                            setCurrentSubject(selectedSubject);

                                            // Si es un nivel de inglÃ©s, extraer el nivel y auto-seleccionar grados
                                            if (esNivelIngles(selectedSubject)) {
                                                const nivel = extraerNivelDeMateria(selectedSubject);
                                                if (nivel) {
                                                    setCurrentNivelIngles(nivel);
                                                    // Auto-seleccionar ambos grados (se harÃ¡ en handleAddAssignment)
                                                }
                                            } else {
                                                setCurrentNivelIngles('');
                                            }

                                            if (errors.assignment) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.assignment;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        className={`mt-1 block w-full p-2 border rounded-md ${errors.assignment ? 'border-apple-red' : 'border-apple-gray'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        disabled={isSubmitting || !formData.especialidad}
                                    >
                                        <option value="">
                                            {!formData.especialidad
                                                ? 'Seleccione primero una especialidad'
                                                : 'Seleccione una asignatura'}
                                        </option>
                                        {getAvailableSubjects && (
                                            Array.isArray(getAvailableSubjects) ? (
                                                // Para Teacher: lista simple
                                                <optgroup label="InglÃ©s">
                                                    {getAvailableSubjects.map(subj => (
                                                        <option key={subj.value} value={subj.value}>{subj.label}</option>
                                                    ))}
                                                </optgroup>
                                            ) : (
                                                // Para Docente GuÃ­a, Integralidad o Especialista: agrupado por categorÃ­as
                                                Object.entries(getAvailableSubjects).map(([category, subjects]) =>
                                                    subjects.length > 0 ? (
                                                        <optgroup key={category} label={category}>
                                                            {subjects.map(subj => (
                                                                <option key={subj.value} value={subj.value}>{subj.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    ) : null
                                                )
                                            )
                                        )}
                                    </select>
                                </div>
                                {!esNivelIngles(currentSubject) && (
                                    <div className="flex-grow min-w-[150px]">
                                        <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                            Grado <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={currentGrade}
                                            onChange={e => {
                                                setCurrentGrade(e.target.value);
                                                // Reset nivel if grade changes and it's not 5to-6to
                                                if (!esGradoAlto(e.target.value) || !esInglesPrimaria(currentSubject)) {
                                                    setCurrentNivelIngles('');
                                                }
                                                if (errors.assignment) {
                                                    setErrors(prev => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.assignment;
                                                        return newErrors;
                                                    });
                                                }
                                            }}
                                            className={`mt-1 block w-full p-2 border rounded-md ${errors.assignment ? 'border-apple-red' : 'border-apple-gray'
                                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Seleccione un grado</option>
                                            {GRADOS.map(grado => <option key={grado} value={grado}>{grado}</option>)}
                                        </select>
                                    </div>
                                )}
                                {esNivelIngles(currentSubject) && (
                                    <>
                                        <div className="flex-grow min-w-[200px]">
                                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                                Grados (se asignarÃ¡n automÃ¡ticamente) <span className="text-green-600">*</span>
                                            </label>
                                            <div className="mt-1 p-2 border border-green-300 rounded-md bg-green-50 text-sm text-green-700 font-medium">
                                                5to Grado y 6to Grado
                                            </div>
                                        </div>
                                        <div className="flex-grow min-w-[200px]">
                                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                                Aula/SalÃ³n para {extraerNivelDeMateria(currentSubject) || 'este nivel'}
                                            </label>
                                            <select
                                                value={englishLevelAulas[extraerNivelDeMateria(currentSubject) || ''] || ''}
                                                onChange={(e) => {
                                                    const nivel = extraerNivelDeMateria(currentSubject);
                                                    if (nivel) {
                                                        setEnglishLevelAulas(prev => ({
                                                            ...prev,
                                                            [nivel]: e.target.value
                                                        }));
                                                    }
                                                }}
                                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base"
                                                disabled={isSubmitting}
                                            >
                                                <option value="">Seleccione un aula</option>
                                                {aulas.filter(a => a.activa).map(aula => (
                                                    <option key={aula.id_aula} value={aula.id_aula}>{aula.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                {!esNivelIngles(currentSubject) && currentSubject && currentGrade && (
                                    <div className="flex-grow min-w-[200px]">
                                        <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                                            Aula/SalÃ³n
                                        </label>
                                        <select
                                            value={currentAula}
                                            onChange={(e) => setCurrentAula(e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Seleccione un aula (opcional)</option>
                                            {aulas.filter(a => a.activa).map(aula => (
                                                <option key={aula.id_aula} value={aula.id_aula}>{aula.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    onClick={handleAddAssignment}
                                    disabled={isSubmitting}
                                >
                                    AÃ±adir
                                </Button>
                            </div>
                            {errors.assignment && (
                                <p className="mb-3 text-sm text-destructive bg-destructive/10 p-2 rounded">{errors.assignment}</p>
                            )}
                            {assignments.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {assignments.map((a, index) => {
                                        // Para niveles de inglÃ©s, mostrar de forma agrupada si es posible
                                        const esParteDeNivel = a.nivel_ingles && esGradoAlto(a.grade);
                                        const siguienteEsMismoNivel = index < assignments.length - 1 &&
                                            assignments[index + 1].nivel_ingles === a.nivel_ingles &&
                                            assignments[index + 1].subject === a.subject &&
                                            ((a.grade === '5to Grado' && assignments[index + 1].grade === '6to Grado') ||
                                                (a.grade === '6to Grado' && assignments[index + 1].grade === '5to Grado'));

                                        // Si es 5to y el siguiente es 6to del mismo nivel, mostrar ambos juntos
                                        if (esParteDeNivel && siguienteEsMismoNivel && a.grade === '5to Grado') {
                                            return (
                                                <span
                                                    key={index}
                                                    className="flex items-center gap-2 bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1.5 rounded-full border border-purple-200"
                                                >
                                                    <span className="font-semibold">{a.subject}</span>
                                                    <span className="text-purple-600">(5to y 6to Grado</span>
                                                    {a.nivel_ingles && (
                                                        <span className="text-purple-700 font-bold"> - {a.nivel_ingles}</span>
                                                    )}
                                                    {a.id_aula && (
                                                        <span className="text-purple-600"> - {aulas.find(aula => aula.id_aula === a.id_aula)?.nombre || 'Aula'}</span>
                                                    )}
                                                    <span className="text-purple-600">)</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            // Eliminar ambos (5to y 6to)
                                                            const indicesAEliminar = [index, index + 1];
                                                            setAssignments(prev => prev.filter((_, i) => !indicesAEliminar.includes(i)));
                                                        }}
                                                        className="h-6 w-6 text-purple-600 hover:text-purple-800 hover:bg-purple-200"
                                                        disabled={isSubmitting}
                                                        title="Eliminar ambos grados"
                                                    >
                                                        <CloseIcon className="h-4 w-4" />
                                                    </Button>
                                                </span>
                                            );
                                        }

                                        // Si es 6to y el anterior fue 5to del mismo nivel, no mostrar (ya se mostrÃ³ agrupado)
                                        if (esParteDeNivel && index > 0 &&
                                            assignments[index - 1].nivel_ingles === a.nivel_ingles &&
                                            assignments[index - 1].subject === a.subject &&
                                            assignments[index - 1].grade === '5to Grado' &&
                                            a.grade === '6to Grado') {
                                            return null;
                                        }

                                        // Mostrar asignaciÃ³n normal
                                        return (
                                            <span
                                                key={index}
                                                className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full border border-blue-200"
                                            >
                                                <span className="font-semibold">{a.subject}</span>
                                                <span className="text-blue-600">({a.grade}</span>
                                                {a.nivel_ingles && (
                                                    <span className="text-blue-700 font-bold"> - {a.nivel_ingles}</span>
                                                )}
                                                {a.id_aula && (
                                                    <span className="text-blue-600"> - {aulas.find(aula => aula.id_aula === a.id_aula)?.nombre || 'Aula'}</span>
                                                )}
                                                <span className="text-blue-600">)</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveAssignment(index)}
                                                    className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-200"
                                                    disabled={isSubmitting}
                                                    title="Eliminar"
                                                >
                                                    <CloseIcon className="h-4 w-4" />
                                                </Button>
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground font-light italic">No hay asignaturas agregadas. Agregue al menos una asignatura y grado.</p>
                            )}
                        </div>
                    </div>

                </form>
                <DialogFooter className="px-6 pb-6 sm:px-0 sm:pb-0 mt-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">â³</span>
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TeachersView: React.FC<{
    docentes: Docente[];
    clases: Clase[];
    alumnos: Alumno[];
    aulas: Aula[];
    setDocentes: React.Dispatch<React.SetStateAction<Docente[]>>;
    setClases: React.Dispatch<React.SetStateAction<Clase[]>>;
    currentUser: Usuario;
}> = ({ docentes, clases, alumnos, aulas, setDocentes, setClases, currentUser }) => {
    const { showToast } = useToast();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Docente | null>(null);
    const [unlinkedUsers] = useState<Array<{ id: string, email: string, role: string }>>([]);
    const [showUnlinkedSection, setShowUnlinkedSection] = useState(false);
    const [englishLevelAssignments, setEnglishLevelAssignments] = useState<Array<{ id_docente: string, nivel_ingles: string, id_aula?: string }>>([]);
    const [confirmDeleteTeacher, setConfirmDeleteTeacher] = useState<{ open: boolean; teacherId: string | null; warningMessage?: string }>({ open: false, teacherId: null });

    // Cargar asignaciones de niveles de inglÃ©s
    useEffect(() => {
        const loadEnglishAssignments = async () => {
            try {
                const anoEscolar = '2025-2026';
                const { data: assignments, error } = await supabase
                    .from('asignacion_docente_nivel_ingles')
                    .select('id_docente, nivel_ingles')
                    .eq('ano_escolar', anoEscolar)
                    .eq('activa', true);

                if (error) {
                    console.error('Error loading English level assignments:', error);
                    return;
                }

                // Cargar tambiÃ©n las aulas asignadas a cada nivel
                const assignmentsWithAulas = await Promise.all(
                    (assignments || []).map(async (assignment) => {
                        const { data: aulaAssignment } = await supabase
                            .from('asignacion_aula_nivel_ingles')
                            .select('id_aula')
                            .eq('nivel_ingles', assignment.nivel_ingles)
                            .eq('ano_escolar', anoEscolar)
                            .eq('activa', true)
                            .maybeSingle();

                        return {
                            ...assignment,
                            id_aula: aulaAssignment?.id_aula
                        };
                    })
                );

                setEnglishLevelAssignments(assignmentsWithAulas);
            } catch (error) {
                console.error('Error loading English assignments:', error);
            }
        };

        loadEnglishAssignments();
    }, [docentes]);

    const handleOpenModal = (teacher: Docente | null = null) => {
        setSelectedTeacher(teacher);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTeacher(null);
    };

    // Helper functions for English logic
    const esInglesPrimaria = (subject: string): boolean => {
        const lowerSubject = subject.toLowerCase();
        return lowerSubject.includes('inglÃ©s') || lowerSubject.includes('ingles') ||
            lowerSubject.includes('english');
    };

    const esGradoAlto = (grade: string): boolean => {
        return grade === '5to Grado' || grade === '6to Grado';
    };

    const handleSaveTeacher = async (teacherData: Docente, newAssignments: Assignment[]) => {
        try {
            // Get current academic year (you might want to get this from context or config)
            const anoEscolar = '2025-2026'; // TODO: Obtener del contexto/configuraciÃ³n

            // Update teacher details in Supabase
            const teacherExists = docentes.some(d => d.id_docente === teacherData.id_docente);
            let savedTeacher: Docente;

            if (teacherExists) {
                // Update existing teacher
                const { id_docente, created_at, updated_at, ...updateData } = teacherData;
                savedTeacher = await docentesService.update(id_docente, updateData);
                setDocentes(prev => prev.map(d => d.id_docente === savedTeacher.id_docente ? savedTeacher : d));

                // Delete old English level assignments if any
                try {
                    await supabase
                        .from('asignacion_docente_nivel_ingles')
                        .delete()
                        .eq('id_docente', savedTeacher.id_docente)
                        .eq('ano_escolar', anoEscolar);
                } catch (error) {
                    console.error('Error deleting old English level assignments:', error);
                }
            } else {
                // Create new teacher
                // Omit id_docente, created_at, updated_at - Supabase will generate id_docente automatically
                const { id_docente, created_at, updated_at, id_usuario, ...newTeacher } = teacherData;
                // Only include id_usuario if it's a valid UUID (not a generated string like "user-123456")
                const teacherToCreate = id_usuario && !id_usuario.startsWith('user-') && !id_usuario.startsWith('docente-')
                    ? { ...newTeacher, id_usuario }
                    : newTeacher;
                savedTeacher = await docentesService.create(teacherToCreate);
                setDocentes(prev => [...prev, savedTeacher]);
            }

            // Update classes based on assignments
            // Remove all old classes for this teacher
            const otherTeachersClasses = clases.filter(c => c.id_docente_asignado !== savedTeacher.id_docente);

            // Delete old classes from Supabase
            const oldClasses = clases.filter(c => c.id_docente_asignado === savedTeacher.id_docente);
            for (const oldClass of oldClasses) {
                try {
                    await clasesService.delete(oldClass.id_clase);
                } catch (error) {
                    console.error('Error deleting old class:', error);
                }
            }

            // Separate English and regular assignments
            const asignacionesIngles = newAssignments.filter(a => esInglesPrimaria(a.subject));
            const asignacionesRegulares = newAssignments.filter(a => !esInglesPrimaria(a.subject));

            // Create new classes based on assignments
            if (newAssignments.length > 0) {
                const createdClasses = [];
                const errors: string[] = [];
                const asignacionesNivelCreadas: string[] = [];

                // Process regular assignments
                for (const a of asignacionesRegulares) {
                    // Validar que la asignatura y el grado no estÃ©n vacÃ­os
                    if (!a.subject || !a.grade) {
                        errors.push(`Asignatura o grado vacÃ­o: ${a.subject || 'Sin asignatura'} - ${a.grade || 'Sin grado'}`);
                        continue;
                    }

                    try {
                        const newClass = {
                            nombre_materia: a.subject.trim(),
                            grado_asignado: a.grade.trim(),
                            id_docente_asignado: savedTeacher.id_docente,
                            id_aula: a.id_aula || null, // Agregar aula si estÃ¡ asignada
                            studentIds: alumnos.filter(s => s.salon === a.grade).map(s => s.id_alumno),
                        };
                        const created = await clasesService.create(newClass);
                        createdClasses.push({
                            ...created,
                            studentIds: created.studentIds || []
                        });
                    } catch (error: any) {
                        const errorMsg = `Error al crear la clase ${a.subject} (${a.grade}): ${error.message || 'Error desconocido'}`;
                        console.error(`Error creating class for ${a.subject} - ${a.grade}:`, error);
                        errors.push(errorMsg);
                    }
                }

                // Process English assignments
                for (const a of asignacionesIngles) {
                    if (!a.subject || !a.grade) {
                        errors.push(`Asignatura o grado vacÃ­o: ${a.subject || 'Sin asignatura'} - ${a.grade || 'Sin grado'}`);
                        continue;
                    }

                    try {
                        if (!esGradoAlto(a.grade)) {
                            // Para 1er-4to: Crear clases por skill
                            // Skills para 1er-4to: Phonics, Reading, Writing, Listening, Speaking, Project, Use of English
                            const skillsPrimaria = ['Phonics', 'Reading', 'Writing', 'Listening', 'Speaking', 'Project', 'Use of English'];
                            const alumnosGrado = alumnos.filter(s => s.salon === a.grade);

                            for (const skill of skillsPrimaria) {
                                try {
                                    const claseSkill: any = {
                                        nombre_materia: `InglÃ©s - ${skill}`,
                                        grado_asignado: a.grade.trim(),
                                        id_docente_asignado: savedTeacher.id_docente,
                                        id_aula: a.id_aula || null, // Agregar aula si estÃ¡ asignada
                                        es_ingles_primaria: true,
                                        es_proyecto: skill === 'Project',
                                        nivel_ingles: null, // 1er-4to no tienen niveles
                                        skill_rutina: skill,
                                        studentIds: alumnosGrado.map(al => al.id_alumno),
                                    };
                                    const createdSkill = await clasesService.create(claseSkill);
                                    createdClasses.push({
                                        ...createdSkill,
                                        studentIds: createdSkill.studentIds || []
                                    });
                                } catch (error: any) {
                                    const errorMsg = `Error creating class for ${skill} - ${a.grade}: ${error.message || JSON.stringify(error)}`;
                                    console.error(errorMsg, error);
                                    errors.push(errorMsg);
                                }
                            }
                        } else {
                            // Para 5to-6to: Solo crear asignaciÃ³n de docente por nivel, NO crear clases individuales
                            // Las clases se crearÃ¡n una sola vez por skill (consolidadas) cuando se agregue el primer docente
                            if (a.nivel_ingles) {
                                try {
                                    // Verificar si ya existe esta asignaciÃ³n
                                    const { data: existing } = await supabase
                                        .from('asignacion_docente_nivel_ingles')
                                        .select('*')
                                        .eq('id_docente', savedTeacher.id_docente)
                                        .eq('nivel_ingles', a.nivel_ingles)
                                        .eq('ano_escolar', anoEscolar)
                                        .single();

                                    if (!existing) {
                                        // Crear entrada en asignacion_docente_nivel_ingles
                                        const { error: assignError } = await supabase
                                            .from('asignacion_docente_nivel_ingles')
                                            .insert({
                                                id_docente: savedTeacher.id_docente,
                                                nivel_ingles: a.nivel_ingles,
                                                ano_escolar: anoEscolar,
                                                activa: true
                                            });

                                        if (assignError) {
                                            throw assignError;
                                        }
                                    } else {
                                        // Actualizar si ya existe
                                        await supabase
                                            .from('asignacion_docente_nivel_ingles')
                                            .update({ activa: true })
                                            .eq('id', existing.id);
                                    }

                                    // Crear o actualizar asignaciÃ³n de aula para este nivel
                                    if (a.id_aula) {
                                        try {
                                            // Verificar si ya existe una asignaciÃ³n de aula para este nivel
                                            const { data: existingAula } = await supabase
                                                .from('asignacion_aula_nivel_ingles')
                                                .select('*')
                                                .eq('nivel_ingles', a.nivel_ingles)
                                                .eq('ano_escolar', anoEscolar)
                                                .eq('activa', true)
                                                .single();

                                            if (!existingAula) {
                                                // Crear nueva asignaciÃ³n de aula
                                                const { error: aulaError } = await supabase
                                                    .from('asignacion_aula_nivel_ingles')
                                                    .insert({
                                                        id_aula: a.id_aula,
                                                        nivel_ingles: a.nivel_ingles,
                                                        ano_escolar: anoEscolar,
                                                        prioridad: 1,
                                                        activa: true
                                                    });

                                                if (aulaError) {
                                                    console.error('Error creating aula assignment:', aulaError);
                                                    // No lanzar error, solo registrar
                                                }
                                            } else {
                                                // Actualizar aula existente si es diferente
                                                if (existingAula.id_aula !== a.id_aula) {
                                                    await supabase
                                                        .from('asignacion_aula_nivel_ingles')
                                                        .update({
                                                            id_aula: a.id_aula,
                                                            activa: true
                                                        })
                                                        .eq('id', existingAula.id);
                                                }
                                            }
                                        } catch (error) {
                                            // Si no existe la tabla o hay error, solo registrar
                                            console.error('Error managing aula assignment:', error);
                                        }
                                    }

                                    // Verificar si ya existen clases consolidadas por skill para 5to-6to
                                    // Si no existen, crearlas una sola vez (6 clases, una por skill)
                                    const skillsNivel = ['Speaking', 'Listening', 'Writing', 'Creative Writing', 'Use of English', 'Reading'];

                                    // Obtener todas las clases de inglÃ©s de 5to-6to existentes
                                    const existingEnglishClasses = clases.filter(c =>
                                        c.es_ingles_primaria &&
                                        c.grado_asignado === '5to Grado' &&
                                        c.skill_rutina &&
                                        skillsNivel.includes(c.skill_rutina)
                                    );

                                    // Crear solo las clases que no existen aÃºn (una por skill, sin nivel especÃ­fico)
                                    for (const skill of skillsNivel) {
                                        const classExists = existingEnglishClasses.some(c => c.skill_rutina === skill);

                                        if (!classExists) {
                                            try {
                                                // Obtener todos los alumnos de 5to y 6to (sin filtrar por nivel, ya que la clase es consolidada)
                                                const todosAlumnos5to6to = alumnos.filter(
                                                    alumno => alumno.salon === '5to Grado' || alumno.salon === '6to Grado'
                                                );

                                                // Crear clase consolidada (sin nivel especÃ­fico, nivel_ingles = null)
                                                const claseSkill: any = {
                                                    nombre_materia: `InglÃ©s - ${skill}`,
                                                    grado_asignado: '5to Grado', // Usar 5to como grado principal para el filtro
                                                    id_docente_asignado: null, // Sin docente especÃ­fico, se consultarÃ¡ de asignaciones
                                                    es_ingles_primaria: true,
                                                    es_proyecto: false,
                                                    nivel_ingles: null, // null indica que es una clase consolidada
                                                    skill_rutina: skill,
                                                    studentIds: todosAlumnos5to6to.map(al => al.id_alumno),
                                                };
                                                const createdSkill = await clasesService.create(claseSkill);
                                                createdClasses.push({
                                                    ...createdSkill,
                                                    studentIds: createdSkill.studentIds || []
                                                });
                                            } catch (error: any) {
                                                const errorMsg = `Error creating consolidated class for ${skill}: ${error.message || JSON.stringify(error)}`;
                                                console.error(errorMsg, error);
                                                errors.push(errorMsg);
                                            }
                                        }
                                    }

                                    asignacionesNivelCreadas.push(`${a.subject} - 5to y 6to Grado (${a.nivel_ingles})`);
                                } catch (error: any) {
                                    const errorMsg = `Error al crear asignaciÃ³n de nivel ${a.nivel_ingles} para ${a.grade}: ${error.message || 'Error desconocido'}`;
                                    console.error(`Error creating English level assignment:`, error);
                                    errors.push(errorMsg);
                                }
                            } else {
                                errors.push(`Falta nivel_ingles para ${a.subject} en ${a.grade}`);
                            }
                        }
                    } catch (error: any) {
                        const errorMsg = `Error al procesar inglÃ©s ${a.subject} (${a.grade}): ${error.message || 'Error desconocido'}`;
                        console.error(`Error processing English assignment:`, error);
                        errors.push(errorMsg);
                    }
                }

                // Mostrar errores si los hay
                if (errors.length > 0) {
                    alert('Algunas asignaciones no se pudieron crear:\n\n' + errors.join('\n'));
                }

                // Recargar todas las clases desde Supabase para asegurar sincronizaciÃ³n
                try {
                    const allClases = await clasesService.getAll();
                    setClases(allClases.map((db: any) => {
                        const { created_at, updated_at, student_ids, ...clase } = db;
                        return {
                            ...clase,
                            studentIds: student_ids || []
                        };
                    }));
                } catch (error: any) {
                    console.error('Error reloading classes:', error);
                    // Si falla la recarga, al menos actualizar con las clases creadas
                    setClases([...otherTeachersClasses, ...createdClasses]);
                }

                // Mostrar mensaje de Ã©xito
                // Para niveles de inglÃ©s, contamos las clases creadas (no las asignaciones)
                const totalCreado = createdClasses.length;
                // Contar clases consolidadas de inglÃ©s de 5to-6to (mÃ¡ximo 6, una por skill)
                const englishConsolidatedClasses = createdClasses.filter(c =>
                    c.es_ingles_primaria &&
                    c.nivel_ingles === null &&
                    c.grado_asignado === '5to Grado'
                ).length;
                const totalEsperado = asignacionesRegulares.length +
                    (asignacionesIngles.filter(a => !esGradoAlto(a.grade)).length * 7) + // 1er-4to: 7 skills por grado
                    Math.min(englishConsolidatedClasses, 6); // 5to-6to: mÃ¡ximo 6 clases consolidadas (una por skill)

                if (totalCreado >= totalEsperado * 0.9) { // Permitir 10% de error
                    if (asignacionesNivelCreadas.length > 0) {
                        showToast({
                            type: 'success',
                            title: `Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente`,
                            message: `Clases creadas: ${createdClasses.length}. Asignaciones de nivel inglÃ©s: ${asignacionesNivelCreadas.length}. Se crearon automÃ¡ticamente las clases consolidadas por skill para 5to y 6to Grado.`,
                            duration: 7000,
                        });
                    } else {
                        showToast({
                            type: 'success',
                            title: `Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente`,
                            message: `${createdClasses.length} clase(s) creada(s)`,
                        });
                    }
                } else if (totalCreado > 0) {
                    showToast({
                        type: 'warning',
                        title: `Docente ${teacherExists ? 'actualizado' : 'creado'} con advertencias`,
                        message: `Solo ${totalCreado} de aproximadamente ${totalEsperado} clases se guardaron correctamente.`,
                        duration: 6000,
                    });
                }
            } else {
                // Si no hay asignaturas, solo actualizar el estado local
                setClases(otherTeachersClasses);
                showToast({
                    type: 'info',
                    title: `Docente ${teacherExists ? 'actualizado' : 'creado'} exitosamente`,
                    message: 'Nota: No se agregaron asignaturas',
                });
            }

            handleCloseModal();
        } catch (error: any) {
            console.error('Error saving teacher:', error);
            showToast({
                type: 'error',
                title: 'Error al guardar el docente',
                message: error.message || 'No se pudo guardar el docente. Por favor, intÃ©ntalo de nuevo.',
            });
        }
    };

    const handleDeleteTeacher = async (id_docente: string) => {
        // Verificar que el usuario actual no se estÃ© eliminando a sÃ­ mismo
        if (currentUser?.docenteId === id_docente) {
            showToast({
                type: 'warning',
                title: 'AcciÃ³n no permitida',
                message: 'No puedes eliminar tu propio perfil de docente. Contacta a un coordinador o directivo.',
            });
            return;
        }

        // Obtener informaciÃ³n del docente a eliminar
        const docenteToDelete = docentes.find(d => d.id_docente === id_docente);
        const classesToDelete = clases.filter(c => c.id_docente_asignado === id_docente);

        // Preparar mensaje de advertencia
        const warningMessage = `Docente: ${docenteToDelete?.nombres || ''} ${docenteToDelete?.apellidos || ''}\nEmail: ${docenteToDelete?.email || ''}\n\nâš ï¸ ADVERTENCIA: Esta acciÃ³n eliminarÃ¡:\n- El registro del docente\n- ${classesToDelete.length} clase(s) asignada(s)\n- Todas las planificaciones asociadas\n- Todas las notificaciones asociadas\n\nEsta acciÃ³n NO se puede deshacer.`;

        setConfirmDeleteTeacher({ open: true, teacherId: id_docente, warningMessage });
    };

    const confirmDeleteTeacherAction = async () => {
        if (!confirmDeleteTeacher.teacherId) return;

        const id_docente = confirmDeleteTeacher.teacherId;

        const classesToDelete = clases.filter(c => c.id_docente_asignado === id_docente);

        try {
            // Mostrar indicador de carga
            const deleteButton = document.activeElement as HTMLElement;

            if (deleteButton) {
                deleteButton.textContent = 'Eliminando...';
                deleteButton.setAttribute('disabled', 'true');
            }

            // Verificar si hay muchas clases (puede tomar tiempo)
            if (classesToDelete.length > 10) {
                console.warn(`Eliminando ${classesToDelete.length} clases, esto puede tomar un momento...`);
            }

            // Delete classes from Supabase
            let deletedClasses = 0;
            let failedClasses: string[] = [];

            for (const clase of classesToDelete) {
                try {
                    await clasesService.delete(clase.id_clase);
                    deletedClasses++;
                } catch (error: any) {
                    console.error(`Error deleting class ${clase.id_clase}:`, error);
                    failedClasses.push(clase.nombre_materia || clase.id_clase);
                }
            }

            // Si algunas clases fallaron, mostrar advertencia
            if (failedClasses.length > 0) {
                const continueDelete = window.confirm(
                    `âš ï¸ Advertencia: No se pudieron eliminar ${failedClasses.length} clase(s):\n` +
                    `${failedClasses.slice(0, 5).join(', ')}${failedClasses.length > 5 ? '...' : ''}\n\n` +
                    `Â¿Desea continuar eliminando el docente de todas formas?`
                );

                if (!continueDelete) {
                    setConfirmDeleteTeacher({ open: false, teacherId: null });
                    return;
                }
            }

            // Delete teacher from Supabase
            await docentesService.delete(id_docente);

            // Update local state
            setDocentes(prev => prev.filter(d => d.id_docente !== id_docente));
            setClases(prev => prev.filter(c => c.id_docente_asignado !== id_docente));

            // Cerrar el diÃ¡logo de confirmaciÃ³n
            setConfirmDeleteTeacher({ open: false, teacherId: null });

            // Mostrar mensaje de Ã©xito
            showToast({
                type: 'success',
                title: 'Docente eliminado exitosamente',
                message: `${deletedClasses} clase(s) eliminada(s)${failedClasses.length > 0 ? `. ${failedClasses.length} clase(s) con errores` : ''}`,
                duration: 6000,
            });

        } catch (error: any) {
            console.error('Error deleting teacher:', error);

            // Manejar diferentes tipos de errores
            let errorMessage = 'Error al eliminar el docente: ';

            if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('row-level security')) {
                errorMessage += 'Error de permisos. Verifica que tengas los permisos necesarios.';
            } else if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
                errorMessage += 'Demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente.';
            } else if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
                errorMessage += 'Error de comunicaciÃ³n con el servidor. Por favor, recarga la pÃ¡gina e intenta nuevamente.';
            } else {
                errorMessage += error.message || 'Error desconocido';
            }

            showToast({
                type: 'error',
                title: 'Error al eliminar el docente',
                message: `${errorMessage} Si el problema persiste, contacta al administrador del sistema.`,
                duration: 8000,
            });
        }
    };

    const handleLinkToExisting = async (email: string, docenteId: string) => {
        try {
            // Placeholder implementation - assuming authorizedUsersService exists or just log
            console.log('Linking', email, 'to', docenteId);
            showToast({
                type: 'success',
                title: 'OpciÃ³n no implementada', // Temporary until service is verified
                message: 'Esta funcionalidad requiere actualizaciÃ³n del servicio.'
            });
        } catch (error: any) {
            console.error('Error linking user:', error);
        }
    };

    const handleCreateFromAuthorized = (email: string) => {
        handleOpenModal({ email } as any);
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">GestiÃ³n de Docentes</h2>
                    <HelpTooltip
                        content="Administra el personal docente del colegio. AquÃ­ puedes agregar nuevos docentes, asignar materias y grados, y gestionar sus horarios y responsabilidades."
                        variant="icon-only"
                        side="right"
                    />
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-apple-blue text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium transition-apple">
                    <PlusIcon />
                    AÃ±adir Docente
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-apple-gray-light">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Docente</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Asignaturas</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Grados</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Contacto</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-apple-gray-light">
                        {docentes.map(docente => {
                            // Clases regulares asignadas directamente al docente
                            const teacherClasses = clases.filter(c => c.id_docente_asignado === docente.id_docente);

                            // Asignaciones de inglÃ©s de niveles (5to-6to)
                            const englishAssignments = englishLevelAssignments.filter(a => a.id_docente === docente.id_docente);

                            // Construir lista de asignaturas
                            const regularSubjects = [...new Set(teacherClasses.map(c => c.nombre_materia))];
                            const englishSubjects = englishAssignments.length > 0 ? ['InglÃ©s (Niveles)'] : [];
                            const subjects = [...regularSubjects, ...englishSubjects];

                            // Construir lista de grados
                            let grades = [...new Set(teacherClasses.map(c => c.grado_asignado))];

                            // Para docentes de inglÃ©s de niveles, agregar 5to y 6to Grado
                            if (englishAssignments.length > 0) {
                                if (!grades.includes('5to Grado')) grades.push('5to Grado');
                                if (!grades.includes('6to Grado')) grades.push('6to Grado');
                            }

                            grades.sort(); // Ordenar para mantener consistencia

                            // Obtener aulas asignadas
                            const regularAulas = [...new Set(teacherClasses.map(c => c.id_aula).filter(Boolean))];
                            const englishAulas = [...new Set(englishAssignments.map(a => a.id_aula).filter(Boolean))];
                            const allAulas = [...regularAulas, ...englishAulas];
                            const aulasNames = allAulas.map(id => aulas.find(a => a.id_aula === id)?.nombre || '').filter(Boolean);

                            return (
                                <tr key={docente.id_docente} className="hover:bg-apple-gray-light transition-apple">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-apple-gray-dark">{docente.nombres} {docente.apellidos}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                        {subjects.length > 0 ? (
                                            <div>
                                                {subjects.join(', ')}
                                                {englishAssignments.length > 0 && (
                                                    <div className="text-xs text-purple-600 mt-1">
                                                        Niveles: {englishAssignments.map(a => a.nivel_ingles).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                        {grades.length > 0 ? grades.join(', ') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                                        <div>{docente.email}</div>
                                        <div>{docente.telefono}</div>
                                        {aulasNames.length > 0 && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                Aulas: {aulasNames.join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                                        <button onClick={() => handleOpenModal(docente)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                        <button onClick={() => handleDeleteTeacher(docente.id_docente)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {docentes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12">
                                    <EmptyStateTeachers onAdd={() => handleOpenModal()} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ConfirmaciÃ³n de eliminaciÃ³n de docente */}
            <ConfirmDialog
                open={confirmDeleteTeacher.open}
                onOpenChange={(open) => setConfirmDeleteTeacher({ open, teacherId: open ? confirmDeleteTeacher.teacherId : null })}
                onConfirm={confirmDeleteTeacherAction}
                title="Eliminar Docente"
                description={confirmDeleteTeacher.warningMessage || ''}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />

            {/* Unlinked Authorized Users Section - Only for coordinadores and directivos */}
            {(currentUser.role === 'coordinador' || currentUser.role === 'directivo') && unlinkedUsers.length > 0 && (
                <div className="mt-8 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-apple-gray-dark">Usuarios Autorizados Sin Vincular</h3>
                            <p className="text-sm text-apple-gray font-light mt-2">
                                Estos usuarios estÃ¡n en la lista blanca pero no tienen un registro de docente.
                                VincÃºlalos con un docente existente o crea un nuevo docente.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUnlinkedSection(!showUnlinkedSection)}
                            className="px-4 py-2 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light text-sm font-medium transition-apple"
                        >
                            {showUnlinkedSection ? 'Ocultar' : 'Mostrar'} ({unlinkedUsers.length})
                        </button>
                    </div>

                    {showUnlinkedSection && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="space-y-3">
                                {unlinkedUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-yellow-300">
                                        <div className="flex-1">
                                            <div className="font-medium text-apple-gray-dark">{user.email}</div>
                                            <div className="text-sm text-apple-gray font-light">Rol: {user.role}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Link to existing docente */}
                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleLinkToExisting(user.email, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                                defaultValue=""
                                            >
                                                <option value="">Vincular con docente existente...</option>
                                                {docentes.map(d => (
                                                    <option key={d.id_docente} value={d.id_docente}>
                                                        {d.nombres} {d.apellidos} ({d.email})
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Create new docente */}
                                            <button
                                                onClick={() => handleCreateFromAuthorized(user.email)}
                                                className="px-4 py-1.5 bg-apple-blue text-white rounded-lg hover:opacity-90 text-sm font-medium transition-apple"
                                            >
                                                Crear Nuevo Docente
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && <TeacherFormModal teacher={selectedTeacher} clases={clases} aulas={aulas} onClose={handleCloseModal} onSave={handleSaveTeacher} />}
        </div>
    );
};

const PlanningFormModal: React.FC<{
    plan: Planificacion | null;
    userRole: UserRole;
    userId: string; // docenteId for teachers
    assignedClasses: { id_clase: string, nombre_materia: string, grado_asignado: string }[];
    onClose: () => void;
    onSave: (plan: Planificacion) => void;
    isReadOnly?: boolean;
    currentUserEmail?: string; // Email del usuario actual para buscar docente si userId estÃ¡ vacÃ­o
}> = ({ plan, userRole, userId, assignedClasses, onClose, onSave, isReadOnly = false, currentUserEmail }) => {
    const [formData, setFormData] = useState<Omit<Planificacion, 'id_planificacion' | 'fecha_creacion'>>({
        id_docente: plan?.id_docente || userId,
        id_clase: plan?.id_clase || (assignedClasses.length > 0 ? assignedClasses[0].id_clase : ''),
        semana: plan?.semana || getWeekNumber(new Date('2024-09-01')),
        lapso: plan?.lapso || 'I Lapso',
        ano_escolar: plan?.ano_escolar || '2025-2026',
        competencia_indicadores: plan?.competencia_indicadores || '',
        inicio: plan?.inicio || '',
        desarrollo: plan?.desarrollo || '',
        cierre: plan?.cierre || '',
        recursos_links: plan?.recursos_links || '',
        status: plan?.status || 'Borrador',
        observaciones: plan?.observaciones || '',
        nombres_docente: plan?.nombres_docente,
        apellidos_docente: plan?.apellidos_docente,
    });

    const [validationError, setValidationError] = useState<string>('');

    // Si userId estÃ¡ vacÃ­o y es un docente, intentar buscar el docente por email
    useEffect(() => {
        const fetchDocenteId = async () => {
            if (userRole === 'docente' && (!userId || userId.trim() === '') && currentUserEmail) {
                try {
                    const { data: docente } = await supabase
                        .from('docentes')
                        .select('id_docente')
                        .eq('email', currentUserEmail.toLowerCase())
                        .maybeSingle();

                    if (docente && docente.id_docente) {
                        setFormData(prev => ({ ...prev, id_docente: docente.id_docente }));
                    }
                } catch (error) {
                    console.error('Error fetching docente:', error);
                }
            }
        };

        fetchDocenteId();
    }, [userRole, userId, currentUserEmail]);

    const isReviewMode = userRole !== 'docente' && plan !== null;

    const canEditTeacherFields = !isReadOnly && (plan === null || (userRole === 'docente' && (plan.status === 'Borrador' || plan.status === 'Revisado')));
    const canEditCoordinatorFields = !isReadOnly && isReviewMode;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
        // Limpiar error de validaciÃ³n cuando el usuario cambia el campo
        if (name === 'id_clase' && validationError) {
            setValidationError('');
        }
    };

    const handleSubmit = (newStatus: Planificacion['status']) => {
        // Validar que id_clase no estÃ© vacÃ­o
        if (!formData.id_clase || formData.id_clase.trim() === '') {
            setValidationError('Debe seleccionar una asignatura para crear la planificaciÃ³n.');
            return;
        }

        // Validar que id_docente no estÃ© vacÃ­o
        if (!formData.id_docente || formData.id_docente.trim() === '') {
            setValidationError('Error: No se pudo identificar al docente. Por favor, contacte al administrador.');
            return;
        }

        setValidationError('');

        const finalPlan: Planificacion = {
            ...formData,
            id_planificacion: plan?.id_planificacion || `plan-${Date.now()}`,
            fecha_creacion: plan?.fecha_creacion || new Date().toISOString(),
            status: newStatus,
        };
        onSave(finalPlan);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">
                        {isReadOnly ? 'Detalle de PlanificaciÃ³n' :
                            plan === null ? 'Nueva PlanificaciÃ³n' :
                                userRole === 'docente' ? 'Editar PlanificaciÃ³n' : 'Revisar PlanificaciÃ³n'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-apple-gray hover:text-apple-gray-dark transition-apple rounded-lg hover:bg-apple-gray-light"><CloseIcon /></button>
                </div>
                <div className="space-y-6">
                    {/* Error de validaciÃ³n */}
                    {validationError && (
                        <div className="p-4 bg-red-50 border border-apple-red rounded-lg mb-6">
                            <p className="text-sm text-apple-red font-medium">{validationError}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">Asignatura <span className="text-apple-red">*</span></label>
                            <select
                                name="id_clase"
                                value={formData.id_clase}
                                onChange={handleChange}
                                disabled={!canEditTeacherFields}
                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base disabled:bg-apple-gray-light disabled:cursor-not-allowed"
                            >
                                <option value="">Seleccione una asignatura</option>
                                {assignedClasses.map(c => (
                                    <option key={c.id_clase} value={c.id_clase}>
                                        {c.nombre_materia} ({c.grado_asignado})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">Lapso</label>
                            <select
                                name="lapso"
                                value={formData.lapso}
                                onChange={handleChange}
                                disabled={!canEditTeacherFields}
                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base disabled:bg-apple-gray-light disabled:cursor-not-allowed"
                            >
                                <option>I Lapso</option>
                                <option>II Lapso</option>
                                <option>III Lapso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-apple-gray-dark mb-2">AÃ±o Escolar</label>
                            <select
                                name="ano_escolar"
                                value={formData.ano_escolar}
                                onChange={handleChange}
                                disabled={!canEditTeacherFields}
                                className="mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base disabled:bg-apple-gray-light disabled:cursor-not-allowed"
                            >
                                {ANOS_ESCOLARES.map(ano => (
                                    <option key={ano} value={ano}>{ano}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <InputField as="textarea" rows={3} label="Competencia / Indicadores" name="competencia_indicadores" value={formData.competencia_indicadores} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={4} label="Inicio" name="inicio" value={formData.inicio} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={6} label="Desarrollo" name="desarrollo" value={formData.desarrollo} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={4} label="Cierre" name="cierre" value={formData.cierre} onChange={handleChange} required disabled={!canEditTeacherFields} />
                    <InputField as="textarea" rows={2} label="Recursos / Links" name="recursos_links" value={formData.recursos_links || ''} onChange={handleChange} disabled={!canEditTeacherFields} />

                    {(isReviewMode || (isReadOnly && formData.observaciones)) && (
                        <div className="border-t border-apple-gray-light pt-6">
                            <InputField as="textarea" rows={4} label="Observaciones del Coordinador" name="observaciones" value={formData.observaciones || ''} onChange={handleChange} disabled={!canEditCoordinatorFields} />
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6 border-t border-apple-gray-light">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg font-medium transition-apple hover:bg-apple-gray-light"
                        >
                            {isReadOnly ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!isReadOnly && canEditTeacherFields && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Borrador')}
                                    disabled={!formData.id_clase || formData.id_clase.trim() === ''}
                                    className="px-6 py-3 bg-apple-gray text-white rounded-lg font-medium transition-apple hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar Borrador
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Enviado')}
                                    disabled={!formData.id_clase || formData.id_clase.trim() === ''}
                                    className="flex items-center gap-2 px-6 py-3 bg-apple-blue text-white rounded-lg font-medium transition-apple hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SendIcon className="h-4 w-4" />
                                    Enviar PlanificaciÃ³n
                                </button>
                            </>
                        )}
                        {!isReadOnly && canEditCoordinatorFields && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Revisado')}
                                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium transition-apple hover:opacity-90"
                                >
                                    Marcar como Corregido
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('Aprobado')}
                                    className="flex items-center gap-2 px-6 py-3 bg-apple-green text-white rounded-lg font-medium transition-apple hover:opacity-90"
                                >
                                    <ClipboardCheckIcon className="h-4 w-4" />
                                    Aprobar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlanningView: React.FC<{
    planificaciones: Planificacion[];
    setPlanificaciones: React.Dispatch<React.SetStateAction<Planificacion[]>>;
    clases: Clase[];
    docentes: Docente[];
    currentUser: Usuario;
    navParams?: any;
}> = ({ planificaciones, setPlanificaciones, clases, docentes, currentUser, navParams }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Planificacion | null>(null);
    const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    const [boardFilters, setBoardFilters] = useState({
        ano_escolar: 'all',
        lapso: 'all',
        id_docente: 'all',
    });

    const highlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (navParams?.planId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [navParams, planificaciones]);

    const handleOpenModal = (plan: Planificacion | null = null, isReadOnly = false) => {
        setSelectedPlan(plan);
        setIsReadOnlyModal(isReadOnly);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPlan(null);
        setIsReadOnlyModal(false);
    };

    const handleSavePlan = async (planData: Planificacion) => {
        try {
            // Validar UUIDs antes de guardar
            if (!planData.id_clase || planData.id_clase.trim() === '') {
                throw new Error('Debe seleccionar una asignatura para crear la planificaciÃ³n.');
            }

            if (!planData.id_docente || planData.id_docente.trim() === '') {
                throw new Error('Error: No se pudo identificar al docente. Por favor, contacte al administrador.');
            }

            // Validar formato UUID bÃ¡sico
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(planData.id_clase)) {
                throw new Error('Error: El ID de la clase no es vÃ¡lido. Por favor, seleccione una asignatura vÃ¡lida.');
            }

            if (!uuidRegex.test(planData.id_docente)) {
                throw new Error('Error: El ID del docente no es vÃ¡lido. Por favor, contacte al administrador.');
            }

            const planExists = planificaciones.some(p => p.id_planificacion === planData.id_planificacion);
            if (planExists) {
                // Update existing plan
                const { id_planificacion, fecha_creacion, updated_at, ...updateData } = planData;
                await planificacionesService.update(id_planificacion, updateData);
                setPlanificaciones(prev => prev.map(p => p.id_planificacion === planData.id_planificacion ? planData : p));
            } else {
                // Create new plan
                const { id_planificacion, fecha_creacion, updated_at, ...newPlan } = planData;
                const created = await planificacionesService.create(newPlan);
                setPlanificaciones(prev => [...prev, created]);
            }
            handleCloseModal();
        } catch (error: any) {
            console.error('Error saving plan:', error);
            const errorMessage = error.message || 'Error desconocido';

            // Mensaje mÃ¡s amigable para errores de UUID
            if (errorMessage.includes('invalid input syntax for type uuid') || errorMessage.includes('UUID')) {
                alert('Error al guardar la planificaciÃ³n: Debe seleccionar una asignatura vÃ¡lida. Si el problema persiste, contacte al coordinador.');
            } else {
                alert('Error al guardar la planificaciÃ³n: ' + errorMessage);
            }
        }
    };

    const handleGetAiSuggestions = async (plan: Planificacion) => {
        setSelectedPlan(plan);
        setAiModalOpen(true);
        setIsLoadingAi(true);
        const suggestions = await getAIPlanSuggestions(plan);
        setAiSuggestions(suggestions);
        setIsLoadingAi(false);
    };

    const teacherClasses = useMemo(() => {
        if (!currentUser || currentUser.role !== 'docente') return [];
        // Para docentes, mostrar TODAS las clases disponibles, no solo las asignadas
        // Esto permite que docentes sin clases asignadas tambiÃ©n puedan crear planificaciones
        return clases
            .map(c => ({ id_clase: c.id_clase, nombre_materia: c.nombre_materia, grado_asignado: c.grado_asignado }))
            .filter((c, index, self) =>
                // Eliminar duplicados basados en id_clase
                index === self.findIndex((clase) => clase.id_clase === c.id_clase)
            )
            .sort((a, b) => {
                // Ordenar primero por grado, luego por nombre de materia
                if (a.grado_asignado !== b.grado_asignado) {
                    return a.grado_asignado.localeCompare(b.grado_asignado);
                }
                return a.nombre_materia.localeCompare(b.nombre_materia);
            });
    }, [clases, currentUser]);

    const handleFilterChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setBoardFilters(prev => ({ ...prev, [name]: value }));
    };

    const renderBoardView = () => {
        const statusStyles: { [key in Planificacion['status']]: string } = {
            Borrador: 'bg-gray-100 text-gray-800',
            Enviado: 'bg-blue-100 text-blue-800',
            Revisado: 'bg-yellow-100 text-yellow-800',
            Aprobado: 'bg-green-100 text-green-800',
        };

        // Filter planificaciones based on board filters
        // All roles can see all planificaciones
        const filteredPlanificaciones = useMemo(() => {
            if (!planificaciones || planificaciones.length === 0) return [];

            let filtered = [...planificaciones];

            // Apply filters
            const { ano_escolar, lapso, id_docente } = boardFilters;

            if (ano_escolar && ano_escolar !== 'all') {
                filtered = filtered.filter(p => p.ano_escolar === ano_escolar);
            }

            if (lapso && lapso !== 'all') {
                filtered = filtered.filter(p => p.lapso === lapso);
            }

            if (id_docente && id_docente !== 'all') {
                filtered = filtered.filter(p => p.id_docente === id_docente);
            }

            return filtered;
        }, [planificaciones, boardFilters]);

        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Tablero de Planificaciones</h2>
                    {currentUser.role === 'docente' && (
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-apple-blue text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium transition-apple">
                            <PlusIcon />
                            AÃ±adir PlanificaciÃ³n
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 py-6 border-b border-apple-gray-light">
                    <InputField as="select" label="AÃ±o Escolar" name="ano_escolar" value={boardFilters.ano_escolar} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        {ANOS_ESCOLARES.map(ano => (
                            <option key={ano} value={ano}>{ano}</option>
                        ))}
                    </InputField>
                    <InputField as="select" label="Lapso" name="lapso" value={boardFilters.lapso} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        <option value="I Lapso">I Lapso</option>
                        <option value="II Lapso">II Lapso</option>
                        <option value="III Lapso">III Lapso</option>
                    </InputField>
                    <InputField as="select" label="Docente" name="id_docente" value={boardFilters.id_docente} onChange={handleFilterChange}>
                        <option value="all">Todos</option>
                        {docentes && docentes.length > 0 ? docentes.map(d => (
                            <option key={d.id_docente} value={d.id_docente}>{d.nombres || ''} {d.apellidos || ''}</option>
                        )) : null}
                    </InputField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlanificaciones
                        .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
                        .map(plan => {
                            const clase = clases.find(c => c.id_clase === plan.id_clase);
                            const docente = plan.id_docente ? docentes.find(d => d.id_docente === plan.id_docente) : null;
                            // Use preserved names if docente is deleted, otherwise use current docente info
                            const docenteNombre = docente
                                ? `${docente.nombres} ${docente.apellidos}`
                                : (plan.nombres_docente && plan.apellidos_docente
                                    ? `${plan.nombres_docente} ${plan.apellidos_docente}`
                                    : 'Docente no disponible');
                            const isHighlighted = navParams?.planId === plan.id_planificacion;
                            return (
                                <div key={plan.id_planificacion} ref={isHighlighted ? highlightRef : null} className={`border border-apple-gray-light rounded-lg p-6 flex flex-col justify-between transition-apple hover:opacity-70 ${isHighlighted ? 'ring-2 ring-apple-blue' : ''}`}>
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg">{clase?.nombre_materia} - {clase?.grado_asignado}</h3>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[plan.status]}`}>
                                                {plan.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-apple-gray font-light mt-2">Docente: {docenteNombre}</p>
                                        <p className="text-sm text-apple-gray font-light">Semana {plan.semana} | {plan.lapso} | {plan.ano_escolar}</p>
                                        <p className="text-xs text-apple-gray font-light mt-2">Creado: {new Date(plan.fecha_creacion).toLocaleDateString()}</p>
                                        {plan.competencia_indicadores && (
                                            <div className="mt-4 space-y-1 text-sm">
                                                <p><span className="font-semibold">Competencia:</span> {plan.competencia_indicadores.length > 50 ? plan.competencia_indicadores.substring(0, 50) + '...' : plan.competencia_indicadores}</p>
                                            </div>
                                        )}
                                        {plan.observaciones && (
                                            <div className="mt-4 py-3 px-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                                                <p className="text-sm text-yellow-800 font-light"><span className="font-medium">Observaciones:</span> {plan.observaciones}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-apple-gray-light">
                                        <button onClick={() => handleGetAiSuggestions(plan)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-apple font-medium">
                                            <SparklesIcon className="h-4 w-4" /> Coco
                                        </button>
                                        <button onClick={() => handleOpenModal(plan, true)} className="text-xs px-4 py-1.5 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light transition-apple font-medium">Ver</button>
                                        {(currentUser.role === 'coordinador' || currentUser.role === 'directivo') &&
                                            <button onClick={() => handleOpenModal(plan)} className="text-xs px-4 py-1.5 bg-apple-blue text-white rounded-lg hover:opacity-90 transition-apple font-medium">Revisar</button>
                                        }
                                        {currentUser.role === 'docente' && (plan.status === 'Borrador' || plan.status === 'Revisado') &&
                                            <button onClick={() => handleOpenModal(plan)} className="text-xs px-4 py-1.5 bg-apple-green text-white rounded-lg hover:opacity-90 transition-apple font-medium">Editar</button>
                                        }
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        )
    };

    // Early return if currentUser is not available (after hooks)
    if (!currentUser) {
        return <div className="mb-8 py-12 text-center"><p className="text-apple-gray font-light">Cargando...</p></div>;
    }

    return (
        <div>
            {renderBoardView()}

            {isModalOpen && (
                <PlanningFormModal
                    plan={selectedPlan}
                    userRole={currentUser.role}
                    userId={currentUser.docenteId || ''}
                    assignedClasses={teacherClasses}
                    onClose={handleCloseModal}
                    onSave={handleSavePlan}
                    isReadOnly={isReadOnlyModal}
                    currentUserEmail={currentUser.email}
                />
            )}
            {isAiModalOpen && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-purple-500" />Sugerencias de Coco</h2>
                            <button onClick={() => setAiModalOpen(false)}><CloseIcon /></button>
                        </div>
                        {isLoadingAi ? (
                            <div className="text-center py-8">Generando sugerencias...</div>
                        ) : (
                            <div>
                                <textarea
                                    value={aiSuggestions}
                                    onChange={(e) => setAiSuggestions(e.target.value)}
                                    className="w-full h-64 p-4 border rounded-md"
                                    placeholder="Las sugerencias aparecerÃ¡n aquÃ­..."
                                />
                                <div className="flex justify-end gap-4 mt-6">
                                    <button onClick={() => setAiModalOpen(false)} className="px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light font-medium transition-apple">Cerrar</button>
                                    <button onClick={async () => {
                                        if (selectedPlan && aiSuggestions) {
                                            const updatedPlan = { ...selectedPlan, competencia_indicadores: aiSuggestions };
                                            await handleSavePlan(updatedPlan);
                                            setAiModalOpen(false);
                                        }
                                    }} className="px-6 py-3 bg-apple-blue text-white rounded-lg hover:opacity-90 font-medium transition-apple">Aplicar Sugerencias</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const { showToast } = useToast();

    // Usuario por defecto sin requerir login
    const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);



    // Data states - loaded from Supabase
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [clases, setClases] = useState<Clase[]>([]);
    const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [aulas, setAulas] = useState<Aula[]>([]);

    // Loading states
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // View-specific states
    const [selectedStudent, setSelectedStudent] = useState<Alumno | null>(null);
    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Alumno | null>(null);
    const [navParams, setNavParams] = useState<any>(null);

    // Estados para confirmaciones
    const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<{ open: boolean; studentId: string | null }>({ open: false, studentId: null });

    // Estado para ayuda de atajos de teclado
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    // Estado para paleta de comandos (Cmd+K)
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    // Estado para preferencias de usuario
    const [showPreferences, setShowPreferences] = useState(false);



    // Load all data from Supabase
    const loadAllData = async () => {
        // Removido: if (!currentUser) return; - Ahora la plataforma estÃ¡ abierta

        setIsLoadingData(true);
        setDataError(null);

        try {
            // Helper function to handle errors
            const handleError = (err: any, serviceName: string) => {
                // Rate limiting
                if (err?.message?.includes('429') || err?.code === 'PGRST301') {
                    console.warn(`Rate limit for ${serviceName}. Will retry later.`);
                    return [];
                }
                // RLS/permission errors
                if (err?.code === '42501' || err?.message?.includes('permission') || err?.message?.includes('row-level security')) {
                    console.error(`âŒ RLS bloqueando acceso a ${serviceName}. Ejecuta DESHABILITAR_RLS_TODAS_TABLAS_COMPLETO.sql`, err);
                    setDataError(`Error de permisos al cargar ${serviceName}. Verifica las polÃ­ticas RLS.`);
                    return [];
                }
                // Other errors
                console.error(`Error loading ${serviceName}:`, err);
                return [];
            };

            // Load all data in parallel with error handling
            const [alumnosData, docentesData, clasesData, planificacionesData, notificationsData, aulasData] = await Promise.all([
                alumnosService.getAll().catch((err) => handleError(err, 'alumnos')),
                docentesService.getAll().catch((err) => handleError(err, 'docentes')),
                clasesService.getAll().catch((err) => handleError(err, 'clases')),
                planificacionesService.getAll().catch((err) => handleError(err, 'planificaciones')),
                notificacionesService.getAll().catch((err) => handleError(err, 'notificaciones')),
                aulasService.getAll().catch((err) => handleError(err, 'aulas'))
            ]);

            setAlumnos(alumnosData);
            setDocentes(docentesData);
            setClases(clasesData);
            setPlanificaciones(planificacionesData);
            setAulas(aulasData);
            setNotifications(notificationsData.map(n => {
                const linkTo = typeof n.link_to === 'string' ? JSON.parse(n.link_to) : n.link_to;
                return {
                    ...n,
                    recipientId: n.recipient_id,
                    linkTo: linkTo || { view: 'dashboard' }
                };
            }));



        } catch (error: any) {
            console.error('Error loading data:', error);
            setDataError('Error al cargar los datos. Por favor, recarga la pÃ¡gina.');
        } finally {
            setIsLoadingData(false);
        }
    };

    // Load data when user logs in
    useEffect(() => {
        if (currentUser) {
            loadAllData();
        }
    }, [currentUser]);






    // AUTENTICACIÃ“N DESHABILITADA - Plataforma abierta
    // useEffect para verificaciÃ³n de sesiÃ³n comentado
    /*
    useEffect(() => {
      // Check for existing session
      const checkSession = async () => {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            // No hacer signOut por errores temporales de sesiÃ³n
            return;
          }
          
          if (session?.user?.email) {
            // Verify user is authorized and get their role
            const { data: authorizedUser, error: authError } = await supabase
              .from('authorized_users')
              .select('*')
              .eq('email', session.user.email.toLowerCase())
              .maybeSingle(); // Usar maybeSingle para evitar errores si hay problemas temporales
  
            // Si hay un error de RLS, red o rate limiting, no hacer signOut
            if (authError) {
              // Si es un error 429 (Too Many Requests), esperar y no hacer signOut
              if (authError.code === 'PGRST301' || 
                  authError.message?.includes('429') || 
                  authError.message?.includes('rate limit') ||
                  authError.message?.includes('Too Many Requests')) {
                console.warn('Rate limit alcanzado (429). Manteniendo sesiÃ³n, se reintentarÃ¡ mÃ¡s tarde.');
                return; // No hacer signOut, solo esperar
              }
              
              // Si es un error 500 o de servidor, no hacer signOut
              if (authError.message?.includes('500') || authError.code === 'PGRST301') {
                console.warn('Error del servidor, no se harÃ¡ signOut');
                return;
              }
              
              // Si es un error 406 (Not Acceptable) o error de RLS, no hacer signOut
              if (authError.code === '42501' ||
                  authError.message?.includes('406') ||
                  authError.message?.includes('permission') ||
                  authError.message?.includes('row-level security')) {
                console.warn('Error temporal verificando autorizaciÃ³n, no se harÃ¡ signOut');
                return;
              }
              
              // Para otros errores desconocidos, tambiÃ©n no hacer signOut automÃ¡ticamente
              // Solo registrar el error (sin console.error para evitar spam)
              if (!authError.message?.includes('JWT') && !authError.message?.includes('token')) {
                console.warn('Error verificando autorizaciÃ³n:', authError.message || authError.code);
              }
              return;
            }
  
            if (authorizedUser) {
              const fullName = session.user.user_metadata?.full_name || 
                              session.user.user_metadata?.name ||
                              session.user.email.split('@')[0];
  
              // For docentes, try to link to existing docente record by email
              let docenteId: string | undefined = undefined;
              if (authorizedUser.role === 'docente') {
                try {
                  // Try to find existing docente by email
                  const { data: docente } = await supabase
                    .from('docentes')
                    .select('id_docente, id_usuario')
                    .eq('email', session.user.email.toLowerCase())
                    .maybeSingle(); // Usar maybeSingle tambiÃ©n aquÃ­
  
                  if (docente) {
                    docenteId = docente.id_docente;
                    // If docente exists but id_usuario is not set, update it
                    if (!docente.id_usuario) {
                      await supabase
                        .from('docentes')
                        .update({ id_usuario: session.user.id })
                        .eq('id_docente', docente.id_docente);
                    }
                  } else {
                    // If no docente exists, create one automatically
                    const { data: newDocente } = await supabase
                      .from('docentes')
                      .insert({
                        email: session.user.email.toLowerCase(),
                        nombres: fullName.split(' ')[0] || '',
                        apellidos: fullName.split(' ').slice(1).join(' ') || '',
                        id_usuario: session.user.id,
                        telefono: '',
                        especialidad: '',
                      })
                      .select('id_docente')
                      .single();
  
                    if (newDocente) {
                      docenteId = newDocente.id_docente;
                    }
                  }
                } catch (error) {
                  console.error('Error linking docente:', error);
                  // Continue even if linking fails
                }
              }
  
              setCurrentUser({
                id: session.user.id,
                email: session.user.email,
                role: authorizedUser.role as UserRole,
                fullName: fullName,
                docenteId: docenteId,
              });
            } else {
              // Solo hacer signOut si realmente el usuario NO estÃ¡ autorizado
              // (no si hay un error temporal)
              console.log('User not found in authorized_users, signing out');
              await supabase.auth.signOut();
            }
          }
        } catch (error) {
          console.error('Error in checkSession:', error);
          // No hacer signOut por errores inesperados - mantener la sesiÃ³n
        }
      };
  
      checkSession();
  
      // Listen for auth state changes (con throttling para evitar loops)
      let lastAuthCheck = 0;
      const AUTH_CHECK_THROTTLE = 2000; // 2 segundos entre verificaciones
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          // Throttle: solo verificar si pasaron al menos 2 segundos desde la Ãºltima verificaciÃ³n
          const now = Date.now();
          if (now - lastAuthCheck < AUTH_CHECK_THROTTLE) {
            return; // Saltar esta verificaciÃ³n
          }
          lastAuthCheck = now;
          
          // Verificar autorizaciÃ³n solo si hay sesiÃ³n
          if (session?.user?.email) {
            try {
              const { data: authorizedUser } = await supabase
                .from('authorized_users')
                .select('*')
                .eq('email', session.user.email.toLowerCase())
                .maybeSingle();
              
              if (authorizedUser) {
                const { data: userData } = await supabase.auth.getUser();
                const fullName = userData.user?.user_metadata?.full_name || 
                               userData.user?.user_metadata?.name || 
                               session.user.email?.split('@')[0] || '';
                
                setCurrentUser({
                  id: session.user.id,
                  email: session.user.email,
                  role: authorizedUser.role as UserRole,
                  fullName: fullName,
                });
              }
            } catch (error) {
              console.error('Error en onAuthStateChange:', error);
              // No hacer signOut por errores
            }
          }
        }
      });
  
      return () => {
        subscription.unsubscribe();
      };
    }, []);
    */

    const handleLoginSuccess = async (user: { id: string; email: string; username: string; role: string; fullName?: string }) => {
        // For docentes, try to link to existing docente record by email
        let docenteId: string | undefined = undefined;
        if (user.role === 'docente') {
            try {
                // Try to find existing docente by email
                const { data: docente } = await supabase
                    .from('docentes')
                    .select('id_docente, id_usuario')
                    .eq('email', user.email.toLowerCase())
                    .maybeSingle(); // Use maybeSingle to avoid errors

                if (docente) {
                    docenteId = docente.id_docente;
                    // If docente exists but id_usuario is not set, update it
                    if (!docente.id_usuario) {
                        await supabase
                            .from('docentes')
                            .update({ id_usuario: user.id })
                            .eq('id_docente', docente.id_docente);
                    }
                } else {
                    // If no docente exists, create one automatically
                    const { data: newDocente } = await supabase
                        .from('docentes')
                        .insert({
                            email: user.email.toLowerCase(),
                            nombres: user.fullName?.split(' ')[0] || '',
                            apellidos: user.fullName?.split(' ').slice(1).join(' ') || '',
                            id_usuario: user.id,
                            telefono: '',
                            especialidad: '',
                        })
                        .select('id_docente')
                        .maybeSingle(); // Use maybeSingle to avoid errors

                    if (newDocente) {
                        docenteId = newDocente.id_docente;
                    }
                }
            } catch (error: any) {
                // Only log non-rate-limit errors
                if (!error?.message?.includes('429') && !error?.code?.includes('429')) {
                    console.error('Error linking docente:', error);
                }
                // Continue even if linking fails
            }
        }

        setCurrentUser({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role as UserRole,
            fullName: user.fullName || user.username,
            docenteId: docenteId,
        });
        setShowLogin(false);
        setActiveView('students');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setShowLogin(true);
    };

    const handleNavigate = (view: string, params: any = null) => {
        if (view === 'students' && selectedStudent) {
            setSelectedStudent(null); // Reset detail view when navigating away
        }
        setActiveView(view);
        setNavParams(params);
    };

    // Atajos de teclado globales
    useGlobalShortcuts(handleNavigate);

    // Atajo para mostrar ayuda (Shift + ?)
    useKeyboardShortcuts(
        [
            {
                key: '?',
                shift: true,
                action: () => setShowShortcutsHelp(true),
                description: 'Mostrar ayuda de atajos',
            },
            {
                key: 'k',
                ctrl: true,
                action: () => setShowCommandPalette(true),
                description: 'Abrir bÃºsqueda global',
            },
        ],
        true
    );

    const handleNotificationClick = async (notification: Notification) => {
        try {
            await notificacionesService.markAsRead(notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            if (notification.linkTo && typeof notification.linkTo !== 'string' && notification.linkTo.view) {
                handleNavigate(notification.linkTo.view, notification.linkTo.params);
            }
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            // Still navigate even if marking as read fails
            if (notification.linkTo && typeof notification.linkTo !== 'string' && notification.linkTo.view) {
                handleNavigate(notification.linkTo.view, notification.linkTo.params);
            }
        }
    };

    // Student CRUD handlers
    const handleOpenStudentModal = (student: Alumno | null = null) => {
        setEditingStudent(student);
        setStudentModalOpen(true);
    };

    const handleCloseStudentModal = () => {
        setEditingStudent(null);
        setStudentModalOpen(false);
    };

    const handleSaveStudent = async (studentData: Alumno) => {
        try {
            if (editingStudent) {
                // Update existing student
                // Update existing student
                const updated = await alumnosService.update(studentData.id_alumno, studentData);
                setAlumnos(prev => prev.map(s => s.id_alumno === updated.id_alumno ? updated : s));
                showToast({
                    type: 'success',
                    title: 'Alumno actualizado',
                    message: `${studentData.nombres} ${studentData.apellidos} ha sido actualizado correctamente`,
                });
            } else {
                // Create new student
                const { id_alumno, ...newStudent } = studentData;

                const created = await alumnosService.create(newStudent as Alumno);
                setAlumnos(prev => [...prev, created]);
                showToast({
                    type: 'success',
                    title: 'Alumno creado',
                    message: `${studentData.nombres} ${studentData.apellidos} ha sido agregado correctamente`,
                });
            }
            handleCloseStudentModal();
        } catch (error: any) {
            console.error('Error saving student:', error);
            showToast({
                type: 'error',
                title: 'Error al guardar',
                message: error.message || 'No se pudo guardar el alumno. Por favor, intÃ©ntalo de nuevo.',
            });
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        setConfirmDeleteStudent({ open: true, studentId });
    };

    const confirmDeleteStudentAction = async () => {
        if (!confirmDeleteStudent.studentId) return;

        const student = alumnos.find(s => s.id_alumno === confirmDeleteStudent.studentId);
        const studentName = student ? `${student.nombres} ${student.apellidos}` : 'este alumno';

        try {
            await alumnosService.delete(confirmDeleteStudent.studentId);
            setAlumnos(prev => prev.filter(s => s.id_alumno !== confirmDeleteStudent.studentId));
            setConfirmDeleteStudent({ open: false, studentId: null });
            showToast({
                type: 'success',
                title: 'Alumno eliminado',
                message: `${studentName} ha sido eliminado correctamente`,
            });
        } catch (error: any) {
            console.error('Error deleting student:', error);
            showToast({
                type: 'error',
                title: 'Error al eliminar',
                message: error.message || 'No se pudo eliminar el alumno. Por favor, intÃ©ntalo de nuevo.',
            });
        }
    };


    const renderView = () => {
        if (activeView === 'students' && selectedStudent) {
            return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />
        }
        switch (activeView) {
            case 'students':
                return <StudentListView
                    students={alumnos}
                    onSelectStudent={setSelectedStudent}
                    onAddStudent={() => handleOpenStudentModal(null)}
                    onEditStudent={handleOpenStudentModal}
                    onDeleteStudent={handleDeleteStudent}
                    onOpenBulkImport={() => {
                        console.log('ðŸŸ¢ onOpenBulkImport called, setting isBulkImportOpen to true');
                        setIsBulkImportOpen(true);
                    }}
                />;
            case 'teachers':
                return <TeachersView docentes={docentes} clases={clases} alumnos={alumnos} aulas={aulas} setDocentes={setDocentes} setClases={setClases} currentUser={currentUser!} />;
            case 'planning':
                return <PlanningView planificaciones={planificaciones} setPlanificaciones={setPlanificaciones} clases={clases} docentes={docentes} currentUser={currentUser!} navParams={navParams} />;
            case 'indicadores':
                return <GestionIndicadores clases={clases} />;
            case 'authorized-users':
                return (
                    <Suspense fallback={
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    }>
                        <AuthorizedUsersView currentUser={currentUser!} />
                    </Suspense>
                );
            default:
                return <div className="bg-white p-6 rounded-lg shadow-md"><h2>Vista no encontrada</h2><p>La vista solicitada no existe.</p></div>;
        }
    };

    const viewTitles: { [key: string]: string } = {
        students: selectedStudent ? `Detalle de ${selectedStudent.nombres}` : 'GestiÃ³n de Alumnos',
        teachers: 'GestiÃ³n de Docentes',
        planning: 'Planificaciones',
        'authorized-users': 'GestiÃ³n de Usuarios',
        indicadores: 'EvaluaciÃ³n Indicadores',
    };

    const getBreadcrumbs = () => {
        const items: { label: string; onClick?: () => void; icon: any }[] = [
            { label: 'Inicio', onClick: () => handleNavigate('students'), icon: Home },
        ];

        if (activeView === 'students' && selectedStudent) {
            items.push(
                { label: 'Alumnos', onClick: () => { handleNavigate('students'); setSelectedStudent(null); }, icon: UsersIcon },
                { label: selectedStudent.nombres, icon: UserCircleIcon }
            );
        } else {
            if (activeView !== 'students') {
                // Mapear iconos por vista
                const viewIcons: { [key: string]: any } = {
                    teachers: TeachersIcon,
                    planning: PlanningIcon,
                    'authorized-users': UsersIcon,
                    indicadores: EvaluationIcon
                };
                items.push({ label: viewTitles[activeView] || activeView, icon: viewIcons[activeView] || Home });
            }
        }

        return items;
    };

    // Show login screen if no user is logged in
    if (!currentUser || showLogin) {
        return (
            <Suspense fallback={
                <div className="flex h-screen bg-gradient-to-br from-manglar-orange-light via-background to-manglar-green-light items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-manglar-orange to-manglar-green flex items-center justify-center shadow-lg animate-pulse">
                                <span className="text-white font-bold text-2xl">M</span>
                            </div>
                        </div>
                        <LoadingSpinner size="md" />
                    </div>
                </div>
            }>
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </Suspense>
        );
    }

    if (isLoadingData) {
        return (
            <div className="flex h-screen bg-gradient-to-br from-manglar-orange-light via-background to-manglar-green-light items-center justify-center">
                <div className="text-center space-y-6 w-full max-w-md px-4">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-manglar-orange to-manglar-green flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-3xl">M</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-manglar-orange border-t-transparent"></div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48 mx-auto" />
                            <Skeleton className="h-4 w-64 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (dataError) {
        return (
            <div className="flex h-screen bg-background items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6">
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Error al cargar datos</AlertTitle>
                            <AlertDescription>{dataError}</AlertDescription>
                        </Alert>
                        <Button onClick={() => loadAllData()} className="w-full">
                            Reintentar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background-light overflow-hidden">
            <Sidebar
                activeView={activeView}
                onNavigate={handleNavigate}
                userRole={currentUser.role}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header
                    title={viewTitles[activeView] || 'ManglarNet'}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    setShowPreferences={setShowPreferences}
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />
                <div className="p-3 sm:p-4 lg:p-6 flex-1 overflow-y-auto">
                    {/* Breadcrumbs */}
                    {(activeView !== 'dashboard' || selectedStudent) && (
                        <div className="mb-4 animate-slide-up">
                            <Breadcrumbs items={getBreadcrumbs()} />
                        </div>
                    )}
                    {renderView()}
                </div>
            </main>

            {/* ConfirmaciÃ³n de eliminaciÃ³n de estudiante */}
            <ConfirmDialog
                open={confirmDeleteStudent.open}
                onOpenChange={(open) => setConfirmDeleteStudent({ open, studentId: open ? confirmDeleteStudent.studentId : null })}
                onConfirm={confirmDeleteStudentAction}
                title="Eliminar Alumno"
                description={
                    confirmDeleteStudent.studentId
                        ? `Â¿EstÃ¡ seguro de que desea eliminar a ${alumnos.find(s => s.id_alumno === confirmDeleteStudent.studentId)?.nombres} ${alumnos.find(s => s.id_alumno === confirmDeleteStudent.studentId)?.apellidos}? Esta acciÃ³n no se puede deshacer.`
                        : ''
                }
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />

            {isStudentModalOpen && (
                <StudentFormModal
                    student={editingStudent}
                    onClose={handleCloseStudentModal}
                    onSave={handleSaveStudent}
                />
            )}
            {isBulkImportOpen && (
                <>
                    {console.log('ðŸŸ¡ Rendering BulkImportModal, isBulkImportOpen:', isBulkImportOpen)}
                    <BulkImportModal
                        isOpen={isBulkImportOpen}
                        onClose={() => {
                            console.log('ðŸ”´ Closing BulkImportModal');
                            setIsBulkImportOpen(false);
                        }}
                        onSuccess={() => {
                            console.log('âœ… Import successful, reloading students');
                            loadAllData(); // Reload students after successful import
                        }}
                    />
                </>
            )}

            {/* Onboarding Tour */}
            {currentUser && (
                <OnboardingTour
                    steps={[
                        {
                            id: 'welcome',
                            title: 'Â¡Bienvenido a ManglarNet!',
                            description: 'Te guiaremos por las caracterÃ­sticas principales de la plataforma para que puedas aprovecharla al mÃ¡ximo.',
                        },
                        {
                            id: 'navigation',
                            title: 'NavegaciÃ³n RÃ¡pida',
                            description: (
                                <div className="space-y-2">
                                    <p>Usa el menÃº lateral para navegar entre las diferentes secciones.</p>
                                    <p className="text-xs text-muted-foreground">
                                        ðŸ’¡ <strong>Tip:</strong> Presiona <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl/Cmd + K</kbd> para bÃºsqueda rÃ¡pida
                                    </p>
                                </div>
                            ),
                        },
                        {
                            id: 'search',
                            title: 'BÃºsqueda Global',
                            description: 'Presiona Ctrl/Cmd + K para buscar estudiantes, docentes o navegar rÃ¡pidamente a cualquier secciÃ³n.',
                        },
                        {
                            id: 'theme',
                            title: 'PersonalizaciÃ³n',
                            description: 'Puedes cambiar entre modo claro y oscuro usando el botÃ³n en el header. Tus preferencias se guardan automÃ¡ticamente.',
                        },
                        {
                            id: 'shortcuts',
                            title: 'Atajos de Teclado',
                            description: (
                                <div className="space-y-2">
                                    <p>Usa atajos de teclado para ser mÃ¡s productivo:</p>
                                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                        <li><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl/Cmd + K</kbd> - BÃºsqueda global</li>
                                        <li><kbd className="px-1 py-0.5 bg-muted rounded">Shift + ?</kbd> - Ver todos los atajos</li>
                                        <li><kbd className="px-1 py-0.5 bg-muted rounded">/</kbd> - Buscar en vista actual</li>
                                    </ul>
                                </div>
                            ),
                        },
                    ]}
                    onComplete={() => {
                        if (currentUser) {
                            localStorage.setItem(`manglar-onboarding-${currentUser.id}`, 'true');
                        }
                    }}
                    onSkip={() => {
                        if (currentUser) {
                            localStorage.setItem(`manglar-onboarding-${currentUser.id}`, 'true');
                        }
                    }}
                    storageKey={`manglar-onboarding-${currentUser?.id || 'guest'}`}
                />
            )}

            {/* DiÃ¡logo de preferencias de usuario */}
            {currentUser && (
                <UserPreferencesDialog
                    open={showPreferences}
                    onOpenChange={setShowPreferences}
                    userId={currentUser.id}
                />
            )}

            {/* Paleta de comandos (Cmd/Ctrl + K) */}
            <CommandPalette
                open={showCommandPalette}
                onOpenChange={setShowCommandPalette}
                onNavigate={handleNavigate}
                students={alumnos.map(a => ({
                    id_alumno: a.id_alumno,
                    nombres: a.nombres,
                    apellidos: a.apellidos,
                    salon: a.salon,
                }))}
                teachers={docentes.map(d => ({
                    id_docente: d.id_docente,
                    nombres: d.nombres,
                    apellidos: d.apellidos,
                }))}
                currentView={activeView}
            />

            {/* DiÃ¡logo de ayuda de atajos de teclado */}
            <KeyboardShortcutsHelp
                open={showShortcutsHelp}
                onOpenChange={setShowShortcutsHelp}
                shortcuts={[
                    { keys: ['Ctrl', 'K'], description: 'Abrir bÃºsqueda global', category: 'NavegaciÃ³n' },
                    { keys: ['Ctrl', 'N'], description: 'Ir al Dashboard', category: 'NavegaciÃ³n' },
                    { keys: ['/'], description: 'Buscar en vista actual', category: 'NavegaciÃ³n' },
                    { keys: ['Shift', '?'], description: 'Mostrar esta ayuda', category: 'General' },
                    { keys: ['Esc'], description: 'Cerrar diÃ¡logos', category: 'General' },
                ]}
            />
        </div>
    );
};




export default App;

