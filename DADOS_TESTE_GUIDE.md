# 📊 Guia de Dados de Teste - Sistema OPA

## 📝 Visão Geral

Este documento explica os dados fictícios criados para testes do Sistema OPA, incluindo análise de saques, depósitos, fraudes e relatórios.

## 🎯 Dados Criados

### 1. Clientes (8 registros)

| ID Cliente   | Nome Completo            | Status      |
|--------------|--------------------------|-------------|
| TEST_CLI_001 | João Silva Santos        | OK          |
| TEST_CLI_002 | Maria Oliveira Costa     | MONITORAR   |
| TEST_CLI_003 | Pedro Alves Ribeiro      | CRITICO     |
| TEST_CLI_004 | Ana Paula Souza          | OK          |
| TEST_CLI_005 | Carlos Eduardo Lima      | MONITORAR   |
| TEST_CLI_006 | Fernanda Torres          | OK          |
| TEST_CLI_007 | Roberto Mendes Junior    | CRITICO     |
| TEST_CLI_008 | Juliana Ferreira         | MONITORAR   |

**Distribuição de Status:**
- ✅ **OK**: 3 clientes
- ⚠️ **MONITORAR**: 3 clientes  
- 🔴 **CRITICO**: 2 clientes

### 2. Análises de SAQUE (7 registros)

#### Categoria: CASSINO (3 análises)
- **TEST_CLI_001**: Saque de R$ 1.500,00 às 14:23 - Alta atividade em slots
- **TEST_CLI_004**: Saque de R$ 3.000,00 às 18:45 - Grande saque após bônus
- **TEST_CLI_006**: Saque de R$ 750,50 às 09:12 - Atividade normal

#### Categoria: SPORTBOOK (3 análises)
- **TEST_CLI_002**: Saque de R$ 2.500,00 às 16:30 - Futebol Internacional
- **TEST_CLI_005**: Saque de R$ 1.800,00 às 20:15 - Basketball NBA
- **TEST_CLI_008**: Saque de R$ 2.200,00 às 11:45 - Tennis WTA

#### Categoria: OUTROS (1 análise)
- **TEST_CLI_003**: Saque de R$ 950,00 às 13:22 - Padrão irregular

### 3. Análises de DEPOSITO (7 registros)

#### Categoria: CASSINO (3 análises com ganho)
- **TEST_CLI_001**: Depósito R$ 2.000,00 | Ganho: R$ 350,00
- **TEST_CLI_004**: Depósito R$ 5.000,00 | Ganho: R$ 1.200,00
- **TEST_CLI_006**: Depósito R$ 1.200,00 | Ganho: R$ 80,00

#### Categoria: SPORTBOOK (3 análises com perda)
- **TEST_CLI_002**: Depósito R$ 3.000,00 | Perda: R$ 800,00
- **TEST_CLI_005**: Depósito R$ 1.500,00 | Perda: R$ 450,00
- **TEST_CLI_008**: Depósito R$ 2.100,00 | Perda: R$ 500,00

#### Categoria: OUTROS (1 análise)
- **TEST_CLI_003**: Depósito R$ 1.000,00 | Ganho: R$ 150,00

### 4. Registros de FRAUDES (6 registros)

| Cliente      | Motivo Padrão            | Analista |
|--------------|--------------------------|----------|
| TEST_CLI_003 | COMPORTAMENTO_SUSPEITO   | Admin    |
| TEST_CLI_007 | GOLPE                    | Analista |
| TEST_CLI_002 | MULTIPLA_CONTA           | Admin    |
| TEST_CLI_005 | MANIPULACAO_JOGOS        | Analista |
| TEST_CLI_008 | CHARGEBACK              | Admin    |
| TEST_CLI_007 | DOCUMENTACAO_FALSA       | Analista |

### 5. Logs de Auditoria (7 registros)

Inclui registros de:
- Login de usuários
- Criação de análises
- Finalização de análises
- Reporte de fraudes

## 🚀 Como Executar

### Passo 1: Execute o script SQL

```bash
# Via MySQL Workbench, DBeaver, ou linha de comando:
mysql -u root -p opa_system < dados_ficticios_teste.sql
```

### Passo 2: Verifique os dados inseridos

```sql
-- Ver todos os clientes
SELECT * FROM clientes WHERE id_cliente LIKE 'TEST_%';

-- Ver todas as análises
SELECT * FROM analises WHERE id_cliente LIKE 'TEST_%';

-- Ver todas as fraudes
SELECT * FROM fraudes WHERE id_cliente LIKE 'TEST_%';
```

