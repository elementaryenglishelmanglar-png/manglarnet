/**
 * RRHH Templates List
 * Vista de lista de plantillas de evaluación con acciones
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    PlusIcon,
    EditIcon,
    DeleteIcon,
    SearchIcon,
    EvaluationIcon
} from '../Icons';
import {
    rrhhTemplatesService,
    type RRHHTemplate
} from '../../services/rrhhEvaluationService';
import { useToast } from '../ui/toast';
import { TemplateBuilder } from './TemplateBuilder';
import { TemplateAssignment } from './TemplateAssignment';
import { DirectEvaluationForm } from './DirectEvaluationForm';

export const TemplatesList: React.FC = () => {
    const [templates, setTemplates] = useState<RRHHTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [showBuilder, setShowBuilder] = useState(false);
    const [showAssignment, setShowAssignment] = useState(false);
    const [showDirectEvaluation, setShowDirectEvaluation] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await rrhhTemplatesService.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
            showToast({ type: 'error', title: 'Error al cargar plantillas' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setShowBuilder(true);
    };

    const handleEdit = (templateId: string) => {
        setSelectedTemplate(templateId);
        setShowBuilder(true);
    };

    const handleAssign = (templateId: string) => {
        setSelectedTemplate(templateId);
        setShowAssignment(true);
    };

    const handleDirectEvaluation = (templateId: string) => {
        setSelectedTemplate(templateId);
        setShowDirectEvaluation(true);
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

        try {
            await rrhhTemplatesService.delete(templateId);
            showToast({ type: 'success', title: 'Plantilla eliminada' });
            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            showToast({ type: 'error', title: 'Error al eliminar plantilla' });
        }
    };

    const handleBuilderClose = () => {
        setShowBuilder(false);
        setSelectedTemplate(null);
        loadTemplates();
    };

    const handleAssignmentClose = () => {
        setShowAssignment(false);
        setSelectedTemplate(null);
    };

    const handleDirectEvaluationClose = () => {
        setShowDirectEvaluation(false);
        setSelectedTemplate(null);
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showBuilder) {
        return (
            <TemplateBuilder
                templateId={selectedTemplate || undefined}
                onSave={handleBuilderClose}
                onCancel={handleBuilderClose}
            />
        );
    }

    if (showAssignment && selectedTemplate) {
        return (
            <TemplateAssignment
                templateId={selectedTemplate}
                onClose={handleAssignmentClose}
            />
        );
    }

    if (showDirectEvaluation && selectedTemplate) {
        return (
            <DirectEvaluationForm
                templateId={selectedTemplate}
                onComplete={handleDirectEvaluationClose}
                onCancel={handleDirectEvaluationClose}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Plantillas de Evaluación</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona las plantillas de evaluación de desempeño
                    </p>
                </div>
                <Button onClick={handleCreateNew}>
                    <PlusIcon className="mr-2" />
                    Nueva Plantilla
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Buscar plantillas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <EvaluationIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay plantillas</h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm
                                ? 'No se encontraron plantillas con ese criterio'
                                : 'Crea tu primera plantilla de evaluación'}
                        </p>
                        {!searchTerm && (
                            <Button onClick={handleCreateNew}>
                                <PlusIcon className="mr-2" />
                                Crear Plantilla
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                        {template.description && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant={
                                            Math.abs(template.total_weight_check - 100) < 0.01
                                                ? 'success'
                                                : 'warning'
                                        }
                                    >
                                        {template.total_weight_check.toFixed(0)}%
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(template.id)}
                                            className="flex-1"
                                        >
                                            <EditIcon className="mr-1 h-4 w-4" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleAssign(template.id)}
                                            className="flex-1"
                                        >
                                            <EvaluationIcon className="mr-1 h-4 w-4" />
                                            Asignar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(template.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <DeleteIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleDirectEvaluation(template.id)}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        <EvaluationIcon className="mr-1 h-4 w-4" />
                                        Evaluar Directamente
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
