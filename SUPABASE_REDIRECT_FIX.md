# 🔧 Solución: Error de Redirección después de Login con Google

## Problema

Después de iniciar sesión con Google correctamente, aparece el error `ERR_CONNECTION_REFUSED` en `localhost:3000`. Esto ocurre porque Supabase necesita tener configuradas las URLs de redirección permitidas.

## ✅ Solución: Configurar URLs de Redirección en Supabase

### Paso 1: Acceder a la Configuración de Autenticación

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto: **rnycynatrhxhbfpydqvd**
3. En el menú lateral, ve a **Authentication**
4. Haz clic en **URL Configuration** (o busca "Redirect URLs" en Settings)

### Paso 2: Agregar URLs de Redirección Permitidas

En la sección **Redirect URLs** o **Site URL**, necesitas agregar:

#### Para Desarrollo Local:
```
http://localhost:3000
```

#### Para Producción (Vercel):
```
https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app
```

Si tienes un dominio personalizado configurado en Vercel, agrégalo también:
```
https://tu-dominio.com
```

### Paso 3: Configurar Site URL

En la sección **Site URL**, configura la URL principal:

- **Para desarrollo**: `http://localhost:3000`
- **Para producción**: `https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app`

**Nota**: Puedes dejar la de producción como principal si es donde más trabajas.

### Paso 4: Guardar Cambios

1. Haz clic en **Save** o **Update**
2. Espera unos segundos para que los cambios se apliquen

### Paso 5: Probar Nuevamente

1. Ve a tu aplicación en Vercel
2. Intenta iniciar sesión con Google
3. Ahora debería redirigir correctamente a tu aplicación en Vercel

## 📋 Resumen de URLs a Configurar

### En Supabase Dashboard > Authentication > URL Configuration:

**Redirect URLs** (pueden ser múltiples):
```
http://localhost:3000
https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app
https://*.vercel.app
```

**Site URL** (URL principal):
```
https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app
```

## 🔍 Ubicación Exacta en Supabase Dashboard

```
Supabase Dashboard
  └── Tu Proyecto (rnycynatrhxhbfpydqvd)
      └── Authentication (menú lateral)
          └── URL Configuration
              ├── Site URL
              └── Redirect URLs
```

O alternativamente:

```
Supabase Dashboard
  └── Tu Proyecto
      └── Settings (engranaje)
          └── Authentication
              └── URL Configuration
```

## 🐛 Si Aún No Funciona

1. **Verifica que guardaste los cambios** en Supabase Dashboard
2. **Limpia la caché del navegador** (Ctrl+Shift+Delete)
3. **Cierra sesión completamente** de Google y vuelve a intentar
4. **Verifica la consola del navegador** para ver si hay otros errores
5. **Revisa los logs de autenticación** en Supabase Dashboard > Authentication > Logs

## 📝 Nota Importante

El código ya está configurado para usar `window.location.origin` automáticamente, lo que significa que:
- En desarrollo (`localhost:3000`), redirigirá a `http://localhost:3000`
- En producción (Vercel), redirigirá a tu URL de Vercel

Solo necesitas asegurarte de que Supabase tenga estas URLs configuradas como permitidas.

