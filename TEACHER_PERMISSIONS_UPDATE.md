# Actualización de Permisos de Docentes

## Cambio Realizado

Los permisos de los **docentes** han sido actualizados para reflejar un acceso más restrictivo.

---

## Permisos de Docente (Actualizados)

### ✅ Puede VER (solo lectura):
- Estudiantes
- Profesores
- Clases
- Horarios
- Evaluaciones
- Calendario

### ✅ Puede CREAR y EDITAR:
- **Planificaciones** (solo las propias)

### ❌ NO puede acceder:
- Gestión de usuarios
- Crear/editar estudiantes, profesores, clases
- Crear/editar horarios
- Crear/editar evaluaciones
- Crear/editar eventos de calendario

---

## Comparación

### Antes:
```sql
'students.view',
'teachers.view',
'classes.view',
'plans.view', 'plans.create', 'plans.edit',
'schedules.view',
'evaluations.view', 'evaluations.create',  ← Podía crear evaluaciones
'calendar.view'
```

### Después:
```sql
'students.view',
'teachers.view',
'classes.view',
'plans.view', 'plans.create', 'plans.edit',
'schedules.view',
'evaluations.view',  ← Solo ver (sin crear)
'calendar.view'
```

---

## Tabla de Permisos Actualizada

| Recurso | Docente | Coordinador | Directivo |
|---------|---------|-------------|-----------|
| **Estudiantes** | Ver | Todo | Todo |
| **Profesores** | Ver | Todo | Todo |
| **Clases** | Ver | Todo | Todo |
| **Planificaciones** | Ver + Crear/Editar propias | Todo | Aprobar |
| **Horarios** | Ver | Todo | Todo |
| **Evaluaciones** | Ver | Todo | Todo |
| **Calendario** | Ver | Todo | Todo |
| **Usuarios** | ❌ | Todo | Ver/Crear/Editar |

---

## Políticas RLS

Las políticas RLS ya están configuradas correctamente:

- **Planificaciones:** Los docentes solo pueden crear/editar sus propias planificaciones
- **Otros recursos:** Los docentes tienen acceso de solo lectura

No se requieren cambios adicionales en las políticas RLS.

---

## Impacto

✅ **Docentes pueden:**
- Ver toda la información de la plataforma
- Crear y editar sus propias planificaciones
- Ver horarios, evaluaciones, calendario

❌ **Docentes NO pueden:**
- Crear evaluaciones (solo ver)
- Modificar estudiantes, profesores, clases
- Gestionar usuarios
- Modificar horarios o calendario
