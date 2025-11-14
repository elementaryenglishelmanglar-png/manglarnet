# 🔧 Crear la Tabla authorized_users Primero

## ⚠️ Problema

El error `relation "authorized_users" does not exist` significa que la tabla aún no se ha creado en la base de datos. Necesitas ejecutar la migración completa primero.

## ✅ Solución: Ejecutar la Migración Completa

### Paso 1: Abrir SQL Editor en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: **rnycynatrhxhbfpydqvd**
3. En el menú lateral izquierdo, haz clic en **SQL Editor**
4. Haz clic en **New Query** (botón verde en la parte superior)

### Paso 2: Copiar y Pegar la Migración Completa

Copia **TODO** el siguiente SQL y pégalo en el editor:

```sql
-- Create table for authorized users (whitelist)
-- This table stores emails that are allowed to access the system

CREATE TABLE IF NOT EXISTS authorized_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('docente', 'coordinador', 'directivo', 'administrativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);

-- Enable Row Level Security
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read authorized_users
CREATE POLICY "Users can read authorized_users" ON authorized_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only directivos can insert/update/delete authorized_users
CREATE POLICY "Directivos can manage authorized_users" ON authorized_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM authorized_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.role = 'directivo'
    )
  );

-- Insert initial authorized users (coordinadores)
INSERT INTO authorized_users (email, role) VALUES
  ('elementaryenglish.elmanglar@gmail.com', 'coordinador'),
  ('coordinacionprimariaciem@gmail.com', 'coordinador'),
  ('ysabelzamora.elmanglar@gmail.com', 'coordinador'),
  ('vargas199511@gmail.com', 'coordinador')
ON CONFLICT (email) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_authorized_users_updated_at
  BEFORE UPDATE ON authorized_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Paso 3: Ejecutar la Query

1. Haz clic en el botón **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
2. Espera a que termine la ejecución (debería tomar unos segundos)
3. Deberías ver un mensaje de éxito: **"Success. No rows returned"** o similar

### Paso 4: Verificar que la Tabla se Creó

Ejecuta esta query para verificar:

```sql
-- Verificar que la tabla existe y tiene datos
SELECT email, role, created_at 
FROM authorized_users 
ORDER BY email;
```

Deberías ver 4 usuarios listados:
- `coordinacionprimariaciem@gmail.com` - coordinador
- `elementaryenglish.elmanglar@gmail.com` - coordinador
- `vargas199511@gmail.com` - coordinador
- `ysabelzamora.elmanglar@gmail.com` - coordinador

## 🎯 Después de Crear la Tabla

Una vez que la tabla esté creada:

1. **Espera 10-30 segundos** para que los cambios se propaguen
2. **Limpia la caché del navegador** (Ctrl+Shift+Delete)
3. **Cierra sesión completamente** de Google si estás logueado
4. **Intenta iniciar sesión** con cualquiera de los correos autorizados

## 🐛 Si Hay Errores al Ejecutar la Migración

### Error: "policy already exists"

Si ves este error, significa que algunas partes ya se ejecutaron antes. En ese caso:

1. Ejecuta solo las partes que faltan, o
2. Ejecuta este SQL para eliminar las políticas existentes primero:

```sql
-- Eliminar políticas existentes (si es necesario)
DROP POLICY IF EXISTS "Users can read authorized_users" ON authorized_users;
DROP POLICY IF EXISTS "Directivos can manage authorized_users" ON authorized_users;

-- Luego ejecuta la migración completa de nuevo
```

### Error: "function already exists"

Si ves este error sobre la función, está bien, significa que ya existe. Continúa con el resto de la migración.

### Error: "trigger already exists"

Similar al anterior, si el trigger ya existe, está bien. La migración usa `CREATE OR REPLACE` y `IF NOT EXISTS` para evitar estos problemas.

## 📝 Nota Importante

**NO** ejecutes solo el `INSERT` sin crear la tabla primero. La tabla debe existir antes de poder insertar datos.

## ✅ Checklist

- [ ] Tabla `authorized_users` creada
- [ ] Índice creado
- [ ] Row Level Security habilitado
- [ ] Políticas creadas
- [ ] 4 usuarios coordinadores insertados
- [ ] Función y trigger creados
- [ ] Verificación exitosa con SELECT

