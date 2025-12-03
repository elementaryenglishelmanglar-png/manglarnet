'use client';

import { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon } from '@/components/Icons';
import { EmptyStateStudents, EmptyStateSearch, EmptyState } from '@/components/ui/empty-state';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { OptimisticButton } from '@/components/ui/optimistic-button';
import type { Alumno } from '@/types';

interface StudentListViewProps {
  students: Alumno[];
  onSelectStudent: (student: Alumno) => void;
  onAddStudent: () => void;
  onEditStudent: (student: Alumno) => void;
  onDeleteStudent: (studentId: string) => void;
}

export default function StudentListView({ 
  students, 
  onSelectStudent, 
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent 
}: StudentListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');

  const grades = useMemo(() => ['all', ...Array.from(new Set(students.map(s => s.salon)))], [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatch = `${student.nombres} ${student.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());
      const gradeMatch = filterGrade === 'all' || student.salon === filterGrade;
      return nameMatch && gradeMatch;
    });
  }, [students, searchTerm, filterGrade]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Lista de Alumnos</h2>
          <HelpTooltip
            content="Gestiona todos los estudiantes del colegio. Puedes buscar por nombre, filtrar por salón, y realizar acciones como ver detalles, editar o eliminar."
            variant="icon-only"
            side="right"
          />
        </div>
        <button 
          onClick={onAddStudent} 
          className="flex items-center gap-2 bg-manglar-orange text-white px-6 py-3 rounded-lg hover:bg-manglar-orange/90 active:scale-95 text-sm sm:text-base font-medium min-h-[44px] transition-apple hover-lift-smooth focus-ring"
          aria-label="Agregar nuevo alumno"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Añadir Alumno</span>
          <span className="sm:hidden">Añadir</span>
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <label htmlFor="student-search" className="sr-only">Buscar alumnos</label>
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <SearchIcon className="text-apple-gray" aria-hidden="true" />
          </span>
          <input
            id="student-search"
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-manglar-orange focus:border-manglar-orange transition-apple text-base placeholder:text-apple-gray"
            aria-label="Buscar alumnos por nombre"
          />
        </div>
        <label htmlFor="grade-filter" className="sr-only">Filtrar por salón</label>
        <select
          id="grade-filter"
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value)}
          className="px-4 py-3 border border-apple-gray rounded-lg text-base w-full sm:w-auto transition-apple focus:outline-none focus:ring-2 focus:ring-manglar-orange focus:border-manglar-orange"
          aria-label="Filtrar alumnos por salón"
        >
          {grades.map(grade => (
            <option key={grade} value={grade}>
              {grade === 'all' ? 'Todos los Salones' : grade}
            </option>
          ))}
        </select>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4" role="list" aria-label="Lista de alumnos">
        {filteredStudents.map(student => (
          <div 
            key={student.id_alumno} 
            className="py-4 border-b border-apple-gray-light transition-apple hover:opacity-70 hover-lift-smooth"
            role="listitem"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-apple-gray-dark text-lg mb-1">
                  {student.nombres} {student.apellidos}
                </h3>
                <p className="text-sm text-apple-gray font-light">{student.email_alumno}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                student.condicion === 'Regular' ? 'bg-apple-green text-white' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {student.condicion}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <span className="text-apple-gray font-light w-24">Salón:</span>
                <span className="text-apple-gray-dark font-medium">{student.salon}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-apple-gray font-light w-24">Cédula:</span>
                <span className="text-apple-gray-dark font-medium">{student.cedula_escolar}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-3 border-t border-apple-gray-light">
              <button 
                onClick={() => onSelectStudent(student)} 
                className="flex-1 px-4 py-2 bg-manglar-orange text-white rounded-lg hover:bg-manglar-orange/90 active:scale-95 text-sm font-medium transition-apple hover-lift-smooth focus-ring min-h-[44px]"
                aria-label={`Ver detalles de ${student.nombres} ${student.apellidos}`}
              >
                Ver
              </button>
              <button 
                onClick={() => onEditStudent(student)} 
                className="px-4 py-2 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-manglar-orange-light active:scale-95 text-sm font-medium transition-apple hover-lift-smooth focus-ring min-h-[44px] min-w-[44px]"
                aria-label={`Editar ${student.nombres} ${student.apellidos}`}
              >
                <EditIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button 
                onClick={() => onDeleteStudent(student.id_alumno)} 
                className="px-4 py-2 border border-apple-red text-apple-red rounded-lg hover:bg-apple-red hover:text-white active:scale-95 text-sm font-medium transition-apple hover-lift-smooth focus-ring min-h-[44px] min-w-[44px]"
                aria-label={`Eliminar ${student.nombres} ${student.apellidos}`}
              >
                <DeleteIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && students.length === 0 && (
          <EmptyStateStudents onAdd={onAddStudent} />
        )}
        {filteredStudents.length === 0 && students.length > 0 && searchTerm && (
          <EmptyStateSearch query={searchTerm} />
        )}
        {filteredStudents.length === 0 && students.length > 0 && !searchTerm && (
          <EmptyState
            icon={SearchIcon}
            title="No hay alumnos en este filtro"
            description="Intenta cambiar el filtro de salón o agregar más alumnos al sistema."
            action={{
              label: 'Agregar Alumno',
              onClick: onAddStudent,
            }}
          />
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-apple-gray-light" role="table" aria-label="Lista de alumnos">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Nombre Completo</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Salón</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Cédula Escolar</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Condición</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-apple-gray-light">
            {filteredStudents.map(student => (
              <tr 
                key={student.id_alumno} 
                className="transition-apple hover:bg-manglar-orange-light/10 cursor-pointer hover-lift-smooth"
                onClick={() => onSelectStudent(student)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStudent(student);
                  }
                }}
                tabIndex={0}
                role="row"
                aria-label={`Alumno: ${student.nombres} ${student.apellidos}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-apple-gray-dark">{student.nombres} {student.apellidos}</div>
                  <div className="text-sm text-apple-gray font-light">{student.email_alumno}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray font-light">{student.salon}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray font-light">{student.cedula_escolar}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                    student.condicion === 'Regular' ? 'bg-apple-green text-white' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {student.condicion}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                  <button 
                    onClick={() => onSelectStudent(student)} 
                    className="text-manglar-orange hover:text-manglar-orange/80 hover:underline transition-apple focus-ring rounded px-1"
                    aria-label={`Ver detalles de ${student.nombres} ${student.apellidos}`}
                  >
                    Ver Detalles
                  </button>
                  <button 
                    onClick={() => onEditStudent(student)} 
                    className="text-manglar-orange hover:text-manglar-orange/80 transition-apple focus-ring rounded p-1"
                    aria-label={`Editar ${student.nombres} ${student.apellidos}`}
                  >
                    <EditIcon aria-hidden="true" />
                  </button>
                  <button 
                    onClick={() => onDeleteStudent(student.id_alumno)} 
                    className="text-apple-red hover:text-apple-red/80 transition-apple focus-ring rounded p-1"
                    aria-label={`Eliminar ${student.nombres} ${student.apellidos}`}
                  >
                    <DeleteIcon aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

