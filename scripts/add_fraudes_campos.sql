-- Script para adicionar os novos campos na tabela fraudes
-- Execute este script no banco de dados antes de usar a funcionalidade de reporte de fraude

-- Adicionar coluna data_analise (date, NOT NULL)
-- Primeiro adicionamos como nullable para poder atualizar dados existentes
ALTER TABLE `fraudes` 
ADD COLUMN `data_analise` DATE NULL AFTER `data_registro`;

-- Adicionar coluna descricao_detalhada (text, NOT NULL)
-- Primeiro adicionamos como nullable para poder atualizar dados existentes
ALTER TABLE `fraudes` 
ADD COLUMN `descricao_detalhada` TEXT NULL AFTER `data_analise`;

-- Atualizar registros existentes com valores padrão
-- Se houver fraudes antigas, vamos usar a data_registro como data_analise
UPDATE `fraudes` 
SET `data_analise` = DATE(`data_registro`)
WHERE `data_analise` IS NULL;

-- Para descricao_detalhada, vamos usar o motivo_padrao ou motivo_livre como fallback
UPDATE `fraudes` 
SET `descricao_detalhada` = COALESCE(`motivo_livre`, `motivo_padrao`, 'Fraude reportada anteriormente')
WHERE `descricao_detalhada` IS NULL;

-- Agora tornamos as colunas NOT NULL
ALTER TABLE `fraudes` 
MODIFY COLUMN `data_analise` DATE NOT NULL;

ALTER TABLE `fraudes` 
MODIFY COLUMN `descricao_detalhada` TEXT NOT NULL;

