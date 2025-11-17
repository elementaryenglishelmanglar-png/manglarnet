'use client';

import { ArrowLeftIcon, IdentificationIcon, CakeIcon, LocationMarkerIcon, AcademicCapIcon, UsersIcon, SparklesIcon, MailIcon, PhoneIcon, UserCircleIcon } from '@/components/Icons';
import type { Alumno } from '@/types';

interface StudentDetailViewProps {
  student: Alumno;
  onBack: () => void;
}

const InfoItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value?: string | string[];
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4">
    <Icon className="h-5 w-5 text-apple-gray mt-1" />
    <div>
      <p className="text-sm text-apple-gray font-light mb-1">{label}</p>
      <p className="font-medium text-apple-gray-dark">
        {Array.isArray(value) ? value.join(', ') : (value || 'N/A')}
      </p>
    </div>
  </div>
);

export default function StudentDetailView({ student, onBack }: StudentDetailViewProps) {
  return (
    <div className="mb-8">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-sm text-apple-gray hover:text-apple-gray-dark mb-8 transition-apple"
      >
        <ArrowLeftIcon />
        Volver a la Lista
      </button>
      <div className="flex flex-col md:flex-row gap-12">
        <div className="flex-shrink-0 text-center">
          <UserCircleIcon className="h-32 w-32 text-apple-gray mx-auto opacity-40" />
          <h2 className="text-3xl font-bold mt-6 text-apple-gray-dark tracking-tight">
            {student.nombres} {student.apellidos}
          </h2>
          <p className="text-apple-gray font-light mt-2">{student.salon}</p>
        </div>
        <div className="flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <InfoItem icon={IdentificationIcon} label="Cédula Escolar" value={student.cedula_escolar} />
            <InfoItem 
              icon={CakeIcon} 
              label="Fecha de Nacimiento" 
              value={new Date(student.fecha_nacimiento).toLocaleDateString()} 
            />
            <InfoItem 
              icon={LocationMarkerIcon} 
              label="Lugar de Nacimiento" 
              value={`${student.lugar_nacimiento}, ${student.estado}`} 
            />
            <InfoItem icon={AcademicCapIcon} label="Condición" value={student.condicion} />
            <InfoItem 
              icon={UsersIcon} 
              label="Hermanos en el Colegio" 
              value={student.hermanos.length > 0 ? student.hermanos : 'No tiene'} 
            />
            <InfoItem icon={SparklesIcon} label="Nivel de Inglés" value={student.nivel_ingles} />
          </div>
          <hr className="my-8 border-apple-gray-light" />
          <h3 className="text-xl font-semibold mb-6 text-apple-gray-dark tracking-tight">
            Información de Contacto de Representantes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="py-6 border-b border-apple-gray-light">
              <h4 className="font-semibold text-apple-gray-dark mb-4">Madre: {student.info_madre.nombre}</h4>
              <div className="space-y-4">
                <InfoItem icon={MailIcon} label="Email" value={student.info_madre.email} />
                <InfoItem icon={PhoneIcon} label="Teléfono" value={student.info_madre.telefono} />
              </div>
            </div>
            <div className="py-6 border-b border-apple-gray-light">
              <h4 className="font-semibold text-apple-gray-dark mb-4">Padre: {student.info_padre.nombre}</h4>
              <div className="space-y-4">
                <InfoItem icon={MailIcon} label="Email" value={student.info_padre.email} />
                <InfoItem icon={PhoneIcon} label="Teléfono" value={student.info_padre.telefono} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

