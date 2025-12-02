#!/bin/bash

# Script para desplegar la Edge Function create-user
# Ejecuta: bash deploy-function.sh

echo "🚀 Desplegando Edge Function create-user..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "supabase/functions/create-user/index.ts" ]; then
    echo "❌ Error: No se encuentra la función. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Paso 1: Verificar login
echo "📋 Paso 1: Verificando login en Supabase..."
if ! supabase projects list &>/dev/null; then
    echo "⚠️  No estás logueado. Ejecuta primero: supabase login"
    echo "   Esto abrirá tu navegador para autenticarte."
    exit 1
fi

# Paso 2: Verificar que el proyecto está vinculado
echo "📋 Paso 2: Verificando que el proyecto está vinculado..."
if [ ! -f ".supabase/config.toml" ] && [ ! -f "supabase/.temp/project-ref" ]; then
    echo "⚠️  El proyecto no está vinculado. Ejecuta: supabase link"
    echo "   Selecciona tu proyecto de la lista."
    exit 1
fi

# Paso 3: Solicitar service_role key
echo ""
echo "📋 Paso 3: Necesitas el Service Role Key"
echo "   1. Ve a Supabase Dashboard > Settings > API"
echo "   2. Busca 'service_role' key (NO el anon key)"
echo "   3. Cópialo"
echo ""
read -sp "   Pega el Service Role Key aquí (no se mostrará): " SERVICE_KEY
echo ""

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: No se proporcionó el Service Role Key"
    exit 1
fi

# Paso 4: Configurar el secreto
echo "📋 Paso 4: Configurando el secreto..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"

if [ $? -ne 0 ]; then
    echo "❌ Error al configurar el secreto"
    exit 1
fi

echo "✅ Secreto configurado correctamente"
echo ""

# Paso 5: Desplegar la función
echo "📋 Paso 5: Desplegando la función create-user..."
supabase functions deploy create-user

if [ $? -ne 0 ]; then
    echo "❌ Error al desplegar la función"
    exit 1
fi

echo ""
echo "✅ ¡Función desplegada exitosamente!"
echo ""
echo "📋 Verificando despliegue..."
supabase functions list

echo ""
echo "🎉 ¡Listo! Ahora puedes crear usuarios desde la interfaz."
echo "   La función se usará automáticamente cuando crees usuarios."

