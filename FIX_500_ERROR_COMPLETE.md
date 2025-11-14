# 🔧 Solución Completa: Error 500 al Verificar Autorización

## ⚠️ Problema Persistente

El error 500 continúa después de intentar corregir las políticas RLS. Necesitamos un enfoque más robusto.

## ✅ Solución Paso a Paso

### Paso 1: Verificar el Estado Actual

Primero, ejecuta esto en SQL Editor para ver qué políticas existen:

```sql
-- Ver políticas actuales
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'authorized_users';
```

### Paso 2: Eliminar TODAS las Políticas Existentes

```sql
-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Authenticated users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;
```

### Paso 3: Crear Políticas Nuevas y Más Permisivas

```sql
-- Política de lectura: Cualquier usuario autenticado puede leer
CREATE POLICY "allow_read_authorized_users" ON authorized_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserción: Solo directivos pueden insertar
CREATE POLICY "allow_insert_for_directivos" ON authorized_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  );

-- Política de actualización: Solo directivos pueden actualizar
CREATE POLICY "allow_update_for_directivos" ON authorized_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  );

-- Política de eliminación: Solo directivos pueden eliminar
CREATE POLICY "allow_delete_for_directivos" ON authorized_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'directivo'
    )
  );
```

### Paso 4: Verificar que las Políticas se Crearon

```sql
-- Verificar políticas creadas
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'authorized_users'
ORDER BY cmd, policyname;
```

Deberías ver 4 políticas:
- `allow_read_authorized_users` - SELECT
- `allow_insert_for_directivos` - INSERT
- `allow_update_for_directivos` - UPDATE
- `allow_delete_for_directivos` - DELETE

### Paso 5: Verificar que los Usuarios Están en la Tabla

```sql
-- Verificar usuarios
SELECT email, role 
FROM authorized_users 
ORDER BY email;
```

### Paso 6: Probar Acceso Directo (Como Administrador)

Si tienes acceso de administrador, prueba esto para verificar que la tabla es accesible:

```sql
-- Probar consulta directa (debería funcionar si estás autenticado)
SELECT email, role 
FROM authorized_users 
WHERE email = 'elementaryenglish.elmanglar@gmail.com';
```

## 🔍 Verificar Logs de Supabase

Si el error persiste, revisa los logs:

1. Ve a **Supabase Dashboard** > **Logs** > **Postgres Logs**
2. Busca errores relacionados con `authorized_users`
3. O ve a **Logs** > **API Logs** y busca el error 500

## 🛠️ Solución Alternativa: Función de Seguridad

Si las políticas RLS siguen fallando, podemos crear una función de seguridad:

```sql
-- Crear función para verificar autorización
CREATE OR REPLACE FUNCTION check_user_authorization(user_email TEXT)
RETURNS TABLE(email TEXT, role TEXT) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT au.email, au.role
  FROM authorized_users au
  WHERE au.email = LOWER(user_email);
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION check_user_authorization(TEXT) TO authenticated;
```

Luego actualizarías el código para usar esta función en lugar de consultar directamente la tabla.

## 🚨 Solución Temporal: Deshabilitar RLS (SOLO PARA DIAGNÓSTICO)

**ADVERTENCIA**: Esto deshabilita la seguridad. Solo úsalo para diagnosticar el problema.

```sql
-- SOLO PARA DIAGNÓSTICO - NO USAR EN PRODUCCIÓN
ALTER TABLE authorized_users DISABLE ROW LEVEL SECURITY;

-- Probar inicio de sesión ahora
-- Si funciona, el problema es con las políticas RLS

-- IMPORTANTE: Volver a habilitar RLS después
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
```

## 📋 Checklist de Verificación

Ejecuta este script completo para verificar todo:

```sql
-- Script completo de verificación
DO $$
BEGIN
  -- Verificar que la tabla existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'authorized_users') THEN
    RAISE NOTICE '✅ Tabla authorized_users existe';
  ELSE
    RAISE EXCEPTION '❌ Tabla authorized_users NO existe';
  END IF;

  -- Verificar que RLS está habilitado
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'authorized_users' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS está habilitado';
  ELSE
    RAISE NOTICE '⚠️ RLS NO está habilitado';
  END IF;

  -- Verificar políticas
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'authorized_users'
  ) THEN
    RAISE NOTICE '✅ Políticas RLS existen';
  ELSE
    RAISE NOTICE '⚠️ NO hay políticas RLS';
  END IF;

  -- Verificar usuarios
  IF EXISTS (SELECT 1 FROM authorized_users) THEN
    RAISE NOTICE '✅ Hay usuarios en la tabla';
  ELSE
    RAISE NOTICE '⚠️ NO hay usuarios en la tabla';
  END IF;
END $$;

-- Mostrar resumen
SELECT 
  'Tabla existe' as verificación,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'authorized_users') as estado
UNION ALL
SELECT 
  'RLS habilitado',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'authorized_users' AND rowsecurity = true)
UNION ALL
SELECT 
  'Políticas existen',
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'authorized_users')
UNION ALL
SELECT 
  'Usuarios en tabla',
  EXISTS (SELECT 1 FROM authorized_users);
```

## 🎯 Próximos Pasos

1. Ejecuta el Paso 2 y 3 para recrear las políticas
2. Ejecuta el script de verificación del Paso 6
3. Comparte los resultados del script de verificación
4. Si sigue fallando, prueba la solución temporal (Paso 7) para confirmar que es un problema de RLS

