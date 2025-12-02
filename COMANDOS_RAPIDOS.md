# Comandos Rápidos para Desplegar

## Opción 1: Usar el Script Automático

```bash
bash deploy-function.sh
```

El script te guiará paso a paso.

## Opción 2: Comandos Manuales

### 1. Login (si no estás logueado)
```bash
supabase login
```

### 2. Vincular proyecto (si no está vinculado)
```bash
supabase link
```

### 3. Configurar secreto
```bash
# Primero obtén el service_role key de: Supabase Dashboard > Settings > API
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

### 4. Desplegar función
```bash
supabase functions deploy create-user
```

### 5. Verificar
```bash
supabase functions list
```

## ✅ Después del Despliegue

Una vez desplegada la función:
- ✅ Puedes crear usuarios desde la interfaz
- ✅ No necesitas habilitar signups públicos
- ✅ La función se usa automáticamente
- ✅ Solo coordinadores y directivos pueden crear usuarios

