CREATE TABLE `auditorias` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `id_cliente` varchar(64) NOT NULL,
  `motivo` text NOT NULL,
  `tipo` enum('ESPORTIVO','CASSINO') NOT NULL,
  `analista_id` int NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX `auditorias_id_cliente_idx` ON `auditorias` (`id_cliente`);

