$ErrorActionPreference = "Stop"

# 1. Build Next.js
Write-Host "Building Next.js standalone..."
npm run build

# Next.js standalone output folder
$standaloneDir = ".next\standalone"

# Next.js might nest the output depending on workspace, let's locate the server.js
$serverJsPath = Get-ChildItem -Path $standaloneDir -Filter "server.js" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $serverJsPath) {
    Write-Error "Could not find server.js inside $standaloneDir"
    exit 1
}
$targetStandaloneDir = $serverJsPath.Directory.FullName

Write-Host "Found standalone root at: $targetStandaloneDir"

# 2. Copy static files required by Next.js standalone
Write-Host "Copying static assets..."
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination "$targetStandaloneDir\public" -Recurse -Force
}

$staticTarget = "$targetStandaloneDir\.next\static"
if (-not (Test-Path $staticTarget)) {
    New-Item -ItemType Directory -Force -Path $staticTarget | Out-Null
}
Copy-Item -Path ".next\static\*" -Destination $staticTarget -Recurse -Force

# 3. Bundle scripts/ directory for listener
if (Test-Path "scripts\server.ts") {
    Write-Host "Bundling scripts/server.ts..."
    New-Item -ItemType Directory -Force -Path "$targetStandaloneDir\scripts" | Out-Null
    bun build scripts/server.ts --target bun --outfile "$targetStandaloneDir\scripts\server.js"
}

# 4. Bundle Bun.exe runtime
$bunPath = (Get-Command bun.exe -ErrorAction SilentlyContinue).Source
if ($bunPath -and (Test-Path $bunPath)) {
    Write-Host "Bundling Bun executable from $bunPath..."
    Copy-Item -Path $bunPath -Destination "$targetStandaloneDir\bun.exe" -Force
} else {
    Write-Warning "bun.exe not found on PATH! Make sure Bun is installed."
}

Write-Host "Standalone build ready with Bun runtime!"
