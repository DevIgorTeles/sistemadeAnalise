## OPA System – Guia Passo a Passo

Imagine que você ganhou um brinquedo novo que só funciona quando todas as pecinhas estão no lugar. Este guia te mostra, de forma bem calma e simples, como montar todas as peças para brincar com o OPA System: instalar os programas, rodar o sistema e até espiar o banco de dados pelo DBeaver.

---

## 1. O que é o OPA System?
- É um sistema que tem duas partes trabalhando juntas: uma tela feita com React (a parte que você vê) e um servidor feito com Express + Drizzle (a parte que conversa com o banco de dados).
- Você pode usá-lo para cadastrar informações, gerar análises e acompanhar fraudes.

---

## 2. O que você precisa instalar antes de tudo
Pense nestes itens como os “superpoderes” do seu computador para rodar o projeto.

1. **Git** – serve para baixar o projeto. Instale em https://git-scm.com/downloads.
2. **Node.js 20 ou superior** – é o motor que roda o código. Baixe em https://nodejs.org.
3. **pnpm 10 ou superior** – é o ajudante que instala bibliotecas. Depois do Node, rode:
   ```bash
   npm install -g pnpm
   ```
4. **MySQL 8 ou superior** – é o banco de dados onde os dados ficam guardados.
5. **DBeaver** – é o programa que abre o banco de dados de forma bonita. Baixe em https://dbeaver.io/download/.

### Conferindo se deu certo
Abra um terminal (PowerShell ou Git Bash) e digite:
```bash
node -v
pnpm -v
mysql --version
git --version
```
Se cada comando mostrar uma versão (ex.: `v20.x.x`), está tudo certo!

---

## 3. Baixar o projeto do GitHub
1. Escolha uma pasta onde você quer guardar o projeto.
2. No terminal, entre nela (ex.: `cd C:\projetos`).
3. Rode:
   ```bash
   git clone https://github.com/DevIgorTeles/sistemadeAnalise.git
   cd sistemadeAnalise
   ```
Pronto, você já tem o projeto na sua máquina.

---

## 4. Instalar as bibliotecas do projeto
Dentro da pasta do projeto (confira com `pwd` ou `Get-Location` se estiver no lugar certo), rode:
```bash
pnpm install
```
Esse comando baixa todas as bibliotecas que o projeto usa. Pode demorar um pouquinho.

---

## 5. Contar os segredos do projeto para o computador
O sistema precisa de algumas informações guardadas em um arquivo chamado `.env`. Ele fica na raiz do projeto (mesmo nível do `package.json`).

1. Crie um arquivo chamado `.env`.
2. Copie e cole este conteúdo mudando os dados em letras maiúsculas:
   ```dotenv
   DATABASE_URL="mysql://USUARIO: SENHA@localhost:3306/opa_system"
   JWT_SECRET="escolha_uma_frase_secreta_grande"
   OWNER_OPEN_ID="identificador_do_admin"
   OAUTH_SERVER_URL=""
   VITE_APP_ID="opa-system-dev"
   BUILT_IN_FORGE_API_URL=""
   BUILT_IN_FORGE_API_KEY=""
   ```

### O que colocar em cada campo?
- `USUARIO` e `SENHA`: o usuário e senha do MySQL.
- `opa_system`: é o nome do banco. Você pode trocar, mas precisa usar o mesmo nome no MySQL.
- `JWT_SECRET`: invente uma frase longa e difícil, como uma senha.
- Os valores vazios (`""`) podem continuar assim se você não usa OAuth ou Forge.

---

## 6. Criar o banco de dados no MySQL
1. Abra o terminal do MySQL (ou use um cliente como MySQL Workbench).
2. Rode:
   ```sql
   CREATE DATABASE opa_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Volte para o terminal do projeto e rode:
   ```bash
   pnpm db:push
   ```
Este comando cria as tabelas certinhas dentro do banco.

### Dados de demonstração (opcionais)
Quer começar com informações prontas? Com o MySQL conectado ao banco `opa_system`, rode:
```sql
SOURCE /caminho/para/sua/pasta/sistemadeAnalise/insert_test_users.sql;
SOURCE /caminho/para/sua/pasta/sistemadeAnalise/dados_ficticios_teste.sql;
```
O primeiro script cria usuários de teste; o segundo popula clientes, análises, fraudes e logs.
Se preferir rodar via terminal, utilize:
```bash
mysql -u root -p opa_system < /caminho/para/sua/pasta/sistemadeAnalise/insert_test_users.sql
mysql -u root -p opa_system < /caminho/para/sua/pasta/sistemadeAnalise/dados_ficticios_teste.sql
```
Troque `root`/`-p` pelas credenciais corretas e substitua `/caminho/para/sua/pasta/` pelo diretório onde o projeto foi clonado (por exemplo, `/home/seu-usuario/Documentos` no Linux ou `C:\Users\SeuUsuario\Documentos` no Windows).

---

## 7. Colocar o sistema para funcionar (modo desenvolvimento)
Com tudo pronto, rode:
```bash
pnpm dev
```
O terminal vai mostrar algo como `Server running on http://localhost:3000/`. Abra o navegador e digite esse endereço. Se for a primeira vez, pode demorar uns segundos para carregar tudo.

