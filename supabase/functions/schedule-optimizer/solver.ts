// Schedule Solver - Basic implementation using backtracking
// This is a simplified solver that validates hard constraints and optimizes soft constraints

interface Docente {
  id_docente: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
}

interface Clase {
  id_clase: string;
  nombre_materia: string;
  grado_asignado: string;
  id_docente_asignado: string | null;
}

interface Aula {
  id_aula: string;
  nombre: string;
  tipo_aula: string;
  capacidad: number;
}

interface BloqueHorario {
  inicio: string;
  fin: string;
  nombre: string;
}

interface RestriccionDura {
  tipo: string;
  id_docente?: string;
  id_clase?: string;
  id_aula?: string;
  grado?: string;
  dia_semana?: number;
  hora_inicio?: string;
  hora_fin?: string;
  valor?: number;
}

interface RestriccionSuave {
  tipo: string;
  id_docente?: string;
  nombre_materia?: string;
  dia_semana?: number;
  hora_inicio?: string;
  preferencia?: string;
  peso: number;
}

interface DocenteMateria {
  id_docente: string;
  nombre_materia: string;
  nivel_prioridad: number;
}

interface ClaseRequisito {
  id_clase: string;
  tipo_aula_requerida?: string;
  id_aula_especifica?: string;
}

interface Asignacion {
  id_clase: string;
  id_docente: string;
  id_aula: string;
  dia_semana: number; // 1-5
  bloque: number; // índice del bloque
  grado: string;
}

interface Solucion {
  asignaciones: Asignacion[];
  factible: boolean;
  violaciones_restricciones_suaves: number;
  estadisticas: {
    total_asignaciones: number;
    docentes_asignados: number;
    aulas_utilizadas: number;
    conflictos: string[];
  };
}

