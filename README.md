<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ManglarNet - Conexión Pedagógica

Sistema de gestión pedagógica con integración de IA para planificaciones y análisis de evaluaciones.

## 🚀 Características

- **Autenticación con Usuario y Contraseña**: Sistema seguro de login con autenticación propia
- **Sistema de Whitelist**: Control de acceso mediante lista de usuarios autorizados
- **Gestión de Roles**: Roles diferenciados (Directivo, Coordinador, Docente, Administrativo)
- **Gestión de Alumnos**: Registro completo de información estudiantil
- **Gestión de Docentes**: Administración de personal docente
- **Planificaciones**: Creación y revisión de planificaciones de clase con sugerencias de IA
- **Horarios**: Gestión de horarios de clases y equipos
- **Evaluaciones**: Análisis de evaluaciones con IA para identificar patrones y sugerir acciones
- **Dashboard**: Vista general del sistema con estadísticas y notificaciones

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase (para hosting y autenticación)
- API Key de Google Gemini (para funcionalidades de IA)

## 🛠️ Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd manglarnet---conexión-pedagógica
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Configurar el primer usuario administrador**
   
   Ejecuta las migraciones SQL en Supabase Dashboard (SQL Editor):
   - `supabase/migrations/026_create_custom_auth_system.sql`
   - `supabase/migrations/027_create_super_admin.sql`
   
   Luego crea el primer usuario super administrador siguiendo las instrucciones en la migración 027.

5. **Ejecutar migraciones de base de datos**
   
   Ejecuta la migración SQL para crear la tabla de usuarios autorizados:
   ```bash
   # Desde Supabase Dashboard > SQL Editor, ejecuta:
   # supabase/migrations/001_create_authorized_users.sql
   ```

6. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 🚀 Despliegue en Supabase

### Paso 1: Crear proyecto en Supabase

1. Ve a [Supabase](https://supabase.com) y crea una cuenta o inicia sesión
2. Crea un nuevo proyecto
3. Anota tu **Project URL** y **anon key** desde Settings > API

### Paso 2: Configurar Sistema de Autenticación

1. Ejecuta las migraciones SQL en Supabase Dashboard (SQL Editor):
   - `supabase/migrations/026_create_custom_auth_system.sql` - Crea la tabla usuarios y sistema de autenticación
   - `supabase/migrations/027_create_super_admin.sql` - Crea función para super administrador
   - `supabase/migrations/028_update_rls_policies_for_usuarios.sql` - Actualiza políticas RLS

2. Crea el primer usuario super administrador:
   - Ve a Supabase Dashboard > Authentication > Users
   - Crea un nuevo usuario con email y contraseña
   - Copia el User UID
   - Ejecuta en SQL Editor:
     ```sql
     SELECT create_super_admin_user(
       'USER_UID_AQUI'::UUID,
       'admin',
       'admin@manglarnet.local'
     );
     ```

### Paso 3: Configurar Edge Function para Gemini API

1. **Instalar Supabase CLI** (si no lo tienes):
   ```bash
   npm install -g supabase
   ```

2. **Iniciar sesión en Supabase CLI**:
   ```bash
   supabase login
   ```

3. **Vincular tu proyecto**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Configurar el secreto de Gemini API**:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
   ```

5. **Desplegar la Edge Function**:
   ```bash
   supabase functions deploy gemini-api
   ```

### Paso 4: Configurar variables de entorno en Supabase

En el dashboard de Supabase, ve a **Project Settings > Edge Functions** y asegúrate de que el secreto `GEMINI_API_KEY` esté configurado.

### Paso 4: Desplegar el frontend

Supabase puede hostear tu aplicación frontend de varias maneras:

#### Opción A: Usando Supabase Hosting (Recomendado)

1. **Construir la aplicación**:
   ```bash
   npm run build
   ```

2. **Inicializar Supabase Hosting** (si es la primera vez):
   ```bash
   supabase init
   ```

3. **Desplegar**:
   ```bash
   supabase functions deploy
   # O usa la interfaz web de Supabase para subir la carpeta dist/
   ```

#### Opción B: Usando Vercel/Netlify

1. **Construir la aplicación**:
   ```bash
   npm run build
   ```

2. **Configurar variables de entorno** en tu plataforma de hosting:
   - `VITE_SUPABASE_URL`: Tu URL de proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Tu anon key de Supabase

3. **Desplegar la carpeta `dist/`**

### Paso 5: Configurar CORS (si es necesario)

Si tienes problemas de CORS, asegúrate de que tu dominio esté agregado en:
- Supabase Dashboard > Settings > API > CORS settings

## 📁 Estructura del Proyecto

```
manglarnet---conexión-pedagógica/
├── components/          # Componentes React reutilizables
├── services/           # Servicios (API, etc.)
│   └── geminiService.ts # Servicio para llamadas a Gemini API
├── supabase/
│   ├── functions/      # Supabase Edge Functions
│   │   └── gemini-api/ # Edge Function para Gemini API
│   └── config.toml     # Configuración de Supabase
├── App.tsx             # Componente principal
├── index.tsx           # Punto de entrada
├── index.html          # HTML principal
├── vite.config.ts      # Configuración de Vite
└── package.json        # Dependencias del proyecto
```

## 🔒 Seguridad

- **Autenticación**: Sistema de whitelist que solo permite acceso a usuarios previamente autorizados
- **Roles y Permisos**: Control de acceso basado en roles (Directivo, Coordinador, Docente, Administrativo)
- **API Keys**: La API key de Gemini está protegida en Supabase Edge Functions y nunca se expone al frontend
- **Variables de entorno**: Nunca commitees archivos `.env.local` o `.env` con credenciales reales
- **CORS**: Configurado correctamente para permitir solo dominios autorizados
- **Row Level Security**: La tabla de usuarios autorizados tiene RLS habilitado para proteger los datos

## 🐛 Solución de Problemas

### Error: "GEMINI_API_KEY not configured"
- Asegúrate de haber configurado el secreto en Supabase:
  ```bash
  supabase secrets set GEMINI_API_KEY=your-key
  ```

### Error: "Failed to fetch" en llamadas a Edge Functions
- Verifica que la Edge Function esté desplegada
- Verifica que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas correctamente
- Revisa la consola del navegador para más detalles

### Error de CORS
- Agrega tu dominio a la lista de CORS permitidos en Supabase Dashboard

## 📝 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la build de producción

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 📞 Soporte

Para soporte, contacta al equipo de desarrollo.

---

**Nota**: Este proyecto fue migrado para funcionar con Supabase. Las API keys de Gemini ahora están protegidas en Edge Functions del lado del servidor.
