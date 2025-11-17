# Script maestro para ejecutar todos los scripts en orden
# Ejecutar desde: manglarnet---conexión-pedagógica\

Write-Host "🚀 Ejecutando migración completa..." -ForegroundColor Cyan
Write-Host "`nEste script ejecutará:" -ForegroundColor Yellow
Write-Host "   1. Migración de archivos" -ForegroundColor White
Write-Host "   2. Creación de configuraciones" -ForegroundColor White
Write-Host "   3. Limpieza del proyecto original" -ForegroundColor White
Write-Host "   4. Restauración de configuración Vite" -ForegroundColor White
Write-Host "`n¿Continuar? (S/N): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operación cancelada." -ForegroundColor Red
    exit 0
}

# Obtener el directorio actual
$currentDir = Get-Location
$parentDir = Split-Path -Parent $currentDir
$nextjsDir = Join-Path $parentDir "manglarnet-nextjs"

# ============================================
# PASO 1: MIGRAR ARCHIVOS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 1: Migrando archivos a manglarnet-nextjs" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Crear directorio si no existe
if (-not (Test-Path $nextjsDir)) {
    New-Item -ItemType Directory -Path $nextjsDir | Out-Null
    Write-Host "✅ Directorio creado: $nextjsDir" -ForegroundColor Green
} else {
    Write-Host "⚠️  El directorio ya existe: $nextjsDir" -ForegroundColor Yellow
}

