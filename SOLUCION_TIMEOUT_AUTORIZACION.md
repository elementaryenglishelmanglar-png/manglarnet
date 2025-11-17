# 🔧 Solución: Timeout en Verificación de Autorización

## ⚠️ Problema

Después de iniciar sesión con Google, la verificación de autorización se queda colgada y hace timeout después de 15 segundos. El error indica que hay un problema con la conexión a Supabase o con las políticas RLS.

## 🔍 Causa Raíz

El problema es que la consulta a la tabla `authorized_users` se está colgando porque:

1. **Las políticas RLS pueden estar bloqueando la consulta** durante el proceso de autenticación
2. **El token JWT no se está enviando correctamente** en las peticiones a Supabase
3. **La sesión no está completamente establecida** cuando se intenta hacer la consulta

## ✅ Solución Completa

### Paso 1: Ejecutar el Script SQL en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: **rnycynatrhxhbfpydqvd**
3. En el menú lateral izquierdo, haz clic en **SQL Editor**
4. Haz clic en **New Query**
5. Copia y pega **TODO** el contenido del archivo `FIX_AUTH_TIMEOUT.sql`
6. Haz clic en **Run** (o presiona `Ctrl+Enter`)

Este script:
- Verifica que tu email esté en la tabla `authorized_users`
- Verifica las políticas RLS actuales
- Elimina políticas conflictivas
- Crea una política permisiva que permite a usuarios autenticados leer la tabla
- Verifica que todo esté correcto

### Paso 2: Verificar Variables de Entorno

Asegúrate de que tienes un archivo `.env.local` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=https://rnycynatrhxhbfpydqvd.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**⚠️ IMPORTANTE:** 
- El archivo `.env.local` NO debe estar en el repositorio Git (debe estar en `.gitignore`)
- Reinicia el servidor de desarrollo después de crear o modificar `.env.local`

### Paso 3: Verificar URL de Redirección en Supabase

1. Ve a **Authentication > URL Configuration** en Supabase Dashboard
2. Asegúrate de que `http://localhost:3000` esté en la lista de **Redirect URLs**
3. Si no está, agrégalo y haz clic en **Save**

### Paso 4: Limpiar Caché del Navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú lateral, expande **Storage**
4. Haz clic en **Clear site data** (o **Limpiar datos del sitio**)
5. Cierra y vuelve a abrir el navegador

### Paso 5: Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

## 🔍 Verificación

Después de ejecutar los pasos anteriores, deberías ver en la consola del navegador:

1. ✅ `OAuth callback detectado, esperando procesamiento...`
2. ✅ `Obteniendo sesión...`
3. ✅ `Session found: elementaryenglish.elmanglar@gmail.com`
4. ✅ `Session token present: true`
5. ✅ `Usuario autenticado: elementaryenglish.elmanglar@gmail.com`
6. ✅ `Token de sesión presente: true`
7. ✅ `Iniciando consulta a authorized_users...`
8. ✅ `Consulta completada en Xms` (donde X debería ser < 1000ms)
9. ✅ `User authorized with role: coordinador`

## 🐛 Si el Problema Persiste

### Verificar en Supabase SQL Editor

Ejecuta estas consultas para diagnosticar:

```sql
-- 1. Verificar que tu email está en la tabla
SELECT * FROM authorized_users 
WHERE email = 'elementaryenglish.elmanglar@gmail.com';

-- 2. Verificar políticas RLS
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'authorized_users';

-- 3. Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'authorized_users';
```

### Verificar en la Consola del Navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Network** (o **Red**)
3. Filtra por `authorized_users`
4. Intenta iniciar sesión de nuevo
5. Revisa la petición a `authorized_users`:
   - ¿Qué código de estado tiene? (debería ser 200)
   - ¿Qué headers tiene? (debería incluir `Authorization: Bearer ...`)
   - ¿Qué respuesta tiene? (debería incluir tu email y rol)

### Posibles Problemas Adicionales

1. **Error 401 (Unauthorized)**: El token JWT no se está enviando correctamente
   - Solución: Verifica que las variables de entorno estén correctas y reinicia el servidor

2. **Error 403 (Forbidden)**: Las políticas RLS están bloqueando la consulta
   - Solución: Ejecuta el script SQL `FIX_AUTH_TIMEOUT.sql` de nuevo

3. **Error 500 (Internal Server Error)**: Problema con Supabase
   - Solución: Espera unos minutos y vuelve a intentar, o contacta al soporte de Supabase

4. **Timeout**: La consulta nunca completa
   - Solución: Verifica tu conexión a internet y las políticas RLS

## 📝 Cambios Realizados en el Código

Se han realizado las siguientes mejoras en `components/LoginScreen.tsx`:

1. ✅ **Espera más tiempo después del callback OAuth** (2 segundos en lugar de 1)
2. ✅ **Reintentos para obtener la sesión** (hasta 3 intentos con espera entre ellos)
3. ✅ **Timeout explícito en la consulta** (10 segundos en lugar de indefinido)
4. ✅ **Mejor logging** para diagnosticar problemas
5. ✅ **Verificación del token de sesión** antes de hacer la consulta
6. ✅ **Mensajes de error más descriptivos**

## 🎯 Resultado Esperado

Después de seguir estos pasos, deberías poder:
- ✅ Iniciar sesión con Google sin problemas
- ✅ Ver tu email y rol en la consola
- ✅ Acceder al dashboard sin timeouts
- ✅ Ver mensajes de éxito en la consola en lugar de timeouts

