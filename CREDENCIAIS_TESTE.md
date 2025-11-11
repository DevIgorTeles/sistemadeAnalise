# Credenciais de Teste - Sistema OPA

## ✅ Problema Resolvido - Credenciais Corrigidas

As senhas foram corrigidas no banco de dados com o script `fix_passwords.ts`. Todas as senhas agora funcionam corretamente com hash bcrypt válido.

---

## 🔐 Credenciais de Login

### Usuários que FUNCIONAM corretamente:

#### 1. Administrador Sistema
- **Email**: `admin@opasystem.com`
- **Senha**: `admin123`
- **Role**: admin
- **ID**: 3

#### 2. Analista Teste
- **Email**: `analista@opasystem.com`
- **Senha**: `admin123`
- **Role**: analista
- **ID**: 4

#### 3. Igor (Usuário original)
- **Email**: `igor@teste.com`
- **Senha**: `admin123`
- **Role**: admin
- **ID**: 1

#### 4. Administrador Teste
- **Email**: `admin@test.com`
- **Senha**: `admin123`
- **Role**: admin
- **ID**: 2

---

## ⚙️ Configuração do Ambiente (.env)

O arquivo `.env` agora contém:

```env
DATABASE_URL=mysql://root:admin@localhost:3306/opa_system
JWT_SECRET=opa-system-secret-key-2024
VITE_APP_ID=opa-system
OWNER_OPEN_ID=test-admin-001
```

---

## 🧪 Como Testar

### Via Frontend (Login)
1. Acesse a página de login
2. Digite qualquer um dos emails acima
3. Digite a senha: `admin123`
4. Deve fazer login com sucesso!

### Via API direta
```bash
curl -X POST http://localhost:3000/api/local-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opasystem.com","password":"admin123"}'
```

---

## 🔧 Problemas Corrigidos

1. ❌ **Senhas em texto plano** → ✅ Senhas com hash bcrypt correto
2. ❌ **Senhas truncadas** → ✅ Senhas completas no banco
3. ❌ **JWT_SECRET faltando** → ✅ JWT_SECRET configurado
4. ❌ **Variáveis de ambiente faltando** → ✅ Todas as variáveis necessárias adicionadas

---

## 📊 Verificar no Banco de Dados

Execute no DBeaver ou MySQL Workbench:

```sql
SELECT 
    id,
    email,
    name,
    role,
    ativo,
    CHAR_LENGTH(password) as 'tamanho_senha',
    LEFT(password, 30) as 'hash_preview'
FROM users
WHERE password IS NOT NULL;
```

**Todas as senhas devem ter ~60 caracteres** (tamanho típico de hash bcrypt).

---

## 🚀 Próximos Passos

1. **Reinicie o servidor** para carregar as novas variáveis de ambiente:
   ```bash
   pnpm dev
   ```

2. **Teste o login** com as credenciais acima

3. Se ainda der erro, verifique os logs do servidor

---

## 💡 Notas Importantes

- **Todas as senhas de teste são**: `admin123`
- **Hash usado**: bcrypt com salt rounds = 10
- **Formato do hash**: `$2b$10$...` (60 caracteres)
- **JWT_SECRET**: Necessário para criar tokens de autenticação

---

## 📝 Verificar Usuários no Banco

### Via SQL:
```sql
-- Ver todos os usuários com suas credenciais
SELECT 
    id,
    openId,
    name,
    email,
    role,
    ativo,
    createdAt
FROM users
ORDER BY id;
```

### Via Script Node.js (Recomendado):
```bash
# Verificar status de todos os usuários e testar senhas
pnpm verify:users

# Corrigir senhas (atualiza todas para "admin123")
pnpm fix:passwords
```

## 🔧 Scripts Disponíveis

### 1. `pnpm fix:passwords`
Corrige todas as senhas dos usuários no banco de dados, atualizando-as para `admin123` com hash bcrypt correto.

### 2. `pnpm verify:users`
Verifica todos os usuários no banco de dados, mostrando:
- Informações do usuário (ID, Email, Nome, Role, Status)
- Status da senha (válida, inválida, ausente)
- Teste de verificação com `admin123`

---

## ✅ Última Verificação

**Status atual**: Todas as senhas foram corrigidas e estão funcionando corretamente.

**Usuários verificados**:
- ✅ igor@teste.com
- ✅ admin@test.com
- ✅ admin@opasystem.com
- ✅ analista@opasystem.com
- ✅ pablo@opasystem.com

**Senha padrão**: `admin123` (funciona para todos os usuários acima)

