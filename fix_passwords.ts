/**
 * Script para corrigir senhas dos usuários no banco de dados
 * Atualiza todas as senhas para "admin123" com hash bcrypt correto
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

config();

const PASSWORD = "admin123";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada no arquivo .env");
  process.exit(1);
}

async function fixPasswords() {
  console.log("🔧 Iniciando correção de senhas...\n");

  // Criar hash da senha
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(PASSWORD, salt);
  
  console.log(`✅ Hash gerado para senha "${PASSWORD}":`);
  console.log(`   ${hash}\n`);

  // Conectar ao banco
  let connection: mysql.Connection | null = null;
  try {
    // Extrair informações da DATABASE_URL
    // Formato: mysql://user:password@host:port/database
    const match = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error("Formato de DATABASE_URL inválido. Use: mysql://user:password@host:port/database");
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
      "SELECT id, email, name, role, password FROM users WHERE password IS NOT NULL"
    );

    if (rows.length === 0) {
      console.log("⚠️  Nenhum usuário com senha encontrado no banco de dados");
      return;
    }

    console.log(`📋 Encontrados ${rows.length} usuário(s) com senha:\n`);

    // Atualizar senhas
    let updated = 0;
    for (const user of rows) {
      // Verificar se a senha já está correta
      const isCorrect = await bcrypt.compare(PASSWORD, user.password);
      
      if (isCorrect) {
        console.log(`⏭️  Usuário ${user.id} (${user.email}) já tem a senha correta`);
        continue;
      }

      // Atualizar senha
      await connection.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hash, user.id]
      );

      // Verificar se atualizou corretamente
      const verifyPassword = await bcrypt.compare(PASSWORD, hash);
      if (verifyPassword) {
        console.log(`✅ Usuário ${user.id} (${user.email}) - senha atualizada`);
        updated++;
      } else {
        console.error(`❌ Erro ao atualizar senha do usuário ${user.id}`);
      }
    }

    console.log(`\n✨ Processo concluído! ${updated} usuário(s) atualizado(s)`);

    // Verificar todas as senhas novamente
    console.log("\n🔍 Verificando senhas atualizadas:\n");
    const [verifyRows] = await connection.query<any[]>(
      "SELECT id, email, name, CHAR_LENGTH(password) as password_length, LEFT(password, 7) as hash_prefix FROM users WHERE password IS NOT NULL"
    );

    for (const user of verifyRows) {
      const status = user.password_length === 60 && user.hash_prefix === "$2b$10$" 
        ? "✅" 
        : "⚠️";
      console.log(
        `${status} ID: ${user.id} | Email: ${user.email} | Tamanho: ${user.password_length} | Prefixo: ${user.hash_prefix}`
      );
    }

  } catch (error) {
    console.error("❌ Erro ao corrigir senhas:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Conexão encerrada");
    }
  }
}

// Executar
fixPasswords()
  .then(() => {
    console.log("\n🎉 Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });

