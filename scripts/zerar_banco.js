#!/usr/bin/env node

/**
 * Script para ZERAR completamente o Banco de Dados OPA System
 * 
 * Uso:
 *   pnpm zerar-banco
 *   ou
 *   node scripts/zerar_banco.js
 * 
 * Ou com confirmação automática:
 *   node scripts/zerar_banco.js --confirm
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function zerarBanco() {
  try {
    // Verificar se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      log('red', '❌ Erro: DATABASE_URL não configurada no arquivo .env');
      process.exit(1);
    }

    // Parse da DATABASE_URL
    const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
    const config = {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      multipleStatements: true,
    };

    log('blue', '========================================');
    log('yellow', '  Zerar Banco de Dados OPA System');
    log('blue', '========================================');
    log('', '');

    log('blue', `Conectando ao banco de dados...`);
    log('', `  Host: ${config.host}`);
    log('', `  Port: ${config.port}`);
    log('', `  Database: ${config.database}`);
    log('', `  User: ${config.user}`);
    log('', '');

    // Confirmar ação (a menos que --confirm seja passado)
    if (!process.argv.includes('--confirm')) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const resposta = await new Promise((resolve) => {
        rl.question(
          '⚠️  ATENÇÃO: Isso irá DELETAR TODOS OS DADOS! Digite "ZERAR" para confirmar: ',
          resolve
        );
      });

      rl.close();

      if (resposta !== 'ZERAR') {
        log('yellow', '❌ Operação cancelada.');
        process.exit(0);
      }
    }

    log('', '');
    log('yellow', 'Executando limpeza do banco de dados...');

    // Conectar ao banco
    const connection = await mysql.createConnection(config);

    // Ler e executar script SQL
    const sqlPath = path.join(__dirname, 'zerar_banco.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await connection.query(sql);

    // Verificar resultado
    const [users] = await connection.query(
      'SELECT COUNT(*) as total FROM users WHERE email = ?',
      ['admin@opasystem.com']
    );

    await connection.end();

    if (users[0].total === 1) {
      log('', '');
      log('green', '✅ Banco de dados zerado com sucesso!');
      log('', '');
      log('green', 'Credenciais do Administrador:');
      log('', '  📧 Email: admin@opasystem.com');
      log('', '  🔑 Senha: admin123');
      log('', '');
      log('yellow', '⚠️  Lembre-se de alterar a senha após o primeiro login!');
    } else {
      log('red', '❌ Erro: Usuário administrador não foi criado corretamente');
      process.exit(1);
    }
  } catch (error) {
    log('red', `❌ Erro ao zerar banco de dados: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      log('yellow', '   Verifique se o MySQL está rodando');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('yellow', '   Verifique as credenciais no arquivo .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      log('yellow', '   Verifique se o banco de dados existe');
    }
    process.exit(1);
  }
}

// Executar
zerarBanco();

