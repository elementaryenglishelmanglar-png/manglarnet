# 🚀 Ejecutar Migración de Lógica de Inglés

## ⚠️ IMPORTANTE: Ejecuta esta migración antes de usar la funcionalidad de inglés

La tabla `asignacion_docente_nivel_ingles` y otras tablas relacionadas necesitan ser creadas en Supabase.

## 📋 Pasos para Ejecutar la Migración

### Paso 1: Acceder al SQL Editor de Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú lateral izquierdo)
4. Haz clic en **New Query** (botón verde en la esquina superior derecha)

### Paso 2: Ejecutar la Migración

1. Abre el archivo: `supabase/migrations/012_ingles_primaria_logic.sql`
2. **Copia TODO el contenido** del archivo
3. Pégalo en el editor SQL de Supabase
4. Haz clic en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
5. Deberías ver: **"Success. No rows returned"**

### Paso 3: Verificar que las Tablas se Crearon

Ejecuta este SQL para verificar:

```sql
-- Verificar que las nuevas tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'asignacion_docente_nivel_ingles',
  'asignacion_aula_nivel_ingles',
  'configuracion_ingles_primaria'
)
ORDER BY table_name;
```

Deberías ver 3 tablas listadas.

### Paso 4: Verificar que las Columnas de Clases se Agregaron

Ejecuta este SQL para verificar los campos de inglés en la tabla `clases`:

```sql
-- Verificar columnas de inglés en tabla clases
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clases'
AND column_name IN (
  'nivel_ingles',
  'skill_rutina',
  'es_ingles_primaria',
  'es_proyecto'
)
ORDER BY column_name;
```

Deberías ver 4 columnas listadas.

### Paso 5: Verificar las Políticas RLS

Ejecuta este SQL para verificar las políticas:

```sql
-- Verificar políticas RLS para las nuevas tablas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN (
  'asignacion_docente_nivel_ingles',
  'asignacion_aula_nivel_ingles',
  'configuracion_ingles_primaria'
)
ORDER BY tablename, cmd;
```

## ✅ Verificación Completa

Ejecuta este SQL completo para verificar todo:

```sql
-- Verificación completa de la migración de inglés
SELECT 
  'Tablas creadas' as tipo,
  COUNT(*) as cantidad
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'asignacion_docente_nivel_ingles',
  'asignacion_aula_nivel_ingles',
  'configuracion_ingles_primaria'
)

UNION ALL

SELECT 
  'Columnas en clases' as tipo,
  COUNT(*) as cantidad
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clases'
AND column_name IN (
  'nivel_ingles',
  'skill_rutina',
  'es_ingles_primaria',
  'es_proyecto'
)

UNION ALL

SELECT 
  'Políticas RLS' as tipo,
  COUNT(*) as cantidad
FROM pg_policies 
WHERE tablename IN (
  'asignacion_docente_nivel_ingles',
  'asignacion_aula_nivel_ingles',
  'configuracion_ingles_primaria'
);
```

Deberías ver:
- **Tablas creadas**: 3
- **Columnas en clases**: 4
- **Políticas RLS**: 6 (2 políticas por tabla: SELECT y ALL)

## 🎯 Después de Ejecutar la Migración

Una vez ejecutada la migración, deberías poder:

1. ✅ Agregar docentes de inglés con niveles (Basic, Lower, Upper)
2. ✅ Asignar niveles automáticamente a 5to y 6to grado
3. ✅ Ver las aulas de primaria creadas automáticamente
4. ✅ Configurar la asignación de docentes por nivel

## 🐛 Si Aparece un Error

### Error: "relation already exists"
**Solución**: La migración ya fue ejecutada. Puedes continuar.

### Error: "permission denied"
**Solución**: Asegúrate de estar usando una cuenta con permisos de administrador en Supabase.

### Error: "column already exists"
**Solución**: Algunas columnas ya existen. La migración usa `IF NOT EXISTS`, así que debería continuar.

## 📝 Notas Importantes

- Las aulas de primaria se crearán automáticamente si no existen
- Las tablas tienen políticas RLS activas
- Los campos de inglés en `clases` son opcionales (NULL permitido)

