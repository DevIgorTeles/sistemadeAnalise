# Solução do Erro 500 - Local Login Failed

## 🔍 Problema Identificado

O erro 500 ocorre porque o `JWT_SECRET` estava muito curto ou vazio. O JOSE (JSON Web Signature library) requer uma chave secreta adequada para gerar tokens JWT.

## ✅ Solução Aplicada

1. **Gerada nova chave secreta segura** para JWT
2. **Atualizado o arquivo `.env`** com a nova chave
3. **Reinicie o servidor** para aplicar as mudanças

---

## 🔑 Configuração Atual (.env)

```env
DATABASE_URL=mysql://root:admin@localhost:3306/opa_system
JWT_SECRET=iEIukuAPap64cO8m0QRGtF9lM9dtEmftrvp943lzDIG+wb1ctN+TWuOExkvVOOMcwGwynqI+kQqrU4cWUW1Acw==
VITE_APP_ID=opa-system
OWNER_OPEN_ID=test-admin-001
```

---

## 🚀 Como Resolver

### 1. Reiniciar o servidor

Pare o servidor atual (Ctrl+C) e inicie novamente:

```bash
pnpm dev
```

### 2. Testar o login

Acesse a página de login e use:

- **Email**: `admin@opasystem.com`
- **Senha**: `admin123`

---

## 🔧 Por que o erro ocorreu?

O erro original mostrava:
```
Error: Invalid key format
at Object.hmacImportKey
```

Isso significa que a chave JWT estava muito curta. O JOSE precisa de uma chave de pelo menos 32 bytes (256 bits) para trabalhar corretamente com algoritmos como HS256.

A nova chave tem **88 caracteres base64**, o que equivale a **64 bytes** - mais que suficiente para segurança adequada.

---

## 📝 Verificação

### Verificar se está funcionando:

1. Acesse o frontend
2. Digite email e senha
3. Não deve mais dar erro 500
4. Deve criar a sessão e redirecionar para o dashboard

### Se ainda der erro:

Verifique os logs do servidor:

```bash
# No terminal onde o servidor está rodando
# Procure por mensagens como:
# "[LocalAuth] login failed"
# "[Auth] Session verification failed"
```

---

## 🎯 Credenciais de Teste

| Email | Senha | Role |
|-------|-------|------|
| admin@opasystem.com | admin123 | admin |
| analista@opasystem.com | admin123 | analista |
| igor@teste.com | admin123 | admin |
| admin@test.com | admin123 | admin |

---

## 💡 Dica

Se ainda tiver problemas, verifique:

1. ✅ Servidor está rodando? (`pnpm dev`)
2. ✅ Banco de dados está acessível? (Conecte no DBeaver)
3. ✅ Variáveis de ambiente carregadas? (Verifique `.env`)
4. ✅ Senhas estão corretas no banco? (Execute o SQL de verificação)

---

## 📊 Verificar no Banco

```sql
-- Ver se todos os usuários têm senha
SELECT 
    email,
    CASE 
        WHEN password IS NOT NULL THEN '✅ Com senha'
        ELSE '❌ Sem senha'
    END as 'Status'
FROM users;
```

---

## ✅ Pronto!

Após reiniciar o servidor, o login deve funcionar normalmente.