export function solveSchedule(
  docentes: Docente[],
  clases: Clase[],
  aulas: Aula[],
  bloquesHorarios: BloqueHorario[],
  restriccionesDuras: RestriccionDura[],
  restriccionesSuaves: RestriccionSuave[],
  docenteMaterias: DocenteMateria[],
  claseRequisitos: ClaseRequisito[],
  grado?: string
): Solucion {
  const asignaciones: Asignacion[] = []
  const conflictos: string[] = []
  let violacionesSuaves = 0

  // Helper: Check if docente can teach this class
  const docentePuedeDarClase = (idDocente: string, nombreMateria: string): boolean => {
    return docenteMaterias.some(
      dm => dm.id_docente === idDocente && dm.nombre_materia === nombreMateria
    )
  }

  // Helper: Get available aulas for a class
  const getAulasDisponibles = (idClase: string): Aula[] => {
    const requisito = claseRequisitos.find(cr => cr.id_clase === idClase)
    
    if (requisito?.id_aula_especifica) {
      const aula = aulas.find(a => a.id_aula === requisito.id_aula_especifica)
      return aula ? [aula] : []
    }
    
    if (requisito?.tipo_aula_requerida) {
      return aulas.filter(a => a.tipo_aula === requisito.tipo_aula_requerida)
    }
    
    return aulas
  }

  // Helper: Check hard constraint violations
  const verificarRestriccionDura = (
    asignacion: Asignacion,
    asignacionesExistentes: Asignacion[]
  ): { valida: boolean; razon?: string } => {
    // 1. Docente no puede estar en dos lugares a la vez
    const conflictoDocente = asignacionesExistentes.find(
      a => a.id_docente === asignacion.id_docente &&
           a.dia_semana === asignacion.dia_semana &&
           a.bloque === asignacion.bloque
    )
    if (conflictoDocente) {
      return { valida: false, razon: `Docente ya asignado en ${asignacion.dia_semana}-${asignacion.bloque}` }
    }

    // 2. Aula no puede usarse para dos clases a la vez
    const conflictoAula = asignacionesExistentes.find(
      a => a.id_aula === asignacion.id_aula &&
           a.dia_semana === asignacion.dia_semana &&
           a.bloque === asignacion.bloque
    )
    if (conflictoAula) {
      return { valida: false, razon: `Aula ya ocupada en ${asignacion.dia_semana}-${asignacion.bloque}` }
    }

    // 3. Grado no puede tener dos clases a la vez
    const conflictoGrado = asignacionesExistentes.find(
      a => a.grado === asignacion.grado &&
           a.dia_semana === asignacion.dia_semana &&
           a.bloque === asignacion.bloque
    )
    if (conflictoGrado) {
      return { valida: false, razon: `Grado ya tiene clase en ${asignacion.dia_semana}-${asignacion.bloque}` }
    }

    // 4. Verificar restricciones duras específicas
    for (const restriccion of restriccionesDuras) {
      if (restriccion.tipo === 'docente_no_disponible') {
        if (restriccion.id_docente === asignacion.id_docente &&
            restriccion.dia_semana === asignacion.dia_semana &&
            restriccion.hora_inicio && restriccion.hora_fin) {
          const bloque = bloquesHorarios[asignacion.bloque]
          if (bloque && bloque.inicio >= restriccion.hora_inicio && bloque.fin <= restriccion.hora_fin) {
            return { valida: false, razon: 'Docente no disponible en este horario' }
          }
        }
      }

      if (restriccion.tipo === 'aula_no_disponible') {
        if (restriccion.id_aula === asignacion.id_aula &&
            restriccion.dia_semana === asignacion.dia_semana &&
            restriccion.hora_inicio && restriccion.hora_fin) {
          const bloque = bloquesHorarios[asignacion.bloque]
          if (bloque && bloque.inicio >= restriccion.hora_inicio && bloque.fin <= restriccion.hora_fin) {
            return { valida: false, razon: 'Aula no disponible en este horario' }
          }
        }
      }

      if (restriccion.tipo === 'grado_no_disponible') {
        if (restriccion.grado === asignacion.grado &&
            restriccion.dia_semana === asignacion.dia_semana &&
            restriccion.hora_inicio && restriccion.hora_fin) {
          const bloque = bloquesHorarios[asignacion.bloque]
          if (bloque && bloque.inicio >= restriccion.hora_inicio && bloque.fin <= restriccion.hora_fin) {
            return { valida: false, razon: 'Grado no disponible en este horario' }
          }
        }
      }
    }

    return { valida: true }
  }

  // Helper: Calculate soft constraint violations
  const calcularViolacionesSuaves = (asignacion: Asignacion): number => {
    let violaciones = 0

    for (const restriccion of restriccionesSuaves) {
      if (restriccion.tipo === 'docente_preferencia_horario') {
        if (restriccion.id_docente === asignacion.id_docente &&
            restriccion.hora_inicio && restriccion.hora_fin) {
          const bloque = bloquesHorarios[asignacion.bloque]
          if (bloque && bloque.inicio >= restriccion.hora_inicio && bloque.fin <= restriccion.hora_fin) {
            if (restriccion.preferencia === 'evita') {
              violaciones += restriccion.peso
            }
          }
        }
      }

      if (restriccion.tipo === 'docente_preferencia_dia') {
        if (restriccion.id_docente === asignacion.id_docente &&
            restriccion.dia_semana === asignacion.dia_semana) {
          if (restriccion.preferencia === 'evita') {
            violaciones += restriccion.peso
          }
        }
      }
    }

    return violaciones
  }

  // Main algorithm: Try to assign each class
  for (const clase of clases) {
    if (grado && clase.grado_asignado !== grado) {
      continue
    }

    // Find docente for this class
    let docenteAsignado: Docente | null = null

    // First, try the assigned docente
    if (clase.id_docente_asignado) {
      const docente = docentes.find(d => d.id_docente === clase.id_docente_asignado)
      if (docente && docentePuedeDarClase(docente.id_docente, clase.nombre_materia)) {
        docenteAsignado = docente
      }
    }

    // If no assigned docente, find any docente who can teach this class
    if (!docenteAsignado) {
      const docentesCapaces = docenteMaterias
        .filter(dm => dm.nombre_materia === clase.nombre_materia)
        .sort((a, b) => b.nivel_prioridad - a.nivel_prioridad)
        .map(dm => docentes.find(d => d.id_docente === dm.id_docente))
        .filter(d => d !== undefined) as Docente[]

      if (docentesCapaces.length > 0) {
        docenteAsignado = docentesCapaces[0]
      }
    }

    if (!docenteAsignado) {
      conflictos.push(`Clase ${clase.nombre_materia} (${clase.grado_asignado}): No hay docente disponible`)
      continue
    }

    // Get available aulas
    const aulasDisponibles = getAulasDisponibles(clase.id_clase)
    if (aulasDisponibles.length === 0) {
      conflictos.push(`Clase ${clase.nombre_materia} (${clase.grado_asignado}): No hay aula disponible`)
      continue
    }

    // Try to assign the class - use best-fit algorithm considering soft constraints
    let mejorAsignacion: Asignacion | null = null
    let menorViolacion = Infinity
    let asignada = false
    const diasSemana = [1, 2, 3, 4, 5] // Lunes a Viernes

    // Try each day and block to find best assignment
    for (const dia of diasSemana) {
      if (asignada) break
      
      for (let bloque = 0; bloque < bloquesHorarios.length; bloque++) {
        if (asignada) break
        
        // Skip break times (recreo, almuerzo)
        const bloqueInfo = bloquesHorarios[bloque]
        if (bloqueInfo.nombre.toLowerCase().includes('recreo') ||
            bloqueInfo.nombre.toLowerCase().includes('almuerzo')) {
          continue
        }

        // Try each available aula
        for (const aula of aulasDisponibles) {
          const asignacion: Asignacion = {
            id_clase: clase.id_clase,
            id_docente: docenteAsignado.id_docente,
            id_aula: aula.id_aula,
            dia_semana: dia,
            bloque: bloque,
            grado: clase.grado_asignado
          }

          // Check hard constraints
          const validacion = verificarRestriccionDura(asignacion, asignaciones)
          if (validacion.valida) {
            // Calculate soft constraint violations for this assignment
            const violaciones = calcularViolacionesSuaves(asignacion)
            
            // If no violations, assign immediately
            if (violaciones === 0) {
              asignaciones.push(asignacion)
              violacionesSuaves += violaciones
              asignada = true
              mejorAsignacion = null // Clear best option
              break
            }
            
            // Otherwise, keep track of best option
            if (violaciones < menorViolacion) {
              menorViolacion = violaciones
              mejorAsignacion = asignacion
            }
          }
        }
      }
    }

    // If no perfect assignment found, use best option
    if (!asignada && mejorAsignacion) {
      asignaciones.push(mejorAsignacion)
      violacionesSuaves += menorViolacion
      asignada = true
    }

    if (!asignada) {
      conflictos.push(`Clase ${clase.nombre_materia} (${clase.grado_asignado}): No se pudo asignar horario`)
    }
  }

  // Calculate statistics
  const docentesAsignados = new Set(asignaciones.map(a => a.id_docente)).size
  const aulasUtilizadas = new Set(asignaciones.map(a => a.id_aula)).size

  return {
    asignaciones,
    factible: conflictos.length === 0 && asignaciones.length === clases.length,
    violaciones_restricciones_suaves: violacionesSuaves,
    estadisticas: {
      total_asignaciones: asignaciones.length,
      docentes_asignados: docentesAsignados,
      aulas_utilizadas: aulasUtilizadas,
      conflictos
    }
  }
}

