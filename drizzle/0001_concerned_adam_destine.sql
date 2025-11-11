CREATE TABLE `analises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_cliente` varchar(64) NOT NULL,
	`data_analise` date NOT NULL,
	`valor_deposito` decimal(18,2),
	`valor_saque` decimal(18,2),
	`qtd_apostas` int,
	`retorno_apostas` decimal(18,2),
	`observacao` text,
	`fonte_consulta` varchar(64),
	`auditoria_usuario` int,
	`auditoria_data` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id_cliente` varchar(64) NOT NULL,
	`status_cliente` enum('OK','MONITORAR','CRITICO') NOT NULL DEFAULT 'OK',
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id_cliente` PRIMARY KEY(`id_cliente`)
);
--> statement-breakpoint
CREATE TABLE `fraudes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_cliente` varchar(64) NOT NULL,
	`data_registro` timestamp NOT NULL DEFAULT (now()),
	`motivo_padrao` varchar(255) NOT NULL,
	`motivo_livre` text,
	`analista_id` int,
	CONSTRAINT `fraudes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logs_auditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` varchar(64) NOT NULL,
	`detalhe` json,
	`usuario_id` int,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_auditoria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','analista') NOT NULL DEFAULT 'analista';--> statement-breakpoint
ALTER TABLE `users` ADD `ativo` int DEFAULT 1 NOT NULL;