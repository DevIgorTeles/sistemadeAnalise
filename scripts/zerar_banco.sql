-- Script para ZERAR completamente o Banco de Dados OPA System
-- ⚠️ ATENÇÃO: Este script DELETARÁ TODOS OS DADOS do banco!

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar todas as tabelas
TRUNCATE TABLE logs_auditoria;
TRUNCATE TABLE auditorias;
TRUNCATE TABLE fraudes;
TRUNCATE TABLE depositos;
TRUNCATE TABLE saques;
TRUNCATE TABLE clientes;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Recriar usuário administrador inicial
INSERT INTO users (
    openId,
    name,
    email,
    role,
    password,
    ativo,
    loginMethod,
    createdAt,
    updatedAt,
    lastSignedIn
) VALUES (
    'admin-initial',
    'Administrador',
    'admin@opasystem.com',
    'admin',
    '$2b$10$Yhx.pPuXJz9auqlGU/6/.uoEQGFi/sQiKLVBebJ6w5YwuTiAUnmYy',
    1,
    'local',
    NOW(),
    NOW(),
    NOW()
);

-- Confirmar que o banco foi zerado
SELECT 'Banco de dados zerado com sucesso!' as Status;
SELECT 
    'admin@opasystem.com' as Email,
    'admin123' as Senha,
    'admin' as Perfil;

