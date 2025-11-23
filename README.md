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

#### 🚀 Para Novos Usuários (Setup Completo do Zero)

**Opção 1: Script SQL Completo (RECOMENDADO - Mais Rápido)**

Este script cria o banco de dados e TODAS as tabelas necessárias do zero:

```bash
# Execute o script SQL que cria tudo automaticamente
mysql -u root -padmin < setup_banco.sql

# Ou se o banco já existe:
mysql -u root -padmin opa_system < setup_banco.sql
```

O script `setup_banco.sql` cria automaticamente:
- ✅ Banco de dados `opa_system` (se não existir)
- ✅ Tabela `users` (usuários do sistema)
- ✅ Tabela `clientes` (clientes analisados)
- ✅ Tabela `saques` (análises de saques)
- ✅ Tabela `depositos` (análises de depósitos)
- ✅ Tabela `fraudes` (relatórios de fraude)
- ✅ Tabela `auditorias` (registros de auditoria)
- ✅ Tabela `logs_auditoria` (logs do sistema)
- ✅ Tabela `refresh_tokens` (tokens de autenticação)
- ✅ Todos os índices e foreign keys necessários

**Opção 2: Usando Drizzle (Alternativa)**

Se preferir usar o Drizzle ORM para sincronizar o schema:

```bash
# Sincronizar schema com o banco de dados
pnpm db:push
```

**Depois de criar as tabelas, inicialize com usuário admin:**

```bash
# Execute o script que cria o usuário administrador inicial
mysql -u root -padmin opa_system < insert_test_users.sql
```

Ou use o script Node.js:
```bash
pnpm fix:passwords
```

#### 🔄 Para Usuários Existentes (Atualizar Tabelas)

Se você já tem o banco configurado e precisa apenas atualizar as tabelas:

```bash
# Sincronizar schema com o banco (adiciona/atualiza tabelas)
pnpm db:push
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

O sistema utiliza as seguintes tabelas:

- **`users`**: Usuários do sistema (admin, analistas)
- **`clientes`**: Informações dos clientes analisados
- **`saques`**: Armazena análises de saques
- **`depositos`**: Armazena análises de depósitos
- **`fraudes`**: Relatórios de fraude
- **`auditorias`**: Registros de auditoria
- **`logs_auditoria`**: Logs de auditoria do sistema
- **`refresh_tokens`**: Tokens de refresh para autenticação

> **Nota:** A tabela `analises` antiga foi removida. Se ainda existir no banco, execute `scripts/drop_analises_table.sql` para removê-la.

> **💡 Dica:** Para criar todas as tabelas do zero, use o script `setup_banco.sql` (veja seção de Configuração do Banco de Dados acima).

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


## 🔧 Comandos Úteis do Banco de Dados

### Sincronizar schema (Recomendado)
```bash
pnpm db:push
```
Sincroniza diretamente o schema com o banco de dados. Ideal para desenvolvimento.

### Gerar migrations
```bash
pnpm db:generate
```
Gera arquivos de migration SQL baseados nas alterações do schema em `drizzle/schema.ts`.

### Aplicar migrations
```bash
pnpm db:migrate
```
Aplica as migrations geradas no banco de dados.

### Gerar e aplicar migrations
```bash
pnpm db:push-with-migrate
```
Gera e aplica migrations automaticamente no banco de dados.

### Zerar banco de dados
```bash
pnpm zerar-banco
```
Limpa todas as tabelas e recria o usuário administrador inicial.

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

### Erro ao gerar migrations

1. Verifique se o arquivo `drizzle.config.ts` está configurado corretamente
2. Confirme que a `DATABASE_URL` está definida no `.env`
3. Certifique-se de que o schema em `drizzle/schema.ts` está válido

### Erro "Unknown table 'analises'" ao aplicar migrations

Este erro ocorre quando há migrations antigas tentando remover a tabela `analises` que não existe. Soluções:

**Solução 1 - Usar push direto (Recomendado):**
```bash
pnpm db:push
```
Isso sincroniza diretamente sem usar migrations antigas.

**Solução 2 - Limpar migrations problemáticas:**
1. Remova as migrations que tentam dropar `analises` da pasta `drizzle/`
2. Remova os snapshots correspondentes de `drizzle/meta/`
3. Atualize `drizzle/meta/_journal.json` removendo as entradas problemáticas
4. Execute `pnpm db:push` novamente

## 📄 Licença

Este projeto é proprietário.

---

**Desenvolvido para Operação de Prevenção e Análise**
