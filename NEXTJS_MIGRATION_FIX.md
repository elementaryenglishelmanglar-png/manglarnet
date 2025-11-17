# 🔧 Solución Completa: Problemas de Autenticación en Next.js

## 🎯 Problema Identificado

Los timeouts de `getSession()` y `getUser()` ocurren porque:

1. **Variables de entorno incorrectas**: Next.js necesita `NEXT_PUBLIC_` pero tienes `VITE_`
2. **OAuth Redirect URL no configurada**: La URL cambió de Vite (puerto 5173) a Next.js (puerto 3000)
3. **Cliente de Supabase sin credenciales**: Sin las variables correctas, el cliente no puede conectarse

## ✅ Solución Paso a Paso

### Paso 1: Crear/Actualizar `.env.local`

Crea o actualiza el archivo `.env.local` en la raíz del proyecto con:

```env
# Next.js requiere NEXT_PUBLIC_ para variables del cliente
NEXT_PUBLIC_SUPABASE_URL=https://rnycynatrhxhbfpydqvd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4
```

**⚠️ IMPORTANTE:**
- El archivo debe llamarse `.env.local` (con el punto al inicio)
- Debe estar en la raíz del proyecto (mismo nivel que `package.json`)
- **NO** debe tener espacios alrededor del `=`
- Reinicia el servidor después de crear/modificar este archivo

### Paso 2: Configurar OAuth Redirect URL en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **URL Configuration**
4. En **Redirect URLs**, agrega:
   ```
   http://localhost:3000/auth/callback
   ```
5. Si vas a desplegar, también agrega:
   ```
   https://manglarnet-conexion-pedagogica.vercel.app/auth/callback
   
   ```
6. Haz clic en **Save**

### Paso 3: Verificar Variables de Entorno

Abre la consola del navegador (F12) y ejecuta:

```javascript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Presente' : 'FALTANTE');
```

Si ves `undefined` o `FALTANTE`, las variables no están configuradas correctamente.

### Paso 4: Reiniciar el Servidor

Después de crear/modificar `.env.local`:

1. Detén el servidor (Ctrl+C)
2. Reinicia con:
   ```bash
   npm run dev
   ```

## 🔍 Verificación del Problema

### Síntomas del Problema Actual:

- ✅ `getSession timeout` después de 8 segundos
- ✅ `getUser timeout` después de 5 segundos
- ✅ "Session check timed out - cookies may not be available yet"
- ✅ El dashboard se queda cargando indefinidamente

### Causa Raíz:

El cliente de Supabase en `lib/supabase/client.ts` está buscando:
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Pero si estas variables no existen o son `undefined`, el cliente no puede:
- Conectarse a Supabase
- Hacer llamadas de autenticación
- Leer/escribir cookies

## 📋 Checklist de Verificación

Antes de probar nuevamente, verifica:

- [ ] Archivo `.env.local` existe en la raíz del proyecto
- [ ] Variables tienen el prefijo `NEXT_PUBLIC_` (no `VITE_`)
- [ ] No hay espacios alrededor del `=` en `.env.local`
- [ ] OAuth Redirect URL está configurada en Supabase: `http://localhost:3000/auth/callback`
- [ ] Servidor fue reiniciado después de crear/modificar `.env.local`
- [ ] Las variables se ven en la consola del navegador (no son `undefined`)

## 🚨 Si Aún No Funciona

### 1. Verificar que el archivo existe:

```bash
# En PowerShell
Test-Path .env.local

# Debería retornar: True
```

### 2. Verificar contenido del archivo:

```bash
# En PowerShell
Get-Content .env.local

# Debería mostrar:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Verificar que Next.js está leyendo las variables:

Agrega temporalmente esto en `app/(dashboard)/layout.tsx` al inicio del componente:

```typescript
console.log('ENV CHECK:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'
});
```

Si ves `MISSING`, las variables no están siendo leídas.

### 4. Limpiar caché de Next.js:

```bash
# Eliminar carpeta .next
Remove-Item -Recurse -Force .next

# Reiniciar servidor
npm run dev
```

## 📝 Notas Importantes

1. **Diferencia entre Vite y Next.js:**
   - Vite: `VITE_SUPABASE_URL`
   - Next.js: `NEXT_PUBLIC_SUPABASE_URL`
   - Next.js solo expone variables que empiezan con `NEXT_PUBLIC_` al cliente

2. **OAuth Redirect URL:**
   - Vite (original): `http://localhost:5173/auth/callback`
   - Next.js (nuevo): `http://localhost:3000/auth/callback`
   - **Ambas deben estar en Supabase** si quieres usar ambos entornos

3. **Archivo `.env.local`:**
   - Está en `.gitignore` (no se sube al repositorio)
   - Solo funciona en desarrollo local
   - Para producción, configura las variables en Vercel/plataforma de hosting

## 🎯 Próximos Pasos Después de Arreglar

Una vez que las variables estén configuradas correctamente:

1. El cliente de Supabase podrá conectarse
2. `getSession()` y `getUser()` funcionarán
3. Las cookies se establecerán correctamente
4. El dashboard cargará sin timeouts

Si después de seguir estos pasos aún hay problemas, comparte:
- El contenido de `.env.local` (sin la key completa, solo confirma que existe)
- Los logs de la consola del navegador
- Si las variables aparecen como `undefined` o no

