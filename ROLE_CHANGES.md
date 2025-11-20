# Cambios en el Sistema de Roles

## Resumen de Cambios

Se ha eliminado el rol `super_admin` y se han elevado los permisos del rol `coordinador` para tener acceso completo a toda la plataforma.

---

## Roles Actualizados

### 🟢 Docente (Sin cambios)
**Permisos:**
- Ver estudiantes, profesores, clases
- Crear/editar sus propias planificaciones
- Ver horarios
- Crear evaluaciones
- Ver calendario

---

### 🔵 Coordinador (PERMISOS AMPLIADOS)
**Permisos COMPLETOS:**
- ✅ **Estudiantes:** Ver, crear, editar, eliminar
- ✅ **Profesores:** Ver, crear, editar, eliminar
- ✅ **Clases:** Ver, crear, editar, eliminar
- ✅ **Planificaciones:** Ver, crear, editar, eliminar, aprobar
- ✅ **Horarios:** Ver, crear, editar, eliminar
- ✅ **Evaluaciones:** Ver, crear, editar, eliminar
- ✅ **Calendario:** Ver, crear, editar, eliminar
- ✅ **Usuarios:** Ver, crear, editar, eliminar
- ✅ **Sistema:** Administración completa

**Cambios:**
- ❌ Antes: Permisos limitados (solo editar estudiantes y clases)
- ✅ Ahora: **Permisos completos en toda la plataforma**

---

### 🟡 Directivo (Sin cambios significativos)
**Permisos:**
- Ver, crear, editar, eliminar estudiantes, profesores, clases
- Aprobar planificaciones
- Gestión completa de horarios, evaluaciones, calendario
- Ver, crear, editar usuarios (no eliminar)

**Nota:** Los directivos mantienen sus permisos pero ahora los coordinadores tienen los mismos permisos.

---

### ❌ Super Admin (ELIMINADO)
Este rol ha sido completamente removido del sistema.

---

## Archivos Modificados

### 1. Database Migration
**Archivo:** `supabase/migrations/030_unified_auth_system.sql`

**Cambios:**
- Eliminado `super_admin` de la restricción CHECK en `role_permissions`
- Eliminado `super_admin` de la restricción CHECK en `usuarios`
- Actualizado permisos de `coordinador` para incluir TODOS los permisos
- Actualizadas todas las políticas RLS para dar acceso a `coordinador`

**Antes:**
```sql
role TEXT CHECK (role IN ('docente', 'coordinador', 'directivo', 'super_admin'))
```

**Después:**
```sql
role TEXT CHECK (role IN ('docente', 'coordinador', 'directivo'))
```

**Permisos de Coordinador - Antes:**
```sql
('coordinador', ARRAY[
  'students.view', 'students.edit',
  'teachers.view',
  'classes.view', 'classes.edit',
  -- ... permisos limitados
])
```

**Permisos de Coordinador - Después:**
```sql
('coordinador', ARRAY[
  'students.view', 'students.create', 'students.edit', 'students.delete',
  'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',
  'classes.view', 'classes.create', 'classes.edit', 'classes.delete',
  'plans.view', 'plans.create', 'plans.edit', 'plans.delete', 'plans.approve',
  'schedules.view', 'schedules.create', 'schedules.edit', 'schedules.delete',
  'evaluations.view', 'evaluations.create', 'evaluations.edit', 'evaluations.delete',
  'calendar.view', 'calendar.create', 'calendar.edit', 'calendar.delete',
  'users.view', 'users.create', 'users.edit', 'users.delete',
  'system.admin'
])
```

---

### 2. TypeScript Types
**Archivo:** `services/authService.ts`

**Cambios:**
```typescript
// Antes
role: 'docente' | 'coordinador' | 'directivo' | 'super_admin';

// Después
role: 'docente' | 'coordinador' | 'directivo';
```

---

### 3. Admin Setup Script
**Archivo:** `supabase/migrations/031_setup_admin_user.sql`

**Cambios:**
- El usuario admin ahora se crea con rol `coordinador` en lugar de `super_admin`
- Comentarios actualizados para reflejar que coordinador tiene permisos completos

**Antes:**
```sql
role: 'super_admin',  -- Role
```

**Después:**
```sql
role: 'coordinador',  -- Role (coordinador has full permissions)
```

