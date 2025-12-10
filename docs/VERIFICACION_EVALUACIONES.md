# ✅ Checklist de Verificación: Guardado de Evaluaciones RRHH

## 🎯 Objetivo
Verificar que las evaluaciones se guardan correctamente y se visualizan en "Ver Evaluaciones"

---

## 📋 Pasos de Verificación

### **1. Preparación**
- [ ] Asegúrate de tener usuarios registrados en "Gestión de Usuarios"
- [ ] Asegúrate de tener al menos una plantilla de evaluación creada
- [ ] Abre la consola del navegador (F12) para ver los logs

### **2. Crear una Evaluación**
1. Ve a **"Evaluaciones RRHH"**
2. Click en **"Evaluar Directamente"**
3. Completa el formulario:
   - [ ] Selecciona un docente
   - [ ] Selecciona año escolar (ej: 2025-2026)
   - [ ] Selecciona lapso (ej: I Lapso)
   - [ ] Completa la autoevaluación (verde)
   - [ ] Completa la evaluación del supervisor (azul)
   - [ ] Agrega observaciones finales (opcional)
   - [ ] Agrega acuerdos (opcional)
4. Click en **"Guardar Evaluación"**

### **3. Verificar en Consola**
Deberías ver en la consola:
```
Creating assignment with data: {
  template_id: "...",
  evaluator_id: "...",
  evaluatee_id: "...",
  evaluation_period: "2025-2026 - I Lapso",
  final_score: 16.50
}

Assignment created: { id: "...", ... }

Saved X responses
```

### **4. Verificar en "Ver Evaluaciones"**
1. Ve a **"Ver Evaluaciones"**
2. Deberías ver tu evaluación en la lista
3. Verifica que muestra:
   - [ ] Nombre del docente evaluado
   - [ ] Plantilla utilizada
   - [ ] Período correcto (2025-2026 - I Lapso)
   - [ ] Nombre del evaluador
   - [ ] Fecha de evaluación
   - [ ] Nota final sobre 20
   - [ ] Badge de desempeño (Excelente/Bueno/Regular)

### **5. Ver Detalles**
1. Click en **"Ver Detalles"** de la evaluación
2. Verifica que se abre el modal con:
   - [ ] Pestaña "Comparación" muestra gráficos por área
   - [ ] Pestaña "Autoevaluación" muestra todos los ítems con puntajes
   - [ ] Pestaña "Eval. Supervisor" muestra todos los ítems con puntajes
   - [ ] Se muestran las observaciones finales (si las agregaste)
   - [ ] Se muestran los acuerdos (si los agregaste)

### **6. Verificar Filtros**
1. En "Ver Evaluaciones", prueba los filtros:
   - [ ] Buscar por nombre del docente
   - [ ] Filtrar por año escolar
   - [ ] Filtrar por lapso
   - [ ] Botón "Limpiar Filtros" funciona

### **7. Verificar Evolución Histórica**
1. Ve a **"Evolución Histórica"**
2. Selecciona el docente que evaluaste
3. Deberías ver:
   - [ ] Timeline con la evaluación
   - [ ] Estadísticas (total, promedio, última nota)
   - [ ] Tendencia

---

## 🐛 Problemas Comunes y Soluciones

### **Problema 1: "Usuario no encontrado en la base de datos"**
**Causa:** El usuario que está evaluando no existe en la tabla `usuarios`
**Solución:**
1. Ve a "Gestión de Usuarios"
2. Asegúrate de que tu usuario esté registrado
3. Verifica que el email coincida con tu email de login

### **Problema 2: No aparecen evaluaciones en "Ver Evaluaciones"**
**Causa:** Problema con las foreign keys o RLS
**Solución:**
1. Abre la consola del navegador
2. Busca errores en rojo
3. Ejecuta en Supabase SQL Editor:
```sql
-- Verificar que la evaluación se guardó
SELECT * FROM rrhh_assignments ORDER BY created_at DESC LIMIT 5;

-- Verificar las respuestas
SELECT * FROM rrhh_responses ORDER BY created_at DESC LIMIT 10;

-- Verificar que los usuarios existen
SELECT id, username, nombre, apellido, email FROM usuarios;
```

### **Problema 3: Error de foreign key**
**Causa:** Los IDs no coinciden entre tablas
**Solución:**
```sql
-- Verificar la estructura de rrhh_assignments
SELECT 
    a.id,
    a.evaluator_id,
    a.evaluatee_id,
    e1.nombre as evaluator_nombre,
    e2.nombre as evaluatee_nombre
FROM rrhh_assignments a
LEFT JOIN usuarios e1 ON a.evaluator_id = e1.id
LEFT JOIN usuarios e2 ON a.evaluatee_id = e2.id
ORDER BY a.created_at DESC
LIMIT 5;
```

### **Problema 4: Nota final es 0 o incorrecta**
**Causa:** Fórmula de cálculo o falta de respuestas
**Solución:**
1. Verifica que completaste TODOS los ítems de la evaluación
2. Revisa la consola para ver el `final_score` calculado
3. Verifica que las respuestas se guardaron:
```sql
SELECT 
    assignment_id,
    COUNT(*) as total_responses,
    AVG(supervisor_score) as avg_score
FROM rrhh_responses
GROUP BY assignment_id;
```

---

## 📊 Datos de Prueba

Si necesitas datos de prueba, ejecuta:

```sql
-- Ver todas las evaluaciones con detalles
SELECT 
    a.id,
    a.evaluation_period,
    a.final_score,
    a.status,
    t.name as template_name,
    e1.nombre || ' ' || e1.apellido as evaluator,
    e2.nombre || ' ' || e2.apellido as evaluatee,
    a.completed_at
FROM rrhh_assignments a
JOIN rrhh_templates t ON a.template_id = t.id
LEFT JOIN usuarios e1 ON a.evaluator_id = e1.id
LEFT JOIN usuarios e2 ON a.evaluatee_id = e2.id
WHERE a.status = 'completed'
ORDER BY a.completed_at DESC;
```

---

## ✅ Resultado Esperado

Al completar todos los pasos, deberías tener:
- ✅ Evaluación guardada en la base de datos
- ✅ Visible en "Ver Evaluaciones"
- ✅ Detalles completos accesibles
- ✅ Filtros funcionando correctamente
- ✅ Evolución histórica mostrando la evaluación

---

## 🔧 Cambios Realizados para Asegurar el Guardado

1. **Corrección de evaluator_id**: Ahora usa `id` de la tabla `usuarios` en lugar de `auth.user.id`
2. **Logging mejorado**: Muestra en consola cada paso del guardado
3. **Validación de usuario**: Verifica que el evaluador existe en la tabla `usuarios`
4. **Contador de respuestas**: Muestra cuántas respuestas se guardaron
5. **Manejo de errores**: Mensajes de error más descriptivos

---

## 📞 Soporte

Si encuentras algún problema:
1. Copia el error de la consola
2. Ejecuta las queries de verificación en Supabase
3. Revisa que los usuarios tengan `nombre` y `apellido` en la tabla `usuarios`
