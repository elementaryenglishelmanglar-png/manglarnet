'use client';

import { PlusIcon, EditIcon, DeleteIcon } from '@/components/Icons';
import type { Docente, Clase, Aula, Usuario } from '@/types';

interface TeacherListViewProps {
  docentes: Docente[];
  clases: Clase[];
  aulas: Aula[];
  onAddTeacher: () => void;
  onEditTeacher: (teacher: Docente) => void;
  onDeleteTeacher: (id_docente: string) => void;
}

export default function TeacherListView({
  docentes,
  clases,
  aulas,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
}: TeacherListViewProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-apple-gray-dark tracking-tight">Gestión de Docentes</h2>
        <button 
          onClick={onAddTeacher} 
          className="flex items-center gap-2 bg-apple-blue text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium transition-apple"
        >
          <PlusIcon />
          Añadir Docente
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-apple-gray-light">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Docente</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Asignaturas</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Grados</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Contacto</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-apple-gray-dark uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-apple-gray-light">
            {docentes.map(docente => {
              // Regular classes assigned directly to teacher
              const teacherClasses = clases.filter(c => c.id_docente_asignado === docente.id_docente);
              
              // English level assignments (5to-6to)
              const englishAssignments = englishLevelAssignments.filter(a => a.id_docente === docente.id_docente);
              
              // Build subjects list
              const regularSubjects = [...new Set(teacherClasses.map(c => c.nombre_materia))];
              const englishSubjects = englishAssignments.length > 0 ? ['Inglés (Niveles)'] : [];
              const subjects = [...regularSubjects, ...englishSubjects];
              
              // Build grades list
              let grades = [...new Set(teacherClasses.map(c => c.grado_asignado))];
              
              // For English level teachers, add 5to and 6to Grado
              if (englishAssignments.length > 0) {
                if (!grades.includes('5to Grado')) grades.push('5to Grado');
                if (!grades.includes('6to Grado')) grades.push('6to Grado');
              }
              
              grades.sort();
              
              // Get assigned aulas
              const regularAulas = [...new Set(teacherClasses.map(c => c.id_aula).filter(Boolean))];
              const englishAulas = [...new Set(englishAssignments.map(a => a.id_aula).filter(Boolean))];
              const allAulas = [...regularAulas, ...englishAulas];
              const aulasNames = allAulas.map(id => {
                const aula = aulas.find((a: any) => a.id_aula === id);
                return aula?.nombre || aula?.nombre_aula || '';
              }).filter(Boolean);

              return (
                <tr key={docente.id_docente} className="hover:bg-apple-gray-light transition-apple">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-apple-gray-dark">
                    {docente.nombres} {docente.apellidos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                    {subjects.length > 0 ? (
                      <div>
                        {subjects.join(', ')}
                        {englishAssignments.length > 0 && (
                          <div className="text-xs text-purple-600 mt-1">
                            Niveles: {englishAssignments.map(a => a.nivel_ingles).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                    {grades.length > 0 ? grades.join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-apple-gray">
                    <div>{docente.email}</div>
                    <div>{docente.telefono}</div>
                    {aulasNames.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Aulas: {aulasNames.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                    <button 
                      onClick={() => onEditTeacher(docente)} 
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      onClick={() => onDeleteTeacher(docente.id_docente)} 
                      className="text-red-600 hover:text-red-800"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

