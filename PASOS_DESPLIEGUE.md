# Pasos para Desplegar la Edge Function create-user

## ✅ Paso 1: Iniciar Sesión en Supabase CLI

Ejecuta en tu terminal:

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte. Sigue las instrucciones en pantalla.

## ✅ Paso 2: Vincular tu Proyecto

Ejecuta:

```bash
cd /Users/elementary/Desktop/manglarnet
supabase link
```

Selecciona tu proyecto de la lista que aparece.

**O si conoces tu project-ref**, puedes usar:

```bash
supabase link --project-ref tu-project-ref
```

Para encontrar tu `project-ref`:
1. Ve a Supabase Dashboard
2. Settings > General
3. Busca "Reference ID"

## ✅ Paso 3: Obtener Service Role Key

1. Ve a **Supabase Dashboard** > **Settings** > **API**
2. En la sección **"Project API keys"**
3. Busca **`service_role`** (el key secreto, NO el `anon` key)
4. **Copia ese key** (es largo, algo como: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

⚠️ **IMPORTANTE**: Este key tiene permisos de administrador. No lo compartas ni lo subas a Git.

## ✅ Paso 4: Configurar el Secreto

Ejecuta (reemplaza `TU_SERVICE_ROLE_KEY` con el key que copiaste):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```

## ✅ Paso 5: Desplegar la Función

```bash
supabase functions deploy create-user
```

## ✅ Paso 6: Verificar

```bash
supabase functions list
```

Deberías ver `create-user` en la lista.

## 🎉 ¡Listo!

Ahora puedes crear usuarios desde la interfaz sin necesidad de habilitar signups públicos.

## 🐛 Si algo falla

### Error: "Project not found"
- Asegúrate de haber ejecutado `supabase link` correctamente
- Verifica que estés en el directorio correcto

### Error: "Permission denied"
- Verifica que hayas iniciado sesión con `supabase login`
- Verifica que tengas permisos en el proyecto

### Error: "Function not found"
- Verifica que el archivo existe en `supabase/functions/create-user/index.ts`
- Asegúrate de estar en el directorio raíz del proyecto

