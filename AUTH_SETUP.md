# Configuración de Autenticación con Google OAuth

Esta guía explica cómo configurar la autenticación con Google OAuth en Supabase para el sistema de whitelist.

## 📋 Prerrequisitos

1. Proyecto de Supabase creado
2. Cuenta de Google Cloud Platform (GCP)
3. Acceso al dashboard de Supabase

## 🔧 Pasos de Configuración

### 1. Configurar Google OAuth en Google Cloud Platform

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services > Credentials**
4. Haz clic en **Create Credentials > OAuth client ID**
5. Si es la primera vez, configura la pantalla de consentimiento OAuth:
   - Tipo de aplicación: **External**
   - Nombre de la aplicación: **ManglarNet**
   - Email de soporte: Tu email
   - Agrega tu email como usuario de prueba
6. Crea el OAuth client ID:
   - Tipo de aplicación: **Web application**
   - Nombre: **ManglarNet Web Client**
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:3000
     https://rnycynatrhxhbfpydqvd.supabase.co
     https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app
     https://*.vercel.app
     ```
     **Nota**: Agrega también tu URL de producción de Vercel (reemplaza con tu URL real si es diferente)
   - **Authorized redirect URIs**:
     ```
     https://rnycynatrhxhbfpydqvd.supabase.co/auth/v1/callback
     ```
     **IMPORTANTE**: Solo debe haber UNA URI de redirección y debe ser exactamente la de Supabase
7. Copia el **Client ID** y **Client Secret**



### 2. Configurar OAuth en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication > Providers**
3. Busca **Google** en la lista de proveedores
4. Habilita el proveedor Google
5. Ingresa:
   - **Client ID (for Google OAuth)**: El Client ID que copiaste de GCP
   - **Client Secret (for Google OAuth)**: El Client Secret que copiaste de GCP
6. Haz clic en **Save**

### 3. Ejecutar Migración de Base de Datos

Ejecuta la migración SQL para crear la tabla de usuarios autorizados:

```bash
# Opción 1: Usando Supabase CLI
supabase db push