### O que está acontecendo nos bastidores?
- O Node executa o servidor Express.
- O Vite abre uma versão do front-end com recarregamento automático; cada vez que você salva um arquivo, a tela atualiza.
- Se a porta `3000` estiver ocupada, o sistema tenta outra (ele avisa qual usou).

---

## 8. Gerar versão para produção (opcional)
Quando quiser criar os arquivos prontos para subir em um servidor, rode:
```bash
pnpm build
```
Depois execute:
```bash
pnpm start
```
Certifique-se de que `NODE_ENV=production` e que a `DATABASE_URL` aponta para o banco correto de produção.

---

## 9. Como ver o banco de dados no DBeaver

### 9.1 Instalar e abrir
- Baixe o DBeaver: https://dbeaver.io/download/
- Instale e abra. Parece complicado, mas vamos parte por parte.

### 9.2 Criar uma nova conexão
1. Clique em `Database` → `New Database Connection`.
2. Escolha **MySQL** → clique em `Next`.

### 9.3 Preencher os dados
Use as mesmas informações do `.env`:
- `Server Host`: `localhost` (ou o IP do servidor remoto)
- `Port`: `3306`
- `Database`: `opa_system`
- `Username`: o usuário do MySQL
- `Password`: a senha do MySQL

### 9.4 Testar
- Aperte `Test Connection`.
- Se aparecer “Success”, clique em `Finish`.
- Se aparecer erro, confira usuário/senha ou se o MySQL está ligado.

### 9.5 Ver os dados
1. No painel esquerdo, abra a conexão → `Schemas` → `opa_system`.
2. Clique com o botão direito em `users`, `clientes`, `analises`, `fraudes` ou `logs_auditoria`.
3. Escolha `View Data` → `All`. Agora você pode ver as linhas da tabela.

### 9.6 Rodar comandos SQL
1. Clique com o botão direito no banco → `SQL Editor` → `New SQL Script`.
2. Digite, por exemplo:
   ```sql
   SELECT * FROM users LIMIT 10;
   ```
3. Aperte `Ctrl+Enter`. Os resultados aparecem logo abaixo.

---

## 10. Scripts úteis (com nome e sobrenome)
- `pnpm test` → roda os testes com Vitest.
- `pnpm check` → confere tipos TypeScript.
- `pnpm format` → arruma o código usando Prettier.
- `pnpm fix:passwords` → recalcula senhas caso tenha alterado algo manualmente no banco.
- `pnpm verify:users` → faz checagens extras nos usuários cadastrados.

---

## 11. Onde cada coisa mora
- `client/` → códigos do React + Vite (as telas).
- `server/` → servidor Express e rotas tRPC (a lógica por trás).
- `drizzle/` → definição das tabelas e migrações do banco.
- `shared/` → tipos e funções usadas tanto no front quanto no back.
- Arquivos `.sql` e `.ts` raiz → scripts auxiliares de teste e manutenção.

---

## 12. Problemas comuns (e como salvar o dia)
- **“Não consigo conectar no MySQL”**  
  Veja se o serviço está ativo (`net start MySQL` no Windows). Confira usuário e senha.
- **“O comando `pnpm db:push` falhou”**  
  Normalmente é `DATABASE_URL` errado ou falta de permissão. Ajuste e rode de novo.
- **“O site não abre em `localhost:3000`”**  
  Garanta que `pnpm dev` está rodando e que firewall ou antivírus não bloqueou. Se outra aplicação usa a porta 3000, olhe no terminal qual porta o sistema escolheu.
- **“Editei o .env mas nada mudou”**  
  Pare o servidor (`Ctrl+C`) e rode `pnpm dev` novamente. Variáveis novas só funcionam depois do restart.

---

Respire, siga os passos com calma e você terá o OPA System rodando e pronto para brincar em pouco tempo. Se algo ficar confuso, releia cada etapa com carinho – o caminho está todo aqui!

