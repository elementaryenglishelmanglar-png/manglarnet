# Guía: Desplegar Edge Function create-user

## Paso 1: Instalar Supabase CLI

### Opción A: Con Homebrew (macOS - Recomendado)
```bash
brew install supabase/tap/supabase
```

### Opción B: Con npm
```bash
npm install -g supabase
```

### Opción C: Descarga directa
Visita: https://github.com/supabase/cli/releases

## Paso 2: Iniciar sesión en Supabase CLI

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

## Paso 3: Vincular tu proyecto

```bash
supabase link --project-ref tu-project-ref
```

Para encontrar tu `project-ref`:
1. Ve a Supabase Dashboard
2. Ve a Settings > General
3. Busca "Reference ID"

O simplemente ejecuta:
```bash
supabase link
```
Y selecciona tu proyecto de la lista.

## Paso 4: Obtener Service Role Key

1. Ve a **Supabase Dashboard** > **Settings** > **API**
2. Busca la sección **"Project API keys"**
3. Copia el **`service_role` key** (⚠️ Es secreto, no lo compartas)
4. Anótalo, lo necesitarás en el siguiente paso

## Paso 5: Configurar el secreto

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

Reemplaza `tu-service-role-key-aqui` con el key que copiaste.

## Paso 6: Desplegar la función

```bash
supabase functions deploy create-user
```

## Paso 7: Verificar el despliegue

```bash
supabase functions list
```

Deberías ver `create-user` en la lista.

## ✅ Listo

Ahora puedes crear usuarios desde la interfaz sin necesidad de habilitar signups públicos.

## 🐛 Solución de Problemas

### Error: "Project not found"
- Asegúrate de haber ejecutado `supabase link` correctamente
- Verifica que estés en el directorio correcto del proyecto

### Error: "Permission denied"
- Verifica que hayas iniciado sesión con `supabase login`
- Verifica que tengas permisos en el proyecto

### Error: "Function not found"
- Asegúrate de estar en el directorio raíz del proyecto
- Verifica que la función existe en `supabase/functions/create-user/`

## 📝 Notas

- El código ya está actualizado para usar la Edge Function automáticamente
- Si la función no está disponible, hará fallback al método signUp
- La función valida que solo coordinadores y directivos puedan crear usuarios

