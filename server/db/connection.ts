/**
 * Gerenciamento de conexão com o banco de dados
 * Centraliza a criação e gerenciamento do connection pool
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;
let _connectionPool: mysql.Pool | null = null;

/**
 * Configuração do Connection Pool
 * Reutiliza conexões e evita estouro de conexões simultâneas
 */
function createConnectionPool(): mysql.Pool {
  if (_connectionPool) {
    return _connectionPool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  try {
    // Parse da URL de conexão
    const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
    
    const poolConfig: mysql.PoolOptions = {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove a barra inicial
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      debug: false,
    };

    _connectionPool = mysql.createPool(poolConfig);

    console.log(`[Database] Connection pool configurado: ${poolConfig.connectionLimit} conexões máximas`);

    // Tratamento de erros do pool
    _connectionPool.on('connection', (connection) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Database] Nova conexão estabelecida. ID: ${connection.threadId}`);
      }
    });

    _connectionPool.on('error', (error: any) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Database] Erro no connection pool:', errorMessage);
      if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.warn('[Database] Conexão perdida, pool tentará reconectar automaticamente...');
      }
    });

    return _connectionPool;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Database] Erro ao criar connection pool:', errorMessage);
    throw error;
  }
}

/**
 * Obtém instância do Drizzle ORM
 * Cria lazy instance para permitir que ferramentas locais rodem sem DB
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = createConnectionPool();
      _db = drizzle(pool);
      
      // Teste de conexão (não bloquear se falhar)
      pool.execute('SELECT 1').then(() => {
        console.log('[Database] Conexão estabelecida com sucesso via connection pool');
      }).catch((err) => {
        console.warn('[Database] Teste de conexão falhou (mas pool criado):', err instanceof Error ? err.message : String(err));
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("[Database] Failed to create connection pool:", errorMessage);
      _db = null;
    }
  }
  return _db;
}

/**
 * Fecha o connection pool (útil para graceful shutdown)
 */
export async function closeDb(): Promise<void> {
  if (_connectionPool) {
    await _connectionPool.end();
    _connectionPool = null;
    _db = null;
    console.log('[Database] Connection pool fechado');
  }
}

