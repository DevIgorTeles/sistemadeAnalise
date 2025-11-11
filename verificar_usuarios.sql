-- Script para verificar usuários no DBeaver
USE opa_system;

-- Ver todos os usuários
SELECT 
    id as ID,
    openId as 'Open ID',
    name as Nome,
    email as Email,
    role as Perfil,
    ativo as Ativo,
    loginMethod as 'Método Login',
    CHAR_LENGTH(password) as 'Tam. Hash',
    LEFT(password, 35) as 'Hash Preview',
    createdAt as 'Criado em',
    lastSignedIn as 'Último acesso'
FROM users
ORDER BY id;

-- Testar se as senhas são bcrypt válidas
SELECT 
    email,
    CASE 
        WHEN LEFT(password, 4) = '$2b$' THEN '✅ Hash bcrypt válido'
        WHEN password IS NULL THEN '❌ Sem senha'
        ELSE '❌ Hash inválido'
    END as 'Status Hash'
FROM users
WHERE password IS NOT NULL;

-- Resumo por perfil
SELECT 
    role as Perfil,
    COUNT(*) as Total,
    SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as Ativos
FROM users
GROUP BY role;

