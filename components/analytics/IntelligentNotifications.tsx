'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle2,
    TrendingDown,
    Users,
    Calendar,
    X,
} from 'lucide-react';
import { analyticsService } from '@/services/analyticsDataService';
import type { IntelligentNotification, NotificationFilters } from '@/types/analytics';

interface IntelligentNotificationsProps {
    filters?: NotificationFilters;
}

export function IntelligentNotifications({ filters }: IntelligentNotificationsProps) {
    const [notifications, setNotifications] = useState<IntelligentNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<IntelligentNotification | null>(
        null
    );
    const [filterSeveridad, setFilterSeveridad] = useState<string>('all');
    const [filterEstado, setFilterEstado] = useState<string>('pendiente');
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        fetchNotifications();
    }, [filters, filterSeveridad, filterEstado]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const combinedFilters: NotificationFilters = {
                ...filters,
                severidad: filterSeveridad !== 'all' ? (filterSeveridad as any) : undefined,
                estado: filterEstado !== 'all' ? (filterEstado as any) : undefined,
            };
            const data = await analyticsService.getIntelligentNotifications(combinedFilters);
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (
        id: string,
        status: 'revisada' | 'resuelta' | 'descartada'
    ) => {
        try {
            await analyticsService.updateNotificationStatus(id, status, undefined, reviewNotes);
            setReviewNotes('');
            setSelectedNotification(null);
            fetchNotifications();
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const getSeverityIcon = (severidad: string) => {
        switch (severidad) {
            case 'critica':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'alta':
                return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            case 'media':
                return <Info className="h-5 w-5 text-yellow-500" />;
            case 'baja':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            default:
                return <Info className="h-5 w-5 text-gray-400" />;
        }
    };

    const getSeverityBadgeVariant = (
        severidad: string
    ): 'destructive' | 'default' | 'secondary' | 'outline' => {
        switch (severidad) {
            case 'critica':
            case 'alta':
                return 'destructive';
            case 'media':
                return 'default';
            default:
                return 'secondary';
        }
    };

    const getAlertTypeIcon = (tipo: string) => {
        switch (tipo) {
            case 'bajada_brusca':
                return <TrendingDown className="h-4 w-4" />;
            case 'anomalia_grupal':
                return <Users className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getAlertTypeLabel = (tipo: string): string => {
        const labels: Record<string, string> = {
            rendimiento_bajo: 'Rendimiento Bajo',
            bajada_brusca: 'Bajada Brusca',
            riesgo_alto: 'Riesgo Alto',
            asistencia_critica: 'Asistencia Crítica',
            anomalia_grupal: 'Anomalía Grupal',
            mejora_significativa: 'Mejora Significativa',
        };
        return labels[tipo] || tipo;
    };

    const pendingCount = notifications.filter((n) => n.estado === 'pendiente').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-manglar-orange border-t-transparent"></div>
                    <p className="text-sm text-muted-foreground font-medium">Cargando alertas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Alertas Inteligentes</h3>
                    {pendingCount > 0 && (
                        <Badge variant="destructive" className="rounded-full">
                            {pendingCount}
                        </Badge>
                    )}
                </div>

                <div className="flex gap-2">
                    <Select value={filterSeveridad} onValueChange={setFilterSeveridad}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Severidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="critica">Crítica</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterEstado} onValueChange={setFilterEstado}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pendiente">Pendientes</SelectItem>
                            <SelectItem value="revisada">Revisadas</SelectItem>
                            <SelectItem value="resuelta">Resueltas</SelectItem>
                            <SelectItem value="descartada">Descartadas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                            <p className="text-lg font-medium mb-2">No hay alertas</p>
                            <p className="text-sm text-muted-foreground">
                                No se encontraron alertas con los filtros seleccionados
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((notification) => (
                        <Card
                            key={notification.id_notificacion}
                            className={`cursor-pointer transition-all hover:shadow-md ${notification.estado === 'pendiente' ? 'border-l-4 border-l-red-500' : ''
                                }`}
                            onClick={() => setSelectedNotification(notification)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">{getSeverityIcon(notification.severidad)}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm mb-1">{notification.titulo}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {notification.mensaje}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant={getSeverityBadgeVariant(notification.severidad)}>
                                                    {notification.severidad}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {getAlertTypeLabel(notification.tipo_alerta)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
                                            {notification.grado && (
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {notification.grado}
                                                </div>
                                            )}
                                            {notification.materia && (
                                                <div className="flex items-center gap-1">
                                                    <span>•</span>
                                                    {notification.materia}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(notification.created_at).toLocaleDateString('es-ES')}
                                            </div>
                                            <Badge
                                                variant={notification.estado === 'pendiente' ? 'default' : 'outline'}
                                                className="text-xs"
                                            >
                                                {notification.estado}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    {selectedNotification && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-3">
                                    {getSeverityIcon(selectedNotification.severidad)}
                                    <div className="flex-1">
                                        <DialogTitle>{selectedNotification.titulo}</DialogTitle>
                                        <DialogDescription className="mt-2">
                                            {selectedNotification.mensaje}
                                        </DialogDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedNotification(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {/* Metrics */}
                                {(selectedNotification.valor_actual !== undefined ||
                                    selectedNotification.valor_anterior !== undefined) && (
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">Métricas</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                                {selectedNotification.valor_actual !== undefined && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Valor actual:</span>
                                                        <span className="font-medium tabular-nums">
                                                            {selectedNotification.valor_actual.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedNotification.valor_anterior !== undefined && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Valor anterior:</span>
                                                        <span className="font-medium tabular-nums">
                                                            {selectedNotification.valor_anterior.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedNotification.umbral_activacion !== undefined && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Umbral:</span>
                                                        <span className="font-medium tabular-nums">
                                                            {selectedNotification.umbral_activacion.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                {/* Suggested Actions */}
                                {selectedNotification.acciones_sugeridas &&
                                    selectedNotification.acciones_sugeridas.length > 0 && (
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">Acciones Sugeridas</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="space-y-2 text-sm">
                                                    {selectedNotification.acciones_sugeridas.map((accion, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                            <span>{accion}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    )}

                                {/* Review Notes */}
                                {selectedNotification.estado === 'pendiente' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Notas de Revisión (Opcional)</label>
                                        <Textarea
                                            placeholder="Agrega notas sobre las acciones tomadas..."
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                )}
                            </div>

                            {selectedNotification.estado === 'pendiente' && (
                                <DialogFooter className="gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            handleUpdateStatus(selectedNotification.id_notificacion, 'descartada')
                                        }
                                    >
                                        Descartar
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            handleUpdateStatus(selectedNotification.id_notificacion, 'revisada')
                                        }
                                    >
                                        Marcar como Revisada
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            handleUpdateStatus(selectedNotification.id_notificacion, 'resuelta')
                                        }
                                    >
                                        Marcar como Resuelta
                                    </Button>
                                </DialogFooter>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
