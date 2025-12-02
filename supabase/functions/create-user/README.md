# Edge Function: create-user

Esta función permite crear usuarios de forma segura usando el `service_role` key, sin necesidad de habilitar signups públicos.

## Despliegue

1. **Asegúrate de tener el service_role key configurado**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Desplegar la función**:
   ```bash
   supabase functions deploy create-user
   ```

## Uso

La función requiere:
- Header de autorización con el token del usuario actual
- El usuario debe ser coordinador o directivo
- Body con los datos del usuario a crear

## Configuración de Variables de Entorno

La función usa estas variables de entorno (configuradas automáticamente por Supabase):
- `SUPABASE_URL` - URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (configurar manualmente)

