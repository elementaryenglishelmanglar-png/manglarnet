# 🔧 Solución: Error 500 al Verificar Autorización

## ⚠️ Problema

Después de iniciar sesión con Google correctamente, aparece un error 500 al intentar verificar la autorización. El error en la consola muestra:
- `Failed to load resource: the server responded with a status of 500`
- `Error checking authorization: Object`

## 🔍 Causa

El problema es que las políticas de Row Level Security (RLS) son demasiado restrictivas o no están funcionando correctamente durante el proceso de verificación de autorización. La política actual puede estar bloqueando el acceso cuando la sesión aún se está estableciendo.

## ✅ Solución: Corregir las Políticas RLS

### Paso 1: Abrir SQL Editor en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: **rnycynatrhxhbfpydqvd**
3. En el menú lateral izquierdo, haz clic en **SQL Editor**
4. Haz clic en **New Query**

### Paso 2: Ejecutar el Script de Corrección

Copia y pega **TODO** este SQL:

```sql
-- Fix RLS policies for authorized_users table
-- This migration fixes the policies to allow authenticated users to read their own authorization status

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;

-- Create a more permissive read policy that allows any authenticated user to read the table
-- This is needed during the authorization check process
CREATE POLICY "Authenticated users can read authorized_users" ON authorized_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only directivos can insert/update/delete authorized_users
-- This policy allows directivos to manage the table
CREATE POLICY "Directivos can manage authorized_users" ON authorized_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role = 'directivo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = (auth.jwt() ->> 'email')
      AND au.role = 'directivo'
    )
  );
```

### Paso 3: Ejecutar la Query

1. Haz clic en el botón **Run** (o presiona `Ctrl+Enter`)
2. Deberías ver un mensaje de éxito: **"Success. No rows returned"**

### Paso 4: Verificar las Políticas

Ejecuta esta query para verificar que las políticas se crearon correctamente:

```sql
-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'authorized_users'
ORDER BY policyname;
```

Deberías ver 2 políticas:
1. `Authenticated users can read authorized_users` - Para SELECT
2. `Directivos can manage authorized_users` - Para INSERT, UPDATE, DELETE

## 🔄 Después de Corregir las Políticas

1. **Espera 10-30 segundos** para que los cambios se propaguen
2. **Limpia la caché del navegador** completamente (Ctrl+Shift+Delete)
3. **Cierra sesión completamente** de Google
4. **Cierra todas las pestañas** de tu aplicación
5. **Abre una nueva pestaña** y ve a tu aplicación en Vercel
6. **Intenta iniciar sesión** con Google nuevamente

## 🔍 Verificar que la Tabla Tiene Datos

Antes de probar, asegúrate de que los usuarios estén en la tabla:

```sql
-- Verificar usuarios en la tabla
SELECT email, role, created_at 
FROM authorized_users 
ORDER BY email;
```

Deberías ver al menos estos usuarios:
- `elementaryenglish.elmanglar@gmail.com` - coordinador
- `vargas199511@gmail.com` - coordinador
- `coordinacionprimariaciem@gmail.com` - coordinador
- `ysabelzamora.elmanglar@gmail.com` - coordinador

## 🐛 Si Aún No Funciona

### Verificar que RLS está Habilitado

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'authorized_users';
```

Deberías ver `rowsecurity = true`.

### Verificar que las Políticas Están Activas

```sql
-- Ver todas las políticas activas
SELECT * FROM pg_policies 
WHERE tablename = 'authorized_users';
```

### Probar Acceso Directo

Si tienes acceso como administrador, puedes probar deshabilitar temporalmente RLS para diagnosticar:

```sql
-- SOLO PARA DIAGNÓSTICO - NO USAR EN PRODUCCIÓN
-- Deshabilitar RLS temporalmente (solo para probar)
ALTER TABLE authorized_users DISABLE ROW LEVEL SECURITY;

-- Probar la consulta
SELECT * FROM authorized_users WHERE email = 'elementaryenglish.elmanglar@gmail.com';

-- IMPORTANTE: Volver a habilitar RLS después de probar
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
```

## 📝 Cambios Realizados

La nueva política es más permisiva para la lectura:
- **Antes**: `USING (auth.role() = 'authenticated')` - Podía fallar si el rol no estaba establecido
- **Ahora**: `USING (true)` con `TO authenticated` - Permite a cualquier usuario autenticado leer la tabla

Esto es seguro porque:
1. Solo usuarios autenticados pueden acceder (gracias a `TO authenticated`)
2. La tabla solo contiene emails y roles, no información sensible
3. La escritura/modificación sigue restringida solo a directivos

## ✅ Checklist

- [ ] Políticas antiguas eliminadas
- [ ] Nueva política de lectura creada
- [ ] Política de escritura actualizada
- [ ] Verificación de políticas exitosa
- [ ] Usuarios verificados en la tabla
- [ ] Caché del navegador limpiada
- [ ] Prueba de inicio de sesión exitosa

