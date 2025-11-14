# Guía de Despliegue en Supabase

Esta guía te ayudará a desplegar ManglarNet en Supabase paso a paso.

## 📋 Checklist Pre-Despliegue

- [ ] Tienes una cuenta de Supabase
- [ ] Tienes una API key de Google Gemini
- [ ] Tienes Node.js 18+ instalado
- [ ] Tienes Supabase CLI instalado

## 🚀 Pasos de Despliegue

### 1. Preparar el Proyecto

```bash
# Clonar y entrar al directorio
cd manglarnet---conexión-pedagógica

# Instalar dependencias
npm install
```

### 2. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa el formulario:
   - **Name**: ManglarNet (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña de forma segura
   - **Region**: Elige la región más cercana a tus usuarios
5. Espera a que el proyecto se cree (puede tardar 2-3 minutos)

### 3. Obtener Credenciales de Supabase

1. En el dashboard de Supabase, ve a **Settings > API**
2. Copia los siguientes valores:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon/public key** (una clave larga que comienza con `eyJ...`)

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://rnycynatrhxhbfpydqvd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4
```

**⚠️ IMPORTANTE**: Nunca commitees este archivo. Ya está en `.gitignore`.

### 5. Instalar y Configurar Supabase CLI

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular tu proyecto (reemplaza YOUR_PROJECT_REF con el ID de tu proyecto)
supabase link --project-ref rnycynatrhxhbfpydqvd
```

Para encontrar tu `PROJECT_REF`:
- Ve a Settings > General
- El "Reference ID" es tu project ref

### 6. Configurar Gemini API Key en Supabase

```bash
# Configurar el secreto de Gemini API
supabase secrets set GEMINI_API_KEY=AIzaSyA7mwXiTOC7_5Qyw__NY0Fv1suOp2Yoozk
```

Para obtener tu Gemini API Key:
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Cópiala y úsala en el comando anterior

### 7. Desplegar Edge Function

```bash
# Desplegar la función gemini-api
supabase functions deploy gemini-api
```

Deberías ver un mensaje de éxito como:
```
Deployed Function gemini-api (https://xxxxx.supabase.co/functions/v1/gemini-api)
```

### 8. Verificar Edge Function

Puedes probar la función con:

```bash
curl -X POST https://rnycynatrhxhbfpydqvd.supabase.co/functions/v1/gemini-api \
  -H "Authorization: Bearer tu-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"type":"plan-suggestions","data":{"competencia_indicadores":"test","inicio":"test","desarrollo":"test","cierre":"test"}}'
```

### 9. Construir la Aplicación Frontend

```bash
# Construir para producción
npm run build
```

Esto creará una carpeta `dist/` con los archivos estáticos.

### 10. Desplegar Frontend

Tienes varias opciones:

#### Opción A: Supabase Hosting (Beta)

Si Supabase Hosting está disponible para tu proyecto:

1. Ve a **Storage** en el dashboard de Supabase
2. Crea un bucket público llamado `web`
3. Sube los archivos de la carpeta `dist/` al bucket
4. Configura el dominio en Settings > API

#### Opción B: Vercel (Recomendado)

##### Método 1: Deploy desde Vercel Dashboard (Más Fácil)

1. **Preparar el repositorio:**
   - Asegúrate de que tu código esté en GitHub, GitLab o Bitbucket
   - Verifica que los archivos `vercel.json` y `.vercelignore` estén en el repositorio

2. **Conectar proyecto en Vercel:**
   - Ve a [vercel.com](https://vercel.com) e inicia sesión (puedes usar GitHub)
   - Haz clic en "Add New Project"
   - Importa tu repositorio de GitHub/GitLab/Bitbucket
   - Vercel detectará automáticamente que es un proyecto Vite

3. **Configurar el proyecto:**
   - **Framework Preset**: Vite (debería detectarse automáticamente)
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build` (ya configurado en vercel.json)
   - **Output Directory**: `dist` (ya configurado en vercel.json)
   - **Install Command**: `npm install` (ya configurado en vercel.json)

4. **Configurar Variables de Entorno:**
   - En la sección "Environment Variables", agrega:
     - `VITE_SUPABASE_URL` = `https://rnycynatrhxhbfpydqvd.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4`
   - Asegúrate de seleccionar todas las opciones: Production, Preview, y Development

5. **Desplegar:**
   - Haz clic en "Deploy"
   - Espera a que termine el build (2-3 minutos)
   - Tu aplicación estará disponible en una URL como: `https://tu-proyecto.vercel.app`

6. **Configurar Dominio Personalizado (Opcional):**
   - Ve a Settings > Domains
   - Agrega tu dominio personalizado
   - Sigue las instrucciones para configurar DNS

##### Método 2: Deploy desde CLI

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Iniciar sesión:**
   ```bash
   vercel login
   ```

3. **Desplegar por primera vez:**
   ```bash
   vercel
   ```
   - Sigue las instrucciones interactivas
   - Selecciona tu cuenta/organización
   - Confirma la configuración del proyecto

4. **Configurar variables de entorno:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   # Pega: https://rnycynatrhxhbfpydqvd.supabase.co
   # Selecciona: Production, Preview, Development
   
   vercel env add VITE_SUPABASE_ANON_KEY
   # Pega: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4
   # Selecciona: Production, Preview, Development
   ```

5. **Desplegar a producción:**
   ```bash
   vercel --prod
   ```

##### Verificar el Deploy

1. Abre la URL proporcionada por Vercel
2. Verifica que la aplicación carga correctamente
3. Prueba iniciar sesión
4. Verifica que las funciones de IA funcionen

##### Actualizaciones Futuras

Cada vez que hagas push a tu repositorio conectado, Vercel desplegará automáticamente una nueva versión. También puedes desplegar manualmente con:
```bash
vercel --prod
```

#### Opción C: Netlify

1. Instala Netlify CLI: `npm install -g netlify-cli`
2. Ejecuta: `netlify deploy --prod --dir=dist`
3. Configura las variables de entorno en Netlify Dashboard

#### Opción D: Otro Hosting Estático

Sube los archivos de la carpeta `dist/` a tu servicio de hosting preferido (GitHub Pages, AWS S3, etc.)

### 11. Configurar CORS (si es necesario)

Si tienes problemas de CORS:

1. Ve a **Settings > API** en Supabase Dashboard
2. En "CORS settings", agrega tu dominio de producción
3. Guarda los cambios

### 12. Verificar el Despliegue

1. Abre tu aplicación en el navegador
2. Intenta iniciar sesión
3. Prueba la funcionalidad de sugerencias de IA en planificaciones
4. Verifica que el análisis de evaluaciones funcione

## 🔧 Solución de Problemas

### Error: "GEMINI_API_KEY not configured"

**Solución:**
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyA7mwXiTOC7_5Qyw__NY0Fv1suOp2Yoozk
supabase functions deploy gemini-api
```

### Error: "Failed to fetch" en el navegador

**Posibles causas:**
1. Variables de entorno no configuradas correctamente
2. Edge Function no desplegada
3. Problemas de CORS

**Solución:**
1. Verifica que `.env.local` tenga los valores correctos
2. Verifica que la Edge Function esté desplegada: `supabase functions list`
3. Revisa la consola del navegador para más detalles
4. Verifica CORS en Supabase Dashboard

### Error: "Invalid API key" en Edge Function

**Solución:**
1. Verifica que el secreto esté configurado: `supabase secrets list`
2. Si no aparece, configúralo de nuevo: `supabase secrets set GEMINI_API_KEY=tu-key`
3. Redespliega la función: `supabase functions deploy gemini-api`

## 📊 Monitoreo

### Ver Logs de Edge Functions

```bash
# Ver logs en tiempo real
supabase functions logs gemini-api

# Ver logs de las últimas 24 horas
supabase functions logs gemini-api --since 24h
```

### Ver Logs en Dashboard

1. Ve a **Edge Functions** en Supabase Dashboard
2. Haz clic en `gemini-api`
3. Ve a la pestaña "Logs"

## 🔄 Actualizaciones

Para actualizar la aplicación:

1. **Actualizar código:**
   ```bash
   git pull
   npm install
   ```

2. **Actualizar Edge Function (si cambió):**
   ```bash
   supabase functions deploy gemini-api
   ```

3. **Reconstruir frontend:**
   ```bash
   npm run build
   ```

4. **Redesplegar frontend** según tu método de hosting

## 📝 Notas Adicionales

- Las Edge Functions tienen un timeout de 60 segundos por defecto
- El límite de requests depende de tu plan de Supabase
- Considera implementar rate limiting para producción
- Monitorea el uso de la API de Gemini para controlar costos

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs de Edge Functions
2. Verifica la consola del navegador
3. Consulta la [documentación de Supabase](https://supabase.com/docs)
4. Contacta al equipo de desarrollo

