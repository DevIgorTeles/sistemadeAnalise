# Migração para Tabelas Separadas: Saques e Depósitos

## 📋 Resumo das Alterações

Este documento detalha todas as alterações realizadas para migrar da estrutura antiga (tabela única `analises`) para a nova estrutura com tabelas separadas (`saques` e `depositos`).

---

## ✅ Alterações Realizadas

### 1. **Schema do Banco de Dados**

#### Tabelas Criadas
- ✅ **Tabela `saques`**: Armazena exclusivamente análises de saque
- ✅ **Tabela `depositos`**: Armazena exclusivamente análises de depósito

#### Estrutura Mantida
- ✅ Tabela `analises` antiga mantida no schema (para backup histórico)
- ✅ Todas as relações atualizadas para usar as novas tabelas
- ✅ Índices otimizados criados para ambas as tabelas

**Arquivos Modificados:**
- `drizzle/schema.ts`: Relações atualizadas (`saquesRelations`, `depositosRelations`)

---

### 2. **Backend (Server)**

#### Funções Atualizadas em `server/db.ts`

1. **`getUltimaAnalise(idCliente: string)`**
   - ✅ Busca em ambas as tabelas (`saques` e `depositos`)
   - ✅ Retorna a análise mais recente (comparando por data e ID)
   - ✅ Usado apenas para obter nome do cliente e data de criação

2. **`verificarDuplicidade(idCliente, dataAnalise, tipoAnalise)`**
   - ✅ Verifica duplicidade na tabela específica baseada no tipo
   - ✅ Garante regra de negócio: 1 análise de saque por dia e 1 análise de depósito por dia
   - ✅ Permite fazer uma de cada tipo no mesmo dia

3. **`getAnalisePorDataETipo(idCliente, dataAnalise, tipoAnalise)`**
   - ✅ Busca na tabela específica (`saques` ou `depositos`)
   - ✅ Retorna a análise mais recente do tipo especificado

4. **`getAnalisePorData(idCliente, dataAnalise)`**
   - ✅ Busca em ambas as tabelas e retorna a mais recente
   - ✅ Mantido para compatibilidade com código existente

5. **`getDataCriacaoConta(idCliente: string)`**
   - ✅ Busca em ambas as tabelas
   - ✅ Retorna a data de criação da conta mais antiga disponível

6. **`criarAnalise(analise: AnaliseInput)`**
   - ✅ **Tipo corrigido**: Criado tipo `AnaliseInput` independente da tabela `analises` antiga
   - ✅ Insere na tabela específica baseada em `tipoAnalise`
   - ✅ Para `SAQUE`: insere em `saques`
   - ✅ Para `DEPOSITO`: insere em `depositos`
   - ✅ Invalidar cache após criação

7. **`listarMetricasAnalises(filtros)`**
   - ✅ Busca em ambas as tabelas quando necessário
   - ✅ Adiciona campo `tipoAnalise` para compatibilidade
   - ✅ Suporta filtro por tipo de análise

**Arquivos Modificados:**
- `server/db.ts`: Removida dependência da tabela `analises` antiga, criado tipo `AnaliseInput`

---

### 3. **Routers (API)**

#### `server/routers.ts`

1. **Validação de Schemas**
   - ✅ `analisesSchema`: Validação diferenciada por tipo (SAQUE/DEPOSITO)
   - ✅ Campos específicos obrigatórios por tipo

2. **Procedures**
   - ✅ `analises.verificarHoje`: Usa `verificarDuplicidade` com tipo
   - ✅ `analises.criar`: Usa `criarAnalise` atualizada
   - ✅ `analises.getUltimo`: Usa `getUltimaAnalise` atualizada
   - ✅ `analises.getDataCriacaoConta`: Busca apenas data de criação

**Arquivos Modificados:**
- `server/routers.ts`: Nenhuma alteração necessária (já estava usando as funções corretas)

---

### 4. **Frontend**

#### `client/src/pages/NovaAnalise.tsx`

1. **Preenchimento Automático por ID**
   - ✅ **CORRIGIDO**: Ao inserir ID do cliente, preenche apenas:
     - Nome do cliente (de última análise)
     - Data de criação da conta (do banco de dados)
   - ✅ **NÃO preenche** nenhum dado de análises antigas
   - ✅ Campos específicos permanecem limpos

2. **Limpeza de Campos**
   - ✅ Ao trocar tipo de análise, campos específicos do outro tipo são limpos
   - ✅ Ao limpar ID do cliente, todos os campos são limpos (exceto tipo de análise)

3. **Finalização de Análise**
   - ✅ **JÁ IMPLEMENTADO**: Após finalizar análise, usuário permanece na tela
   - ✅ Formulário é limpo para nova análise
   - ✅ Data de análise é resetada para hoje

**Arquivos Modificados:**
- `client/src/pages/NovaAnalise.tsx`: Adicionado `useEffect` para limpar campos ao trocar tipo de análise

---

## 🔍 Regras de Negócio Validadas

### ✅ Duplicidade
- ✅ Cada cliente pode fazer **apenas 1 análise de SAQUE por dia**
- ✅ Cada cliente pode fazer **apenas 1 análise de DEPÓSITO por dia**
- ✅ É permitido fazer **1 de cada tipo no mesmo dia**

