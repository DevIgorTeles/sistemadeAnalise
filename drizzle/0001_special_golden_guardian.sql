DROP TABLE `analises`;--> statement-breakpoint
ALTER TABLE `depositos` MODIFY COLUMN `auditoria_data` timestamp;--> statement-breakpoint
ALTER TABLE `saques` MODIFY COLUMN `auditoria_data` timestamp;--> statement-breakpoint
ALTER TABLE `fraudes` ADD `data_analise` date NOT NULL;--> statement-breakpoint
ALTER TABLE `fraudes` ADD `descricao_detalhada` text NOT NULL;