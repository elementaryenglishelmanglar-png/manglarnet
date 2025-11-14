# Configuración de Variables de Entorno

Este documento explica cómo configurar las variables de entorno necesarias para el proyecto.

## Variables Requeridas

### Frontend (.env.local)

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=https://rnycynatrhxhbfpydqvd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4
```

**Dónde encontrar estos valores:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings > API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Backend (Supabase Edge Functions)

La API key de Gemini debe configurarse como secreto en Supabase:

```bash
supabase secrets set GEMINI_API_KEY=AIzaSyA7mwXiTOC7_5Qyw__NY0Fv1suOp2Yoozk
```

**Obtener API Key de Gemini:**
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Cópiala y úsala en el comando anterior

## Verificación

Para verificar que los secretos están configurados correctamente:

```bash
supabase secrets list
```

Deberías ver `GEMINI_API_KEY` en la lista.

## Notas de Seguridad

⚠️ **IMPORTANTE:**
- Nunca commitees archivos `.env.local` o `.env` al repositorio
- El archivo `.gitignore` ya está configurado para ignorar estos archivos
- La API key de Gemini solo debe estar en Supabase Secrets, nunca en el frontend

