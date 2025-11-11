/**
 * Script para verificar usuários no banco de dados
 * Verifica emails, senhas e status dos usuários
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada no arquivo .env");
  process.exit(1);
}

async function verificarUsuarios() {
  let connection: mysql.Connection | null = null;
  try {
    // Extrair informações da DATABASE_URL
    const match = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error("Formato de DATABASE_URL inválido");
    }

    const [, user, password, host, port, database] = match;
    
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
    });

    console.log("✅ Conectado ao banco de dados\n");

    // Buscar todos os usuários
    const [rows] = await connection.query<any[]>(
      `SELECT 
        id, 
        openId, 
        email, 
        name, 
        role, 
        ativo, 
        loginMethod,
        password,
        CHAR_LENGTH(password) as password_length,
        LEFT(password, 7) as hash_prefix,
        CASE 
          WHEN password IS NULL THEN '❌ Sem senha'
          WHEN CHAR_LENGTH(password) = 60 AND LEFT(password, 7) = '$2b$10$' THEN '✅ Hash válido'
          ELSE '⚠️ Hash inválido'
        END as status_senha
      FROM users 
      ORDER BY id`
    );

    if (rows.length === 0) {
      console.log("⚠️  Nenhum usuário encontrado no banco de dados");
      return;
    }

    console.log(`📋 Encontrados ${rows.length} usuário(s):\n`);
    console.log("┌─────┬──────────────────────────┬─────────────────────────┬──────────┬───────┬──────────────┬─────────────────┐");
    console.log("│ ID  │ Email                    │ Nome                   │ Role     │ Ativo │ Login Method │ Status Senha    │");
    console.log("├─────┼──────────────────────────┼─────────────────────────┼──────────┼───────┼──────────────┼─────────────────┤");

    for (const user of rows) {
      const id = String(user.id).padEnd(3);
      const email = (user.email || "").padEnd(24).substring(0, 24);
      const name = (user.name || "").padEnd(23).substring(0, 23);
      const role = (user.role || "").padEnd(8).substring(0, 8);
      const ativo = user.ativo === 1 ? "✅ Sim" : "❌ Não";
      const loginMethod = (user.loginMethod || "N/A").padEnd(12).substring(0, 12);
      const statusSenha = (user.status_senha || "").padEnd(15).substring(0, 15);
      
      console.log(`│ ${id} │ ${email} │ ${name} │ ${role} │ ${ativo} │ ${loginMethod} │ ${statusSenha} │`);
    }

    console.log("└─────┴──────────────────────────┴─────────────────────────┴──────────┴───────┴──────────────┴─────────────────┘\n");

    // Testar senhas
    console.log("🔐 Testando senhas com 'admin123':\n");
    for (const user of rows) {
      if (!user.password) {
        console.log(`❌ ID ${user.id} (${user.email}): Sem senha`);
        continue;
      }

      try {
        const isCorrect = await bcrypt.compare("admin123", user.password);
        const status = isCorrect ? "✅" : "❌";
        console.log(`${status} ID ${user.id} (${user.email}): ${isCorrect ? "Senha correta" : "Senha incorreta"}`);
      } catch (error) {
        console.log(`⚠️  ID ${user.id} (${user.email}): Erro ao verificar senha - ${error}`);
      }
    }

  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Conexão encerrada");
    }
  }
}

// Executar
verificarUsuarios()
  .then(() => {
    console.log("\n🎉 Verificação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });

