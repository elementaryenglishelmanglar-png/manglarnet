# 🔧 Configurar Variables de Entorno en Vercel

## ⚠️ Problema Actual

Tu aplicación está desplegada pero muestra un error porque las variables de entorno de Supabase no están configuradas en Vercel.

## ✅ Solución: Configurar Variables en Vercel Dashboard

### Paso 1: Acceder a la Configuración del Proyecto

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. En el dashboard, encuentra tu proyecto: **manglarnet-conexion-pedagogica**
3. Haz clic en el nombre del proyecto para abrirlo

### Paso 2: Ir a Environment Variables

1. En el menú superior, haz clic en **"Settings"**
2. En el menú lateral izquierdo, haz clic en **"Environment Variables"**

### Paso 3: Agregar Variables de Entorno

Necesitas agregar **2 variables**:

#### Variable 1: VITE_SUPABASE_URL

1. Haz clic en **"Add New"**
2. En el campo **"Key"**, escribe: `VITE_SUPABASE_URL`
3. En el campo **"Value"**, pega: `https://rnycynatrhxhbfpydqvd.supabase.co`
4. **IMPORTANTE**: Marca las tres casillas:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Haz clic en **"Save"**

#### Variable 2: VITE_SUPABASE_ANON_KEY

1. Haz clic en **"Add New"** nuevamente
2. En el campo **"Key"**, escribe: `VITE_SUPABASE_ANON_KEY`
3. En el campo **"Value"**, pega:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4
   ```
4. **IMPORTANTE**: Marca las tres casillas:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Haz clic en **"Save"**

### Paso 4: Redesplegar la Aplicación

Después de agregar las variables, **debes redesplegar** la aplicación:

1. Ve a la pestaña **"Deployments"** en el menú superior
2. Encuentra el último deployment
3. Haz clic en los **tres puntos (⋯)** a la derecha
4. Selecciona **"Redeploy"**
5. Confirma el redeploy

**O alternativamente:**

1. Ve a la pestaña **"Deployments"**
2. Haz clic en el último deployment
3. Haz clic en **"Redeploy"** (botón en la parte superior)

### Paso 5: Verificar

Después de unos minutos:

1. Espera a que termine el nuevo deployment (verás "Ready" en verde)
2. Haz clic en el deployment para abrir la URL
3. La aplicación debería cargar correctamente ahora

## 🎯 Resumen de Variables

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://rnycynatrhxhbfpydqvd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4` |

## ⚠️ Notas Importantes

1. **Las variables deben empezar con `VITE_`** para que Vite las incluya en el build
2. **Debes marcar Production, Preview y Development** para que funcionen en todos los entornos
3. **Después de agregar variables, SIEMPRE debes redesplegar** para que surtan efecto
4. Las variables se aplican solo a nuevos deployments, no a los existentes

## 🐛 Si Aún No Funciona

1. Verifica que las variables estén escritas exactamente como se muestra (sin espacios extra)
2. Asegúrate de haber redesplegado después de agregar las variables
3. Revisa los logs del deployment en Vercel para ver si hay errores
4. Verifica que el Edge Function de Supabase esté desplegada

## 📸 Ubicación Visual

```
Vercel Dashboard
  └── Tu Proyecto
      └── Settings (menú superior)
          └── Environment Variables (menú lateral izquierdo)
              └── Add New (botón)
```

