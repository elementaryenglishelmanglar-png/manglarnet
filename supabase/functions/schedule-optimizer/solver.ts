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
  nivel_ingles?: string | null; // 'Basic', 'Lower', 'Upper', null
  skill_rutina?: string | null; // 'Reading', 'Writing', 'Speaking', 'Listening', 'Use of English', 'Phonics', 'Project', null
  es_ingles_primaria?: boolean;
  es_proyecto?: boolean;
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

interface Alumno {
  id_alumno: string;
  salon: string;
  nivel_ingles?: string | null;
}

interface ConfigInglesPrimaria {
  id: string;
  ano_escolar: string;
  grado: string;
  niveles_disponibles: string[];
  skills_por_semana: Array<{ dia: number; skill: string; bloques: number }>;
  duracion_bloque_minutos: number;
  activa: boolean;
}

interface AsignacionDocenteNivel {
  id_docente: string;
  nivel_ingles: string;
  ano_escolar: string;
  activa: boolean;
}

interface AsignacionAulaNivel {
  id_aula: string;
  nivel_ingles: string;
  ano_escolar: string;
  prioridad: number;
  activa: boolean;
}

interface Asignacion {
  id_clase: string;
  id_docente: string;
  id_aula: string;
  dia_semana: number; // 1-5
  bloque: number; // índice del bloque
  grado: string;
  nivel_ingles?: string | null; // Para clases de inglés
  skill_rutina?: string | null; // Para clases de inglés
  es_ingles?: boolean; // Indica si es clase de inglés
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
  grado?: string,
  alumnos?: Alumno[],
  configInglesPrimaria?: ConfigInglesPrimaria[],
  asignacionesDocenteNivel?: AsignacionDocenteNivel[],
  asignacionesAulaNivel?: AsignacionAulaNivel[]
): Solucion {
  const asignaciones: Asignacion[] = []
  const conflictos: string[] = []
  let violacionesSuaves = 0

  // Helper: Check if a class is English Primaria
  const esInglesPrimaria = (clase: Clase): boolean => {
    return clase.es_ingles_primaria === true || 
           (clase.nombre_materia?.toLowerCase().includes('inglés') || 
            clase.nombre_materia?.toLowerCase().includes('ingles'))
  }

  // Helper: Get docente for English level
  const getDocentePorNivel = (nivelIngles: string): Docente | null => {
    if (!asignacionesDocenteNivel) return null
    const asignacion = asignacionesDocenteNivel.find(
      ad => ad.nivel_ingles === nivelIngles && ad.activa
    )
    if (!asignacion) return null
    return docentes.find(d => d.id_docente === asignacion.id_docente) || null
  }

  // Helper: Get aulas for English level
  const getAulasPorNivel = (nivelIngles: string): Aula[] => {
    if (!asignacionesAulaNivel) return aulas
    const asignacionesFiltradas = asignacionesAulaNivel
      .filter(aa => aa.nivel_ingles === nivelIngles && aa.activa)
      .sort((a, b) => a.prioridad - b.prioridad)
    if (asignacionesFiltradas.length === 0) return aulas
    
    const aulasNivel = asignacionesFiltradas
      .map(aa => aulas.find(a => a.id_aula === aa.id_aula))
      .filter(a => a !== undefined) as Aula[]
    
    return aulasNivel.length > 0 ? aulasNivel : aulas
  }

  // Helper: Get alumnos by grado and nivel_ingles
  const getAlumnosPorGradoYNivel = (grado: string, nivelIngles: string | null): Alumno[] => {
    if (!alumnos) return []
    if (nivelIngles === null) {
      // For Project, return all alumnos of the grade
      return alumnos.filter(a => a.salon === grado)
    }
    return alumnos.filter(a => a.salon === grado && a.nivel_ingles === nivelIngles)
  }

  // Helper: Check if bloque is valid for English (45 minutes)
  const esBloqueValidoParaIngles = (bloque: BloqueHorario, bloqueIndex: number, bloquesHorarios: BloqueHorario[]): boolean => {
    // Skip break times
    if (bloque.nombre.toLowerCase().includes('recreo') ||
        bloque.nombre.toLowerCase().includes('almuerzo')) {
      return false
    }
    
    // For English, we need blocks that can be 45 minutes
    // We can use regular 1-hour blocks and mark them as 45 minutes
    // Or find blocks that are already 45 minutes
    const duracionMinutos = calcularDuracionMinutos(bloque.inicio, bloque.fin)
    
    // Accept blocks of 45 or 60 minutes (we'll adjust later)
    return duracionMinutos >= 45
  }

  // Helper: Calculate duration in minutes
  const calcularDuracionMinutos = (inicio: string, fin: string): number => {
    const [hInicio, mInicio] = inicio.split(':').map(Number)
    const [hFin, mFin] = fin.split(':').map(Number)
    return (hFin * 60 + mFin) - (hInicio * 60 + mInicio)
  }

  // Helper: Convert time to minutes since midnight
  const tiempoAMinutos = (tiempo: string): number => {
    const [h, m] = tiempo.split(':').map(Number)
    return h * 60 + m
  }

  // Helper: Add minutes to time string
  const agregarMinutos = (tiempo: string, minutos: number): string => {
    const totalMinutos = tiempoAMinutos(tiempo) + minutos
    const h = Math.floor(totalMinutos / 60)
    const m = totalMinutos % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

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

    // 3. Grado no puede tener dos clases a la vez (pero para inglés, los niveles pueden tener clases paralelas)
    // Si es clase de inglés por nivel, solo verificar conflicto con mismo nivel
    // Si NO es inglés, verificar conflicto con cualquier clase del grado
    if (asignacion.es_ingles && asignacion.nivel_ingles) {
      // Para inglés, verificar conflicto solo con el mismo nivel
      const conflictoNivel = asignacionesExistentes.find(
        a => a.es_ingles &&
             a.grado === asignacion.grado &&
             a.nivel_ingles === asignacion.nivel_ingles &&
             a.dia_semana === asignacion.dia_semana &&
             a.bloque === asignacion.bloque
      )
      if (conflictoNivel) {
        return { valida: false, razon: `Nivel ${asignacion.nivel_ingles} ya tiene clase en ${asignacion.dia_semana}-${asignacion.bloque}` }
      }
      
      // También verificar que no haya conflicto con clases normales del grado (que no sean inglés)
      const conflictoGradoNormal = asignacionesExistentes.find(
        a => !a.es_ingles &&
             a.grado === asignacion.grado &&
             a.dia_semana === asignacion.dia_semana &&
             a.bloque === asignacion.bloque
      )
      if (conflictoGradoNormal) {
        return { valida: false, razon: `Grado ya tiene clase normal en ${asignacion.dia_semana}-${asignacion.bloque}` }
      }
    } else {
      // Para clases normales, verificar conflicto con cualquier clase del grado
      const conflictoGrado = asignacionesExistentes.find(
        a => a.grado === asignacion.grado &&
             a.dia_semana === asignacion.dia_semana &&
             a.bloque === asignacion.bloque
      )
      if (conflictoGrado) {
        return { valida: false, razon: `Grado ya tiene clase en ${asignacion.dia_semana}-${asignacion.bloque}` }
      }
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

  // Separate English classes from regular classes
  const clasesIngles = clases.filter(c => esInglesPrimaria(c))
  const clasesNormales = clases.filter(c => !esInglesPrimaria(c))

  // Helper: Assign English class
  const asignarClaseIngles = (clase: Clase): boolean => {
    // For English, docente is determined by nivel_ingles
    if (!clase.nivel_ingles) {
      conflictos.push(`Clase de inglés ${clase.nombre_materia} (${clase.grado_asignado}): No tiene nivel_ingles asignado`)
      return false
    }

    // Get docente for this level
    let docenteAsignado = getDocentePorNivel(clase.nivel_ingles)
    
    // If no docente assigned by level, try the assigned docente
    if (!docenteAsignado && clase.id_docente_asignado) {
      const docente = docentes.find(d => d.id_docente === clase.id_docente_asignado)
      if (docente) {
        docenteAsignado = docente
      }
    }

    if (!docenteAsignado) {
      conflictos.push(`Clase de inglés ${clase.nombre_materia} (${clase.grado_asignado}, nivel ${clase.nivel_ingles}): No hay docente disponible para este nivel`)
      return false
    }

    // Get available aulas for this level
    let aulasDisponibles = getAulasPorNivel(clase.nivel_ingles)
    
    // Also check clase_requisitos
    const aulasRequisito = getAulasDisponibles(clase.id_clase)
    if (aulasRequisito.length > 0) {
      aulasDisponibles = aulasDisponibles.filter(a => aulasRequisito.some(ar => ar.id_aula === a.id_aula))
    }

    if (aulasDisponibles.length === 0) {
      conflictos.push(`Clase de inglés ${clase.nombre_materia} (${clase.grado_asignado}, nivel ${clase.nivel_ingles}): No hay aula disponible para este nivel`)
      return false
    }

    // Get configuration for this grade
    const configGrado = configInglesPrimaria?.find(
      c => c.grado === clase.grado_asignado && c.activa
    )

    // For Project, we need 2 consecutive blocks on the same day
    if (clase.es_proyecto || clase.skill_rutina === 'Project') {
      return asignarProyecto(clase, docenteAsignado, aulasDisponibles, bloquesHorarios, configGrado)
    }

    // For regular skills, assign based on configuration or default
    const skillsPorSemana = configGrado?.skills_por_semana || []
    
    // Try to assign based on configuration
    let mejorAsignacion: Asignacion | null = null
    let menorViolacion = Infinity
    let asignada = false

    for (const skillConfig of skillsPorSemana) {
      if (skillConfig.skill === clase.skill_rutina && asignada === false) {
        const dia = skillConfig.dia
        const bloquesNecesarios = skillConfig.bloques || 1

        for (let bloqueIdx = 0; bloqueIdx < bloquesHorarios.length; bloqueIdx++) {
          const bloque = bloquesHorarios[bloqueIdx]
          
          if (!esBloqueValidoParaIngles(bloque, bloqueIdx, bloquesHorarios)) {
            continue
          }

          for (const aula of aulasDisponibles) {
            const asignacion: Asignacion = {
              id_clase: clase.id_clase,
              id_docente: docenteAsignado.id_docente,
              id_aula: aula.id_aula,
              dia_semana: dia,
              bloque: bloqueIdx,
              grado: clase.grado_asignado,
              nivel_ingles: clase.nivel_ingles,
              skill_rutina: clase.skill_rutina || null,
              es_ingles: true
            }

            const validacion = verificarRestriccionDura(asignacion, asignaciones)
            if (validacion.valida) {
              const violaciones = calcularViolacionesSuaves(asignacion)
              
              if (violaciones === 0) {
                asignaciones.push(asignacion)
                violacionesSuaves += violaciones
                asignada = true
                break
              }
              
              if (violaciones < menorViolacion) {
                menorViolacion = violaciones
                mejorAsignacion = asignacion
              }
            }
          }
          if (asignada) break
        }
      }
    }

    // If not assigned from config, try any day
    if (!asignada) {
      const diasSemana = [1, 2, 3, 4, 5]
      for (const dia of diasSemana) {
        if (asignada) break
        
        for (let bloqueIdx = 0; bloqueIdx < bloquesHorarios.length; bloqueIdx++) {
          const bloque = bloquesHorarios[bloqueIdx]
          
          if (!esBloqueValidoParaIngles(bloque, bloqueIdx, bloquesHorarios)) {
            continue
          }

          for (const aula of aulasDisponibles) {
            const asignacion: Asignacion = {
              id_clase: clase.id_clase,
              id_docente: docenteAsignado.id_docente,
              id_aula: aula.id_aula,
              dia_semana: dia,
              bloque: bloqueIdx,
              grado: clase.grado_asignado,
              nivel_ingles: clase.nivel_ingles,
              skill_rutina: clase.skill_rutina || null,
              es_ingles: true
            }

            const validacion = verificarRestriccionDura(asignacion, asignaciones)
            if (validacion.valida) {
              const violaciones = calcularViolacionesSuaves(asignacion)
              
              if (violaciones === 0) {
                asignaciones.push(asignacion)
                violacionesSuaves += violaciones
                asignada = true
                break
              }
              
              if (violaciones < menorViolacion) {
                menorViolacion = violaciones
                mejorAsignacion = asignacion
              }
            }
          }
          if (asignada) break
        }
      }
    }

    // Use best option if found
    if (!asignada && mejorAsignacion) {
      asignaciones.push(mejorAsignacion)
      violacionesSuaves += menorViolacion
      asignada = true
    }

    if (!asignada) {
      conflictos.push(`Clase de inglés ${clase.nombre_materia} (${clase.grado_asignado}, nivel ${clase.nivel_ingles}): No se pudo asignar horario`)
    }

    return asignada
  }

  // Helper: Assign Project (2 consecutive blocks on same day, for 5to and 6to)
  const asignarProyecto = (
    clase: Clase,
    docente: Docente,
    aulas: Aula[],
    bloquesHorarios: BloqueHorario[],
    configGrado: ConfigInglesPrimaria | undefined
  ): boolean => {
    // Project needs 2 consecutive blocks
    const diasSemana = [1, 2, 3, 4, 5]
    
    for (const dia of diasSemana) {
      // Try to find 2 consecutive valid blocks
      for (let bloqueIdx = 0; bloqueIdx < bloquesHorarios.length - 1; bloqueIdx++) {
        const bloque1 = bloquesHorarios[bloqueIdx]
        const bloque2 = bloquesHorarios[bloqueIdx + 1]
        
        if (!esBloqueValidoParaIngles(bloque1, bloqueIdx, bloquesHorarios) ||
            !esBloqueValidoParaIngles(bloque2, bloqueIdx + 1, bloquesHorarios)) {
          continue
        }

        for (const aula of aulas) {
          // Check if both blocks are available
          const asignacion1: Asignacion = {
            id_clase: clase.id_clase,
            id_docente: docente.id_docente,
            id_aula: aula.id_aula,
            dia_semana: dia,
            bloque: bloqueIdx,
            grado: clase.grado_asignado,
            nivel_ingles: null, // Project doesn't have nivel
            skill_rutina: 'Project',
            es_ingles: true
          }

          const asignacion2: Asignacion = {
            id_clase: clase.id_clase,
            id_docente: docente.id_docente,
            id_aula: aula.id_aula,
            dia_semana: dia,
            bloque: bloqueIdx + 1,
            grado: clase.grado_asignado,
            nivel_ingles: null,
            skill_rutina: 'Project',
            es_ingles: true
          }

          const validacion1 = verificarRestriccionDura(asignacion1, asignaciones)
          const validacion2 = verificarRestriccionDura(asignacion2, [...asignaciones, asignacion1])

          if (validacion1.valida && validacion2.valida) {
            asignaciones.push(asignacion1)
            asignaciones.push(asignacion2)
            return true
          }
        }
      }
    }

    conflictos.push(`Project ${clase.nombre_materia} (${clase.grado_asignado}): No se pudieron asignar 2 bloques consecutivos`)
    return false
  }

  // Main algorithm: Try to assign each class
  // First assign English classes
  for (const clase of clasesIngles) {
    if (grado && clase.grado_asignado !== grado) {
      continue
    }
    asignarClaseIngles(clase)
  }

  // Then assign regular classes
  for (const clase of clasesNormales) {
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
            grado: clase.grado_asignado,
            es_ingles: false
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

