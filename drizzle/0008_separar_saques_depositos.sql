-- Migration para separar análises em tabelas distintas: saques e depositos

-- Criar tabela saques
CREATE TABLE `saques` (
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
	`auditoria_usuario` int,
	`auditoria_data` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saques_id` PRIMARY KEY(`id`),
	INDEX `idx_saques_cliente_data` (`id_cliente`, `data_analise`),
	INDEX `idx_saques_cliente` (`id_cliente`),
	INDEX `idx_saques_data` (`data_analise`),
	INDEX `idx_saques_auditoria_usuario` (`auditoria_usuario`),
	INDEX `idx_saques_auditoria_data` (`auditoria_data`),
	INDEX `idx_saques_usuario_data` (`auditoria_usuario`, `data_analise`)
);

-- Criar tabela depositos
CREATE TABLE `depositos` (
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
	`auditoria_usuario` int,
	`auditoria_data` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `depositos_id` PRIMARY KEY(`id`),
	INDEX `idx_depositos_cliente_data` (`id_cliente`, `data_analise`),
	INDEX `idx_depositos_cliente` (`id_cliente`),
	INDEX `idx_depositos_data` (`data_analise`),
	INDEX `idx_depositos_auditoria_usuario` (`auditoria_usuario`),
	INDEX `idx_depositos_auditoria_data` (`auditoria_data`),
	INDEX `idx_depositos_usuario_data` (`auditoria_usuario`, `data_analise`)
);

-- Migrar dados de SAQUE da tabela analises para saques
-- NOTA: Se a tabela analises não existir (banco novo), estes INSERTs serão ignorados
-- Execute manualmente se precisar migrar dados de um banco antigo:
/*
INSERT INTO `saques` (
	`id_cliente`,
	`nome_completo`,
	`data_analise`,
	`data_criacao_conta`,
	`horario_saque`,
	`valor_saque`,
	`metrica_saque`,
	`categoria_saque`,
	`jogo_esporte_saque`,
	`financeiro`,
	`tempo_analise_segundos`,
	`qtd_apostas`,
	`retorno_apostas`,
	`observacao`,
	`fonte_consulta`,
	`auditoria_usuario`,
	`auditoria_data`
)
SELECT 
	`id_cliente`,
	`nome_completo`,
	`data_analise`,
	`data_criacao_conta`,
	`horario_saque`,
	`valor_saque`,
	`metrica_saque`,
	`categoria_saque`,
	`jogo_esporte_saque`,
	`financeiro`,
	`tempo_analise_segundos`,
	`qtd_apostas`,
	`retorno_apostas`,
	`observacao`,
	`fonte_consulta`,
	`auditoria_usuario`,
	`auditoria_data`
FROM `analises`
WHERE `tipo_analise` = 'SAQUE';
*/

-- Migrar dados de DEPOSITO da tabela analises para depositos
-- NOTA: Se a tabela analises não existir (banco novo), estes INSERTs serão ignorados
-- Execute manualmente se precisar migrar dados de um banco antigo:
/*
INSERT INTO `depositos` (
	`id_cliente`,
	`nome_completo`,
	`data_analise`,
	`data_criacao_conta`,
	`valor_deposito`,
	`ganho_perda`,
	`financeiro`,
	`categoria_deposito`,
	`jogo_esporte_deposito_apos`,
	`tempo_analise_segundos`,
	`qtd_apostas`,
	`retorno_apostas`,
	`observacao`,
	`fonte_consulta`,
	`auditoria_usuario`,
	`auditoria_data`
)
SELECT 
	`id_cliente`,
	`nome_completo`,
	`data_analise`,
	`data_criacao_conta`,
	`valor_deposito`,
	`ganho_perda`,
	`financeiro`,
	`categoria_deposito`,
	`jogo_esporte_deposito_apos`,
	`tempo_analise_segundos`,
	`qtd_apostas`,
	`retorno_apostas`,
	`observacao`,
	`fonte_consulta`,
	`auditoria_usuario`,
	`auditoria_data`
FROM `analises`
WHERE `tipo_analise` = 'DEPOSITO';
*/

-- NOTA: A tabela analises não será removida automaticamente para manter backup dos dados
-- Execute manualmente após validar a migração: DROP TABLE `analises`;