### ✅ Preenchimento Automático
- ✅ Ao informar ID do cliente:
  - Preenche apenas **nome** e **data de criação da conta**
  - **Não preenche** dados de análises antigas
  - Campos específicos permanecem limpos

### ✅ Persistência na Tela
- ✅ Após finalizar análise, usuário **permanece na tela** de nova análise
- ✅ Formulário é limpo automaticamente para nova análise

---

## 📊 Validação da Estrutura do Banco

### Tabelas e Campos para Funcionalidades

#### ✅ Histórico
- Campos `auditoriaData`, `dataAnalise` em ambas as tabelas
- Índices por cliente e data
- Índices por analista e data

#### ✅ Auditoria
- Tabela `auditorias` separada
- Campo `auditoriaUsuario` em `saques` e `depositos`
- Campo `auditoriaData` em `saques` e `depositos`
- Tabela `logs_auditoria` para trilha de auditoria

#### ✅ Logs
- Tabela `logs_auditoria` (JSON para detalhes flexíveis)
- Campos de auditoria em cada análise

#### ✅ Métricas
- Campos `tempoAnaliseSegundos` para tempo de análise
- Campo `auditoriaUsuario` para métricas por analista
- Campo `dataAnalise` para métricas por período
- Índices otimizados para consultas de métricas

#### ✅ Categorias
- Campo `categoriaSaque` em `saques`
- Campo `categoriaDeposito` em `depositos`
- Valores: CASSINO, SPORTBOOK, OUTROS

---

## 🚨 Pontos de Atenção

### 1. **Tabela `analises` Antiga**
- ⚠️ A tabela `analises` ainda existe no schema (`drizzle/schema.ts`)
- ⚠️ **Recomendação**: Manter por enquanto para backup histórico
- ⚠️ **Ação futura**: Remover após validação completa da migração

### 2. **Migração de Dados**
- ✅ Migração SQL já foi executada (`drizzle/0008_separar_saques_depositos.sql`)
- ✅ Dados históricos foram migrados para as novas tabelas

### 3. **Cache**
- ✅ Cache invalidado após criação de análise
- ✅ Chaves de cache atualizadas para usar novas tabelas

---

## 📝 Checklist de Validação

### Backend
- [x] Todas as funções de banco usam as novas tabelas
- [x] Tipo `criarAnalise` não depende da tabela `analises` antiga
- [x] Regras de duplicidade funcionam por tipo
- [x] Cache invalidado corretamente

### Frontend
- [x] Preenchimento automático preenche apenas nome e data de criação
- [x] Campos são limpos ao trocar tipo de análise
- [x] Usuário permanece na tela após finalizar análise
- [x] Validações funcionam corretamente

### Banco de Dados
- [x] Tabelas `saques` e `depositos` criadas
- [x] Índices otimizados criados
- [x] Relações atualizadas
- [x] Campos necessários para histórico, auditoria, logs, métricas

---

## 🔄 Sugestões de Evolução Arquitetural

### 1. **Remover Tabela `analises` Antiga**
Após validação completa:
- Remover do schema (`drizzle/schema.ts`)
- Criar migration para dropar a tabela no banco

### 2. **Views ou Funções de Agregação**
Considerar criar views SQL para:
- Análises unificadas (quando necessário para relatórios)
- Métricas agregadas

### 3. **Tipos TypeScript Melhorados**
- Criar tipos unificados para análises quando necessário
- Tipos discriminados mais explícitos (ex: `AnaliseSaque | AnaliseDeposito`)

### 4. **Testes Automatizados**
- Testes unitários para funções de banco
- Testes de integração para regras de duplicidade
- Testes E2E para fluxo completo de criação

### 5. **Otimizações de Performance**
- Considerar materialized views para relatórios complexos
- Cache mais agressivo para consultas frequentes

---

## 📚 Arquivos Modificados

### Backend
- `server/db.ts` - Funções de banco atualizadas, tipo `AnaliseInput` criado
- `drizzle/schema.ts` - Relações atualizadas

### Frontend
- `client/src/pages/NovaAnalise.tsx` - Limpeza de campos ao trocar tipo

### Não Modificados (já estavam corretos)
- `server/routers.ts` - Já usava funções corretas
- `client/src/pages/Home.tsx` - Já usava dados corretos
- `client/src/pages/Relatorios.tsx` - Já usava dados corretos

---

## ✅ Conclusão

Todas as alterações solicitadas foram implementadas com sucesso:

1. ✅ Operações de saque gravadas exclusivamente na tabela `saques`
2. ✅ Operações de depósito gravadas exclusivamente na tabela `depositos`
3. ✅ Regras de negócio validadas (1 saque/dia, 1 depósito/dia, pode fazer ambos)
4. ✅ Preenchimento automático corrigido (apenas nome e data de criação)
5. ✅ Usuário permanece na tela após finalizar análise
6. ✅ Estrutura do banco validada (histórico, auditoria, logs, métricas)
7. ✅ Código padronizado e consistente

---

**Data da Migração:** 2024-12-XX  
**Versão:** 1.0  
**Status:** ✅ Completo e Validado

