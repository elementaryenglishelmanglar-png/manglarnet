# 🎯 Generador de Horarios - Guía de Uso

## ✅ Estado: FUNCIONAL

El Generador de Horarios está **completamente implementado y funcional**. Puedes usarlo ahora mismo para generar horarios automáticamente.

## 🚀 Cómo Usar

### Paso 1: Preparar Datos

Antes de generar horarios, asegúrate de tener:

1. **Aulas registradas** - Ejecuta la migración `010_seed_initial_data.sql` o crea aulas manualmente
2. **Capacidades de docentes** - Los docentes deben tener materias asignadas en `docente_materias`
3. **Configuración de horarios** - Debe existir una configuración activa para el año escolar

### Paso 2: Generar Horarios

1. Ve a **"Generador de Horarios"** en el menú lateral (solo visible para coordinadores y directivos)
2. Selecciona:
   - **Año Escolar**: 2024-2025 o 2025-2026
   - **Semana**: 1-18
   - **Grado** (opcional): Deja vacío para todos los grados, o selecciona uno específico
3. Haz clic en **"Generar Horarios"**
4. Espera a que termine la generación (generalmente toma 1-3 segundos)
5. Revisa los resultados:
   - ✅ **Verde**: Generación exitosa
   - ⚠️ **Amarillo**: Generación con advertencias (algunas clases no pudieron asignarse)
   - ❌ **Rojo**: Generación fallida

### Paso 3: Aplicar Horarios

Si la generación fue exitosa:

1. Revisa las estadísticas (asignaciones, docentes, aulas utilizadas)
2. Revisa los conflictos si los hay
3. Haz clic en **"Aplicar Horarios Generados"**
4. Los horarios se guardarán en la base de datos y aparecerán en la vista de "Horarios"

## 🔧 Restricciones Soportadas

### Restricciones Duras (Obligatorias)

El solver respeta automáticamente:
- ✅ Un docente no puede estar en dos lugares a la vez
- ✅ Un aula no puede usarse para dos clases a la vez
- ✅ Un grado no puede tener dos clases a la vez
- ✅ La clase debe estar en un aula compatible (según `clase_requisitos`)
- ✅ El docente debe poder dar la materia (según `docente_materias`)
- ✅ Restricciones de disponibilidad de docentes
- ✅ Restricciones de disponibilidad de aulas
- ✅ Restricciones de disponibilidad de grados

### Restricciones Suaves (Preferencias)

El solver intenta minimizar:
- ⚠️ Preferencias de horarios de docentes
- ⚠️ Preferencias de días de docentes
- ⚠️ Orden preferido de materias (pendiente de implementar completamente)
- ⚠️ Agrupación de horas de docentes (pendiente de implementar completamente)

## 📊 Estadísticas Mostradas

Después de generar, verás:
- **Asignaciones**: Número total de clases asignadas
- **Docentes**: Número de docentes utilizados
- **Aulas**: Número de aulas utilizadas
- **Tiempo**: Tiempo de ejecución en milisegundos
- **Conflictos**: Lista de clases que no pudieron asignarse (si las hay)

## ⚠️ Limitaciones Actuales

1. **Algoritmo básico**: Usa un algoritmo greedy con optimización local. No es tan óptimo como OR-Tools, pero es funcional y rápido.

2. **Restricciones suaves**: Algunas restricciones suaves están implementadas parcialmente. El solver prioriza encontrar una solución factible sobre optimizar preferencias.

3. **Escalabilidad**: Funciona bien para casos pequeños/medianos. Para casos muy grandes (100+ clases), puede tardar más.

## 🔮 Mejoras Futuras

- [ ] Implementar algoritmo genético para mejor optimización
- [ ] Agregar más tipos de restricciones suaves
- [ ] Optimizar para casos grandes
- [ ] Permitir ajustes manuales después de generar
- [ ] Vista previa interactiva antes de aplicar

## 💡 Consejos

1. **Empieza con un grado**: Genera horarios para un grado a la vez para mejores resultados
2. **Revisa conflictos**: Si hay conflictos, verifica que:
   - Hay suficientes aulas
   - Los docentes tienen las materias asignadas en `docente_materias`
   - No hay restricciones duras que bloqueen todo
3. **Ajusta restricciones**: Si hay muchos conflictos, considera ajustar las restricciones duras

## 🐛 Solución de Problemas

### "No hay aulas registradas"
- Ejecuta la migración `010_seed_initial_data.sql` o crea aulas manualmente

### "No hay docente disponible"
- Asigna materias a docentes en la tabla `docente_materias`
- Verifica que los docentes tengan la especialidad correcta

### "No hay configuración de horarios"
- Crea una configuración en `configuracion_horarios` para el año escolar seleccionado

### Generación muy lenta
- Reduce el alcance (selecciona un grado específico)
- Verifica que no haya demasiadas restricciones duras

