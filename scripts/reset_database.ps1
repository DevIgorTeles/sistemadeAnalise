# Script PowerShell para resetar o banco de dados OPA System
# Este script executa o SQL de inicialização no Windows

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Reset do Banco de Dados OPA System" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Verificar se DATABASE_URL está configurada
if (-not $env:DATABASE_URL) {
    Write-Host "Erro: DATABASE_URL não configurada" -ForegroundColor Red
    Write-Host "Configure a variável DATABASE_URL no arquivo .env"
    exit 1
}

# Extrair informações da DATABASE_URL
# Formato: mysql://user:password@host:port/database
$dbUrl = $env:DATABASE_URL -replace "mysql://", ""
$dbUser = ($dbUrl -split ":")[0]
$dbPass = (($dbUrl -split ":")[1] -split "@")[0]
$dbHost = (($dbUrl -split "@")[1] -split ":")[0]
$dbPort = ((($dbUrl -split "@")[1] -split ":")[1] -split "/")[0]
$dbName = ($dbUrl -split "/")[-1]

Write-Host "Conectando ao banco de dados..." -ForegroundColor Green
Write-Host "Host: $dbHost"
Write-Host "Port: $dbPort"
Write-Host "Database: $dbName"
Write-Host "User: $dbUser"
Write-Host ""

# Confirmar ação
$confirm = Read-Host "Tem certeza que deseja resetar o banco de dados? (sim/não)"
if ($confirm -notmatch "^(sim|s|yes|y)$") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Executando script de inicialização..." -ForegroundColor Yellow

# Executar script SQL usando mysql client
$scriptPath = Join-Path $PSScriptRoot "init_database.sql"
$mysqlCommand = "mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPass $dbName < `"$scriptPath`""

try {
    Invoke-Expression $mysqlCommand
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Banco de dados resetado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credenciais do Administrador:" -ForegroundColor Green
        Write-Host "  Email: admin@opasystem.com"
        Write-Host "  Senha: admin123"
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ Erro ao resetar banco de dados" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ Erro ao executar script: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Certifique-se de que o MySQL client está instalado e no PATH" -ForegroundColor Yellow
    exit 1
}

