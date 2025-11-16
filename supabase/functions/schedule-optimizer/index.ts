// Supabase Edge Function: Schedule Optimizer
// This function uses Google OR-Tools to generate optimal schedules

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleRequest {
  ano_escolar: string;
  semana: number;
  grado?: string; // Optional: generate for specific grade only
  configuracion_id?: string; // Optional: use specific configuration
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ano_escolar, semana, grado, configuracion_id }: ScheduleRequest = await req.json()

    if (!ano_escolar || !semana) {
      return new Response(
        JSON.stringify({ error: 'ano_escolar and semana are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create generation record
    const { data: generacion, error: genError } = await supabase
      .from('generaciones_horarios')
      .insert({
        ano_escolar,
        semana,
        estado: 'generando',
        configuracion: { ano_escolar, semana, grado, configuracion_id },
        creado_por: req.headers.get('x-user-id') || null
      })
      .select()
      .single()

    if (genError) {
      console.error('Error creating generation record:', genError)
      return new Response(
        JSON.stringify({ error: 'Failed to create generation record', details: genError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const startTime = Date.now()

    try {
      // Load all necessary data
      const [
        { data: docentes, error: docentesError },
        { data: clases, error: clasesError },
        { data: aulas, error: aulasError },
        { data: config, error: configError },
        { data: restriccionesDuras, error: restDurasError },
        { data: restriccionesSuaves, error: restSuavesError },
        { data: docenteMaterias, error: docenteMateriasError },
        { data: claseRequisitos, error: claseRequisitosError }
      ] = await Promise.all([
        supabase.from('docentes').select('*'),
        grado 
          ? supabase.from('clases').select('*').eq('grado_asignado', grado)
          : supabase.from('clases').select('*'),
        supabase.from('aulas').select('*').eq('activa', true),
        configuracion_id 
          ? supabase.from('configuracion_horarios').select('*').eq('id', configuracion_id).single()
          : supabase.from('configuracion_horarios').select('*').eq('ano_escolar', ano_escolar).eq('activa', true).single(),
        supabase.from('restricciones_duras').select('*').eq('ano_escolar', ano_escolar).eq('activa', true),
        supabase.from('restricciones_suaves').select('*').eq('ano_escolar', ano_escolar).eq('activa', true),
        supabase.from('docente_materias').select('*'),
        supabase.from('clase_requisitos').select('*')
      ])

      // Check for errors (allow empty results for some)
      if (docentesError) throw new Error(`Error loading docentes: ${docentesError.message}`)
      if (clasesError) throw new Error(`Error loading clases: ${clasesError.message}`)
      if (aulasError) throw new Error(`Error loading aulas: ${aulasError.message}`)
      if (configError) throw new Error(`Error loading config: ${configError.message}`)
      if (restDurasError) throw new Error(`Error loading restricciones_duras: ${restDurasError.message}`)
      if (restSuavesError) throw new Error(`Error loading restricciones_suaves: ${restSuavesError.message}`)
      if (docenteMateriasError) throw new Error(`Error loading docente_materias: ${docenteMateriasError.message}`)
      if (claseRequisitosError) throw new Error(`Error loading clase_requisitos: ${claseRequisitosError.message}`)
      
      // Validate we have minimum required data
      if (!docentes || docentes.length === 0) {
        throw new Error('No hay docentes registrados')
      }
      if (!aulas || aulas.length === 0) {
        throw new Error('No hay aulas registradas. Por favor, crea al menos una aula.')
      }

      if (!config) {
        throw new Error('No configuration found for the specified year')
      }

      // Import solver
      const { solveSchedule } = await import('./solver.ts')

      // Filter clases by grado if specified
      let clasesFiltradas = clases || []
      if (grado) {
        clasesFiltradas = clasesFiltradas.filter(c => c.grado_asignado === grado)
      }

      if (clasesFiltradas.length === 0) {
        throw new Error(`No hay clases para el grado ${grado || 'seleccionado'}`)
      }

      // Run solver
      const solucion = solveSchedule(
        docentes || [],
        clasesFiltradas,
        aulas || [],
        config.bloques_horarios || [],
        restriccionesDuras || [],
        restriccionesSuaves || [],
        docenteMaterias || [],
        claseRequisitos || [],
        grado
      )

      const tiempoEjecucion = Date.now() - startTime

      // Convert assignments to horarios format
      const horariosGenerados = solucion.asignaciones.map(asig => {
        const bloque = config.bloques_horarios[asig.bloque]
        return {
          id_clase: asig.id_clase,
          id_docente: asig.id_docente,
          id_aula: asig.id_aula,
          grado: asig.grado,
          semana: semana,
          dia_semana: asig.dia_semana,
          hora_inicio: bloque?.inicio || '08:00',
          hora_fin: bloque?.fin || '09:00'
        }
      })

      const resultado = {
        horarios: horariosGenerados,
        estadisticas: {
          factible: solucion.factible,
          violaciones_restricciones_suaves: solucion.violaciones_restricciones_suaves,
          tiempo_ejecucion_ms: tiempoEjecucion,
          total_asignaciones: solucion.estadisticas.total_asignaciones,
          docentes_asignados: solucion.estadisticas.docentes_asignados,
          aulas_utilizadas: solucion.estadisticas.aulas_utilizadas,
          conflictos: solucion.estadisticas.conflictos
        }
      }

      // Update generation record
      await supabase
        .from('generaciones_horarios')
        .update({
          estado: solucion.factible ? 'completado' : 'fallido',
          resultado: horariosGenerados,
          estadisticas: resultado.estadisticas,
          tiempo_ejecucion_ms: tiempoEjecucion,
          errores: solucion.estadisticas.conflictos.length > 0 ? solucion.estadisticas.conflictos : null,
          advertencias: solucion.factible ? null : ['Algunas clases no pudieron ser asignadas']
        })
        .eq('id', generacion.id)

      return new Response(
        JSON.stringify({
          success: true,
          generacion_id: generacion.id,
          resultado,
          mensaje: solucion.factible 
            ? 'Horarios generados exitosamente' 
            : 'Horarios generados con advertencias. Revisa los conflictos.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (error: any) {
      const tiempoEjecucion = Date.now() - startTime
      
      // Update generation record with error
      await supabase
        .from('generaciones_horarios')
        .update({
          estado: 'fallido',
          errores: [error.message || 'Unknown error'],
          tiempo_ejecucion_ms: tiempoEjecucion
        })
        .eq('id', generacion.id)

      console.error('Error in schedule generation:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Schedule generation failed', 
          details: error.message,
          generacion_id: generacion.id
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error: any) {
    console.error('Error in schedule optimizer function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