---

## Políticas RLS Actualizadas

Todas las políticas que antes requerían `super_admin` ahora aceptan `coordinador`:

### Ejemplos:

**Gestión de usuarios:**
```sql
-- Antes
AND u.role = 'super_admin'

-- Después
AND u.role IN ('coordinador', 'directivo')
```

**Gestión de planificaciones:**
```sql
-- Antes
OR auth.user_role() IN ('coordinador', 'directivo', 'super_admin')

-- Después
OR auth.user_role() IN ('coordinador', 'directivo')
```

**Gestión de horarios, evaluaciones, calendario, etc:**
- Todas actualizadas para incluir `coordinador` con permisos completos

---

## Migración de Usuarios Existentes

Si tienes usuarios con rol `super_admin`, debes actualizarlos:

```sql
-- Cambiar super_admin a coordinador
UPDATE usuarios 
SET role = 'coordinador' 
WHERE role = 'super_admin';
```

**Nota:** Esto es seguro porque coordinador ahora tiene todos los permisos que tenía super_admin.

---

## Impacto en la Aplicación

### ✅ Lo que FUNCIONA igual:
- Login sigue funcionando normalmente
- Permisos de docentes sin cambios
- Permisos de directivos sin cambios
- Todas las funcionalidades existentes

### ✨ Lo que MEJORA:
- **Coordinadores ahora tienen acceso completo** a toda la plataforma
- Pueden gestionar usuarios (crear, editar, eliminar)
- Pueden eliminar estudiantes, profesores, clases
- Tienen acceso a administración del sistema
- Simplificación del sistema de roles (3 roles en lugar de 4)

### ⚠️ Lo que debes VERIFICAR:
- Si tienes usuarios con rol `super_admin`, cámbialos a `coordinador`
- Verifica que los coordinadores puedan acceder a todas las funciones
- Actualiza cualquier documentación que mencione `super_admin`

---

## Próximos Pasos

1. **Ejecutar la migración actualizada:**
   ```bash
   # En Supabase Dashboard > SQL Editor
   # Ejecutar: 030_unified_auth_system.sql
   ```

2. **Actualizar usuarios existentes:**
   ```sql
   UPDATE usuarios SET role = 'coordinador' WHERE role = 'super_admin';
   ```

3. **Crear usuario admin:**
   ```bash
   # Seguir instrucciones en: 031_setup_admin_user.sql
   # El usuario se creará con rol 'coordinador'
   ```

4. **Verificar permisos:**
   ```sql
   -- Ver permisos de coordinador
   SELECT * FROM role_permissions WHERE role = 'coordinador';
   ```

---

## Comparación de Permisos

| Permiso | Docente | Coordinador | Directivo |
|---------|---------|-------------|-----------|
| **Estudiantes** |
| Ver | ✅ | ✅ | ✅ |
| Crear | ❌ | ✅ | ✅ |
| Editar | ❌ | ✅ | ✅ |
| Eliminar | ❌ | ✅ | ✅ |
| **Profesores** |
| Ver | ✅ | ✅ | ✅ |
| Crear | ❌ | ✅ | ✅ |
| Editar | ❌ | ✅ | ✅ |
| Eliminar | ❌ | ✅ | ✅ |
| **Planificaciones** |
| Ver | ✅ | ✅ | ✅ |
| Crear | ✅ | ✅ | ❌ |
| Editar | ✅ (propias) | ✅ | ❌ |
| Eliminar | ❌ | ✅ | ❌ |
| Aprobar | ❌ | ✅ | ✅ |
| **Usuarios** |
| Ver | ❌ | ✅ | ✅ |
| Crear | ❌ | ✅ | ✅ |
| Editar | ❌ | ✅ | ✅ |
| Eliminar | ❌ | ✅ | ❌ |
| **Sistema** |
| Admin | ❌ | ✅ | ❌ |

---

## Resumen

✅ **Eliminado:** Rol `super_admin`
✅ **Elevado:** Coordinadores ahora tienen permisos completos
✅ **Simplificado:** Sistema de 3 roles en lugar de 4
✅ **Mantenido:** Permisos de docentes y directivos sin cambios
✅ **Actualizado:** Todas las políticas RLS y tipos TypeScript