# Opción 2: Manualmente desde el dashboard
# Ve a SQL Editor en Supabase Dashboard y ejecuta el contenido de:
# supabase/migrations/001_create_authorized_users.sql
```

O manualmente desde el dashboard:
1. Ve a **SQL Editor** en Supabase Dashboard
2. Crea una nueva query
3. Copia y pega el contenido de `supabase/migrations/001_create_authorized_users.sql`
4. Ejecuta la query

### 4. Configurar Usuarios Iniciales

La migración SQL ya incluye los 3 coordinadores iniciales:
- `elementaryenglish.elmanglar@gmail.com` (coordinador)
- `coordinacionprimariaciem@gmail.com` (coordinador)
- `ysabelzamora.elmanglar@gmail.com` (coordinador)

Para agregar el primer directivo:

1. Inicia sesión con una cuenta de Google que sea coordinador
2. Ve a **Usuarios Autorizados** en el menú (solo visible para directivos)
3. Agrega el correo del directivo con rol "directivo"
4. O ejecuta este SQL directamente:

```sql
INSERT INTO authorized_users (email, role) 
VALUES ('correo-directivo@ejemplo.com', 'directivo')
ON CONFLICT (email) DO NOTHING;
```

**Nota**: Inicialmente, solo los coordinadores pueden iniciar sesión. Un coordinador debe ser promovido a directivo manualmente en la base de datos, o puedes crear el primer directivo directamente desde SQL.

### 5. Configurar Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga:

```env
VITE_SUPABASE_URL=https://rnycynatrhxhbfpydqvd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJueWN5bmF0cmh4aGJmcHlkcXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzM2ODgsImV4cCI6MjA3ODY0OTY4OH0.92S_7OVwibBc-a8GaT63njhQGtRRiUj7_EyzYi2wCv4
```

## 🔒 Seguridad y Permisos

### Row Level Security (RLS)

La tabla `authorized_users` tiene RLS habilitado con las siguientes políticas:

1. **Lectura**: Todos los usuarios autenticados pueden leer la lista
2. **Escritura/Modificación**: Solo usuarios con rol "directivo" pueden agregar, editar o eliminar usuarios

### Flujo de Autenticación

1. Usuario hace clic en "Continuar con Google"
2. Se redirige a Google para autenticación
3. Google redirige de vuelta a Supabase con el token
4. Supabase crea/actualiza la sesión del usuario
5. La aplicación verifica si el email está en `authorized_users`
6. Si está autorizado: se le asigna el rol correspondiente y puede acceder
7. Si NO está autorizado: se muestra mensaje de "Acceso denegado" y se cierra la sesión

## 🧪 Pruebas

### Probar con un Usuario Autorizado

1. Asegúrate de que el correo esté en la tabla `authorized_users`
2. Inicia sesión con Google usando ese correo
3. Deberías ser redirigido al dashboard con el rol correspondiente

### Probar con un Usuario NO Autorizado

1. Intenta iniciar sesión con un correo que NO esté en `authorized_users`
2. Deberías ver el mensaje: "Acceso denegado. Tu correo electrónico no está autorizado..."

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa**: La URI de redirección no coincide con la configurada en Google Cloud Console, o falta agregar la URL de producción (Vercel) en los orígenes autorizados.

**Solución**:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Edita tu OAuth 2.0 Client ID
3. En **Authorized JavaScript origins**, asegúrate de tener:
   ```
   http://localhost:3000
   https://rnycynatrhxhbfpydqvd.supabase.co
   https://tu-proyecto.vercel.app
   https://*.vercel.app
   ```
   (Reemplaza `tu-proyecto.vercel.app` con tu URL real de Vercel)
4. En **Authorized redirect URIs**, debe haber SOLO UNA URI:
   ```
   https://rnycynatrhxhbfpydqvd.supabase.co/auth/v1/callback
   ```
5. Guarda los cambios
6. Espera unos minutos para que los cambios se propaguen
7. Intenta iniciar sesión nuevamente

**Nota**: La URL de redirección SIEMPRE debe ser la de Supabase, no la de Vercel. Vercel solo necesita estar en "Authorized JavaScript origins".

### Error: "Access denied" después de login

**Causa**: El correo no está en la tabla `authorized_users`.

**Solución**:
1. Verifica que el correo esté en la tabla:
   ```sql
   SELECT * FROM authorized_users WHERE email = 'correo@ejemplo.com';
   ```
2. Si no está, agrégalo (requiere ser directivo o ejecutar SQL directamente)

### Error: "Failed to fetch" en LoginScreen

**Causa**: Variables de entorno no configuradas o incorrectas.

**Solución**:
1. Verifica que `.env.local` tenga los valores correctos
2. Reinicia el servidor de desarrollo: `npm run dev`
3. Verifica en la consola del navegador si hay errores de CORS

### No puedo ver "Usuarios Autorizados" en el menú

**Causa**: Tu usuario no tiene rol "directivo".

**Solución**:
1. Verifica tu rol en la base de datos:
   ```sql
   SELECT email, role FROM authorized_users WHERE email = 'tu-correo@ejemplo.com';
   ```
2. Si no eres directivo, actualiza tu rol (requiere acceso directo a la BD o que otro directivo lo haga)

## 📝 Notas Importantes

- **Case-insensitive**: Los correos se almacenan en minúsculas para evitar duplicados
- **Rol por defecto**: Si un usuario se registra con Google pero no está en la whitelist, NO se le asigna ningún rol automáticamente
- **Sesiones**: Las sesiones se mantienen activas hasta que el usuario cierre sesión o expire el token
- **Seguridad**: Nunca expongas el Client Secret de Google en el frontend

## 🔄 Actualizar Roles

Para cambiar el rol de un usuario:

1. Como directivo, ve a **Usuarios Autorizados**
2. Haz clic en el icono de editar junto al usuario
3. Selecciona el nuevo rol
4. Guarda los cambios

O ejecuta SQL:

```sql
UPDATE authorized_users 
SET role = 'nuevo_rol' 
WHERE email = 'correo@ejemplo.com';
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Supabase Dashboard > Logs
2. Verifica la consola del navegador para errores
3. Consulta la [documentación de Supabase Auth](https://supabase.com/docs/guides/auth)

