# 🚀 Guía Rápida de Deploy en Vercel

## ✅ Archivos Preparados

Los siguientes archivos ya están configurados y listos para el deploy:

- ✅ `vercel.json` - Configuración de Vercel (routing SPA, build, etc.)
- ✅ `.vercelignore` - Archivos a ignorar en el deploy
- ✅ `package.json` - Scripts de build configurados
- ✅ `vite.config.ts` - Configuración de Vite optimizada

## 📋 Checklist Pre-Deploy

- [x] Archivos de configuración creados
- [x] Build verificado (funciona correctamente)
- [ ] Código en repositorio Git (GitHub/GitLab/Bitbucket)
- [ ] Edge Function de Supabase desplegada
- [ ] Variables de entorno listas para configurar

## 🎯 Pasos para Deploy

### Opción 1: Dashboard de Vercel (Recomendado)

1. **Ve a [vercel.com](https://vercel.com)** e inicia sesión con GitHub
2. **Haz clic en "Add New Project"**
3. **Importa tu repositorio** de GitHub
4. **Configura las variables de entorno:**
   - `VITE_SUPABASE_URL` = `https://rnycynatrhxhbfpydqvd.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4`
5. **Haz clic en "Deploy"**

### Opción 2: CLI de Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Iniciar sesión
vercel login

# 3. Desplegar
vercel

# 4. Configurar variables de entorno
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 5. Desplegar a producción
vercel --prod
```

## 🔧 Configuración Actual

- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Routing**: Configurado como SPA (todas las rutas redirigen a index.html)

## 📝 Notas Importantes

1. **Variables de Entorno**: Asegúrate de configurarlas en Vercel Dashboard antes del deploy
2. **Edge Function**: Debe estar desplegada en Supabase antes de usar la app
3. **CORS**: Ya está configurado en la Edge Function
4. **Auto-Deploy**: Cada push a la rama principal desplegará automáticamente

## 🐛 Solución de Problemas

### Build falla
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel Dashboard

### Variables de entorno no funcionan
- Asegúrate de que empiecen con `VITE_`
- Verifica que estén configuradas para Production, Preview y Development

### Routing no funciona
- Verifica que `vercel.json` tenga la configuración de `rewrites`
- Asegúrate de que todas las rutas redirijan a `/index.html`

## 📚 Documentación Completa

Para más detalles, consulta `DEPLOYMENT.md` sección "Opción B: Vercel"

