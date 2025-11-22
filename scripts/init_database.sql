-- Script de Inicialização do Banco de Dados OPA System
-- Este script reseta o banco de dados e cria o usuário administrador inicial

-- ============================================================================
-- ATENÇÃO: Este script irá DELETAR todos os dados existentes!
-- Execute apenas em ambiente de desenvolvimento ou quando necessário resetar
-- ============================================================================

-- Limpar todas as tabelas (em ordem para respeitar foreign keys)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE logs_auditoria;
TRUNCATE TABLE auditorias;
TRUNCATE TABLE fraudes;
TRUNCATE TABLE depositos;
TRUNCATE TABLE saques;
TRUNCATE TABLE clientes;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Criar Usuário Administrador Inicial
-- ============================================================================

-- Senha padrão: admin123
-- Hash bcrypt gerado para a senha 'admin123'
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

-- ============================================================================
-- Verificar criação do usuário
-- ============================================================================

SELECT 
    id,
    openId,
    name as Nome,
    email as Email,
    role as Perfil,
    ativo as Ativo,
    loginMethod as 'Método Login',
    createdAt as 'Criado em'
FROM users
WHERE email = 'admin@opasystem.com';

-- ============================================================================
-- Credenciais do Usuário Administrador
-- ============================================================================
-- Email: admin@opasystem.com
-- Senha: admin123
-- ============================================================================

