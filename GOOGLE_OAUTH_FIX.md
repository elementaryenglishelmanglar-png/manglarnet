# 🔧 Solución: Error redirect_uri_mismatch y Selección de Cuenta

## Problema 1: Error "redirect_uri_mismatch"

Este error ocurre porque Google Cloud Console no tiene configurada la URL de tu aplicación en producción (Vercel).

## ✅ Solución Paso a Paso

### 1. Obtener tu URL de Vercel

Tu URL de producción es:
```
https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app
```

O si tienes un dominio personalizado configurado, usa esa URL.

### 2. Actualizar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services > Credentials**
4. Haz clic en tu **OAuth 2.0 Client ID** (el que creaste para ManglarNet)
5. En la sección **Authorized JavaScript origins**, haz clic en **"ADD URI"** y agrega:
   ```
   https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app
   ```
   
   También puedes agregar el patrón wildcard para cubrir todas las URLs de Vercel:
   ```
   https://*.vercel.app
   ```

6. **IMPORTANTE**: En **Authorized redirect URIs**, debe haber SOLO UNA URI:
   ```
   https://rnycynatrhxhbfpydqvd.supabase.co/auth/v1/callback
   ```
   
   **NO agregues** la URL de Vercel aquí. Solo debe estar la de Supabase.

7. Haz clic en **"SAVE"**

### 3. Esperar Propagación

Los cambios en Google Cloud Console pueden tardar unos minutos en propagarse. Espera 2-5 minutos antes de probar nuevamente.

### 4. Probar Nuevamente

1. Ve a tu aplicación en Vercel
2. Intenta iniciar sesión con Google
3. Ahora debería funcionar correctamente

## Problema 2: No Puedo Elegir Entre Múltiples Cuentas de Google

El código ya ha sido actualizado para forzar la pantalla de selección de cuenta. Si aún no puedes elegir:

### Solución

1. **Cierra sesión de Google completamente**:
   - Ve a [myaccount.google.com](https://myaccount.google.com)
   - Haz clic en "Seguridad" en el menú lateral
   - Desplázate hasta "Tus dispositivos"
   - Busca tu navegador y haz clic en "Cerrar sesión"

2. **O usa modo incógnito**:
   - Abre una ventana de incógnito en tu navegador
   - Ve a tu aplicación
   - Intenta iniciar sesión

3. **O agrega el parámetro manualmente**:
   - El código ya incluye `prompt: 'select_account'` que fuerza la selección
   - Si aún no funciona, puede ser caché del navegador
   - Intenta limpiar la caché o usar otro navegador

## 📋 Resumen de Configuración Correcta

### Authorized JavaScript origins (pueden ser múltiples):
```
http://localhost:3000
https://rnycynatrhxhbfpydqvd.supabase.co
https://manglarnet-conexion-pedagogica-qhiec31mt-frikianders-projects.vercel.app
https://*.vercel.app
```

### Authorized redirect URIs (SOLO UNA):
```
https://rnycynatrhxhbfpydqvd.supabase.co/auth/v1/callback
```

## 🔍 Verificar Configuración

Para verificar que todo está correcto:

1. Ve a Google Cloud Console > Credentials
2. Abre tu OAuth Client ID
3. Verifica que:
   - ✅ Tu URL de Vercel esté en "Authorized JavaScript origins"
   - ✅ Solo la URL de Supabase esté en "Authorized redirect URIs"
   - ✅ No haya URLs duplicadas o incorrectas

## 🐛 Si Aún No Funciona

1. **Verifica que los cambios se guardaron** en Google Cloud Console
2. **Espera 5-10 minutos** para la propagación
3. **Limpia la caché del navegador** (Ctrl+Shift+Delete)
4. **Prueba en modo incógnito**
5. **Verifica la consola del navegador** para ver errores específicos
6. **Revisa los logs de Supabase** en el dashboard

## 📞 Soporte Adicional

Si después de seguir estos pasos aún tienes problemas:

1. Verifica que el Client ID y Client Secret en Supabase Dashboard sean correctos
2. Asegúrate de que el proveedor Google esté habilitado en Supabase
3. Revisa los logs de autenticación en Supabase Dashboard > Authentication > Logs

