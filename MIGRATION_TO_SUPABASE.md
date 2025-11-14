# 🚀 Guía de Migración a Supabase

Esta guía te ayudará a migrar todos los datos de localStorage a Supabase.

## 📋 Pasos para Completar la Migración

### Paso 1: Ejecutar las Migraciones SQL en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: **rnycynatrhxhbfpydqvd**
3. Ve a **SQL Editor**
4. Haz clic en **New Query**

#### 1.1. Ejecutar Migración de Tablas Principales

Copia y pega el contenido completo de `supabase/migrations/004_create_main_tables.sql` y ejecútalo.

Esta migración crea:
- ✅ Tabla `alumnos` (estudiantes)
- ✅ Tabla `docentes` (profesores)
- ✅ Tabla `clases` (clases/materias)
- ✅ Tabla `planificaciones` (planificaciones de clase)
- ✅ Tabla `horarios` (horarios semanales)
- ✅ Tabla `minutas_evaluacion` (minutas de evaluación)
- ✅ Tabla `notificaciones` (notificaciones del sistema)
- ✅ Todas las políticas RLS (Row Level Security)
- ✅ Índices para optimizar consultas
- ✅ Triggers para actualizar `updated_at`

### Paso 2: Verificar que las Tablas se Crearon

Ejecuta este SQL para verificar:

```sql
-- Verificar todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'alumnos', 
  'docentes', 
  'clases', 
  'planificaciones', 
  'horarios', 
  'minutas_evaluacion', 
  'notificaciones'
)
ORDER BY table_name;
```

Deberías ver 7 tablas listadas.

### Paso 3: Verificar Políticas RLS

```sql
-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN (
  'alumnos', 
  'docentes', 
  'clases', 
  'planificaciones', 
  'horarios', 
  'minutas_evaluacion', 
  'notificaciones'
)
ORDER BY tablename, cmd;
```

### Paso 4: Desplegar los Cambios del Código

1. **Hacer commit y push de los cambios:**
   ```bash
   git add .
   git commit -m "Migrar datos de localStorage a Supabase"
   git push
   ```

2. **Esperar el despliegue en Vercel** (automático)

### Paso 5: Probar la Aplicación

1. Ve a tu aplicación en Vercel
2. Inicia sesión con Google
3. Verifica que los datos se carguen correctamente
4. Prueba crear, editar y eliminar:
   - Alumnos
   - Docentes
   - Planificaciones
   - Etc.

## 🔄 Migración de Datos Existentes (Opcional)

Si tienes datos importantes en localStorage que quieres migrar:

### Opción 1: Migración Manual

1. Abre la consola del navegador (F12)
2. Ejecuta este código para exportar tus datos:

```javascript
// Exportar datos de localStorage
const exportData = {
  alumnos: JSON.parse(localStorage.getItem('manglarnet_alumnos') || '[]'),
  docentes: JSON.parse(localStorage.getItem('manglarnet_docentes') || '[]'),
  clases: JSON.parse(localStorage.getItem('manglarnet_clases') || '[]'),
  planificaciones: JSON.parse(localStorage.getItem('manglarnet_planificaciones') || '[]'),
  minutas: JSON.parse(localStorage.getItem('manglarnet_minutas') || '[]'),
  notifications: JSON.parse(localStorage.getItem('manglarnet_notifications') || '[]')
};
console.log(JSON.stringify(exportData, null, 2));
// Copia el resultado y guárdalo
```

3. Luego puedes crear un script SQL para insertar estos datos en Supabase

### Opción 2: Empezar desde Cero

Simplemente empieza a usar la aplicación y los datos se guardarán automáticamente en Supabase.

## 🔒 Seguridad y Permisos

Las políticas RLS configuradas son:

- **Lectura**: Todos los usuarios autenticados pueden leer todas las tablas
- **Escritura**:
  - **Alumnos, Docentes, Clases, Horarios, Minutas**: Solo coordinadores y directivos
  - **Planificaciones**: Docentes pueden crear/editar las suyas; coordinadores/directivos pueden ver todas
  - **Notificaciones**: Coordinadores/directivos pueden crear; usuarios pueden leer las suyas

## 🐛 Solución de Problemas

### Error: "relation does not exist"

**Solución**: Ejecuta la migración `004_create_main_tables.sql` primero.

### Error: "permission denied"

**Solución**: Verifica que las políticas RLS estén creadas correctamente (Paso 3).

### Los datos no se cargan

**Solución**: 
1. Verifica la consola del navegador para errores
2. Verifica que las variables de entorno de Supabase estén configuradas en Vercel
3. Verifica que estés autenticado correctamente

### Los cambios no se guardan

**Solución**:
1. Verifica que tengas los permisos correctos (coordinador o directivo)
2. Revisa la consola del navegador para errores específicos
3. Verifica que las políticas RLS permitan la operación

## ✅ Checklist de Verificación

- [ ] Migración SQL ejecutada exitosamente
- [ ] 7 tablas creadas y verificadas
- [ ] Políticas RLS configuradas
- [ ] Código desplegado en Vercel
- [ ] Aplicación carga datos desde Supabase
- [ ] Puedo crear/editar/eliminar datos
- [ ] Los cambios persisten después de refrescar
- [ ] Los datos son accesibles desde otros dispositivos

## 📝 Notas Importantes

1. **Los datos ahora están en la nube**: Accesibles desde cualquier dispositivo
2. **Backup automático**: Supabase hace backups automáticos de tu base de datos
3. **Colaboración**: Todos los usuarios autorizados ven los mismos datos
4. **Seguridad**: Los datos están protegidos con Row Level Security

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará completamente migrada a Supabase y todos los datos estarán en la nube, accesibles desde cualquier dispositivo.

