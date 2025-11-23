DROP TABLE `analises`;--> statement-breakpoint
ALTER TABLE `depositos` MODIFY COLUMN `auditoria_usuario` boolean;--> statement-breakpoint
ALTER TABLE `depositos` MODIFY COLUMN `auditoria_data` timestamp;--> statement-breakpoint
ALTER TABLE `saques` MODIFY COLUMN `auditoria_usuario` boolean;--> statement-breakpoint
ALTER TABLE `saques` MODIFY COLUMN `auditoria_data` timestamp;--> statement-breakpoint
ALTER TABLE `depositos` ADD `analista_id` int;--> statement-breakpoint
ALTER TABLE `fraudes` ADD `data_analise` date NOT NULL;--> statement-breakpoint
ALTER TABLE `fraudes` ADD `descricao_detalhada` text NOT NULL;--> statement-breakpoint
ALTER TABLE `saques` ADD `analista_id` int;--> statement-breakpoint
CREATE INDEX `idx_saques_analista_id` ON `saques` (`analista_id`);