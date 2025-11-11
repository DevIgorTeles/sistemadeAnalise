ALTER TABLE `analises` ADD `nome_usuario` varchar(255);--> statement-breakpoint
ALTER TABLE `analises` ADD `data_criacao_conta` date;--> statement-breakpoint
ALTER TABLE `analises` ADD `tipo_analise` varchar(20);--> statement-breakpoint
ALTER TABLE `analises` ADD `horario_saque` varchar(8);--> statement-breakpoint
ALTER TABLE `analises` ADD `metrica_saque` varchar(100);--> statement-breakpoint
ALTER TABLE `analises` ADD `categoria_saque` varchar(50);--> statement-breakpoint
ALTER TABLE `analises` ADD `jogo_esporte_saque` varchar(255);--> statement-breakpoint
ALTER TABLE `analises` ADD `categoria_deposito` varchar(50);--> statement-breakpoint
ALTER TABLE `analises` ADD `jogo_esporte_deposito_apos` varchar(255);--> statement-breakpoint
ALTER TABLE `clientes` ADD `nome_usuario` varchar(255);