ALTER TABLE `analises` ADD `nome_completo` varchar(255);--> statement-breakpoint
ALTER TABLE `analises` ADD `ganho_perda` decimal(18,2);--> statement-breakpoint
ALTER TABLE `analises` ADD `tempo_analise_segundos` int;--> statement-breakpoint
ALTER TABLE `clientes` ADD `nome_completo` varchar(255);--> statement-breakpoint
ALTER TABLE `analises` DROP COLUMN `nome_usuario`;--> statement-breakpoint
ALTER TABLE `clientes` DROP COLUMN `nome_usuario`;