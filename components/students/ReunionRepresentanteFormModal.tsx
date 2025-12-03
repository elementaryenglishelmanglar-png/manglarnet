'use client';

import { useState, useEffect } from 'react';
import { CloseIcon } from '@/components/Icons';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { ReunionRepresentante, Alumno } from '@/types';
import { reunionesService } from '@/services/supabaseDataService';
import { useAuth } from '@/hooks/useAuth';

interface ReunionRepresentanteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  student?: Alumno | null;
  reunion?: ReunionRepresentante | null;
}

export default function ReunionRepresentanteFormModal({
  isOpen,
  onClose,
  onSave,
  student,
  reunion,
}: ReunionRepresentanteFormModalProps) {
  const auth = useAuth();
  const user = auth?.user || null;
  const [formData, setFormData] = useState({
    id_alumno: student?.id_alumno || reunion?.id_alumno || '',
    fecha: reunion?.fecha || new Date().toISOString().split('T')[0],
    grado: student?.salon || reunion?.grado || '',
    asistentes: reunion?.asistentes || [] as string[],
    asistentesInput: '',
    motivo: reunion?.motivo || '',
    inquietudes: reunion?.inquietudes || '',
    acuerdos: reunion?.acuerdos || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        id_alumno: student?.id_alumno || reunion?.id_alumno || '',
        fecha: reunion?.fecha || new Date().toISOString().split('T')[0],
        grado: student?.salon || reunion?.grado || '',
        asistentes: reunion?.asistentes || [],
        asistentesInput: '',
        motivo: reunion?.motivo || '',
        inquietudes: reunion?.inquietudes || '',
        acuerdos: reunion?.acuerdos || '',
      });
      setError(null);
    }
  }, [isOpen, student, reunion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAsistente = () => {
    const asistente = formData.asistentesInput.trim();
    if (asistente && !formData.asistentes.includes(asistente)) {
      setFormData(prev => ({
        ...prev,
        asistentes: [...prev.asistentes, asistente],
        asistentesInput: '',
      }));
    }
  };

  const handleRemoveAsistente = (asistente: string) => {
    setFormData(prev => ({
      ...prev,
      asistentes: prev.asistentes.filter(a => a !== asistente),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAsistente();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.id_alumno || !formData.fecha || !formData.grado) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      const reunionData: Omit<ReunionRepresentante, 'id_reunion' | 'created_at' | 'updated_at'> = {
        id_alumno: formData.id_alumno,
        fecha: formData.fecha,
        grado: formData.grado,
        asistentes: formData.asistentes,
        motivo: formData.motivo || undefined,
        inquietudes: formData.inquietudes || undefined,
        acuerdos: formData.acuerdos || undefined,
        creado_por: user?.id,
      };

      if (reunion) {
        await reunionesService.update(reunion.id_reunion, reunionData);
      } else {
        await reunionesService.create(reunionData);
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la reunión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-apple-gray-dark tracking-tight">
            {reunion ? 'Editar Reunión' : 'Registro Entrevista con Representante'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-apple-gray hover:text-apple-gray-dark transition-apple rounded-lg hover:bg-apple-gray-light"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Información Básica */}
          <div className="border-b border-apple-gray-light pb-8">
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Nombre Estudiante"
                name="nombre_estudiante"
                value={student ? `${student.nombres} ${student.apellidos}` : ''}
                disabled
                className="bg-gray-50"
              />
              <InputField
                label="Fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
              <InputField
                label="Grado"
                name="grado"
                value={formData.grado}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Asistentes */}
          <div className="border-b border-apple-gray-light pb-8">
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">
              Asistentes
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <InputField
                  label=""
                  name="asistentesInput"
                  value={formData.asistentesInput}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Nombre del asistente (presione Enter para agregar)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddAsistente}
                  className="mt-6"
                  variant="outline"
                >
                  Agregar
                </Button>
              </div>
              {formData.asistentes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.asistentes.map((asistente, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1 text-sm flex items-center gap-2"
                    >
                      {asistente}
                      <button
                        type="button"
                        onClick={() => handleRemoveAsistente(asistente)}
                        className="ml-2 hover:text-red-600"
                        aria-label={`Eliminar ${asistente}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Motivo */}
          <div className="border-b border-apple-gray-light pb-8">
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">
              Motivo
            </h3>
            <Textarea
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              placeholder="Describa el motivo de la reunión..."
              rows={3}
              className="w-full"
            />
          </div>

          {/* Inquietudes */}
          <div className="border-b border-apple-gray-light pb-8">
            <Label htmlFor="inquietudes" className="text-xl font-semibold mb-4 block text-apple-gray-dark tracking-tight">
              Inquietudes
            </Label>
            <Textarea
              id="inquietudes"
              name="inquietudes"
              value={formData.inquietudes}
              onChange={handleChange}
              placeholder="Registre las inquietudes expresadas por el representante..."
              rows={8}
              className="w-full"
            />
            <p className="text-sm text-apple-gray mt-2">
              Este campo será analizado para identificar patrones y temas recurrentes.
            </p>
          </div>

          {/* Acuerdos */}
          <div className="pb-8">
            <Label htmlFor="acuerdos" className="text-xl font-semibold mb-4 block text-apple-gray-dark tracking-tight">
              Acuerdos
            </Label>
            <Textarea
              id="acuerdos"
              name="acuerdos"
              value={formData.acuerdos}
              onChange={handleChange}
              placeholder="Registre los acuerdos alcanzados en la reunión..."
              rows={6}
              className="w-full"
            />
            <p className="text-sm text-apple-gray mt-2">
              Los acuerdos pueden ser seguidos para medir su cumplimiento.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4 border-t border-apple-gray-light">
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
              disabled={isSubmitting}
              className="bg-manglar-orange hover:bg-manglar-orange/90"
            >
              {isSubmitting ? 'Guardando...' : reunion ? 'Actualizar' : 'Guardar Reunión'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

