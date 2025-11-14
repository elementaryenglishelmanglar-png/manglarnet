# Changelog - Preparación para Supabase

## 🔧 Cambios Realizados

### Seguridad
- ✅ **Movida API Key de Gemini al servidor**: La API key ahora está protegida en Supabase Edge Functions en lugar de estar expuesta en el frontend
- ✅ **Eliminada dependencia `@google/genai` del frontend**: Ya no se incluye en `package.json` del frontend
- ✅ **Actualizado `.gitignore`**: Agregadas reglas para ignorar archivos de entorno

### Archivos Nuevos
- ✅ **`index.css`**: Archivo CSS faltante que estaba referenciado en `index.html`
- ✅ **`supabase/functions/gemini-api/index.ts`**: Edge Function de Supabase para llamadas seguras a Gemini API
- ✅ **`supabase/functions/gemini-api/deno.json`**: Configuración de Deno para la Edge Function
- ✅ **`supabase/config.toml`**: Configuración de Supabase
- ✅ **`supabase/.gitignore`**: Gitignore para archivos temporales de Supabase
- ✅ **`README.md`**: Actualizado con instrucciones completas de deployment
- ✅ **`DEPLOYMENT.md`**: Guía detallada paso a paso para desplegar en Supabase
- ✅ **`ENV_SETUP.md`**: Guía para configurar variables de entorno
- ✅ **`CHANGELOG.md`**: Este archivo

### Archivos Modificados
- ✅ **`services/geminiService.ts`**: 
  - Eliminada llamada directa a Gemini API
  - Ahora usa Supabase Edge Function
  - Agregadas funciones helper para obtener configuración de Supabase
  
- ✅ **`vite.config.ts`**: 
  - Eliminadas referencias a `GEMINI_API_KEY` (ya no se necesita en frontend)
  - Agregadas variables de entorno para Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  - Mejorada configuración de build para producción
  
- ✅ **`package.json`**: 
  - Eliminada dependencia `@google/genai` (ya no se usa en frontend)
  
- ✅ **`.gitignore`**: 
  - Agregadas reglas para archivos `.env*`
  - Agregadas reglas para archivos temporales de Supabase

## 🚀 Próximos Pasos para Deployment

1. **Crear proyecto en Supabase**
2. **Configurar variables de entorno** (ver `ENV_SETUP.md`)
3. **Desplegar Edge Function** (ver `DEPLOYMENT.md`)
4. **Construir y desplegar frontend** (ver `DEPLOYMENT.md`)

## ⚠️ Breaking Changes

- **Variables de entorno cambiadas**: 
  - Antes: `GEMINI_API_KEY` en `.env.local`
  - Ahora: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local`
  - `GEMINI_API_KEY` ahora se configura como secreto en Supabase

- **API calls cambiadas**: 
  - Las llamadas a Gemini ahora pasan por Supabase Edge Functions
  - Esto es transparente para el usuario final, pero requiere configuración adicional

## 🔍 Verificación

Para verificar que todo funciona:

1. **Localmente**:
   ```bash
   npm install
   # Crear .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
   npm run dev
   ```

2. **Edge Function**:
   ```bash
   supabase functions deploy gemini-api
   supabase functions logs gemini-api
   ```

3. **Build**:
   ```bash
   npm run build
   # Verificar que dist/ se crea correctamente
   ```

## 📝 Notas

- El proyecto ahora está listo para ser hosteado en Supabase
- La API key de Gemini está protegida y nunca se expone al cliente
- Se mantiene compatibilidad con el código existente (solo cambió la implementación interna)
- Todos los archivos de configuración están documentados

