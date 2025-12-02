# Aplicar Migración 051 - Corregir Políticas RLS

## ⚠️ IMPORTANTE: Este error se soluciona aplicando la migración 051

El error "new row violates row-level security policy for table 'resumen_evaluacion_alumno'" ocurre porque las políticas RLS no están configuradas correctamente para las tablas de evaluación.

## Pasos para aplicar la migración:

### Opción 1: Dashboard de Supabase (Recomendado)

1. **Abre el Dashboard de Supabase:**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Ve al SQL Editor:**
   - En el menú lateral, haz clic en "SQL Editor"
   - O usa el atajo: https://supabase.com/dashboard/project/_/sql

3. **Crea una nueva query:**
   - Haz clic en "New query" o el botón "+"

4. **Copia y pega el contenido completo del archivo:**
   ```
   supabase/migrations/051_fix_evaluation_tables_rls.sql
   ```

5. **Ejecuta la query:**
   - Haz clic en "Run" o presiona `Cmd/Ctrl + Enter`
   - Deberías ver un mensaje de éxito

6. **Verifica que funcionó:**
   - Intenta guardar una minuta nuevamente
   - El error debería desaparecer

### Opción 2: Usando Supabase CLI (Si está configurado)

```bash
# Si tienes el proyecto vinculado
supabase db push

# O ejecutar la migración específica
supabase migration up
```

## ¿Qué hace esta migración?

- **Añade políticas RLS** para `resumen_evaluacion_alumno`:
  - Coordinadores/directivos: Pueden gestionar todos los resúmenes
  - Docentes: Pueden ver todos y gestionar los de sus propias evaluaciones

- **Añade políticas RLS** para `detalle_evaluacion_alumno`:
  - Coordinadores/directivos: Pueden gestionar todos los detalles
  - Docentes: Pueden ver todos y gestionar los de sus propias evaluaciones

## Nota adicional

También se actualizó el código para incluir `created_by` al crear minutas, lo que permite que las políticas RLS funcionen correctamente para docentes.

