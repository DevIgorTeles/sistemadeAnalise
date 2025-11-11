# Correção do Erro "require is not defined"

## 🔍 Problema

O erro ocorria ao tentar criar um usuário:

```
TRPCClientError: require is not defined
POST http://localhost:3001/api/trpc/usuarios.criar
```

**Causa:** O código estava usando `require('bcryptjs')` dentro de um arquivo ESM (ES Modules), o que não é permitido.

## ✅ Solução Aplicada

### Arquivo: `server/db.ts`

**Antes:**
```typescript
import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, analises, fraudes, logsAuditoria } from "../drizzle/schema";
import { ENV } from './_core/env';

// ... código ...

if (user.password) {
  const bcrypt = require('bcryptjs'); // ❌ ERRO
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(user.password, salt);
  // ...
}
```

**Depois:**
```typescript
import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, analises, fraudes, logsAuditoria } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcryptjs'; // ✅ IMPORT no topo

// ... código ...

if (user.password) {
  const salt = bcrypt.genSaltSync(10); // ✅ Usa o import
  const hash = bcrypt.hashSync(user.password, salt);
  // ...
}
```

## 🚀 Mudanças Realizadas

1. ✅ Adicionado `import bcrypt from 'bcryptjs';` no topo do arquivo
2. ✅ Removido `const bcrypt = require('bcryptjs');` de dentro da função
3. ✅ Agora usa `bcrypt` importado corretamente

## 📝 Por que isso aconteceu?

O projeto usa **ESM (ES Modules)** que é o formato moderno de JavaScript/TypeScript. Em ESM:
- ❌ Não podemos usar `require()`
- ✅ Devemos usar `import` no topo do arquivo

## ✅ Verificação

Após a correção:
1. **Reinicie o servidor**
2. **Tente criar um usuário novamente**
3. **Deve funcionar sem erros**

---

## 🎯 Resultado

Agora você pode:
- ✅ Criar usuários pela interface
- ✅ Listar usuários
- ✅ Gerenciar usuários sem erros de servidor

---

## 📋 Próximos Passos

1. **Reinicie o servidor:**
   ```bash
   # Ctrl+C para parar
   pnpm dev
   ```

2. **Recarregue a página** (Ctrl+Shift+R)

3. **Teste criar um usuário:**
   - Email: `novo@test.com`
   - Nome: `Usuário Teste`
   - Role: `analista`
   - Senha: `senha123`

