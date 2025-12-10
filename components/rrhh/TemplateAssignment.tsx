/**
 * RRHH Template Assignment
 * Asignación masiva de plantillas a usuarios
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeftIcon, SearchIcon, UsersIcon } from '../Icons';
import {
    rrhhTemplatesService,
    rrhhAssignmentsService,
    type RRHHTemplate
} from '../../services/rrhhEvaluationService';
import { docentesService } from '../../services/supabaseDataService';
import { useToast } from '../ui/toast';

interface TemplateAssignmentProps {
    templateId: string;
    onClose: () => void;
}

interface UserOption {
    id: string;
    name: string;
    email: string;
    role: string;
}

export const TemplateAssignment: React.FC<TemplateAssignmentProps> = ({
    templateId,
    onClose
}) => {
    const [template, setTemplate] = useState<RRHHTemplate | null>(null);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [evaluationPeriod, setEvaluationPeriod] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, [templateId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar plantilla
            const templateData = await rrhhTemplatesService.getById(templateId);
            setTemplate(templateData);

            // Cargar docentes (usuarios a evaluar)
            const docentesData = await docentesService.getAll();
            const usersData: UserOption[] = docentesData.map(d => ({
                id: d.id_usuario,
                name: `${d.nombres} ${d.apellidos}`,
                email: d.email,
                role: 'docente'
            }));
            setUsers(usersData);

            // Configurar período por defecto
            const currentYear = new Date().getFullYear();
            setEvaluationPeriod(`${currentYear}-I Lapso`);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast({ type: 'error', title: 'Error al cargar datos' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
        }
    };

    const handleAssign = async () => {
        if (selectedUsers.size === 0) {
            showToast({ type: 'warning', title: 'Selecciona al menos un usuario' });
            return;
        }

        if (!evaluationPeriod) {
            showToast({ type: 'warning', title: 'Ingresa el período de evaluación' });
            return;
        }

        setAssigning(true);
        try {
            const assignments = Array.from(selectedUsers).map(userId => ({
                template_id: templateId,
                evaluatee_id: userId,
                status: 'pending' as const,
                evaluation_period: evaluationPeriod,
                due_date: dueDate || undefined
            }));

            await rrhhAssignmentsService.createBulk(assignments);

            showToast(
                `Evaluación asignada a ${selectedUsers.size} usuario(s)`,
                'success'
            );
            onClose();
        } catch (error) {
            console.error('Error assigning template:', error);
            showToast({ type: 'error', title: 'Error al asignar evaluación' });
        } finally {
            setAssigning(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onClose}>
                    <ArrowLeftIcon className="mr-2" />
                    Volver
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Asignar Evaluación</h1>
                    <p className="text-gray-600">{template?.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Configuración</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Período de Evaluación *</Label>
                            <Input
                                value={evaluationPeriod}
                                onChange={(e) => setEvaluationPeriod(e.target.value)}
                                placeholder="ej: 2025-I Lapso"
                            />
                        </div>

                        <div>
                            <Label>Fecha Límite (Opcional)</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <div className="text-sm text-gray-600 space-y-2">
                                <div className="flex justify-between">
                                    <span>Usuarios seleccionados:</span>
                                    <span className="font-semibold">{selectedUsers.size}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total usuarios:</span>
                                    <span className="font-semibold">{users.length}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleAssign}
                            disabled={assigning || selectedUsers.size === 0}
                            className="w-full"
                        >
                            {assigning ? 'Asignando...' : `Asignar a ${selectedUsers.size} usuario(s)`}
                        </Button>
                    </CardContent>
                </Card>

                {/* Users Selection Panel */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Seleccionar Usuarios</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                            >
                                {selectedUsers.size === filteredUsers.length
                                    ? 'Deseleccionar Todos'
                                    : 'Seleccionar Todos'}
                            </Button>
                        </div>
                        <div className="relative mt-4">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar usuarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <UsersIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                    <p>No se encontraron usuarios</p>
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedUsers.has(user.id)
                                                ? 'bg-blue-50 border-blue-300'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleToggleUser(user.id)}
                                    >
                                        <Checkbox
                                            checked={selectedUsers.has(user.id)}
                                            onCheckedChange={() => handleToggleUser(user.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-gray-600">{user.email}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
