# 🔧 Solución: Error RLS al crear clases de inglés

## ⚠️ Problema

Al intentar crear clases de inglés con niveles, aparece el error:
```
new row violates row-level security policy for table "clases"
```

## 🔍 Causa

Las políticas RLS de la tabla `clases` pueden estar fallando por:
1. Comparación de emails sin normalización (mayúsculas/minúsculas)
2. Problemas con el JWT token durante la inserción
3. La política `WITH CHECK` no está validando correctamente

## ✅ Solución: Ejecutar Script SQL

### Paso 1: Abrir SQL Editor en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú lateral izquierdo)
4. Haz clic en **New Query** (botón verde en la esquina superior derecha)

### Paso 2: Ejecutar el Script de Corrección

1. Abre el archivo: `FIX_CLASES_RLS.sql`
2. **Copia TODO el contenido** del archivo
3. Pégalo en el editor SQL de Supabase
4. Haz clic en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
5. Deberías ver: **"Success. No rows returned"** o resultados de las consultas de verificación

### Paso 3: Verificar que Funcionó

El script incluye verificaciones automáticas. Deberías ver:
- ✅ Políticas recreadas correctamente
- ✅ Tu email y rol listados
- ✅ "Tiene permisos: SÍ"

### Paso 4: Probar Nuevamente

1. Intenta crear un docente de inglés con nivel nuevamente
2. Debería funcionar sin errores RLS

## 📋 Qué Hace el Script

1. **Elimina las políticas existentes** (si es necesario)
2. **Recrea las políticas** con:
   - Normalización de emails usando `LOWER()` para evitar problemas de mayúsculas/minúsculas
   - Verificación mejorada del JWT
   - Políticas separadas para SELECT y ALL (INSERT/UPDATE/DELETE)
3. **Verifica** que todo esté correcto

## 🐛 Si Sigue Fallando

Si después de ejecutar el script sigue fallando:

1. **Verifica tu rol**: Ejecuta esta consulta para verificar tu rol:
   ```sql
   SELECT email, role 
   FROM authorized_users 
   WHERE LOWER(email) = LOWER('tu-email@ejemplo.com');
   ```
   Reemplaza `tu-email@ejemplo.com` con tu email real.

2. **Verifica el JWT**: Ejecuta esta consulta para ver qué email tiene el JWT:
   ```sql
   SELECT auth.jwt() ->> 'email' as jwt_email;
   ```

3. **Verifica permisos**: Ejecuta esta consulta para verificar si tienes permisos:
   ```sql
   SELECT 
       EXISTS (
           SELECT 1 FROM authorized_users au
           WHERE LOWER(au.email) = LOWER(auth.jwt() ->> 'email')
           AND au.role IN ('coordinador', 'directivo')
       ) as has_permissions;
   ```

## 📝 Notas Importantes

- Las políticas RLS son estrictas por seguridad
- Solo coordinadores y directivos pueden crear/editar/eliminar clases
- Los docentes solo pueden leer clases
- Si no eres coordinador o directivo, necesitas que te agreguen a `authorized_users` con el rol correcto

