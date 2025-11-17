# 🚀 Plan Detallado de Migración a Next.js

## 📋 Resumen Ejecutivo

Migración de la aplicación ManglarNet de **Vite + React (SPA)** a **Next.js 14+ (App Router)** para habilitar:
- ✅ Escalabilidad para whitelabel/SaaS
- ✅ SEO y performance mejorados
- ✅ Estándar de la industria
- ✅ Multi-tenancy nativo

**Tiempo estimado**: 4-6 semanas
**Riesgo**: Medio (refactorización mayor pero estructura clara)

---

## 🎯 Objetivos

1. Migrar toda la funcionalidad actual sin pérdida de features
2. Mejorar arquitectura y mantenibilidad
3. Preparar base para multi-tenancy
4. Optimizar performance y SEO
5. Mantener compatibilidad con Supabase y Vercel

---

## 📊 Análisis de Estado Actual

### Estructura Actual
```
├── App.tsx (9,700 líneas - monolítico)
├── components/
│   ├── Icons.tsx
│   ├── LoginScreen.tsx
│   └── AuthorizedUsersView.tsx
├── services/
│   ├── supabaseClient.ts
│   ├── supabaseDataService.ts
│   ├── geminiService.ts
│   └── weekCalculator.ts
└── index.tsx (entry point)
```

### Vistas Actuales (activeView)
- `dashboard` - Dashboard principal
- `students` - Gestión de alumnos
- `teachers` - Gestión de docentes
- `planning` - Planificaciones
- `calendar` - Calendario
- `schedules` - Horarios
- `team-schedules` - Horarios de equipo
- `schedule-generator` - Generador de horarios
- `evaluation` - Seguimiento pedagógico
- `authorized-users` - Gestión de usuarios
- `lapsos-admin` - Gestión de lapsos

---

## 🏗️ Arquitectura Propuesta (Next.js App Router)

```
nextjs-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx (Dashboard layout con sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx (lista)
│   │   │   └── [id]/
│   │   │       └── page.tsx (detalle)
│   │   ├── teachers/
│   │   │   └── page.tsx
│   │   ├── planning/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── schedules/
│   │   │   └── page.tsx
│   │   ├── team-schedules/
│   │   │   └── page.tsx
│   │   ├── schedule-generator/
│   │   │   └── page.tsx
│   │   ├── evaluation/
│   │   │   └── page.tsx
│   │   ├── authorized-users/
│   │   │   └── page.tsx
│   │   └── lapsos-admin/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts (Supabase OAuth callback)
│   ├── layout.tsx (Root layout)
│   └── page.tsx (Redirect to login or dashboard)
├── components/
│   ├── ui/ (componentes reutilizables)
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── dashboard/
│   │   └── DashboardWidgets.tsx
│   ├── students/
│   │   ├── StudentList.tsx
│   │   └── StudentDetail.tsx
│   └── ...
├── lib/
│   ├── supabase/
│   │   ├── server.ts (Server-side client)
│   │   ├── client.ts (Client-side client)
│   │   └── middleware.ts (Auth middleware)
│   ├── auth/
│   │   └── auth-helpers.ts
│   └── utils/
│       └── ...
├── services/ (mantener estructura actual)
│   ├── supabaseDataService.ts
│   ├── geminiService.ts
│   └── weekCalculator.ts
├── middleware.ts (Next.js middleware para auth)
├── types/
│   └── index.ts (TypeScript types)
└── public/ (assets estáticos)
```

---

## 📅 Fases de Migración

### **FASE 1: Setup Base** (Semana 1)
**Objetivo**: Configurar Next.js y estructura base

#### Tareas:
1. ✅ Inicializar Next.js 14+ con TypeScript
2. ✅ Configurar Supabase para SSR
   - Crear `lib/supabase/server.ts` (server client)
   - Crear `lib/supabase/client.ts` (client client)
   - Migrar `services/supabaseClient.ts`
3. ✅ Configurar estructura de carpetas
4. ✅ Migrar estilos globales (`index.css`)
5. ✅ Configurar variables de entorno
6. ✅ Setup de TypeScript y paths aliases

