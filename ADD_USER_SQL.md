# 🔧 Agregar Usuario Faltante a la Base de Datos

## ⚠️ IMPORTANTE: Verificar que la Tabla Existe Primero

**Si ves el error**: `relation "authorized_users" does not exist`

**Entonces necesitas crear la tabla primero**. Ve a [CREATE_TABLE_FIRST.md](./CREATE_TABLE_FIRST.md) y sigue esas instrucciones.

---

## Problema

El usuario `vargas199511@gmail.com` no está en la tabla `authorized_users`, por lo que no puede iniciar sesión.

**Nota**: Si la tabla no existe, primero debes ejecutar la migración completa (ver CREATE_TABLE_FIRST.md).

## ✅ Solución: Agregar Usuario mediante SQL

### Opción 1: Desde Supabase Dashboard (Más Fácil)

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: **rnycynatrhxhbfpydqvd**
3. Ve a **SQL Editor** en el menú lateral
4. Haz clic en **New Query**
5. Copia y pega este SQL:

```sql
-- Agregar usuario coordinador faltante
INSERT INTO authorized_users (email, role) VALUES
  ('vargas199511@gmail.com', 'coordinador')
ON CONFLICT (email) DO UPDATE
SET role = 'coordinador';
```

6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Deberías ver un mensaje de éxito: "Success. No rows returned"

### Opción 2: Verificar Usuarios Existentes

Para verificar qué usuarios están en la base de datos:

```sql
-- Ver todos los usuarios autorizados
SELECT email, role, created_at 
FROM authorized_users 
ORDER BY email;
```

### Opción 3: Agregar Múltiples Usuarios

Si necesitas agregar varios usuarios a la vez:

```sql
-- Agregar múltiples usuarios coordinadores
INSERT INTO authorized_users (email, role) VALUES
  ('vargas199511@gmail.com', 'coordinador'),
  ('otro-correo@gmail.com', 'coordinador')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role;
```

## 🔍 Verificar que Funcionó

Después de ejecutar el SQL, verifica que el usuario fue agregado:

```sql
-- Verificar usuarios específicos
SELECT email, role 
FROM authorized_users 
WHERE email IN (
  'vargas199511@gmail.com',
  'elementaryenglish.elmanglar@gmail.com'
)
ORDER BY email;
```

Deberías ver ambos usuarios listados con rol "coordinador".

## 📋 Lista de Usuarios que Deberían Estar

Según la migración inicial y los requerimientos:

### Coordinadores:
- ✅ `elementaryenglish.elmanglar@gmail.com` (ya está en la migración)
- ✅ `coordinacionprimariaciem@gmail.com` (ya está en la migración)
- ✅ `ysabelzamora.elmanglar@gmail.com` (ya está en la migración)
- ⚠️ `vargas199511@gmail.com` (necesita agregarse)

## 🐛 Si Aún No Funciona Después de Agregar el Usuario

1. **Limpia la caché del navegador** (Ctrl+Shift+Delete)
2. **Cierra sesión completamente** de Google
3. **Espera 1-2 minutos** para que los cambios se propaguen
4. **Intenta iniciar sesión nuevamente**
5. **Revisa la consola del navegador** para ver si hay otros errores

## 📝 Nota sobre Row Level Security (RLS)

Si después de agregar el usuario sigues viendo errores, puede ser un problema de permisos RLS. En ese caso, verifica que la política de lectura esté funcionando correctamente ejecutando:

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'authorized_users';
```

Deberías ver una política que permita a usuarios autenticados leer la tabla.

