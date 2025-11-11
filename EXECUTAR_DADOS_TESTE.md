# 🚀 Como Executar o Script de Dados de Teste no Windows

## 📋 Opções Disponíveis

### Opção 1: MySQL Workbench (Recomendado)

1. Abra o **MySQL Workbench**
2. Conecte-se ao seu banco de dados
3. Selecione o schema `opa_system`
4. Abra o arquivo `dados_ficticios_teste.sql`
5. Clique em **⚡ Execute** (raio) ou pressione `Ctrl+Shift+Enter`

### Opção 2: DBeaver

1. Abra o **DBeaver**
2. Conecte-se ao banco de dados `opa_system`
3. Vá em **SQL Editor** → **Open SQL Script**
4. Selecione `dados_ficticios_teste.sql`
5. Clique em **▶ Execute SQL Script**

### Opção 3: Via PowerShell (Com Senha no Comando)

```powershell
# Cole no PowerShell (substitua 'SUA_SENHA' pela senha real):
$env:MYSQL_PWD = "SUA_SENHA"; Get-Content dados_ficticios_teste.sql | mysql -u root opa_system

# Ou execute linha a linha:
mysql -u root -p"SUA_SENHA" opa_system < dados_ficticios_teste.sql
```

### Opção 4: Copiar e Colar Manualmente

1. Abra o arquivo `dados_ficticios_teste.sql`
2. Copie todo o conteúdo
3. Abra seu cliente MySQL (Workbench, DBeaver, etc.)
4. Cole o conteúdo na área de SQL
5. Execute o script

### Opção 5: Script PowerShell Alternativo

Crie um arquivo `executar_teste.ps1`:

```powershell
# Ler a senha de forma segura
$senha = Read-Host "Digite a senha do MySQL: " -AsSecureString
$senhaPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha)
)

# Executar o script
Get-Content dados_ficticios_teste.sql | mysql -u root -p"$senhaPlain" opa_system

Write-Host "✅ Script executado com sucesso!"
```

## ⚡ Comando Rápido (Quando você souber a senha)

Se você sabe que a senha é `admin` (conforme o .env que você tem):

```powershell
Get-Content dados_ficticios_teste.sql | mysql -u root -padmin opa_system
```

## 🔍 Verificar se os dados foram inseridos

Após executar, rode estas queries para verificar:

```sql
-- Ver quantos clientes de teste foram criados
SELECT COUNT(*) AS total_clientes FROM clientes WHERE id_cliente LIKE 'TEST_%';

-- Ver quantas análises foram criadas
SELECT COUNT(*) AS total_analises FROM analises WHERE id_cliente LIKE 'TEST_%';

-- Ver quantas fraudes foram criadas
SELECT COUNT(*) AS total_fraudes FROM fraudes WHERE id_cliente LIKE 'TEST_%';
```

## ✅ Resultado Esperado

```
total_clientes: 8
total_analises: 14
total_fraudes: 6
```

## 🎯 Próximos Passos

1. Execute o script usando uma das opções acima
2. Acesse o sistema OPA
3. Navegue pelas páginas:
   - **Home**: Verá estatísticas dos dados de teste
   - **Análises**: Verá as 14 análises criadas
   - **Fraudes**: Verá as 6 fraudes cadastradas
   - **Relatórios**: Verá métricas e gráficos

## 🔧 Troubleshooting

### Erro: "Unknown database"
```sql
CREATE DATABASE IF NOT EXISTS opa_system;
USE opa_system;
```

### Erro: "Access denied"
- Verifique se a senha está correta
- Verifique se o usuário `root` tem permissões

### Erro: "Table doesn't exist"
- Execute as migrações do Drizzle primeiro:
```bash
pnpm drizzle-kit push
```

---

**Dica**: A opção mais fácil e visual é usar o **MySQL Workbench**! 😊

