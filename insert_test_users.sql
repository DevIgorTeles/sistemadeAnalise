-- Script para inserir usuário de teste admin
-- Senha: admin123

USE opa_system;

-- Inserir usuário admin de teste (se ainda não existir)
INSERT IGNORE INTO users (openId, name, email, role, password, ativo, loginMethod) 
VALUES (
    'test-admin-001', 
    'Administrador Sistema', 
    'admin@opasystem.com', 
    'admin', 
    '$2b$10$Yhx.pPuXJz9auqlGU/6/.uoEQGFi/sQiKLVBebJ6w5YwuTiAUnmYy', 
    1,
    'local'
);

-- Inserir usuário analista de teste
INSERT IGNORE INTO users (openId, name, email, role, password, ativo, loginMethod) 
VALUES (
    'test-analista-001', 
    'Analista Teste', 
    'analista@opasystem.com', 
    'analista', 
    '$2b$10$Yhx.pPuXJz9auqlGU/6/.uoEQGFi/sQiKLVBebJ6w5YwuTiAUnmYy', 
    1,
    'local'
);

-- Ver todos os usuários
SELECT 
    id,
    openId,
    name,
    email,
    role,
    ativo,
    loginMethod,
    createdAt,
    lastSignedIn
FROM users
ORDER BY createdAt DESC;

