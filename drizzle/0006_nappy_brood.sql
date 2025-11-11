CREATE TABLE `auditorias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`id_cliente` varchar(64) NOT NULL,
	`motivo` text NOT NULL,
	`tipo` enum('ESPORTIVO','CASSINO') NOT NULL,
	`analista_id` int NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditorias_id` PRIMARY KEY(`id`)
);