## 📊 Testando Funcionalidades

### Teste de Relatórios

1. **Página de Análises**: Verá as 14 análises (7 de SAQUE + 7 de DEPOSITO)
2. **Filtros por Tipo**: Teste filtros de SAQUE vs DEPOSITO
3. **Período**: Análises espalhadas em dezembro de 2024
4. **Status**: Clientes com diferentes status para análise

### Teste de Fraudes

1. **Página de Fraudes**: Verá 6 registros de fraudes
2. **Filtros**: Por motivo padrão, período, analista
3. **Detalhes**: Cada fraude tem motivo livre explicativo

### Teste de Métricas

1. **Página de Relatórios**: Visualize métricas agregadas
2. **Filtros por Analista**: Veja análises por usuário
3. **Filtros por Categoria**: Compare CASSINO vs SPORTBOOK
4. **Período**: Filtrar por data de análise

### Teste de Dashboard/Home

1. **Estatísticas Gerais**: Contadores de análises
2. **Clientes por Status**: Gráficos de distribuição
3. **Atividade Recente**: Últimas análises e fraudes

## 🔍 Consultas Úteis

### Total de análises por categoria
```sql
SELECT 
    categoria_saque AS categoria,
    COUNT(*) AS quantidade
FROM analises
WHERE categoria_saque IS NOT NULL AND id_cliente LIKE 'TEST_%'
GROUP BY categoria_saque

UNION ALL

SELECT 
    categoria_deposito AS categoria,
    COUNT(*) AS quantidade
FROM analises
WHERE categoria_deposito IS NOT NULL AND id_cliente LIKE 'TEST_%'
GROUP BY categoria_deposito;
```

### Clientes com fraudes
```sql
SELECT 
    c.nome_completo,
    c.status_cliente,
    COUNT(f.id) AS total_fraudes
FROM clientes c
JOIN fraudes f ON c.id_cliente = f.id_cliente
WHERE c.id_cliente LIKE 'TEST_%'
GROUP BY c.id_cliente, c.nome_completo, c.status_cliente;
```

### Análises por analista
```sql
SELECT 
    u.name AS analista,
    u.role,
    COUNT(a.id) AS total_analises
FROM analises a
JOIN users u ON a.auditoria_usuario = u.id
WHERE a.id_cliente LIKE 'TEST_%'
GROUP BY u.id, u.name, u.role;
```

## 🧹 Limpeza (Opcional)

Para remover os dados de teste:

```sql
USE opa_system;

-- Remove em cascata (se configurações de FK permitirem)
DELETE FROM logs_auditoria WHERE usuario_id IN (SELECT id FROM users WHERE openId LIKE 'test-%');
DELETE FROM fraudes WHERE id_cliente LIKE 'TEST_%';
DELETE FROM analises WHERE id_cliente LIKE 'TEST_%';
DELETE FROM clientes WHERE id_cliente LIKE 'TEST_%';
```

## 📈 Cobertura de Testes

✅ **Dados criados para testar:**

- [x] Análises de SAQUE com diferentes categorias
- [x] Análises de DEPOSITO com ganhos e perdas
- [x] Clientes com todos os status (OK, MONITORAR, CRITICO)
- [x] Registros de fraudes com diferentes motivos
- [x] Logs de auditoria variados
- [x] Diferentes horários de saque
- [x] Diferentes valores de movimentação
- [x] Diferentes tipos de jogos (cassino e esportes)
- [x] Análises por diferentes usuários (admin e analista)

## 💡 Notas Importantes

1. **IDs seguem padrão TEST_***: Todos os IDs de clientes começam com `TEST_` para fácil identificação
2. **Datas recentes**: Todas as análises são de dezembro 2024 para facilitar testes
3. **Valores realistas**: Os valores são variados para testes estatísticos
4. **Dados coerentes**: Clientes com problemas têm mais análises de saque
5. **Usuários existentes**: Usa os usuários já criados no sistema

## 🎯 Próximos Passos

1. Execute o script SQL
2. Acesse o sistema e navegue pelas páginas
3. Teste filtros e relatórios
4. Verifique se todos os dados aparecem corretamente
5. Teste funcionalidades de busca e ordenação

## 📝 Estrutura de Arquivos

```
opa_system_novo/
├── dados_ficticios_teste.sql  ← Script SQL com todos os dados
└── DADOS_TESTE_GUIDE.md       ← Este arquivo (documentação)
```

---

**Criado em**: Dezembro 2024  
**Versão**: 1.0  
**Autor**: Sistema OPA

