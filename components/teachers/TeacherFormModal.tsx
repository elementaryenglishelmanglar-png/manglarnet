'use client';

import { useState, useEffect, useMemo } from 'react';
import { CloseIcon } from '@/components/Icons';
import { InputField } from '@/components/ui/InputField';
import { GRADOS } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/client';
import type { Docente, Clase, Alumno, Aula } from '@/types';

interface Assignment {
  subject: string;
  grade: string;
  nivel_ingles?: string;
  id_aula?: string;
}

interface TeacherFormModalProps {
  teacher: Docente | null;
  clases: Clase[];
  alumnos: Alumno[];
  aulas: Aula[];
  onClose: () => void;
  onSave: (teacher: Docente, assignments: Assignment[]) => void;
}

// Helper functions for English logic
const esInglesPrimaria = (subject: string): boolean => {
  const lowerSubject = subject.toLowerCase();
  return lowerSubject.includes('inglés') || lowerSubject.includes('ingles') || 
         lowerSubject.includes('english');
};

const esGradoAlto = (grade: string): boolean => {
  return grade === '5to Grado' || grade === '6to Grado';
};

const ASIGNATURAS_POR_NIVEL: { [key: string]: string[] } = {
  'Nivel Primaria': [
    'Matemáticas (EAC)', 'Matemáticas (AC)', 'Lenguaje (AC)', 'Lenguaje (EAC)',
    'Ciencias', 'Sociales', 'Proyecto', 'Inglés', 'Francés', 'Música', 'Arte',
    'Tecnología (Robótica)', 'Tecnología (Computación)', 'Ajedrez',
    'Ed, Física y Deporte', 'Valores'
  ]
};

