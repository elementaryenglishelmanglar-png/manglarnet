import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service_role key (admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin (coordinador or directivo)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin (coordinador or directivo)
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (usuarioError || !usuario) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado o inactivo' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['coordinador', 'directivo'].includes(usuario.role)) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para crear usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { userData } = await req.json()

    if (!userData || !userData.email || !userData.password || !userData.username || !userData.role) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos. Se requieren: email, password, username, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    if (!['docente', 'coordinador', 'directivo'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Rol inválido. Debe ser: docente, coordinador o directivo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Create user in Supabase Auth with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: userData.username,
        role: userData.role,
      }
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: `Error al crear usuario en autenticación: ${authError?.message || 'Unknown error'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Create user profile in usuarios table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        username: userData.username.toLowerCase().trim(),
        email: userData.email.toLowerCase().trim(),
        nombres: userData.nombres || userData.username,
        apellidos: userData.apellidos || '',
        telefono: userData.telefono || null,
        role: userData.role,
        is_active: true,
        email_verified: true,
        created_by: user.id,
      }])
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Error al crear perfil: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. If role is docente, create entry in docentes table
    if (userData.role === 'docente') {
      const { error: docenteError } = await supabaseAdmin
        .from('docentes')
        .insert({
          id_usuario: authData.user.id,
          nombres: userData.nombres || userData.username,
          apellidos: userData.apellidos || '',
          email: userData.email.toLowerCase().trim(),
          activo: true,
        })

      if (docenteError) {
        console.warn('Warning: Could not create docente entry:', docenteError)
        // Don't fail the entire operation
      }
    }

    // 4. Get user with permissions
    const { data: userWithPermissions, error: permError } = await supabaseAdmin
      .rpc('get_user_with_permissions', { p_user_id: authData.user.id })
      .single()

    if (permError || !userWithPermissions) {
      // Return basic profile if permissions fetch fails
      return new Response(
        JSON.stringify({ user: profileData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ user: userWithPermissions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

