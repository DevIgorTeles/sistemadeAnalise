#!/usr/bin/env node

/**
 * Script para adicionar os novos campos na tabela fraudes
 * 
 * Uso:
 *   pnpm migrate:fraudes
 *   ou
 *   node scripts/add_fraudes_campos.js
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada no .env');
    process.exit(1);
  }

  // Parse da URL de conexão
  const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove a barra inicial
    multipleStatements: true, // Permite múltiplas statements
  });

  try {
    console.log('🔄 Executando migration para adicionar campos na tabela fraudes...\n');

    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'add_fraudes_campos.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    // Executar o script SQL
    await connection.query(sql);

    console.log('✅ Migration executada com sucesso!');
    console.log('   - Campo data_analise adicionado');
    console.log('   - Campo descricao_detalhada adicionado');
    console.log('   - Dados existentes atualizados\n');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Campos já existem na tabela. Pulando migration...');
    } else {
      console.error('❌ Erro ao executar migration:', error.message);
      process.exit(1);
    }
  } finally {
    await connection.end();
  }
}

executeMigration();

