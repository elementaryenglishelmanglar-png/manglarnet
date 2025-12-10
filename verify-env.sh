#!/bin/bash

# Script de verificación de variables de entorno
# Ejecuta este script para verificar que tu configuración es correcta

echo "🔍 Verificando configuración de variables de entorno..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que existe .env.local
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ Archivo .env.local encontrado${NC}"
else
    echo -e "${RED}❌ Archivo .env.local NO encontrado${NC}"
    echo -e "${YELLOW}   Ejecuta: cp .env.example .env.local${NC}"
    exit 1
fi

# Verificar que contiene las variables necesarias
echo ""
echo "📋 Verificando variables requeridas..."

check_var() {
    local var_name=$1
    if grep -q "^${var_name}=" .env.local && ! grep -q "^${var_name}=$" .env.local; then
        echo -e "${GREEN}✅ ${var_name} configurado${NC}"
        return 0
    else
        echo -e "${RED}❌ ${var_name} NO configurado o vacío${NC}"
        return 1
    fi
}

all_ok=true

check_var "VITE_SUPABASE_URL" || all_ok=false
check_var "VITE_SUPABASE_ANON_KEY" || all_ok=false

# Verificar .gitignore
echo ""
echo "🛡️  Verificando protección de archivos sensibles..."
if grep -q ".env*.local" .gitignore && grep -q "^.env$" .gitignore; then
    echo -e "${GREEN}✅ .gitignore protege archivos .env${NC}"
else
    echo -e "${YELLOW}⚠️  .gitignore podría no proteger archivos .env correctamente${NC}"
fi

# Verificar que node_modules existe
echo ""
echo "📦 Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  Dependencias no instaladas${NC}"
    echo -e "${YELLOW}   Ejecuta: npm install${NC}"
fi

# Resumen final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$all_ok" = true ]; then
    echo -e "${GREEN}✅ Configuración completa y correcta${NC}"
    echo ""
    echo "🚀 Puedes iniciar el proyecto con:"
    echo "   npm run dev"
else
    echo -e "${RED}❌ Hay problemas con la configuración${NC}"
    echo ""
    echo "📚 Consulta CONFIGURACION_ENV.md para más ayuda"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
