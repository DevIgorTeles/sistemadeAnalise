# Usuários de Teste do Sistema OPA

## Credenciais de Login

### 1. Administrador Sistema
- **ID**: 3
- **openId**: test-admin-001
- **Nome**: Administrador Sistema
- **Email**: admin@opasystem.com
- **Role**: admin
- **Senha**: `admin123`
- **Método de Login**: local

### 2. Analista Teste
- **ID**: 4
- **openId**: test-analista-001
- **Nome**: Analista Teste
- **Email**: analista@opasystem.com
- **Role**: analista
- **Senha**: `admin123`
- **Método de Login**: local

### 3. Administrador Teste (antigo)
- **ID**: 2
- **openId**: test-admin
- **Nome**: Administrador Teste
- **Email**: admin@test.com
- **Role**: admin
- **Senha**: (senha do sistema)

### 4. Usuário Igor
- **ID**: 1
- **openId**: 2
- **Nome**: igor
- **Email**: igor@teste.com
- **Role**: admin
- **Senha**: 123

---

## Como Visualizar no DBeaver/MySQL Workbench

### Consulta SQL para ver todos os usuários:

```sql
SELECT 
    id,
    openId,
    name as Nome,
    email as Email,
    role as Perfil,
    ativo as Ativo,
    loginMethod as 'Método Login',
    createdAt as 'Criado em',
    lastSignedIn as 'Último acesso'
FROM users
ORDER BY createdAt DESC;
```

### Ver estrutura da tabela users:

```sql
DESCRIBE users;
```

### Contar usuários por perfil:

```sql
SELECT 
    role as Perfil,
    COUNT(*) as Total,
    SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as Ativos,
    SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as Inativos
FROM users
GROUP BY role;
```

---

## Sistema de Autenticação

O sistema usa **bcryptjs** para hash de senhas.

**Senha de teste usada**: `admin123`  
**Hash gerado**: `$2b$10$Yhx.pPuXJz9auqlGU/6/.uoEQGFi/sQiKLVBebJ6w5YwuTiAUnmYy`

---

## Observações

- A coluna `ativo` indica se o usuário está ativo (1) ou inativo (0)
- A coluna `role` pode ser: `user`, `admin`, ou `analista`
- O campo `openId` deve ser único
- A senha é armazenada em hash (não está visível em texto plano)

