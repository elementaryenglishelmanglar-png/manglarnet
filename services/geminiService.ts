
// A subset of the Planificacion type from App.tsx, containing only what's needed for the prompt.
interface PlanificacionData {
  competencia_indicadores: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  recursos_links?: string;
}

// Get Supabase URL from environment or use default
const getSupabaseUrl = (): string => {
  // In production, this should be set as an environment variable
  // For local development, you can use: http://localhost:54321
  return import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
};

// Get Supabase anon key from environment
const getSupabaseAnonKey = (): string => {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

/**
 * Generates AI-powered suggestions for a lesson plan using the Gemini API via Supabase Edge Function.
 * @param plan - The lesson plan data.
 * @returns A string containing formatted suggestions, or an error message.
 */
export async function getAIPlanSuggestions(plan: PlanificacionData): Promise<string> {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    
    const response = await fetch(`${supabaseUrl}/functions/v1/gemini-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        type: 'plan-suggestions',
        data: plan,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.result || "Lo sentimos, ha ocurrido un error al contactar al asistente de IA. Por favor, verifica tu conexión o inténtalo de nuevo más tarde.";
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    return "Lo sentimos, ha ocurrido un error al contactar al asistente de IA. Por favor, verifica tu conexión o inténtalo de nuevo más tarde.";
  }
}

// --- NEW ---
// Types for the evaluation analysis feature
interface EvaluacionAlumnoData {
  nombre_alumno: string;
  nota: string;
  adaptacion: string;
  observaciones: string;
}

/**
 * Analyzes a list of student evaluations to identify patterns and suggest actions.
 * @param evaluaciones - An array of student evaluation data.
 * @returns A JSON string with the analysis.
 */
export async function getAIEvaluationAnalysis(evaluaciones: EvaluacionAlumnoData[]): Promise<string> {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    
    const response = await fetch(`${supabaseUrl}/functions/v1/gemini-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        type: 'evaluation-analysis',
        data: evaluaciones,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.result || JSON.stringify([{ 
        dificultad: "Error de Conexión", 
        categoria: "Sistema", 
        frecuencia: 0, 
        estudiantes: "N/A", 
        accionesSugeridas: "No se pudo conectar con el asistente de IA. Por favor, verifique la conexión a internet y vuelva a intentarlo."
    }]);
  } catch (error) {
    console.error("Error fetching AI evaluation analysis:", error);
    // Return a JSON string with an error object to be handled by the frontend
    return JSON.stringify([{ 
        dificultad: "Error de Conexión", 
        categoria: "Sistema", 
        frecuencia: 0, 
        estudiantes: "N/A", 
        accionesSugeridas: "No se pudo conectar con el asistente de IA. Por favor, verifique la conexión a internet y vuelva a intentarlo."
    }]);
  }
}
