-- ============================================================================
-- SCRIPT COMPLETO DE SETUP DO BANCO DE DADOS - OPA SYSTEM
-- ============================================================================
-- Este script cria TODAS as tabelas necessárias do sistema do zero
-- Execute: mysql -u root -padmin < setup_banco.sql
-- Ou: mysql -u root -padmin opa_system < setup_banco.sql
-- ============================================================================

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS `opa_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `opa_system`;

-- ============================================================================
-- TABELA USERS (deve ser criada primeiro - outras tabelas referenciam)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL UNIQUE,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` ENUM('user', 'admin', 'analista') NOT NULL DEFAULT 'analista',
  `ativo` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password` varchar(255),
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role_ativo` (`role`, `ativo`),
  INDEX `idx_users_last_signed_in` (`lastSignedIn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA CLIENTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` varchar(64) NOT NULL,
  `nome_completo` varchar(255),
  `status_cliente` ENUM('OK', 'MONITORAR', 'CRITICO') NOT NULL DEFAULT 'OK',
  `atualizado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `clientes_id_cliente` PRIMARY KEY(`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA SAQUES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `saques` (
  `id` int AUTO_INCREMENT NOT NULL,
  `id_cliente` varchar(64) NOT NULL,
  `nome_completo` varchar(255),
  `data_analise` date NOT NULL,
  `data_criacao_conta` date,
  `horario_saque` varchar(8),
  `valor_saque` decimal(18,2),
  `metrica_saque` varchar(100),
  `categoria_saque` varchar(50),
  `jogo_esporte_saque` varchar(255),
  `financeiro` decimal(18,2),
  `tempo_analise_segundos` int,
  `qtd_apostas` int,
  `retorno_apostas` decimal(18,2),
  `observacao` text,
  `fonte_consulta` varchar(64),
  `analista_id` int,
  `auditoria_usuario` TINYINT(1) DEFAULT 0,
  `auditoria_data` timestamp NULL,
  CONSTRAINT `saques_id` PRIMARY KEY(`id`),
  INDEX `idx_saques_cliente_data` (`id_cliente`, `data_analise`),
  INDEX `idx_saques_cliente` (`id_cliente`),
  INDEX `idx_saques_data` (`data_analise`),
  INDEX `idx_saques_analista_id` (`analista_id`),
  INDEX `idx_saques_auditoria_usuario` (`auditoria_usuario`),
  INDEX `idx_saques_auditoria_data` (`auditoria_data`),
  INDEX `idx_saques_usuario_data` (`auditoria_usuario`, `data_analise`),
  CONSTRAINT `fk_saques_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_saques_analista` FOREIGN KEY (`analista_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA DEPOSITOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `depositos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `id_cliente` varchar(64) NOT NULL,
  `nome_completo` varchar(255),
  `data_analise` date NOT NULL,
  `data_criacao_conta` date,
  `valor_deposito` decimal(18,2),
  `ganho_perda` decimal(18,2),
  `financeiro` decimal(18,2),
  `categoria_deposito` varchar(50),
  `jogo_esporte_deposito_apos` varchar(255),
  `tempo_analise_segundos` int,
  `qtd_apostas` int,
  `retorno_apostas` decimal(18,2),
  `observacao` text,
  `fonte_consulta` varchar(64),
  `analista_id` int,
  `auditoria_usuario` TINYINT(1) DEFAULT 0,
  `auditoria_data` timestamp NULL,
  CONSTRAINT `depositos_id` PRIMARY KEY(`id`),
  INDEX `idx_depositos_cliente_data` (`id_cliente`, `data_analise`),
  INDEX `idx_depositos_cliente` (`id_cliente`),
  INDEX `idx_depositos_data` (`data_analise`),
  INDEX `idx_depositos_auditoria_usuario` (`auditoria_usuario`),
  INDEX `idx_depositos_auditoria_data` (`auditoria_data`),
  INDEX `idx_depositos_usuario_data` (`auditoria_usuario`, `data_analise`),
  CONSTRAINT `fk_depositos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_depositos_analista` FOREIGN KEY (`analista_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA FRAUDES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `fraudes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `id_cliente` varchar(64) NOT NULL,
  `data_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_analise` date NOT NULL,
  `descricao_detalhada` text NOT NULL,
  `motivo_padrao` varchar(255) NOT NULL,
  `motivo_livre` text,
  `analista_id` int,
  CONSTRAINT `fraudes_id` PRIMARY KEY(`id`),
  INDEX `idx_fraudes_cliente` (`id_cliente`),
  INDEX `idx_fraudes_data_registro` (`data_registro`),
  INDEX `idx_fraudes_analista` (`analista_id`),
  CONSTRAINT `fk_fraudes_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fraudes_analista` FOREIGN KEY (`analista_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA AUDITORIAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `auditorias` (
  `id` int AUTO_INCREMENT NOT NULL,
  `id_cliente` varchar(64) NOT NULL,
  `motivo` text NOT NULL,
  `tipo` ENUM('ESPORTIVO', 'CASSINO') NOT NULL,
  `analista_id` int NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `auditorias_id` PRIMARY KEY(`id`),
  INDEX `idx_auditorias_cliente` (`id_cliente`),
  INDEX `idx_auditorias_cliente_criado` (`id_cliente`, `criado_em`),
  INDEX `idx_auditorias_criado` (`criado_em`),
  INDEX `idx_auditorias_analista` (`analista_id`),
  INDEX `idx_auditorias_tipo_analista` (`tipo`, `analista_id`),
  CONSTRAINT `fk_auditorias_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_auditorias_analista` FOREIGN KEY (`analista_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA LOGS_AUDITORIA
-- ============================================================================
CREATE TABLE IF NOT EXISTS `logs_auditoria` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tipo` varchar(64) NOT NULL,
  `detalhe` json,
  `usuario_id` int,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `logs_auditoria_id` PRIMARY KEY(`id`),
  CONSTRAINT `fk_logs_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA REFRESH_TOKENS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `user_id` int NOT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked_at` timestamp NULL,
  `ip_address` varchar(45),
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
  INDEX `idx_refresh_tokens_user_id` (`user_id`),
  INDEX `idx_refresh_tokens_expires_at` (`expires_at`),
  INDEX `idx_refresh_tokens_user_revoked` (`user_id`, `revoked_at`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MENSAGEM DE SUCESSO
-- ============================================================================
SELECT "✅ Todas as tabelas foram criadas com sucesso!" AS resultado;
SELECT "📋 Tabelas criadas: users, clientes, saques, depositos, fraudes, auditorias, logs_auditoria, refresh_tokens" AS informacao;
