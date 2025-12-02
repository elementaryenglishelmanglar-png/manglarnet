# Debug: Problema de Login con Usuario Creado

## Problema
Usuario "ysazamora" creado pero no puede iniciar sesión - dice "credenciales inválidas"

## Posibles Causas

### 1. Email no coincide
Cuando se crea un usuario:
- Si NO se proporciona email → se usa `username@manglarnet.local`
- Si SÍ se proporciona email → se usa ese email

Cuando se hace login:
- Si ingresas solo username (sin @) → se convierte a `username@manglarnet.local`
- Si ingresas email completo → se usa ese email

**Solución**: Asegúrate de usar el mismo email que se usó para crear el usuario.

### 2. Confirmación de Email
Si la confirmación de email está habilitada en Supabase, el usuario necesita confirmar su email antes de poder iniciar sesión.

**Solución**: Deshabilitar confirmación de email en Supabase Dashboard > Authentication > Settings

### 3. Usuario no creado en auth.users
El usuario podría estar en la tabla `usuarios` pero no en `auth.users`.

**Verificación SQL**:
```sql
-- Verificar si el usuario existe en auth.users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email LIKE '%ysazamora%';

-- Verificar si el usuario existe en usuarios
SELECT id, username, email, role, is_active 
FROM usuarios 
WHERE username = 'ysazamora';
```

### 4. Contraseña incorrecta
La contraseña podría no haberse guardado correctamente.

**Solución**: Resetear la contraseña desde Supabase Dashboard o recrear el usuario.

## Pasos para Resolver

### Paso 1: Verificar el email usado
En la interfaz de Gestión de Usuarios, verifica qué email tiene el usuario "ysazamora".

### Paso 2: Intentar login con email completo
En lugar de usar solo "ysazamora", intenta usar el email completo:
- Si el email es `ysazamora@manglarnet.local` → usa ese
- Si el email es otro → usa ese email completo

### Paso 3: Verificar en Supabase Dashboard
1. Ve a **Authentication** > **Users**
2. Busca el usuario por email
3. Verifica:
   - ¿Existe el usuario?
   - ¿Está confirmado el email? (debe tener fecha en "Email Confirmed")
   - ¿Cuál es el email exacto?

### Paso 4: Resetear contraseña (si es necesario)
Desde Supabase Dashboard:
1. Ve a **Authentication** > **Users**
2. Encuentra el usuario
3. Click en "..." > "Reset Password"
4. O elimina y recrea el usuario

### Paso 5: Verificar configuración de Supabase
1. Ve a **Authentication** > **Settings** > **Auth Providers** > **Email**
2. Verifica que "Confirm email" esté **DESHABILITADO**
3. Guarda los cambios

## Comandos SQL Útiles

```sql
-- Ver todos los usuarios en auth.users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Ver todos los usuarios en usuarios
SELECT id, username, email, role, is_active, created_at 
FROM usuarios 
ORDER BY created_at DESC;

-- Verificar usuario específico
SELECT 
  u.id,
  u.username,
  u.email,
  u.role,
  u.is_active,
  au.email as auth_email,
  au.email_confirmed_at
FROM usuarios u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.username = 'ysazamora';
```

## Solución Rápida

Si el problema persiste, la solución más rápida es:

1. **Eliminar el usuario** desde la interfaz de Gestión de Usuarios
2. **Recrear el usuario** asegurándote de:
   - Usar un email específico (no dejar vacío)
   - Anotar el email usado
   - Usar una contraseña segura
3. **Intentar login** usando el email completo (no solo el username)

