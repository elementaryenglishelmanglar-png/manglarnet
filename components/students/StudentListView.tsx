'use client';

import { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon } from '@/components/Icons';
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
        <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Lista de Alumnos</h2>
        <button 
          onClick={onAddStudent} 
          className="flex items-center gap-2 bg-apple-blue text-white px-6 py-3 rounded-lg hover:opacity-90 text-sm sm:text-base font-medium min-h-[44px] transition-apple"
        >
          <PlusIcon />
          <span className="hidden sm:inline">Añadir Alumno</span>
          <span className="sm:hidden">Añadir</span>
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="text-apple-gray" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base placeholder:text-apple-gray"
          />
        </div>
        <select
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value)}
          className="px-4 py-3 border border-apple-gray rounded-lg text-base w-full sm:w-auto transition-apple focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue"
        >
          {grades.map(grade => (
            <option key={grade} value={grade}>
              {grade === 'all' ? 'Todos los Salones' : grade}
            </option>
          ))}
        </select>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredStudents.map(student => (
          <div key={student.id_alumno} className="py-4 border-b border-apple-gray-light transition-apple hover:opacity-70">
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
                className="flex-1 px-4 py-2 bg-apple-blue text-white rounded-lg hover:opacity-90 text-sm font-medium transition-apple"
              >
                Ver
              </button>
              <button 
                onClick={() => onEditStudent(student)} 
                className="px-4 py-2 border border-apple-gray text-apple-gray-dark rounded-lg hover:bg-apple-gray-light text-sm font-medium transition-apple"
              >
                <EditIcon />
              </button>
              <button 
                onClick={() => onDeleteStudent(student.id_alumno)} 
                className="px-4 py-2 border border-apple-red text-apple-red rounded-lg hover:bg-apple-red hover:text-white text-sm font-medium transition-apple"
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-apple-gray text-sm font-light">No se encontraron alumnos</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-apple-gray-light">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Nombre Completo</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Salón</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Cédula Escolar</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Condición</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-apple-gray-light">
            {filteredStudents.map(student => (
              <tr key={student.id_alumno} className="transition-apple hover:opacity-70">
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
                    className="text-apple-blue hover:underline transition-apple"
                  >
                    Ver Detalles
                  </button>
                  <button 
                    onClick={() => onEditStudent(student)} 
                    className="text-apple-blue hover:text-apple-blue transition-apple"
                  >
                    <EditIcon />
                  </button>
                  <button 
                    onClick={() => onDeleteStudent(student.id_alumno)} 
                    className="text-apple-red hover:text-apple-red transition-apple"
                  >
                    <DeleteIcon />
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

