#!/usr/bin/env node

/**
 * Script para investigar a origem do usuário "usuariofraude"
 * Verifica:
 * - Se existe um usuário com esse nome na tabela users
 * - Se existe um cliente com esse nome nas tabelas de análises
 * - Se há análises sem analista associado
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function investigar() {
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
    database: url.pathname.slice(1),
  });

  try {
    console.log('🔍 Investigando origem do "usuariofraude"...\n');

    // 1. Verificar se existe usuário com esse nome
    console.log('1. Verificando tabela users...');
    const [users] = await connection.query(
      `SELECT id, openId, name, email, role, ativo FROM users WHERE name LIKE '%fraude%' OR openId LIKE '%fraude%' OR email LIKE '%fraude%'`
    );
    if (users.length > 0) {
      console.log('   ⚠️  Encontrado(s) usuário(s) com "fraude" no nome:');
      users.forEach(u => {
        console.log(`      - ID: ${u.id}, Nome: ${u.name}, Email: ${u.email}, OpenId: ${u.openId}, Role: ${u.role}, Ativo: ${u.ativo}`);
      });
    } else {
      console.log('   ✅ Nenhum usuário encontrado com "fraude" no nome');
    }

    // 2. Verificar clientes com esse nome em saques
    console.log('\n2. Verificando tabela saques...');
    const [saques] = await connection.query(
      `SELECT id, id_cliente, nome_completo, auditoria_usuario, data_analise FROM saques WHERE nome_completo LIKE '%fraude%' OR id_cliente LIKE '%fraude%' LIMIT 10`
    );
    if (saques.length > 0) {
      console.log('   ⚠️  Encontrado(s) registro(s) em saques:');
      saques.forEach(s => {
        console.log(`      - ID: ${s.id}, Cliente: ${s.id_cliente}, Nome: ${s.nome_completo}, Analista ID: ${s.auditoria_usuario || 'NULL'}, Data: ${s.data_analise}`);
      });
    } else {
      console.log('   ✅ Nenhum registro encontrado em saques');
    }

    // 3. Verificar clientes com esse nome em depósitos
    console.log('\n3. Verificando tabela depositos...');
    const [depositos] = await connection.query(
      `SELECT id, id_cliente, nome_completo, auditoria_usuario, data_analise FROM depositos WHERE nome_completo LIKE '%fraude%' OR id_cliente LIKE '%fraude%' LIMIT 10`
    );
    if (depositos.length > 0) {
      console.log('   ⚠️  Encontrado(s) registro(s) em depositos:');
      depositos.forEach(d => {
        console.log(`      - ID: ${d.id}, Cliente: ${d.id_cliente}, Nome: ${d.nome_completo}, Analista ID: ${d.auditoria_usuario || 'NULL'}, Data: ${d.data_analise}`);
      });
    } else {
      console.log('   ✅ Nenhum registro encontrado em depositos');
    }

    // 4. Verificar análises sem analista associado
    console.log('\n4. Verificando análises sem analista associado...');
    const [semAnalista] = await connection.query(
      `SELECT COUNT(*) as total FROM (
        SELECT auditoria_usuario FROM saques WHERE auditoria_usuario IS NULL
        UNION ALL
        SELECT auditoria_usuario FROM depositos WHERE auditoria_usuario IS NULL
      ) as t`
    );
    const totalSemAnalista = semAnalista[0]?.total || 0;
    if (totalSemAnalista > 0) {
      console.log(`   ⚠️  Encontradas ${totalSemAnalista} análises sem analista associado`);
    } else {
      console.log('   ✅ Todas as análises têm analista associado');
    }

    // 5. Verificar se há algum padrão suspeito
    console.log('\n5. Verificando padrões suspeitos...');
    const [padroes] = await connection.query(
      `SELECT nome_completo, COUNT(*) as total FROM (
        SELECT nome_completo FROM saques
        UNION ALL
        SELECT nome_completo FROM depositos
      ) as t WHERE nome_completo LIKE '%usuario%' OR nome_completo LIKE '%fraude%' GROUP BY nome_completo ORDER BY total DESC LIMIT 10`
    );
    if (padroes.length > 0) {
      console.log('   ⚠️  Padrões encontrados:');
      padroes.forEach(p => {
        console.log(`      - "${p.nome_completo}": ${p.total} ocorrências`);
      });
    } else {
      console.log('   ✅ Nenhum padrão suspeito encontrado');
    }

    console.log('\n✅ Investigação concluída!');
  } catch (error) {
    console.error('❌ Erro ao investigar:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

investigar();

