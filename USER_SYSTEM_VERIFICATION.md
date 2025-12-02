# Verificación del Sistema de Usuarios

## ✅ Correcciones Realizadas

### 1. **Componente AuthorizedUsersView**
- ✅ Ahora usa `authService.createUser()` en lugar de `signUp()` directo
- ✅ Eliminado el rol "administrativo" (no existe en la base de datos)
- ✅ Solo permite roles: `docente`, `coordinador`, `directivo`
- ✅ Mejor manejo de errores y rollback

### 2. **Servicio de Autenticación (authService.ts)**
- ✅ `createUser()` actualizado para usar `signUp()` desde el cliente
- ✅ Manejo mejorado de errores
- ✅ Validación de usuarios duplicados
- ✅ Creación automática de entrada en `docentes` si el rol es `docente`

### 3. **Tipos y Definiciones**
- ✅ Eliminado rol "administrativo" de todos los tipos
- ✅ Tipos alineados con la base de datos (migración 030)

### 4. **Políticas RLS**
- ✅ Migración 030: Crea políticas basadas en permisos granulares
- ✅ Migración 040: Crea políticas simplificadas (sobrescribe las de 030)
- ✅ Coordinadores y Directivos pueden gestionar usuarios
- ✅ Usuarios pueden ver y actualizar su propio perfil

## ⚠️ Configuración Requerida en Supabase

### IMPORTANTE: Deshabilitar Confirmación de Email

Para que la creación de usuarios funcione correctamente desde el cliente:

1. Ve a **Supabase Dashboard** > **Authentication** > **Settings**
2. En **Auth Providers** > **Email**
3. **Desactiva** la opción "Confirm email"
4. Guarda los cambios

**Razón**: `signUp()` desde el cliente requiere confirmación de email por defecto, lo cual no es ideal para administradores creando usuarios.

### Alternativa: Edge Function (Recomendado para Producción)

Para producción, considera crear una Edge Function que use el `service_role` key:

```typescript
// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userData } = await req.json()
  
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Create user with admin privileges
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
  })
  
  // ... rest of logic
})
```

## 📋 Verificación de Funcionalidad

### Usuario Actual: "frikiander"

Para verificar que el sistema funciona:

1. **Login**: El usuario "frikiander" debe poder iniciar sesión
2. **Gestión de Usuarios**: Si "frikiander" es coordinador o directivo, debe poder:
   - Ver lista de usuarios
   - Crear nuevos usuarios
   - Editar usuarios existentes
   - Eliminar usuarios
3. **Permisos**: Los permisos deben cargarse correctamente según el rol

### Crear Nuevo Usuario

1. Ir a **Gestión de Usuarios** en el menú
2. Click en **Agregar Usuario**
3. Completar formulario:
   - Usuario (username)
   - Correo (opcional, se usará username@manglarnet.local si no se proporciona)
   - Contraseña (mínimo 6 caracteres)
   - Rol (docente, coordinador, o directivo)
4. Click en **Agregar Usuario**

### Verificación de Base de Datos

Ejecutar en Supabase SQL Editor:

```sql
-- Ver todos los usuarios
SELECT 
  u.username,
  u.email,
  u.role,
  u.is_active,
  u.created_at,
  rp.permissions
FROM usuarios u
LEFT JOIN role_permissions rp ON rp.role = u.role
ORDER BY u.created_at DESC;

-- Verificar que "frikiander" existe
SELECT * FROM usuarios WHERE username = 'frikiander';

-- Verificar permisos del usuario actual
SELECT * FROM get_user_with_permissions(auth.uid());
```

## 🔒 Políticas de Seguridad

### Tabla `usuarios`

- ✅ **SELECT**: Usuarios pueden ver su propio perfil, coordinadores/directivos pueden ver todos
- ✅ **INSERT**: Solo coordinadores y directivos pueden crear usuarios
- ✅ **UPDATE**: Usuarios pueden actualizar su perfil (excepto rol), coordinadores/directivos pueden actualizar todos
- ✅ **DELETE**: Solo coordinadores y directivos pueden eliminar usuarios

### Otras Tablas

- ✅ Todas las tablas tienen políticas RLS basadas en permisos o roles
- ✅ Migración 040 simplifica las políticas para mejor rendimiento

## 🐛 Problemas Conocidos y Soluciones

### Problema: "Error al crear usuario en autenticación"

**Solución**: 
- Verificar que la confirmación de email esté deshabilitada en Supabase
- Verificar que el email no esté ya registrado
- Verificar permisos RLS en la tabla usuarios

### Problema: "Usuario creado pero no aparece en la lista"

**Solución**:
- Verificar que el usuario se creó en `auth.users`
- Verificar que se creó en la tabla `usuarios`
- Verificar políticas RLS que permitan al usuario actual ver el nuevo usuario

### Problema: "No se puede eliminar usuario"

**Solución**:
- Verificar que el usuario actual tiene rol coordinador o directivo
- Verificar políticas RLS de DELETE en tabla usuarios
- El usuario se eliminará de `auth.users` automáticamente por CASCADE

## 📝 Notas Importantes

1. **Rol "administrativo"**: Fue eliminado del sistema. Solo existen: `docente`, `coordinador`, `directivo`

2. **Creación de Docentes**: Cuando se crea un usuario con rol `docente`, se crea automáticamente una entrada en la tabla `docentes`

3. **Email Opcional**: Si no se proporciona email, se usa `username@manglarnet.local`

4. **Contraseñas**: Mínimo 6 caracteres (configuración de Supabase)

5. **Eliminación**: Al eliminar un usuario de `usuarios`, se elimina automáticamente de `auth.users` por CASCADE

## ✅ Checklist de Verificación

- [ ] Usuario "frikiander" puede iniciar sesión
- [ ] Usuario "frikiander" puede ver la lista de usuarios
- [ ] Usuario "frikiander" puede crear nuevos usuarios
- [ ] Nuevos usuarios pueden iniciar sesión
- [ ] Permisos se cargan correctamente según rol
- [ ] Políticas RLS funcionan correctamente
- [ ] Creación de docentes crea entrada en tabla `docentes`
- [ ] Eliminación de usuarios funciona correctamente

