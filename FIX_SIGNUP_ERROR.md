# Solución: Error "Signups not allowed for this instance"

## 🔴 Problema

Al intentar crear un usuario, aparece el error:
```
Error al crear usuario: Signups not allowed for this instance
```

Esto significa que los registros públicos están deshabilitados en Supabase, lo cual es una buena práctica de seguridad.

## ✅ Solución Rápida (Temporal - Para crear usuarios ahora)

### Opción 1: Habilitar Signups Temporalmente

1. Ve a **Supabase Dashboard**
2. Ve a **Authentication** > **Settings**
3. En la sección **Auth**, busca **"Enable email signups"** o **"Disable email signups"**
4. **HABILITA** los signups de email
5. **También deshabilita "Confirm email"** en **Auth Providers** > **Email**
6. Guarda los cambios
7. Intenta crear el usuario de nuevo
8. **Después de crear los usuarios necesarios, deshabilita signups de nuevo**

**⚠️ Nota**: Esto permite que cualquiera se registre públicamente temporalmente. Deshabilítalo después de crear los usuarios.

## ✅ Solución Recomendada (Permanente)

### Opción 2: Usar Edge Function (Ya creada)

He creado una Edge Function que permite crear usuarios de forma segura sin habilitar signups públicos.

**Pasos para desplegar:**

1. **Obtén tu Service Role Key**:
   - Ve a Supabase Dashboard > **Settings** > **API**
   - Copia el **`service_role` key** (⚠️ Manténlo secreto)

2. **Configura el secreto**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
   ```

3. **Despliega la función**:
   ```bash
   supabase functions deploy create-user
   ```

4. **Listo**: El código ya está actualizado para usar la función automáticamente.

**Ventajas:**
- ✅ No requiere habilitar signups públicos
- ✅ Es más seguro
- ✅ Permite crear usuarios sin confirmación de email
- ✅ Solo coordinadores y directivos pueden crear usuarios

## 📋 Resumen de Opciones

### Para crear usuarios AHORA (rápido):
1. Habilita signups temporalmente en Supabase Dashboard
2. Crea los usuarios necesarios
3. Deshabilita signups de nuevo

### Para una solución PERMANENTE (recomendado):
1. Despliega la Edge Function `create-user`
2. El código ya está listo para usarla automáticamente
3. No necesitas habilitar signups públicos

## 🎯 ¿Cuál usar?

- **Si necesitas crear usuarios ahora mismo**: Usa la Opción 1 (habilitar signups temporalmente)
- **Si quieres una solución profesional**: Despliega la Edge Function (Opción 2)

El código ya está preparado para usar la Edge Function automáticamente cuando esté disponible, y hace fallback a signUp si no está desplegada.

