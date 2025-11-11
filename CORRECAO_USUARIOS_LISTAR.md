# Correção do Erro 404 - usuarios.listar

## 🔍 Problema

O erro ocorria porque o procedimento `usuarios.listar` não estava definido no tRPC router.

**Erro original:**
```
No procedure found on path "usuarios.listar"
GET http://localhost:3001/api/trpc/usuarios.listar
```

## ✅ Solução Aplicada

### 1. Adicionada função `listarUsuarios` em `server/db.ts`

```typescript
export async function listarUsuarios() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  
  return result;
}
```

### 2. Adicionado procedimento no `server/routers.ts`

```typescript
usuarios: router({
  listar: protectedProcedure
    .query(async () => {
      const usuarios = await listarUsuarios();
      return usuarios;
    }),
  
  criar: protectedProcedure
    // ... código existente
}),
```

## 🚀 Como Aplicar a Correção

### Reiniciar o servidor:

1. **Pare o servidor atual:**
   ```bash
   # Pressione Ctrl+C no terminal onde o servidor está rodando
   ```

2. **Inicie novamente:**
   ```bash
   pnpm dev
   ```

3. **Recarregue a página no navegador:**
   - Pressione `Ctrl+Shift+R` (Windows/Linux)
   - Ou `Cmd+Shift+R` (Mac)

## ✅ Verificação

Após reiniciar o servidor, a aba "Usuários" deve funcionar corretamente e listar todos os usuários do banco de dados.

---

## 📋 O que foi feito

1. ✅ Criada função `listarUsuarios()` no banco de dados
2. ✅ Adicionado procedimento `listar` no router `usuarios`
3. ✅ Importada a nova função no `routers.ts`
4. ✅ Sem erros de lint

---

## 🎯 Resultado Esperado

Agora você pode:
- Ver a lista de usuários na interface
- Criar novos usuários
- Gerenciar usuários existentes

---

## 💡 Próximos Passos

Se ainda houver erros:
1. Verifique se o servidor foi reiniciado
2. Verifique se o banco de dados está acessível
3. Veja os logs do servidor para identificar problemas
4. Tente fazer logout e login novamente