**Entregables**:
- Proyecto Next.js funcionando
- Supabase configurado para SSR
- Estilos base migrados

---

### **FASE 2: Componentes Base** (Semana 1-2)
**Objetivo**: Migrar componentes reutilizables

#### Tareas:
1. ✅ Migrar `components/Icons.tsx`
2. ✅ Migrar `components/LoginScreen.tsx` → `app/(auth)/login/page.tsx`
3. ✅ Crear `components/ui/Sidebar.tsx` (extraer de App.tsx)
4. ✅ Crear `components/ui/Header.tsx` (extraer de App.tsx)
5. ✅ Migrar `components/AuthorizedUsersView.tsx`
6. ✅ Crear layout de dashboard con sidebar

**Entregables**:
- Componentes base migrados y funcionando
- Layout de dashboard con navegación

---

### **FASE 3: Migración de Vistas** (Semana 2-3)
**Objetivo**: Migrar cada vista a su propia ruta

#### Orden de migración (prioridad):
1. ✅ **Dashboard** (`app/(dashboard)/dashboard/page.tsx`)
   - Widgets principales
   - Estadísticas
   - Alertas

2. ✅ **Students** (`app/(dashboard)/students/page.tsx`)
   - Lista de alumnos
   - Detalle de alumno
   - Formularios

3. ✅ **Teachers** (`app/(dashboard)/teachers/page.tsx`)
   - Lista de docentes
   - Formularios

4. ✅ **Planning** (`app/(dashboard)/planning/page.tsx`)
   - Vista de planificaciones
   - Formularios

5. ✅ **Schedules** (`app/(dashboard)/schedules/page.tsx`)
   - Gestión de horarios

6. ✅ **Calendar** (`app/(dashboard)/calendar/page.tsx`)
   - Vista de calendario

7. ✅ **Evaluation** (`app/(dashboard)/evaluation/page.tsx`)
   - Seguimiento pedagógico

8. ✅ **Authorized Users** (`app/(dashboard)/authorized-users/page.tsx`)
   - Gestión de usuarios

9. ✅ **Lapsos Admin** (`app/(dashboard)/lapsos-admin/page.tsx`)
   - Gestión de lapsos

10. ✅ **Schedule Generator** (`app/(dashboard)/schedule-generator/page.tsx`)
    - Generador de horarios

11. ✅ **Team Schedules** (`app/(dashboard)/team-schedules/page.tsx`)
    - Horarios de equipo

**Entregables**:
- Todas las vistas migradas a rutas Next.js
- Navegación funcionando
- Funcionalidad completa preservada

---

### **FASE 4: Autenticación y Middleware** (Semana 3)
**Objetivo**: Implementar autenticación robusta

#### Tareas:
1. ✅ Crear `middleware.ts` para protección de rutas
2. ✅ Implementar redirección de login
3. ✅ Manejar callbacks de OAuth
4. ✅ Verificación de roles y permisos
5. ✅ Session management

**Entregables**:
- Middleware funcionando
- Rutas protegidas
- Auth flow completo

---

### **FASE 5: Servicios y Lógica** (Semana 3-4)
**Objetivo**: Migrar y adaptar servicios

#### Tareas:
1. ✅ Migrar `services/supabaseDataService.ts`
   - Adaptar para SSR donde sea necesario
   - Mantener client-side donde corresponda
2. ✅ Migrar `services/geminiService.ts`
3. ✅ Migrar `services/weekCalculator.ts`
4. ✅ Crear Server Actions donde sea beneficioso
5. ✅ Optimizar queries y data fetching

**Entregables**:
- Servicios migrados y funcionando
- Data fetching optimizado

---

### **FASE 6: Optimizaciones** (Semana 4-5)
**Objetivo**: Mejorar performance y SEO

#### Tareas:
1. ✅ Implementar metadata por página
2. ✅ Optimizar imágenes
3. ✅ Code splitting automático
4. ✅ Lazy loading de componentes pesados
5. ✅ Caching estratégico
6. ✅ Error boundaries

