# 📋 Cómo Acceder a Reuniones con Representantes

## 🎯 Ubicación en la Plataforma

La funcionalidad de **Reuniones con Representantes** está integrada en la vista de detalles del estudiante.

## 📍 Pasos para Acceder

### 1. Ir a la Sección de Alumnos
- En el menú lateral, haz clic en **"Alumnos"** (ícono de estudiantes)
- O usa el atajo de teclado si está configurado

### 2. Seleccionar un Estudiante
- En la lista de alumnos, haz clic en cualquier estudiante
- Esto abrirá la vista de detalles del estudiante

### 3. Acceder a las Pestañas de Reuniones
Una vez en la vista de detalles del estudiante, verás **3 pestañas** en la parte inferior:

1. **📄 Información** - Datos personales y de contacto (vista por defecto)
2. **🤝 Reuniones** - Lista y gestión de reuniones con representantes
3. **📊 Análisis** - Dashboard con insights y análisis de datos

### 4. Usar la Funcionalidad

#### Pestaña "Reuniones"
- **Ver reuniones existentes**: Lista todas las reuniones registradas para ese estudiante
- **Buscar reuniones**: Usa el campo de búsqueda para filtrar por motivo, inquietudes, acuerdos o asistentes
- **Nueva reunión**: Haz clic en el botón **"Nueva Reunión"** (botón naranja con ícono +)
- **Editar reunión**: Haz clic en el ícono de editar (lápiz) en cualquier tarjeta de reunión
- **Eliminar reunión**: Haz clic en el ícono de eliminar (papelera) en cualquier tarjeta de reunión

#### Pestaña "Análisis"
- **KPIs en tiempo real**: Total de reuniones, con inquietudes, con acuerdos, promedio de asistentes
- **Análisis de frecuencia**: Métricas de frecuencia de reuniones y tendencias
- **Temas de inquietudes**: Ranking de temas más frecuentes
- **Análisis de sentimiento**: Distribución de sentimientos en las inquietudes
- **Insights automáticos**: Recomendaciones basadas en los datos

## 🎨 Interfaz Visual

```
┌─────────────────────────────────────────┐
│  ← Volver a la Lista                     │
├─────────────────────────────────────────┤
│  [Información del Estudiante]           │
│  (Datos personales y contacto)          │
├─────────────────────────────────────────┤
│  ┌─────────┬───────────┬───────────┐  │
│  │Información│ Reuniones │ Análisis  │  │
│  └─────────┴───────────┴───────────┘  │
│                                         │
│  [Contenido de la pestaña seleccionada] │
└─────────────────────────────────────────┘
```

## 📝 Formulario de Reunión

Al hacer clic en **"Nueva Reunión"**, se abre un modal con:

1. **Información Básica**
   - Nombre del estudiante (automático, no editable)
   - Fecha de la reunión
   - Grado

2. **Asistentes**
   - Campo para agregar nombres de asistentes
   - Presiona Enter o haz clic en "Agregar" para añadir cada asistente
   - Los asistentes aparecen como badges que se pueden eliminar

3. **Motivo**
   - Campo de texto para describir el motivo de la reunión

4. **Inquietudes**
   - Campo de texto grande para registrar las inquietudes expresadas
   - Este campo será analizado automáticamente para identificar patrones

5. **Acuerdos**
   - Campo de texto para registrar los acuerdos alcanzados
   - Los acuerdos pueden ser seguidos posteriormente

## 🔍 Funcionalidades de Búsqueda

En la pestaña "Reuniones", puedes buscar por:
- **Motivo** de la reunión
- **Inquietudes** expresadas
- **Acuerdos** alcanzados
- **Nombres de asistentes**

## 📊 Dashboard de Análisis

El dashboard muestra:

### KPIs Principales
- Total de reuniones registradas
- Reuniones con inquietudes documentadas
- Reuniones con acuerdos registrados
- Promedio de asistentes por reunión

### Análisis Detallados (por estudiante)
- **Frecuencia**: Total, frecuencia mensual, días desde última reunión, tendencia
- **Temas**: Ranking de temas más frecuentes en inquietudes
- **Sentimiento**: Análisis de sentimiento (Positivo, Negativo, Neutro) con palabras clave

### Insights Automáticos
- Alertas de alta frecuencia de reuniones
- Recordatorios de seguimiento
- Identificación de patrones problemáticos
- Recomendaciones de acción

## ⚠️ Permisos

- **Docentes**: Pueden ver y crear reuniones
- **Coordinadores**: Pueden ver, crear, editar y eliminar todas las reuniones
- **Directivos**: Pueden ver, crear, editar y eliminar todas las reuniones

## 🚀 Próximos Pasos

1. **Aplicar la migración SQL** en Supabase si aún no lo has hecho
2. **Probar el formulario** registrando una reunión de prueba
3. **Explorar el dashboard** de análisis para ver los insights
4. **Revisar la documentación** `REUNIONES_ANALISIS_DATOS.md` para entender el valor de los análisis

## 💡 Tips

- **Registra las reuniones inmediatamente** después de realizarlas para mantener datos actualizados
- **Sé específico en las inquietudes** para obtener mejores análisis
- **Registra todos los acuerdos** para poder hacer seguimiento
- **Revisa el dashboard de análisis** regularmente para identificar patrones

## 🆘 Solución de Problemas

### No veo las pestañas
- Asegúrate de haber seleccionado un estudiante de la lista
- Verifica que la migración SQL se haya aplicado correctamente
- Recarga la página (F5)

### Error al guardar una reunión
- Verifica que todos los campos requeridos estén completos
- Asegúrate de tener permisos para crear reuniones
- Revisa la consola del navegador para ver errores específicos

### No aparecen datos en el análisis
- Necesitas tener al menos una reunión registrada
- Algunos análisis requieren múltiples reuniones para ser significativos
- Verifica que las reuniones tengan inquietudes o acuerdos registrados

---

**¿Necesitas ayuda?** Revisa la documentación técnica en `REUNIONES_ANALISIS_DATOS.md` o contacta al equipo de desarrollo.

