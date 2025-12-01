# 🚀 FASE 1 COMPLETADA - Guía de Ejecución

## ✅ Archivos Creados

### Migraciones SQL (Supabase)
1. **`046_create_analytics_infrastructure.sql`** - Infraestructura principal
   - 3 tablas nuevas
   - 1 función de cálculo de riesgo
   - 1 vista de telemetría
   - Políticas RLS y triggers

2. **`047_seed_historical_data.sql`** - Datos históricos
   - Función de población de datos
   - Trigger automático para actualizaciones

3. **`verify_analytics_infrastructure.sql`** - Script de testing
   - 8 tests automatizados
   - Verificación de integridad

### Documentación
4. **`ANALYTICS_PLATFORM_README.md`** - Documentación completa
5. **`implementation_plan.md`** - Plan de implementación detallado
6. **`task.md`** - Checklist de tareas

---

## 📋 Pasos para Ejecutar (IMPORTANTE)

### Opción A: Supabase Dashboard (Recomendado para Producción)

1. **Ir a Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/[tu-proyecto]
   - Navegar a: SQL Editor

2. **Ejecutar Migración 046**
   ```
   - Abrir archivo: supabase/migrations/046_create_analytics_infrastructure.sql
   - Copiar TODO el contenido
   - Pegar en SQL Editor
   - Click en "Run" (o Ctrl/Cmd + Enter)
   - Esperar confirmación: "Success. No rows returned"
   ```

3. **Ejecutar Migración 047**
   ```
   - Abrir archivo: supabase/migrations/047_seed_historical_data.sql
   - Copiar TODO el contenido
   - Pegar en SQL Editor
   - Click en "Run"
   - Esperar confirmación
   ```

4. **Poblar Datos Históricos**
   ```sql
   SELECT * FROM populate_historical_averages();
   ```
   - Ejecutar este query
   - Verás un mensaje como: "Successfully populated 47 historical records"

5. **Verificar Instalación**
   ```
   - Abrir archivo: supabase/verify_analytics_infrastructure.sql
   - Copiar TODO el contenido
   - Pegar en SQL Editor
   - Click en "Run"
   - Revisar los mensajes de NOTICE (deben ser todos ✓)
   ```

---

### Opción B: Supabase CLI (Para Desarrollo Local)

```bash
# 1. Asegurarte de estar en el directorio del proyecto
cd /Users/elementary/Desktop/manglarnet

# 2. Verificar que Supabase CLI está instalado
supabase --version

# 3. Aplicar migraciones
supabase db reset  # Esto aplicará TODAS las migraciones

# 4. Poblar datos históricos
supabase db execute "SELECT * FROM populate_historical_averages();"

# 5. Verificar instalación
supabase db execute -f supabase/verify_analytics_infrastructure.sql
```

---

## 🔍 Verificación Post-Instalación

### 1. Verificar Tablas Creadas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'historico_promedios', 
    'notificaciones_inteligentes', 
    'cache_analisis_sentimiento'
  );
```
**Esperado:** 3 filas

---

### 2. Probar Función de Riesgo
```sql
-- Obtener un ID de alumno de prueba
SELECT id_alumno, nombres, apellidos 
FROM alumnos 
LIMIT 1;

-- Calcular su risk score (reemplaza el UUID)
SELECT * FROM calculate_risk_score(
  '12345678-1234-1234-1234-123456789abc',  -- Reemplaza con ID real
  '2024-2025',
  'I Lapso'
);
```
**Esperado:** 1 fila con `risk_score`, `risk_level`, `factores_riesgo`

---

### 3. Verificar Vista de Telemetría
```sql
SELECT * FROM vista_telemetria_academica
ORDER BY grado, materia
LIMIT 10;
```
**Esperado:** Filas con KPIs calculados

---

### 4. Verificar Datos Históricos
```sql
SELECT 
  grado, 
  materia, 
  COUNT(*) as registros,
  ROUND(AVG(promedio_general), 2) as promedio_historico