export default function TeacherFormModal({ 
  teacher, 
  clases, 
  alumnos, 
  aulas, 
  onClose, 
  onSave 
}: TeacherFormModalProps) {
  const [formData, setFormData] = useState<Omit<Docente, 'id_docente' | 'id_usuario'>>({
    nombres: teacher?.nombres || '',
    apellidos: teacher?.apellidos || '',
    email: teacher?.email || '',
    telefono: teacher?.telefono || '',
    especialidad: teacher?.especialidad || '',
  });
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentGrade, setCurrentGrade] = useState('');
  const [currentNivelIngles, setCurrentNivelIngles] = useState('');
  const [currentAula, setCurrentAula] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Load existing assignments when editing
  useEffect(() => {
    const loadExistingAssignments = async () => {
      if (!teacher) {
        setAssignments([]);
        return;
      }

      setIsLoadingAssignments(true);
      try {
        const loadedAssignments: Assignment[] = [];

        // Load regular classes
        const regularClasses = clases.filter(c => c.id_docente_asignado === teacher.id_docente);
        regularClasses.forEach(c => {
          loadedAssignments.push({
            subject: c.nombre_materia,
            grade: c.grado_asignado,
            nivel_ingles: undefined,
            id_aula: c.id_aula || undefined
          });
        });

        setAssignments(loadedAssignments);
      } catch (error) {
        console.error('Error loading assignments:', error);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    loadExistingAssignments();
  }, [teacher, clases]);

  const getAvailableSubjects = useMemo(() => {
    const especialidad = formData.especialidad;
    
    if (especialidad === 'Teacher') {
      return ['Inglés'];
    }
    
    if (especialidad === 'Docente Guía' || especialidad === 'Integralidad' || especialidad === 'Especialista') {
      return ASIGNATURAS_POR_NIVEL['Nivel Primaria'] || [];
    }
    
    return [];
  }, [formData.especialidad]);

  const requiereNivelIngles = (subject: string, grade: string): boolean => {
    return esInglesPrimaria(subject) && esGradoAlto(grade);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'especialidad') {
      setCurrentSubject('');
      setCurrentGrade('');
      setCurrentNivelIngles('');
      setCurrentAula('');
    }
    
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
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAssignment = () => {
    if (!currentSubject.trim() || !currentGrade.trim()) {
      setErrors(prev => ({
        ...prev,
        assignment: 'Seleccione una asignatura y un grado'
      }));
      return;
    }

    if (requiereNivelIngles(currentSubject, currentGrade)) {
      if (!currentNivelIngles || currentNivelIngles === '') {
        setErrors(prev => ({
          ...prev,
          assignment: 'Para inglés en 5to y 6to grado, debe seleccionar un nivel'
        }));
        return;
      }
    }

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
        assignment: 'Esta asignación ya está agregada'
      }));
      return;
    }

    setAssignments(prev => [...prev, { 
      subject: currentSubject.trim(), 
      grade: currentGrade.trim(),
      nivel_ingles: requiereNivelIngles(currentSubject, currentGrade) 
        ? currentNivelIngles 
        : undefined,
      id_aula: currentAula || undefined
    }]);

    setCurrentSubject('');
    setCurrentGrade('');
    setCurrentNivelIngles('');
    setCurrentAula('');
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
    
    if (!validateForm()) {
      return;
    }

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
        id_usuario: teacher?.id_usuario || ''
      };
      await onSave(finalTeacherData, assignments);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-apple-gray-dark tracking-tight">
            {teacher ? 'Editar Docente' : 'Añadir Docente'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-apple-gray hover:text-apple-gray-dark transition-apple p-2 rounded-lg hover:bg-apple-gray-light"
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Personal Info */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight border-b border-apple-gray-light pb-4">
              Información Personal
            </h3>
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
                  <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>
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
                  <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
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
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              <div>
                <InputField 
                  label="Teléfono" 
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
                  <option value="Docente Guía">Docente Guía</option>
                  <option value="Integralidad">Integralidad</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Especialista">Especialista</option>
                </InputField>
              </div>
            </div>
          </div>
          
          {/* Assignments */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">
              Asignaturas y Grados
            </h3>
            {isLoadingAssignments && teacher && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">Cargando asignaciones existentes...</p>
              </div>
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
                      setCurrentSubject(e.target.value);
                      if (!esGradoAlto(currentGrade) || !esInglesPrimaria(e.target.value)) {
                        setCurrentNivelIngles('');
                      }
                    }}
                    className={`mt-1 block w-full p-2 border rounded-md ${
                      errors.assignment ? 'border-apple-red' : 'border-apple-gray'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isSubmitting || !formData.especialidad}
                  >
                    <option value="">
                      {!formData.especialidad 
                        ? 'Seleccione primero una especialidad' 
                        : 'Seleccione una asignatura'}
                    </option>
                    {getAvailableSubjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-grow min-w-[150px]">
                  <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                    Grado <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={currentGrade} 
                    onChange={e => {
                      setCurrentGrade(e.target.value);
                      if (!esGradoAlto(e.target.value) || !esInglesPrimaria(currentSubject)) {
                        setCurrentNivelIngles('');
                      }
                    }}
                    className={`mt-1 block w-full p-2 border rounded-md ${
                      errors.assignment ? 'border-apple-red' : 'border-apple-gray'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isSubmitting}
                  >
                    <option value="">Seleccione un grado</option>
                    {GRADOS.map(grado => (
                      <option key={grado} value={grado}>{grado}</option>
                    ))}
                  </select>
                </div>
                {requiereNivelIngles(currentSubject, currentGrade) && (
                  <div className="flex-grow min-w-[150px]">
                    <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                      Nivel de Inglés <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={currentNivelIngles} 
                      onChange={e => setCurrentNivelIngles(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Seleccione un nivel</option>
                      <option value="Basic">Basic</option>
                      <option value="Lower">Lower</option>
                      <option value="Upper">Upper</option>
                    </select>
                  </div>
                )}
                <div className="flex-grow min-w-[150px]">
                  <label className="block text-sm font-medium text-apple-gray-dark mb-2">
                    Aula/Salón
                  </label>
                  <select
                    value={currentAula}
                    onChange={e => setCurrentAula(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">Seleccione un aula (opcional)</option>
                    {aulas.filter((a: any) => a.activa !== false).map((aula: any) => (
                      <option key={aula.id_aula} value={aula.id_aula}>{aula.nombre || aula.nombre_aula || 'Aula'}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddAssignment} 
                  className="bg-apple-blue text-white px-6 py-3 rounded-lg hover:opacity-90 transition-apple disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={isSubmitting}
                >
                  Añadir
                </button>
              </div>
              {errors.assignment && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{errors.assignment}</p>
              )}
              {assignments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignments.map((a, index) => (
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
                        <span className="text-blue-600"> - {(aulas.find((aula: any) => aula.id_aula === a.id_aula)?.nombre || aulas.find((aula: any) => aula.id_aula === a.id_aula)?.nombre_aula || 'Aula')}</span>
                      )}
                      <span className="text-blue-600">)</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAssignment(index)} 
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        disabled={isSubmitting}
                        title="Eliminar"
                      >
                        <CloseIcon />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-apple-gray font-light italic">
                  No hay asignaturas agregadas. Agregue al menos una asignatura y grado.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-apple-gray-light flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full sm:w-auto px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light transition-apple disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="w-full sm:w-auto px-6 py-3 bg-apple-blue text-white rounded-lg hover:opacity-90 transition-apple disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

