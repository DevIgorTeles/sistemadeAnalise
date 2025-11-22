-- Migration: Adicionar campo analista_id nas tabelas saques e depositos
-- Este campo armazena o ID do usuário que realizou a análise

-- ============================================================================
-- Adicionar campo analista_id em saques
-- ============================================================================

ALTER TABLE `saques` 
  ADD COLUMN `analista_id` int AFTER `fonte_consulta`;

-- Criar índice para otimizar consultas por analista
ALTER TABLE `saques` 
  ADD INDEX `idx_saques_analista_id` (`analista_id`);

-- Adicionar foreign key para garantir integridade referencial
ALTER TABLE `saques` 
  ADD CONSTRAINT `fk_saques_analista` 
  FOREIGN KEY (`analista_id`) 
  REFERENCES `users` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- ============================================================================
-- Adicionar campo analista_id em depositos
-- ============================================================================

ALTER TABLE `depositos` 
  ADD COLUMN `analista_id` int AFTER `fonte_consulta`;

-- Criar índice para otimizar consultas por analista
ALTER TABLE `depositos` 
  ADD INDEX `idx_depositos_analista_id` (`analista_id`);

-- Adicionar foreign key para garantir integridade referencial
ALTER TABLE `depositos` 
  ADD CONSTRAINT `fk_depositos_analista` 
  FOREIGN KEY (`analista_id`) 
  REFERENCES `users` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- ============================================================================
-- NOTA: Registros existentes terão analista_id = NULL
-- Para preencher dados históricos, você pode:
-- 1. Deixar como NULL (análises antigas sem informação de analista)
-- 2. Ou atribuir a um usuário padrão/administrador
-- ============================================================================