**Entregables**:
- Performance mejorado
- SEO básico implementado

---

### **FASE 7: Testing y Validación** (Semana 5-6)
**Objetivo**: Asegurar que todo funciona

#### Tareas:
1. ✅ Testing manual de todas las funcionalidades
2. ✅ Verificar autenticación
3. ✅ Verificar permisos por rol
4. ✅ Testing de navegación
5. ✅ Verificar data fetching
6. ✅ Testing en diferentes navegadores
7. ✅ Testing responsive

**Entregables**:
- Aplicación completamente funcional
- Bugs identificados y corregidos

---

### **FASE 8: Preparación Multi-Tenancy** (Semana 6 - Opcional)
**Objetivo**: Base para whitelabel/SaaS

#### Tareas:
1. ⏳ Diseñar schema de multi-tenancy
2. ⏳ Crear tabla `organizations`
3. ⏳ Implementar detección de tenant (subdomain)
4. ⏳ Adaptar RLS policies para multi-tenant
5. ⏳ Configurar variables de entorno por tenant

**Entregables**:
- Base preparada para multi-tenancy
- Documentación de implementación

---

## 🔧 Configuración Técnica

### Dependencias Next.js
```json
{
  "next": "^14.2.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.5.0", // Para SSR
  "typescript": "^5.8.2"
}
```

### Variables de Entorno
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # Solo para server-side
GEMINI_API_KEY=
```

### Configuración TypeScript
- Mantener `tsconfig.json` actual
- Agregar paths para `@/` alias
- Configurar para Next.js

---

## 🚨 Consideraciones Importantes

### 1. **Compatibilidad con Supabase**
- Usar `@supabase/ssr` para manejo de cookies
- Separar clientes server/client
- Mantener RLS policies actuales

### 2. **Estado Global**
- Evaluar necesidad de Context API o Zustand
- Muchos estados locales pueden mantenerse con `useState`
- Considerar Server Components para data fetching

### 3. **Routing**
- Usar App Router (no Pages Router)
- Rutas dinámicas con `[id]`
- Grupos de rutas con `(auth)` y `(dashboard)`

### 4. **Performance**
- Usar Server Components por defecto
- Client Components solo cuando necesario
- Lazy loading de componentes pesados

### 5. **Migración Gradual**
- Mantener proyecto Vite funcionando durante migración
- Migrar vista por vista
- Testing continuo

---

## 📝 Checklist de Validación

### Funcionalidad
- [ ] Login funciona correctamente
- [ ] Navegación entre vistas funciona
- [ ] Todas las vistas cargan correctamente
- [ ] CRUD de estudiantes funciona
- [ ] CRUD de docentes funciona
- [ ] Planificaciones funcionan
- [ ] Horarios funcionan
- [ ] Calendario funciona
- [ ] Evaluaciones funcionan
- [ ] Gestión de usuarios funciona
- [ ] Permisos por rol funcionan

### Técnico
- [ ] Build de producción funciona
- [ ] Variables de entorno configuradas
- [ ] Supabase SSR funciona
- [ ] Middleware funciona
- [ ] No hay errores en consola
- [ ] Performance aceptable

### UX
- [ ] Diseño se mantiene igual
- [ ] Responsive funciona
- [ ] Navegación intuitiva
- [ ] Loading states funcionan
- [ ] Error states funcionan

---

## 🎯 Métricas de Éxito

1. ✅ Todas las funcionalidades actuales funcionan
2. ✅ Performance igual o mejor que actual
3. ✅ Código más mantenible (componentes separados)
4. ✅ Base preparada para multi-tenancy
5. ✅ SEO mejorado (metadata, SSR)

---

## 📚 Recursos

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

---

## 🔄 Estrategia de Rollback

Si algo falla críticamente:
1. Mantener proyecto Vite funcionando
2. Branch separado para Next.js
3. Testing exhaustivo antes de merge
4. Deploy gradual (staging → production)

---

**Última actualización**: Inicio de migración
**Estado**: 🟢 En progreso

