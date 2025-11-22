# OPA System - Sistema de Operação de Prevenção e Análise

Sistema completo para análise e auditoria de operações financeiras, com suporte para análises de saques e depósitos.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm/pnpm
- MySQL 8.0+
- Variáveis de ambiente configuradas (veja `.env.example`)

### Instalação

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### Configuração do Banco de Dados

1. **Criar o banco de dados:**
```sql
CREATE DATABASE opa_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Executar migrations:**
```bash
pnpm drizzle-kit push
```

3. **Inicializar banco com usuário admin:**
```bash
# Linux/Mac
chmod +x scripts/reset_database.sh
./scripts/reset_database.sh

# Windows (PowerShell)
.\scripts\reset_database.ps1
```

Ou execute manualmente o SQL:
```bash
mysql -u seu_usuario -p opa_system < scripts/init_database.sql
```

## 🔐 Credenciais do Administrador Inicial

Após executar o script de inicialização, use as seguintes credenciais:

- **Email:** `admin@opasystem.com`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## 🔄 Zerar o Banco de Dados

Para zerar completamente o banco de dados e recriar o usuário administrador:

### Método 1: Script Node.js (Recomendado)
```bash
pnpm zerar-banco
```

O script pedirá confirmação digitando "ZERAR" para evitar acidentes.

### Método 2: Script SQL direto
```bash
mysql -u seu_usuario -p opa_system < scripts/zerar_banco.sql
```

### Método 3: Scripts Shell/PowerShell
```bash
# Linux/Mac
./scripts/reset_database.sh

# Windows (PowerShell)
.\scripts\reset_database.ps1
```

**⚠️ ATENÇÃO:** Todos os métodos irão **DELETAR TODOS OS DADOS** do banco de dados!

## 🏃 Executar o Sistema

### Desenvolvimento

```bash
# Iniciar servidor e cliente em modo desenvolvimento
pnpm dev
```

O sistema estará disponível em:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Produção

```bash
# Build
pnpm build

# Iniciar servidor
pnpm start
```

## 📊 Estrutura do Banco de Dados

O sistema utiliza tabelas separadas para diferentes tipos de análise:

- **`saques`**: Armazena análises de saques
- **`depositos`**: Armazena análises de depósitos
- **`clientes`**: Informações dos clientes
- **`auditorias`**: Registros de auditoria
- **`fraudes`**: Relatórios de fraude
- **`users`**: Usuários do sistema
- **`logs_auditoria`**: Logs de auditoria do sistema
- **`refresh_tokens`**: Tokens de refresh para autenticação

> **Nota:** A tabela `analises` antiga foi removida. Se ainda existir no banco, execute `scripts/drop_analises_table.sql` para removê-la.

## 🎯 Funcionalidades Principais

- ✅ Análise de Saques e Depósitos
- ✅ Auditoria de operações
- ✅ Relatórios e métricas
- ✅ Gestão de usuários
- ✅ Dashboard administrativo
- ✅ Dashboard de analista

## 📝 Regras de Negócio

- Cada cliente pode fazer **1 análise de SAQUE por dia**
- Cada cliente pode fazer **1 análise de DEPÓSITO por dia**
- É permitido fazer **1 de cada tipo no mesmo dia**

## 🛠️ Tecnologias

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + tRPC + Express
- **Banco de Dados:** MySQL + Drizzle ORM
- **Autenticação:** JWT + bcrypt

## 📚 Documentação Adicional

- [Migração para Tabelas Separadas](./MIGRACAO_TABELAS_SEPARADAS.md) - Detalhes sobre a estrutura de banco

## 🔧 Troubleshooting

### Erro de conexão com banco de dados

Verifique se:
1. O MySQL está rodando
2. A `DATABASE_URL` no `.env` está correta
3. O banco de dados foi criado

### Erro ao fazer login

1. Verifique se executou o script de inicialização
2. Confirme as credenciais: `admin@opasystem.com` / `admin123`
3. Verifique se o usuário está ativo no banco

### Reset do banco não funciona

1. Certifique-se de que o MySQL client está instalado
2. Verifique permissões do usuário MySQL
3. Execute o SQL manualmente se necessário

## 📄 Licença

Este projeto é proprietário.

---

**Desenvolvido para Operação de Prevenção e Análise**
