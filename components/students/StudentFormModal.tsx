'use client';

import { useState } from 'react';
import { CloseIcon } from '@/components/Icons';
import { InputField } from '@/components/ui/InputField';
import { GRADOS } from '@/lib/utils/constants';
import type { Alumno } from '@/types';

interface StudentFormModalProps {
  student: Alumno | null;
  onClose: () => void;
  onSave: (student: Alumno) => void;
}

export default function StudentFormModal({ student, onClose, onSave }: StudentFormModalProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      id_alumno: student?.id_alumno || '',
    };
    onSave(finalStudentData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-apple-gray-dark tracking-tight">
            {student ? 'Editar Alumno' : 'Añadir Alumno'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-apple-gray hover:text-apple-gray-dark transition-apple rounded-lg hover:bg-apple-gray-light"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Info */}
          <div className="border-b border-apple-gray-light pb-8">
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} required />
              <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
              <InputField label="Email Alumno" name="email_alumno" type="email" value={formData.email_alumno} onChange={handleChange} required />
              <InputField label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} required />
              <InputField 
                as="select" 
                label="Género" 
                name="genero" 
                value={formData.genero} 
                onChange={handleChange}
              >
                <option>Niño</option>
                <option>Niña</option>
              </InputField>
              <InputField label="Lugar de Nacimiento" name="lugar_nacimiento" value={formData.lugar_nacimiento} onChange={handleChange} />
              <InputField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
            </div>
          </div>
          
          {/* Academic Info */}
          <div className="border-b border-apple-gray-light pb-8">
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">Datos Académicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField label="Cédula Escolar" name="cedula_escolar" value={formData.cedula_escolar} onChange={handleChange} />
              <InputField 
                as="select" 
                label="Salón/Grado" 
                name="salon" 
                value={formData.salon} 
                onChange={handleChange}
              >
                {GRADOS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </InputField>
              <InputField 
                as="select" 
                label="Grupo" 
                name="grupo" 
                value={formData.grupo} 
                onChange={handleChange}
              >
                <option>Grupo 1</option>
                <option>Grupo 2</option>
              </InputField>
              <InputField 
                as="select" 
                label="Condición" 
                name="condicion" 
                value={formData.condicion} 
                onChange={handleChange}
              >
                <option>Regular</option>
                <option>Nuevo Ingreso</option>
              </InputField>
              <InputField 
                as="select" 
                label="Nivel de Inglés" 
                name="nivel_ingles" 
                value={formData.nivel_ingles} 
                onChange={handleChange}
              >
                <option>Basic</option>
                <option>Lower</option>
                <option>Upper</option>
                <option>Advanced</option>
                <option>IB</option>
              </InputField>
              <InputField 
                label="Hermanos (separados por coma)" 
                name="hermanos" 
                value={hermanosStr} 
                onChange={(e) => setHermanosStr(e.target.value)} 
              />
            </div>
          </div>
          
          {/* Parent Info */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">Datos de Representantes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="py-6 border-b border-apple-gray-light space-y-4">
                <h4 className="font-semibold text-apple-gray-dark">Madre</h4>
                <InputField label="Nombre Completo" name="info_madre.nombre" value={formData.info_madre.nombre} onChange={handleChange} required />
                <InputField label="Email" name="info_madre.email" type="email" value={formData.info_madre.email} onChange={handleChange} required />
                <InputField label="Teléfono" name="info_madre.telefono" value={formData.info_madre.telefono} onChange={handleChange} required />
              </div>
              <div className="py-6 border-b border-apple-gray-light space-y-4">
                <h4 className="font-semibold text-apple-gray-dark">Padre</h4>
                <InputField label="Nombre Completo" name="info_padre.nombre" value={formData.info_padre.nombre} onChange={handleChange} />
                <InputField label="Email" name="info_padre.email" type="email" value={formData.info_padre.email} onChange={handleChange} />
                <InputField label="Teléfono" name="info_padre.telefono" value={formData.info_padre.telefono} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-apple-gray-light flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full sm:w-auto px-6 py-3 border border-apple-gray text-apple-gray-dark rounded-lg text-base font-medium transition-apple hover:bg-apple-gray-light"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="w-full sm:w-auto px-6 py-3 bg-apple-blue text-white rounded-lg text-base font-medium transition-apple hover:opacity-90"
            >
              Guardar Alumno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

