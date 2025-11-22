-- Script para remover a tabela analises antiga do banco de dados
-- Execute este script APENAS se a tabela ainda existir no banco

-- Verificar se a tabela existe antes de dropar
DROP TABLE IF EXISTS `analises`;

-- Confirmar remoção
SELECT 'Tabela analises removida com sucesso!' as Status;

