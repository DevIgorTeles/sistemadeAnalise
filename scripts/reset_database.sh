#!/bin/bash

# Script para resetar o banco de dados OPA System
# Este script executa o SQL de inicialização

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Reset do Banco de Dados OPA System${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Erro: DATABASE_URL não configurada${NC}"
    echo "Configure a variável DATABASE_URL no arquivo .env"
    exit 1
fi

# Extrair informações da DATABASE_URL
# Formato: mysql://user:password@host:port/database
DB_URL=$(echo $DATABASE_URL | sed 's|mysql://||')
DB_USER=$(echo $DB_URL | cut -d: -f1)
DB_PASS=$(echo $DB_URL | cut -d: -f2 | cut -d@ -f1)
DB_HOST=$(echo $DB_URL | cut -d@ -f2 | cut -d: -f1)
DB_PORT=$(echo $DB_URL | cut -d: -f3 | cut -d/ -f1)
DB_NAME=$(echo $DB_URL | cut -d/ -f2)

echo -e "${GREEN}Conectando ao banco de dados...${NC}"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Confirmar ação
read -p "Tem certeza que deseja resetar o banco de dados? (sim/não): " confirm
if [ "$confirm" != "sim" ] && [ "$confirm" != "s" ] && [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Executando script de inicialização...${NC}"

# Executar script SQL
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < scripts/init_database.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Banco de dados resetado com sucesso!${NC}"
    echo ""
    echo -e "${GREEN}Credenciais do Administrador:${NC}"
    echo "  Email: admin@opasystem.com"
    echo "  Senha: admin123"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Erro ao resetar banco de dados${NC}"
    exit 1
fi

