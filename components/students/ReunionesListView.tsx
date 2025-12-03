'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon, CalendarIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import ReunionRepresentanteFormModal from './ReunionRepresentanteFormModal';
import { reunionesService } from '@/services/supabaseDataService';
import type { ReunionRepresentante, Alumno } from '@/types';
// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface ReunionesListViewProps {
  student?: Alumno | null;
  grado?: string;
  onSelectReunion?: (reunion: ReunionRepresentante) => void;
}

export default function ReunionesListView({
  student,
  grado,
  onSelectReunion,
}: ReunionesListViewProps) {
  const [reuniones, setReuniones] = useState<ReunionRepresentante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReunion, setSelectedReunion] = useState<ReunionRepresentante | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReuniones();
  }, [student, grado]);

  const loadReuniones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!reunionesService) {
        throw new Error('Servicio de reuniones no disponible');
      }
      
      let data: ReunionRepresentante[];

      if (student) {
        data = await reunionesService.getByAlumno(student.id_alumno);
      } else if (grado) {
        data = await reunionesService.getByGrado(grado);
      } else {
        data = await reunionesService.getAll();
      }

      setReuniones(data || []);
    } catch (err: any) {
      console.error('Error loading reuniones:', err);
      setError(err.message || 'Error al cargar las reuniones');
      setReuniones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta reunión?')) return;

    try {
      await reunionesService.delete(id);
      await loadReuniones();
    } catch (err: any) {
      alert('Error al eliminar la reunión: ' + err.message);
    }
  };

  const filteredReuniones = reuniones.filter(reunion => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reunion.motivo?.toLowerCase().includes(searchLower) ||
      reunion.inquietudes?.toLowerCase().includes(searchLower) ||
      reunion.acuerdos?.toLowerCase().includes(searchLower) ||
      reunion.asistentes.some(a => a.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-manglar-orange"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">
            Reuniones con Representantes
          </h2>
          <HelpTooltip
            content="Registre y gestione las reuniones realizadas con los representantes de los estudiantes. Los datos se analizan para identificar patrones y generar insights."
            variant="icon-only"
            side="right"
          />
        </div>
        <Button
          onClick={() => {
            setSelectedReunion(null);
            setIsFormOpen(true);
          }}
          className="bg-manglar-orange hover:bg-manglar-orange/90"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Reunión
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <SearchIcon className="text-apple-gray" aria-hidden="true" />
        </span>
        <input
          type="text"
          placeholder="Buscar por motivo, inquietudes, acuerdos o asistentes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-12 pr-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-manglar-orange focus:border-manglar-orange transition-apple w-full"
        />
      </div>

      {/* Reuniones List */}
      {filteredReuniones.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No se encontraron reuniones' : 'No hay reuniones registradas'}
          description={
            searchTerm
              ? 'Intente con otros términos de búsqueda'
              : 'Comience registrando una nueva reunión con un representante'
          }
          action={
            !searchTerm ? (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-manglar-orange hover:bg-manglar-orange/90"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Registrar Primera Reunión
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredReuniones.map(reunion => (
            <Card
              key={reunion.id_reunion}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectReunion?.(reunion)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CalendarIcon className="h-5 w-5 text-manglar-orange" />
                      <CardTitle className="text-lg">
                        {formatDate(reunion.fecha)}
                      </CardTitle>
                      <Badge variant="outline">{reunion.grado}</Badge>
                    </div>
                    {reunion.motivo && (
                      <p className="text-sm text-apple-gray mt-2">
                        <strong>Motivo:</strong> {reunion.motivo}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedReunion(reunion);
                        setIsFormOpen(true);
                      }}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(reunion.id_reunion);
                      }}
                    >
                      <DeleteIcon className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reunion.asistentes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-apple-gray-dark mb-2">Asistentes:</p>
                    <div className="flex flex-wrap gap-2">
                      {reunion.asistentes.map((asistente, idx) => (
                        <Badge key={idx} variant="secondary">
                          {asistente}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {reunion.inquietudes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-apple-gray-dark mb-1">Inquietudes:</p>
                    <p className="text-sm text-apple-gray line-clamp-3">
                      {reunion.inquietudes}
                    </p>
                  </div>
                )}

                {reunion.acuerdos && (
                  <div>
                    <p className="text-sm font-medium text-apple-gray-dark mb-1">Acuerdos:</p>
                    <p className="text-sm text-apple-gray line-clamp-3">
                      {reunion.acuerdos}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ReunionRepresentanteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedReunion(null);
        }}
        onSave={loadReuniones}
        student={student || undefined}
        reunion={selectedReunion || undefined}
      />
    </div>
  );
}

