// Supabase Edge Function for Gemini API calls
// This keeps the API key secure on the server side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai@^1.29.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    if (type === 'plan-suggestions') {
      const prompt = `
        Actúa como un coordinador académico experto con más de 20 años de experiencia en pedagogía y diseño curricular.
        Tu tarea es analizar la siguiente planificación de clase y ofrecer sugerencias constructivas para mejorarla.
        Sé específico, práctico y positivo en tus comentarios. Estructura tu feedback en tres secciones: Fortalezas, Áreas de Mejora y Sugerencias Concretas.
        Utiliza formato Markdown para la respuesta (títulos con ##, listas con -).

        Aquí está la planificación a revisar:
        - **Competencia / Indicadores:** ${data.competencia_indicadores}
        - **Actividades de Inicio:** ${data.inicio}
        - **Actividades de Desarrollo:** ${data.desarrollo}
        - **Actividades de Cierre:** ${data.cierre}
        - **Recursos y Enlaces:** ${data.recursos_links || 'No especificados'}

        Proporciona tu análisis experto.
      `

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
      })

      return new Response(
        JSON.stringify({ result: response.text }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (type === 'evaluation-analysis') {
      const prompt = `
        Actúa como un pedagogo experto en ciencia de datos con 25 años de experiencia. Tu tarea es analizar los datos de evaluación de un grupo de alumnos para identificar patrones y proponer acciones concretas, claras y realistas.
        A continuación se presenta una lista de alumnos con sus notas, tipo de adaptación curricular y las observaciones cualitativas del docente.

        Datos de los Alumnos:
        ${data.map((e: any) => `- Alumno: ${e.nombre_alumno}, Nota: ${e.nota}, Adaptación: ${e.adaptacion}, Observaciones: "${e.observaciones}"`).join('\n')}

        Basado en estos datos, realiza el siguiente análisis profundo:
        1.  **Identifica Dificultades Clave:** Agrupa las observaciones en 2 a 4 patrones o dificultades comunes (tanto académicas como conductuales). Sé específico. Por ejemplo: "Dificultad con la resolución de problemas de dos pasos", "Falta de atención y seguimiento de instrucciones", "Problemas de interacción social durante trabajos en grupo".
        2.  **Categoriza cada Dificultad:** Clasifícala como "Académico" o "Conductual".
        3.  **Calcula la Frecuencia:** Cuenta con precisión cuántos alumnos presentan cada dificultad.
        4.  **Lista los Estudiantes Involucrados:** Para cada dificultad, enumera los nombres de los alumnos que la presentan.
        5.  **Sugiere Acciones Pedagógicas de Alto Impacto:** Para cada dificultad, propón 2-3 acciones pedagógicas claras y realistas que el docente pueda implementar. Las acciones deben ser específicas y orientadas a la solución.

        Formatea tu respuesta EXCLUSIVAMENTE como un objeto JSON con la siguiente estructura: un array de objetos, donde cada objeto representa una dificultad detectada. No incluyas texto, explicaciones, ni \`\`\`json markdown antes o después del JSON.

        La estructura JSON debe ser la siguiente:
        [
          {
            "dificultad": "string",
            "categoria": "string",
            "frecuencia": "number",
            "estudiantes": "string",
            "accionesSugeridas": "string"
          }
        ]
      `

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      })

      return new Response(
        JSON.stringify({ result: response.text }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in gemini-api function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

