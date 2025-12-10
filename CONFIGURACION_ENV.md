# 🔐 Guía de Configuración de Variables de Entorno

Esta guía te ayudará a configurar correctamente las variables de entorno necesarias para ejecutar el proyecto ManglarNet.

## 📋 Requisitos Previos

- Cuenta en [Supabase](https://supabase.com)
- Proyecto Supabase creado
- (Opcional) API Key de Google Gemini para funcionalidades de IA

## 🚀 Configuración Rápida

### 1. Crear archivo de variables de entorno

El proyecto ya incluye un archivo `.env.local` con las credenciales configuradas. Si necesitas recrearlo:

```bash
cp .env.example .env.local
```

### 2. Variables de Entorno del Frontend

El archivo `.env.local` debe contener:

```env
VITE_SUPABASE_URL=https://rnycynatrhxhbfpydqvd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### ¿Dónde encontrar estos valores?

1. Accede a tu [Dashboard de Supabase](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia los siguientes valores:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Variables de Entorno del Backend (Supabase Edge Functions)

Para las funciones edge que utilizan Gemini AI, configura el secreto en Supabase:

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular tu proyecto
supabase link --project-ref rnycynatrhxhbfpydqvd

# Configurar el secreto de Gemini
supabase secrets set GEMINI_API_KEY=tu-api-key-de-gemini
```

#### Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Cópiala y úsala en el comando anterior

### 4. Verificar la configuración

Para verificar que los secretos están configurados:

```bash
supabase secrets list
```

Deberías ver `GEMINI_API_KEY` en la lista.

## 🔍 Verificación de Variables

El proyecto incluye validación automática de variables de entorno. Al iniciar la aplicación, verás en la consola:

```
✅ VITE_SUPABASE_URL: Configurado
✅ VITE_SUPABASE_ANON_KEY: Configurado
```

Si alguna variable falta, verás:

```
❌ VITE_SUPABASE_URL: No configurado
```

## 🛡️ Seguridad

### ⚠️ IMPORTANTE

- **NUNCA** commitees archivos `.env.local` o `.env` al repositorio
- El archivo `.gitignore` ya está configurado para ignorar estos archivos
- La API key de Gemini **solo** debe estar en Supabase Secrets, nunca en el frontend
- Las claves `VITE_SUPABASE_ANON_KEY` son seguras para el frontend (son públicas por diseño)

### Archivos protegidos por .gitignore

```
.env*.local
.env
```

## 🏃 Ejecutar el Proyecto

Una vez configuradas las variables de entorno:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## 🔧 Solución de Problemas

### Error: "Supabase client not configured"

**Causa**: Variables de entorno no cargadas correctamente.

**Solución**:
1. Verifica que `.env.local` existe en la raíz del proyecto
2. Reinicia el servidor de desarrollo (`npm run dev`)
3. Verifica que las variables empiezan con `VITE_` (requerido por Vite)

### Error: "Invalid API key"

**Causa**: La API key de Supabase es incorrecta o ha expirado.

**Solución**:
1. Ve a Supabase Dashboard → Settings → API
2. Copia nuevamente la `anon/public key`
3. Actualiza `.env.local`
4. Reinicia el servidor

### Las variables no se cargan en producción (Vercel)

**Solución**:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las mismas variables que en `.env.local`
4. Redeploy el proyecto

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google AI Studio](https://makersuite.google.com)

## 📝 Variables de Entorno Disponibles

| Variable | Descripción | Requerida | Ubicación |
|----------|-------------|-----------|-----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | ✅ Sí | Frontend (.env.local) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de Supabase | ✅ Sí | Frontend (.env.local) |
| `GEMINI_API_KEY` | API Key de Google Gemini | ⚠️ Opcional* | Backend (Supabase Secrets) |

*Requerida solo si usas funcionalidades de IA

## 🔄 Actualización de Variables

Si necesitas cambiar las variables de entorno:

1. **En desarrollo**: Edita `.env.local` y reinicia el servidor
2. **En producción**: Actualiza las variables en Vercel/tu plataforma de hosting
3. **Secretos de Supabase**: Usa `supabase secrets set NOMBRE_VARIABLE=valor`

---

**¿Necesitas ayuda?** Consulta la documentación completa en los archivos:
- `ENV_SETUP.md` - Configuración básica
- `VERCEL_ENV_SETUP.md` - Configuración para Vercel
- `DEPLOYMENT.md` - Guía de despliegue