# Función para copiar directorio recursivamente
function Copy-Directory {
    param([string]$Source, [string]$Destination)
    if (Test-Path $Source) {
        $destParent = Split-Path -Parent $Destination
        if (-not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force
        Write-Host "✅ Copiado: $Source -> $Destination" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No encontrado: $Source" -ForegroundColor Yellow
    }
}

# Función para copiar archivo
function Copy-File {
    param([string]$Source, [string]$Destination)
    if (Test-Path $Source) {
        $destParent = Split-Path -Parent $Destination
        if (-not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "✅ Copiado: $Source -> $Destination" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No encontrado: $Source" -ForegroundColor Yellow
    }
}

Write-Host "📁 Copiando directorios..." -ForegroundColor Cyan
Copy-Directory -Source (Join-Path $currentDir "app") -Destination (Join-Path $nextjsDir "app")
Copy-Directory -Source (Join-Path $currentDir "lib") -Destination (Join-Path $nextjsDir "lib")
Copy-Directory -Source (Join-Path $currentDir "components") -Destination (Join-Path $nextjsDir "components")
Copy-Directory -Source (Join-Path $currentDir "types") -Destination (Join-Path $nextjsDir "types")

Write-Host "`n📄 Copiando archivos de configuración..." -ForegroundColor Cyan
Copy-File -Source (Join-Path $currentDir "middleware.ts") -Destination (Join-Path $nextjsDir "middleware.ts")
Copy-File -Source (Join-Path $currentDir "next.config.js") -Destination (Join-Path $nextjsDir "next.config.js")
Copy-File -Source (Join-Path $currentDir "next-env.d.ts") -Destination (Join-Path $nextjsDir "next-env.d.ts")
Copy-File -Source (Join-Path $currentDir "tailwind.config.ts") -Destination (Join-Path $nextjsDir "tailwind.config.ts")
Copy-File -Source (Join-Path $currentDir "postcss.config.js") -Destination (Join-Path $nextjsDir "postcss.config.js")

# Copiar .env.local si existe
if (Test-Path (Join-Path $currentDir ".env.local")) {
    Copy-File -Source (Join-Path $currentDir ".env.local") -Destination (Join-Path $nextjsDir ".env.local")
}

# ============================================
# PASO 2: CREAR CONFIGURACIONES
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 2: Creando archivos de configuración" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Crear package.json para Next.js
$packageJson = @{
    name = "manglarnet-nextjs"
    version = "1.0.0"
    private = $true
    scripts = @{
        dev = "next dev"
        build = "next build"
        start = "next start"
        lint = "next lint"
    }
    dependencies = @{
        "@supabase/supabase-js" = "^2.39.0"
        "@supabase/ssr" = "^0.5.0"
        "html2canvas" = "^1.4.1"
        "jspdf" = "^3.0.3"
        "marked" = "^17.0.0"
        "next" = "^15.0.0"
        "react" = "^19.2.0"
        "react-dom" = "^19.2.0"
    }
    devDependencies = @{
        "@types/node" = "^22.14.0"
        "@types/react" = "^19.0.0"
        "@types/react-dom" = "^19.0.0"
        "autoprefixer" = "^10.4.20"
        "eslint" = "^8.57.0"
        "eslint-config-next" = "^14.2.0"
        "postcss" = "^8.4.47"
        "tailwindcss" = "^3.4.13"
        "typescript" = "~5.8.2"
    }
}

$packageJsonPath = Join-Path $nextjsDir "package.json"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath
Write-Host "✅ Creado: package.json" -ForegroundColor Green

# Crear tsconfig.json para Next.js
$tsconfig = @{
    compilerOptions = @{
        target = "ES2022"
        lib = @("dom", "dom.iterable", "esnext")
        allowJs = $true
        skipLibCheck = $true
        strict = $true
        noEmit = $true
        esModuleInterop = $true
        module = "esnext"
        moduleResolution = "bundler"
        resolveJsonModule = $true
        isolatedModules = $true
        jsx = "preserve"
        incremental = $true
        plugins = @(@{ name = "next" })
        paths = @{ "@/*" = @("./*") }
    }
    include = @("next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts")
    exclude = @("node_modules")
}

$tsconfigPath = Join-Path $nextjsDir "tsconfig.json"
$tsconfig | ConvertTo-Json -Depth 10 | Set-Content -Path $tsconfigPath
Write-Host "✅ Creado: tsconfig.json" -ForegroundColor Green

# Crear .gitignore para Next.js
$gitignoreContent = @"
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build
/dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
"@

$gitignorePath = Join-Path $nextjsDir ".gitignore"
$gitignoreContent | Set-Content -Path $gitignorePath
Write-Host "✅ Creado: .gitignore" -ForegroundColor Green

# Crear README.md básico
$readmeContent = @"
# ManglarNet - Next.js

Migración de ManglarNet a Next.js 15 con App Router.

## Instalación

\`\`\`bash
npm install
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Variables de Entorno

Crear archivo \`.env.local\` con:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
\`\`\`
"@

$readmePath = Join-Path $nextjsDir "README.md"
$readmeContent | Set-Content -Path $readmePath
Write-Host "✅ Creado: README.md" -ForegroundColor Green

# ============================================
# PASO 3: LIMPIAR PROYECTO ORIGINAL
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 3: Limpiando proyecto original" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "⚠️  Eliminando archivos de Next.js del proyecto original..." -ForegroundColor Yellow

# Función para eliminar directorio
function Remove-Directory {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force
        Write-Host "✅ Eliminado: $Path" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No encontrado: $Path" -ForegroundColor Yellow
    }
}

# Función para eliminar archivo
function Remove-File {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Force
        Write-Host "✅ Eliminado: $Path" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No encontrado: $Path" -ForegroundColor Yellow
    }
}

Write-Host "`n🗑️  Eliminando directorios de Next.js..." -ForegroundColor Cyan
Remove-Directory -Path (Join-Path $currentDir "app")
Remove-Directory -Path (Join-Path $currentDir "lib")

Write-Host "`n🗑️  Eliminando archivos de Next.js..." -ForegroundColor Cyan
Remove-File -Path (Join-Path $currentDir "middleware.ts")
Remove-File -Path (Join-Path $currentDir "next.config.js")
Remove-File -Path (Join-Path $currentDir "next-env.d.ts")

# Eliminar .next si existe
if (Test-Path (Join-Path $currentDir ".next")) {
    Remove-Directory -Path (Join-Path $currentDir ".next")
}

# ============================================
# PASO 4: RESTAURAR CONFIGURACIÓN VITE
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PASO 4: Restaurando configuración de Vite" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Restaurar package.json para Vite
$packageJsonVite = @{
    name = "manglarnet-conexion-pedagogica"
    private = $true
    version = "0.0.0"
    type = "module"
    scripts = @{
        dev = "vite"
        build = "vite build"
        preview = "vite preview"
    }
    dependencies = @{
        "@supabase/supabase-js" = "^2.39.0"
        "html2canvas" = "^1.4.1"
        "jspdf" = "^3.0.3"
        "marked" = "^17.0.0"
        "react" = "^19.2.0"
        "react-dom" = "^19.2.0"
    }
    devDependencies = @{
        "@types/react" = "^19.0.0"
        "@types/react-dom" = "^19.0.0"
        "@vitejs/plugin-react" = "^5.0.0"
        "autoprefixer" = "^10.4.20"
        "postcss" = "^8.4.47"
        "tailwindcss" = "^3.4.13"
        "typescript" = "~5.8.2"
        "vite" = "^6.2.0"
    }
}

$packageJsonVitePath = Join-Path $currentDir "package.json"
$packageJsonVite | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonVitePath
Write-Host "✅ Restaurado: package.json (Vite)" -ForegroundColor Green

# Restaurar tsconfig.json para Vite
$tsconfigVite = @{
    compilerOptions = @{
        target = "ES2020"
        useDefineForClassFields = $true
        lib = @("ES2020", "DOM", "DOM.Iterable")
        module = "ESNext"
        skipLibCheck = $true
        moduleResolution = "bundler"
        allowImportingTsExtensions = $true
        resolveJsonModule = $true
        isolatedModules = $true
        noEmit = $true
        jsx = "react-jsx"
        strict = $true
        noUnusedLocals = $true
        noUnusedParameters = $true
        noFallthroughCasesInSwitch = $true
        baseUrl = "."
        paths = @{ "@/*" = @("./*") }
    }
    include = @("src")
    references = @(@{ path = "./tsconfig.node.json" })
}

$tsconfigVitePath = Join-Path $currentDir "tsconfig.json"
$tsconfigVite | ConvertTo-Json -Depth 10 | Set-Content -Path $tsconfigVitePath
Write-Host "✅ Restaurado: tsconfig.json (Vite)" -ForegroundColor Green

# ============================================
# FINALIZACIÓN
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Migración completada exitosamente!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. En el proyecto original: npm install" -ForegroundColor Yellow
Write-Host "   2. En manglarnet-nextjs: cd ../manglarnet-nextjs && npm install" -ForegroundColor Yellow
Write-Host "   3. Probar ambos proyectos" -ForegroundColor Yellow
