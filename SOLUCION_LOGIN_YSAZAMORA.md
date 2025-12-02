# Solución: Usuario "ysazamora" no puede iniciar sesión

## 🔍 Diagnóstico Rápido

El problema más común es que el **email usado para crear el usuario no coincide** con el que intentas usar para login.

## ✅ Solución Inmediata

### Opción 1: Usar el email completo para login

1. En la pantalla de login, **NO uses solo "ysazamora"**
2. Usa el **email completo** que aparece en la tabla de usuarios:
   - Si en la tabla dice: `ysazamora@manglarnet.local` → usa ese email completo
   - Si en la tabla dice otro email → usa ese email completo

### Opción 2: Verificar en Supabase Dashboard

1. Ve a **Supabase Dashboard** > **Authentication** > **Users**
2. Busca el usuario por email (busca "ysazamora")
3. Verifica:
   - ✅ ¿Existe el usuario?
   - ✅ ¿Cuál es el email exacto? (copia ese email)
   - ✅ ¿Tiene fecha en "Email Confirmed"? (debe tener una fecha)

### Opción 3: Si el email no está confirmado

Si el usuario existe pero no tiene "Email Confirmed":

1. Ve a **Supabase Dashboard** > **Authentication** > **Settings**
2. En **Auth Providers** > **Email**
3. **DESHABILITA** "Confirm email"
4. Guarda los cambios
5. Intenta login de nuevo

### Opción 4: Recrear el usuario (Solución más rápida)

Si nada funciona:

1. **Elimina el usuario** desde la interfaz de Gestión de Usuarios
2. **Recrea el usuario** con estas especificaciones:
   - Usuario: `ysazamora`
   - Email: `ysazamora@manglarnet.local` (o el email que prefieras)
   - Contraseña: (la que quieras, mínimo 6 caracteres)
   - Rol: Coordinador
3. **Anota el email usado** (es importante)
4. **Intenta login** usando el **email completo** (no solo el username)

## 📝 Cómo hacer login correctamente

### ✅ CORRECTO:
- Email completo: `ysazamora@manglarnet.local`
- O solo username: `ysazamora` (se convierte automáticamente a `ysazamora@manglarnet.local`)

### ❌ INCORRECTO:
- Usar un email diferente al que se usó para crear el usuario

## 🔧 Verificación SQL (Opcional)

Si tienes acceso al SQL Editor de Supabase, ejecuta:

```sql
-- Ver el usuario en la tabla usuarios
SELECT username, email, role, is_active 
FROM usuarios 
WHERE username = 'ysazamora';

-- Ver el usuario en auth.users
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email LIKE '%ysazamora%';

-- Ver ambos juntos
SELECT 
  u.username,
  u.email as usuarios_email,
  au.email as auth_email,
  au.email_confirmed_at,
  u.is_active
FROM usuarios u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.username = 'ysazamora';
```

## ⚠️ Problema Común: Email Diferente

Si creaste el usuario con un email específico (ej: `ysabelzamora.elmanglar@gmail.com`) pero intentas hacer login con solo "ysazamora", no funcionará.

**Solución**: Usa el **mismo email** que aparece en la tabla de usuarios para hacer login.

## 🎯 Checklist de Verificación

- [ ] El usuario existe en la tabla de usuarios
- [ ] El usuario existe en auth.users (Supabase Dashboard)
- [ ] El email usado para login coincide con el email en la BD
- [ ] La confirmación de email está deshabilitada en Supabase
- [ ] La contraseña es correcta
- [ ] El usuario está activo (is_active = true)

## 💡 Consejo

**Siempre usa el email completo** que aparece en la tabla de usuarios para hacer login, especialmente si proporcionaste un email específico al crear el usuario.

