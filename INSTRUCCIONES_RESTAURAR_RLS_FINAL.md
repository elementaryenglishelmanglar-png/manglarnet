# 🔐 Restaurar RLS con Políticas Correctas

## ✅ Estado Actual

- ✅ La vista de Evaluación funciona correctamente
- ✅ Todos los componentes usan shadcn/ui
- ✅ RLS está deshabilitado temporalmente (workaround)
- ✅ El rol `super_admin` ha sido eliminado
- ✅ El rol `coordinador` tiene los mismos permisos que `directivo`

## 🎯 Próximo Paso: Restaurar RLS

Ahora que todo funciona correctamente, es momento de restaurar RLS (Row Level Security) con las políticas correctas para asegurar la seguridad de los datos.

## 📋 Instrucciones

### Paso 1: Ejecutar el Script de Restauración

1. Ve a **Supabase Dashboard > SQL Editor**
2. Abre el archivo: **`RESTAURAR_RLS_TODAS_TABLAS.sql`**
3. **Copia TODO el contenido** del archivo
4. Pega el contenido en el SQL Editor de Supabase
5. Haz clic en **"Run"** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### Paso 2: Verificar que se Ejecutó Correctamente

Después de ejecutar el script, deberías ver:

1. **Mensajes de confirmación** en la consola de Supabase indicando que RLS se restauró en cada tabla
2. **Una tabla de verificación** al final mostrando el estado de RLS en las tablas principales

### Paso 3: Probar el Sistema

1. **Recarga completamente la página** (Ctrl+Shift+R o Cmd+Shift+R)
2. **Inicia sesión** con:
   - Usuario: `frikiander`
   - Contraseña: `luisaF.9`
3. **Verifica que:**
   - ✅ Puedes iniciar sesión correctamente
   - ✅ Los datos se cargan (alumnos, docentes, clases, etc.)
   - ✅ Puedes navegar por todas las secciones
   - ✅ La vista de Evaluación funciona
   - ✅ Puedes crear y editar datos (si eres coordinador o directivo)

## 🔐 Políticas RLS Implementadas

### Tabla `usuarios`
- ✅ **Usuarios autenticados** pueden leer su propio registro (necesario para login)
- ✅ **Coordinadores y Directivos** pueden leer y gestionar todos los usuarios

### Tablas de Datos (alumnos, docentes, clases, horarios, etc.)
- ✅ **Coordinadores y Directivos** tienen acceso completo (SELECT, INSERT, UPDATE, DELETE)
- ✅ **Docentes** pueden leer sus propios datos y gestionar sus planificaciones

### Tabla `planificaciones`
- ✅ **Docentes** pueden gestionar sus propias planificaciones
- ✅ **Coordinadores y Directivos** pueden gestionar todas las planificaciones

### Tabla `notificaciones`
- ✅ **Usuarios** pueden leer sus propias notificaciones
- ✅ **Coordinadores y Directivos** pueden crear notificaciones y leer todas

## ⚠️ Si Algo No Funciona

Si después de restaurar RLS encuentras problemas:

1. **Verifica en la consola del navegador** (F12) si hay errores de permisos
2. **Verifica tu rol** en la tabla `usuarios`:
   ```sql
   SELECT id, username, email, role, is_active 
   FROM usuarios 
   WHERE username = 'frikiander';
   ```
3. **Verifica las políticas RLS**:
   ```sql
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'usuarios'
   ORDER BY policyname;
   ```

## 📝 Notas Importantes

- **El rol `super_admin` ha sido eliminado** - Ya no existe en el sistema
- **El rol `coordinador` tiene acceso completo** - Igual que `directivo`
- **RLS está habilitado** - Esto es importante para la seguridad de los datos
- **Las políticas son específicas** - Cada tabla tiene políticas que permiten acceso según el rol

## ✅ Después de Restaurar RLS

Una vez que RLS esté restaurado y verificado:

1. ✅ El sistema estará completamente funcional y seguro
2. ✅ Los datos estarán protegidos por políticas RLS
3. ✅ Cada rol tendrá los permisos correctos
4. ✅ El sistema estará listo para producción

---

**¿Listo para restaurar RLS?** Ejecuta el script `RESTAURAR_RLS_TODAS_TABLAS.sql` en Supabase Dashboard > SQL Editor.