FROM historico_promedios
GROUP BY grado, materia
ORDER BY grado, materia;
```
**Esperado:** Múltiples filas con promedios históricos

---

## ⚠️ Troubleshooting

### Error: "function update_updated_at_column() does not exist"
**Solución:** Esta función debe existir de migraciones anteriores. Verificar con:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';
```
Si no existe, crear:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Error: "relation 'authorized_users' does not exist"
**Solución:** Verificar que la tabla `authorized_users` existe:
```sql
SELECT * FROM authorized_users LIMIT 1;
```
Si no existe, revisar migraciones anteriores (001_create_authorized_users.sql)

---

### Error: "permission denied for table..."
**Solución:** Verificar que estás ejecutando como usuario con permisos de admin en Supabase.

---

### No se generan datos históricos
**Causa:** No hay datos en `minutas_evaluacion` o `resumen_evaluacion_alumno`

**Verificar:**
```sql
SELECT COUNT(*) FROM minutas_evaluacion;
SELECT COUNT(*) FROM resumen_evaluacion_alumno;
```

**Solución:** Si las tablas están vacías, los datos históricos se poblarán automáticamente cuando se creen evaluaciones.

---

## 📊 Datos de Ejemplo (Opcional)

Si quieres insertar datos de prueba para testing:

```sql
-- Insertar un registro histórico de ejemplo
INSERT INTO historico_promedios (
  ano_escolar, lapso, mes, grado, materia, 
  promedio_general, promedio_asistencia, total_estudiantes
) VALUES (
  '2023-2024', 'I Lapso', 10, '5to Grado', 'Matemáticas',
  14.5, 85.0, 25
);

-- Insertar una notificación de prueba
INSERT INTO notificaciones_inteligentes (
  tipo_alerta, severidad, titulo, mensaje, grado, materia,
  valor_actual, valor_anterior, estado
) VALUES (
  'bajada_brusca', 'alta', 
  'Bajada en rendimiento de 5to Grado',
  'El promedio de Matemáticas bajó de 15.2 a 13.8 (-9.2%)',
  '5to Grado', 'Matemáticas',
  13.8, 15.2, 'pendiente'
);
```

---

## ✅ Checklist de Verificación

Antes de proceder a FASE 2, confirmar:

- [ ] Migración 046 ejecutada sin errores
- [ ] Migración 047 ejecutada sin errores
- [ ] Función `populate_historical_averages()` ejecutada
- [ ] Script de verificación corrió con todos los ✓
- [ ] Al menos 1 registro en `historico_promedios`
- [ ] Vista `vista_telemetria_academica` retorna datos
- [ ] Función `calculate_risk_score()` funciona correctamente
- [ ] No hay errores en los logs de Supabase

---

## 🎯 Próximos Pasos

Una vez completada la verificación:

1. **Revisar el Implementation Plan** completo
2. **Aprobar para continuar a FASE 2** (Services Layer)
3. **O solicitar modificaciones** si algo no está claro

---

## 📞 Preguntas Frecuentes

**P: ¿Puedo ejecutar las migraciones múltiples veces?**
R: Sí, están diseñadas con `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT` para ser idempotentes.

**P: ¿Afectará esto mis datos existentes?**
R: No, solo se agregan nuevas tablas y funciones. No se modifican datos existentes.

**P: ¿Cuánto espacio ocupará?**
R: Aproximadamente 1-5 MB por año escolar, dependiendo de la cantidad de evaluaciones.

**P: ¿Puedo revertir los cambios?**
R: Sí, ejecutando:
```sql
DROP TABLE IF EXISTS cache_analisis_sentimiento CASCADE;
DROP TABLE IF EXISTS notificaciones_inteligentes CASCADE;
DROP TABLE IF EXISTS historico_promedios CASCADE;
DROP FUNCTION IF EXISTS calculate_risk_score CASCADE;
DROP FUNCTION IF EXISTS populate_historical_averages CASCADE;
DROP FUNCTION IF EXISTS auto_update_historical_averages CASCADE;
DROP VIEW IF EXISTS vista_telemetria_academica CASCADE;
```

---

**¡FASE 1 LISTA PARA EJECUTAR! 🚀**
