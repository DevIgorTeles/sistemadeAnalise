import { eq, and, desc, sql, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, clientes, saques, depositos, fraudes, logsAuditoria, auditorias, refreshTokens, InsertSaque, InsertDeposito } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcryptjs';
import { withCache, CacheKeys, deleteCache, invalidateCache } from './_core/cache';
import { getDataAtualBrasilia, paraISOStringBrasilia } from './utils/timezone';

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
      connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'), // Pool de 10 conexões por padrão
      queueLimit: 0, // Sem limite de fila (aceita todas as requisições)
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Timeouts
      acquireTimeout: 60000, // 60 segundos para adquirir conexão
      timeout: 60000, // 60 segundos de timeout geral
      // Reconnection
      reconnect: true,
      // Logs (desabilitado para reduzir verbosidade)
      debug: false,
    };

    _connectionPool = mysql.createPool(poolConfig);

    // Log de configuração
    console.log(`[Database] Connection pool configurado: ${poolConfig.connectionLimit} conexões máximas`);

    // Tratamento de erros do pool (não fazer throw para não crashar o servidor)
    _connectionPool.on('connection', (connection) => {
      // Log apenas em desenvolvimento para reduzir verbosidade
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Database] Nova conexão estabelecida. ID: ${connection.threadId}`);
      }
    });

    _connectionPool.on('error', (error: any) => {
      // Log erro mas não fazer throw
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
    throw error; // Re-throw para que o getDb possa tratar
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Usar connection pool ao invés de conexão direta
      const pool = createConnectionPool();
      
      // Drizzle aceita Pool diretamente
      _db = drizzle(pool);
      
      // Teste de conexão (não bloquear se falhar)
      pool.execute('SELECT 1').then(() => {
        console.log('[Database] Conexão estabelecida com sucesso via connection pool');
      }).catch((err) => {
        console.warn('[Database] Teste de conexão falhou (mas pool criado):', err instanceof Error ? err.message : String(err));
      });
    } catch (error) {
      // Não fazer throw - apenas logar e retornar null
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Log sem expor dados sensíveis
    console.log(`[Database] upsertUser requested for openId=${user.openId}`);
    const values: InsertUser = {
      openId: user.openId,
    };
    
    const updateSet: Record<string, unknown> = {};
    
    // Handle password hashing if provided
    // Senhas nunca são logadas - apenas o hash é armazenado
    if (user.password) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(user.password, salt);
      values.password = hash;
      updateSet.password = hash;
    }

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = getDataAtualBrasilia();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = getDataAtualBrasilia();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });

    // Invalidar cache do usuário
    await deleteCache(CacheKeys.user(user.openId));
    if (user.email) {
      await deleteCache(CacheKeys.usuario(user.email));
    }
    // Invalidar lista de usuários
    await deleteCache(CacheKeys.listaUsuarios());

    console.log(`[Database] upsertUser succeeded for openId=${user.openId}`);
  } catch (error) {
    // Log erro sem expor dados sensíveis do usuário
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Database] Failed to upsert user:", errorMessage);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  return withCache(
    CacheKeys.user(openId),
    async () => {
      const db = await getDb();
      if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
      }

      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

      return result.length > 0 ? result[0] : undefined;
    },
    600 // Cache por 10 minutos (dados de usuário mudam pouco)
  );
}

export async function listarUsuarios() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  
  return result;
}

// OPA-specific queries
export async function getUltimaAnalise(idCliente: string) {
  return withCache(
    CacheKeys.ultimaAnalise(idCliente),
    async () => {
      const db = await getDb();
      if (!db) return undefined;
      
      // Buscar última análise em saques
      const ultimoSaque = await db
        .select()
        .from(saques)
        .where(eq(saques.idCliente, idCliente))
        .orderBy(desc(saques.dataAnalise), desc(saques.id))
        .limit(1);
      
      // Buscar última análise em depositos
      const ultimoDeposito = await db
        .select()
        .from(depositos)
        .where(eq(depositos.idCliente, idCliente))
        .orderBy(desc(depositos.dataAnalise), desc(depositos.id))
        .limit(1);
      
      // Comparar e retornar a mais recente
      if (ultimoSaque.length === 0 && ultimoDeposito.length === 0) {
        return undefined;
      }
      
      if (ultimoSaque.length === 0) return ultimoDeposito[0];
      if (ultimoDeposito.length === 0) return ultimoSaque[0];
      
      const dataSaque = new Date(ultimoSaque[0].dataAnalise);
      const dataDeposito = new Date(ultimoDeposito[0].dataAnalise);
      
      // Retornar a análise com data mais recente, ou a com ID maior se a data for igual
      if (dataSaque > dataDeposito) {
        return ultimoSaque[0];
      } else if (dataDeposito > dataSaque) {
        return ultimoDeposito[0];
      } else {
        // Mesma data, comparar por ID
        return (ultimoSaque[0].id > ultimoDeposito[0].id) ? ultimoSaque[0] : ultimoDeposito[0];
      }
    },
    180 // Cache por 3 minutos
  );
}

export async function getDataCriacaoConta(idCliente: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Busca a data de criação da conta mais antiga disponível em qualquer análise do cliente
  // Buscar em saques
  const saquesResult = await db
    .select({ dataCriacaoConta: saques.dataCriacaoConta, dataAnalise: saques.dataAnalise })
    .from(saques)
    .where(
      and(
        eq(saques.idCliente, idCliente),
        sql`${saques.dataCriacaoConta} IS NOT NULL`
      )
    )
    .orderBy(saques.dataAnalise) // Ordena pela data de análise mais antiga
    .limit(1);
  
  // Buscar em depositos
  const depositosResult = await db
    .select({ dataCriacaoConta: depositos.dataCriacaoConta, dataAnalise: depositos.dataAnalise })
    .from(depositos)
    .where(
      and(
        eq(depositos.idCliente, idCliente),
        sql`${depositos.dataCriacaoConta} IS NOT NULL`
      )
    )
    .orderBy(depositos.dataAnalise) // Ordena pela data de análise mais antiga
    .limit(1);
  
  // Retornar a data mais antiga entre as duas tabelas
  if (saquesResult.length === 0 && depositosResult.length === 0) {
    return null;
  }
  
  if (saquesResult.length === 0) return depositosResult[0].dataCriacaoConta;
  if (depositosResult.length === 0) return saquesResult[0].dataCriacaoConta;
  
  // Comparar datas e retornar a mais antiga
  const dataSaque = new Date(saquesResult[0].dataAnalise);
  const dataDeposito = new Date(depositosResult[0].dataAnalise);
  
  return dataSaque < dataDeposito 
    ? saquesResult[0].dataCriacaoConta 
    : depositosResult[0].dataCriacaoConta;
}

export async function verificarDuplicidade(
  idCliente: string, 
  dataAnalise: string,
  tipoAnalise: "SAQUE" | "DEPOSITO"
) {
  const db = await getDb();
  if (!db) return false;
  
  // Verificar na tabela específica do tipo
  const tabela = tipoAnalise === "SAQUE" ? saques : depositos;
  
  const result = await db
    .select()
    .from(tabela)
    .where(and(
      eq(tabela.idCliente, idCliente),
      eq(tabela.dataAnalise, dataAnalise as any)
    ))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Busca a análise mais recente do mesmo tipo e mesma data
 * Ordena por ID (auto-increment) para garantir a mais recente sempre
 */
export async function getAnalisePorDataETipo(
  idCliente: string, 
  dataAnalise: string,
  tipoAnalise: "SAQUE" | "DEPOSITO"
) {
  const db = await getDb();
  if (!db) return undefined;

  // Buscar na tabela específica do tipo
  const tabela = tipoAnalise === "SAQUE" ? saques : depositos;

  const result = await db
    .select()
    .from(tabela)
    .where(and(
      eq(tabela.idCliente, idCliente),
      eq(tabela.dataAnalise, dataAnalise as any)
    ))
    .orderBy(desc(tabela.id), desc(tabela.auditoriaData), desc(tabela.dataAnalise))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAnalisePorData(idCliente: string, dataAnalise: string) {
  return withCache(
    CacheKeys.analisePorData(idCliente, dataAnalise),
    async () => {
      const db = await getDb();
      if (!db) return undefined;

      // Buscar em ambas as tabelas e retornar a mais recente
      const saquesResult = await db
        .select()
        .from(saques)
        .where(and(
          eq(saques.idCliente, idCliente),
          eq(saques.dataAnalise, dataAnalise as any)
        ))
        .orderBy(desc(saques.id), desc(saques.auditoriaData), desc(saques.dataAnalise))
        .limit(1);

      const depositosResult = await db
        .select()
        .from(depositos)
        .where(and(
          eq(depositos.idCliente, idCliente),
          eq(depositos.dataAnalise, dataAnalise as any)
        ))
        .orderBy(desc(depositos.id), desc(depositos.auditoriaData), desc(depositos.dataAnalise))
        .limit(1);

      // Retornar a mais recente entre as duas
      if (saquesResult.length === 0 && depositosResult.length === 0) {
        return undefined;
      }

      if (saquesResult.length === 0) return depositosResult[0];
      if (depositosResult.length === 0) return saquesResult[0];

      // Comparar IDs para retornar a mais recente
      return saquesResult[0].id > depositosResult[0].id ? saquesResult[0] : depositosResult[0];
    },
    300 // Cache por 5 minutos
  );
}

// Tipo para criação de análise que suporta ambos os tipos (SAQUE e DEPOSITO)
type AnaliseInput = {
  tipoAnalise: "SAQUE" | "DEPOSITO";
  idCliente: string;
  nomeCompleto: string | null;
  dataAnalise: Date | string;
  dataCriacaoConta?: Date | string | null;
  tempoAnaliseSegundos?: number | null;
  observacao?: string | null;
  fonteConsulta?: string | null;
  qtdApostas?: number | null;
  retornoApostas?: string | null;
  auditoriaUsuario?: number | null;
  auditoriaData?: Date;
  // Campos específicos de SAQUE
  horarioSaque?: string | null;
  valorSaque?: string | null;
  metricaSaque?: string | null;
  categoriaSaque?: string | null;
  jogoEsporteSaque?: string | null;
  financeiro?: string | null;
  // Campos específicos de DEPOSITO
  valorDeposito?: string | null;
  ganhoPerda?: string | null;
  categoriaDeposito?: string | null;
  jogoEsporteDepositoApos?: string | null;
};

export async function criarAnalise(analise: AnaliseInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure client exists
  const cliente = await db.select().from(clientes).where(eq(clientes.idCliente, analise.idCliente)).limit(1);
  if (cliente.length === 0) {
    await db.insert(clientes).values({ idCliente: analise.idCliente, nomeCompleto: analise.nomeCompleto });
  }
  
  // Converter dataAnalise para string YYYY-MM-DD se for Date
  const dataAnalise = typeof analise.dataAnalise === 'string' 
    ? analise.dataAnalise 
    : paraISOStringBrasilia(analise.dataAnalise as Date);
  
  // Converter dataCriacaoConta para string YYYY-MM-DD se for Date, ou null se undefined
  const dataCriacaoConta = typeof analise.dataCriacaoConta === 'string'
    ? analise.dataCriacaoConta
    : analise.dataCriacaoConta instanceof Date
    ? paraISOStringBrasilia(analise.dataCriacaoConta)
    : analise.dataCriacaoConta ?? null;
  
  let result;
  
  // Inserir na tabela específica baseado no tipo
  // auditoriaData só é preenchido quando análise for marcada como auditoria
  // Converter undefined para null explicitamente para garantir que o campo seja NULL no banco
  const auditoriaDataFinal = analise.auditoriaData ?? null;
  
  if (analise.tipoAnalise === "SAQUE") {
    // Construir objeto saque apenas com campos definidos (não undefined)
    const saque: InsertSaque = {
      idCliente: analise.idCliente,
      nomeCompleto: analise.nomeCompleto,
      dataAnalise: dataAnalise,
      dataCriacaoConta: dataCriacaoConta,
    };
    
    // Adicionar campos opcionais apenas se estiverem definidos
    if (analise.horarioSaque !== undefined) saque.horarioSaque = analise.horarioSaque;
    if (analise.valorSaque !== undefined) saque.valorSaque = analise.valorSaque;
    if (analise.metricaSaque !== undefined) saque.metricaSaque = analise.metricaSaque;
    if (analise.categoriaSaque !== undefined) saque.categoriaSaque = analise.categoriaSaque;
    if (analise.jogoEsporteSaque !== undefined) saque.jogoEsporteSaque = analise.jogoEsporteSaque;
    if (analise.financeiro !== undefined) saque.financeiro = analise.financeiro;
    if (analise.tempoAnaliseSegundos !== undefined) saque.tempoAnaliseSegundos = analise.tempoAnaliseSegundos;
    if (analise.qtdApostas !== undefined) saque.qtdApostas = analise.qtdApostas;
    if (analise.retornoApostas !== undefined) saque.retornoApostas = analise.retornoApostas;
    if (analise.observacao !== undefined) saque.observacao = analise.observacao;
    if (analise.fonteConsulta !== undefined) saque.fonteConsulta = analise.fonteConsulta;
    if (analise.auditoriaUsuario !== undefined) saque.auditoriaUsuario = analise.auditoriaUsuario;
    if (auditoriaDataFinal !== undefined && auditoriaDataFinal !== null) saque.auditoriaData = auditoriaDataFinal;
    
    result = await db.insert(saques).values(saque);
  } else {
    // Construir objeto deposito apenas com campos definidos (não undefined)
    const deposito: InsertDeposito = {
      idCliente: analise.idCliente,
      nomeCompleto: analise.nomeCompleto,
      dataAnalise: dataAnalise,
      dataCriacaoConta: dataCriacaoConta,
    };
    
    // Adicionar campos opcionais apenas se estiverem definidos
    if (analise.valorDeposito !== undefined) deposito.valorDeposito = analise.valorDeposito;
    if (analise.ganhoPerda !== undefined) deposito.ganhoPerda = analise.ganhoPerda;
    if (analise.financeiro !== undefined) deposito.financeiro = analise.financeiro;
    if (analise.categoriaDeposito !== undefined) deposito.categoriaDeposito = analise.categoriaDeposito;
    if (analise.jogoEsporteDepositoApos !== undefined) deposito.jogoEsporteDepositoApos = analise.jogoEsporteDepositoApos;
    if (analise.tempoAnaliseSegundos !== undefined) deposito.tempoAnaliseSegundos = analise.tempoAnaliseSegundos;
    if (analise.qtdApostas !== undefined) deposito.qtdApostas = analise.qtdApostas;
    if (analise.retornoApostas !== undefined) deposito.retornoApostas = analise.retornoApostas;
    if (analise.observacao !== undefined) deposito.observacao = analise.observacao;
    if (analise.fonteConsulta !== undefined) deposito.fonteConsulta = analise.fonteConsulta;
    if (analise.auditoriaUsuario !== undefined) deposito.auditoriaUsuario = analise.auditoriaUsuario;
    if (auditoriaDataFinal !== undefined && auditoriaDataFinal !== null) deposito.auditoriaData = auditoriaDataFinal;
    
    result = await db.insert(depositos).values(deposito);
  }
  
  // Invalidar cache relacionado a análises
  await deleteCache(CacheKeys.ultimaAnalise(analise.idCliente));
  await deleteCache(CacheKeys.analisePorData(analise.idCliente, dataAnalise));
  await invalidateCache('metricas:analises:*'); // Invalidar todas as métricas
  
  return result;
}

export async function reportarFraude(fraude: typeof fraudes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Insert fraud record
  const result = await db.insert(fraudes).values(fraude);
  
  // Update client status to MONITORAR
  await db.update(clientes)
    .set({ statusCliente: "MONITORAR" })
    .where(eq(clientes.idCliente, fraude.idCliente));
  
  return result;
}

export async function listarFraudes(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(fraudes)
    .orderBy(desc(fraudes.dataRegistro))
    .limit(limit)
    .offset(offset);
  
  return result;
}

export async function getFraudesPorCliente(idCliente: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(fraudes)
    .where(eq(fraudes.idCliente, idCliente))
    .orderBy(desc(fraudes.dataRegistro));
  
  return result;
}

export async function registrarAuditoriaAnalise(params: {
  idCliente: string;
  motivo: string;
  tipo: "ESPORTIVO" | "CASSINO";
  analistaId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Inserir registro de auditoria
  await db.insert(auditorias).values({
    idCliente: params.idCliente,
    motivo: params.motivo,
    tipo: params.tipo,
    analistaId: params.analistaId,
  });

  // Atualizar campo auditoriaData na análise mais recente do cliente
  // Buscar a análise mais recente (pode ser saque ou depósito)
  const agora = getDataAtualBrasilia();
  
  // Buscar última análise de saque
  const ultimoSaque = await db
    .select()
    .from(saques)
    .where(eq(saques.idCliente, params.idCliente))
    .orderBy(desc(saques.id))
    .limit(1);
  
  // Buscar última análise de depósito
  const ultimoDeposito = await db
    .select()
    .from(depositos)
    .where(eq(depositos.idCliente, params.idCliente))
    .orderBy(desc(depositos.id))
    .limit(1);
  
  // Determinar qual é a mais recente
  const ultimaAnaliseSaque = ultimoSaque[0];
  const ultimaAnaliseDeposito = ultimoDeposito[0];
  
  let ultimaAnalise: typeof ultimaAnaliseSaque | typeof ultimaAnaliseDeposito | null = null;
  let tipoAnalise: "saques" | "depositos" | null = null;
  
  if (ultimaAnaliseSaque && ultimaAnaliseDeposito) {
    // Comparar IDs para determinar a mais recente (IDs são auto-increment)
    if (ultimaAnaliseSaque.id > ultimaAnaliseDeposito.id) {
      ultimaAnalise = ultimaAnaliseSaque;
      tipoAnalise = "saques";
    } else {
      ultimaAnalise = ultimaAnaliseDeposito;
      tipoAnalise = "depositos";
    }
  } else if (ultimaAnaliseSaque) {
    ultimaAnalise = ultimaAnaliseSaque;
    tipoAnalise = "saques";
  } else if (ultimaAnaliseDeposito) {
    ultimaAnalise = ultimaAnaliseDeposito;
    tipoAnalise = "depositos";
  }
  
  // Atualizar auditoriaData na análise mais recente
  if (ultimaAnalise && tipoAnalise) {
    const tabela = tipoAnalise === "saques" ? saques : depositos;
    await db
      .update(tabela)
      .set({ 
        auditoriaData: agora,
        auditoriaUsuario: params.analistaId 
      })
      .where(eq(tabela.id, ultimaAnalise.id));
  }

  // Invalidar cache relacionado
  await deleteCache(CacheKeys.statusAuditoria(params.idCliente));
  await invalidateCache('auditorias:lista:*'); // Invalidar todas as listagens
}

export async function listarAuditorias(filtros: {
  tipo?: "ESPORTIVO" | "CASSINO";
  analistaId?: number;
  dataInicio?: string;
  dataFim?: string;
} = {}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Banco de dados não disponível para listar auditorias");
    return [];
  }

  try {
    const conditions: any[] = [];

    if (filtros.tipo) {
      conditions.push(eq(auditorias.tipo, filtros.tipo));
    }
    if (filtros.analistaId) {
      conditions.push(eq(auditorias.analistaId, filtros.analistaId));
    }
    if (filtros.dataInicio) {
      conditions.push(gte(auditorias.criadoEm, new Date(filtros.dataInicio)));
    }
    if (filtros.dataFim) {
      const fim = new Date(filtros.dataFim);
      fim.setHours(23, 59, 59, 999);
      conditions.push(lte(auditorias.criadoEm, fim));
    }

    let query = db
      .select({
        id: auditorias.id,
        idCliente: auditorias.idCliente,
        motivo: auditorias.motivo,
        tipo: auditorias.tipo,
        criadoEm: auditorias.criadoEm,
        analistaId: auditorias.analistaId,
        nomeCliente: clientes.nomeCompleto,
        nomeAnalista: users.name,
      })
      .from(auditorias)
      .leftJoin(clientes, eq(auditorias.idCliente, clientes.idCliente))
      .leftJoin(users, eq(auditorias.analistaId, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const resultado = await query.orderBy(desc(auditorias.criadoEm));
    return resultado;
  } catch (error: any) {
    // Log erro sem expor dados sensíveis
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Database] Erro ao listar auditorias:", errorMessage);
    return [];
  }
}

export async function getStatusAuditoria(idCliente: string) {
  return withCache(
    CacheKeys.statusAuditoria(idCliente),
    async () => {
      const db = await getDb();
      if (!db) {
        console.warn("[Database] Banco de dados não disponível para buscar status de auditoria");
        return { temAuditoria: false, ultima: null };
      }

      try {
        const resultado = await db
          .select({
            id: auditorias.id,
            motivo: auditorias.motivo,
            tipo: auditorias.tipo,
            criadoEm: auditorias.criadoEm,
            analistaId: auditorias.analistaId,
            nomeAnalista: users.name,
          })
          .from(auditorias)
          .leftJoin(users, eq(auditorias.analistaId, users.id))
          .where(eq(auditorias.idCliente, idCliente))
          .orderBy(desc(auditorias.criadoEm))
          .limit(1);

        const ultima = resultado.length > 0 ? resultado[0] : null;

        return {
          temAuditoria: Boolean(ultima),
          ultima,
        };
      } catch (error: any) {
        // Log erro sem expor dados sensíveis
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Database] Erro ao buscar status de auditoria:", errorMessage);
        return { temAuditoria: false, ultima: null };
      }
    },
    180 // Cache por 3 minutos
  );
}

export async function registrarAuditoria(tipo: string, detalhe: Record<string, any>, usuarioId?: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(logsAuditoria).values({
    tipo,
    detalhe,
    usuarioId,
  });
}

/**
 * Lista métricas de análises das tabelas saques e depositos
 * Otimizada para usar índices e consultas eficientes
 */
export async function listarMetricasAnalises(filtros: {
  analista_id?: number;
  data_inicio?: Date;
  data_fim?: Date;
  tipo_analise?: string;
  id_cliente?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const results: any[] = [];
  
  // Determinar quais tabelas buscar baseado no filtro de tipo
  const buscarSaques = !filtros.tipo_analise || filtros.tipo_analise === "SAQUE";
  const buscarDepositos = !filtros.tipo_analise || filtros.tipo_analise === "DEPOSITO";
  
  // Buscar em saques se necessário (usando índices otimizados)
  if (buscarSaques) {
    const saquesConditions: any[] = [];
    
    // Usar índices existentes para otimizar consultas
    if (filtros.analista_id) {
      saquesConditions.push(eq(saques.auditoriaUsuario, filtros.analista_id));
    }
    if (filtros.id_cliente) {
      saquesConditions.push(like(saques.idCliente, `%${filtros.id_cliente}%`));
    }
    if (filtros.data_inicio) {
      saquesConditions.push(gte(saques.dataAnalise, filtros.data_inicio));
    }
    if (filtros.data_fim) {
      saquesConditions.push(lte(saques.dataAnalise, filtros.data_fim));
    }
    
    let saquesQuery = db.select().from(saques);
    if (saquesConditions.length > 0) {
      saquesQuery = saquesQuery.where(and(...saquesConditions)) as any;
    }
    
    // Ordenar usando índice idx_saques_data
    const saquesResult = await saquesQuery.orderBy(desc(saques.dataAnalise), desc(saques.id));
    // Adicionar tipo para compatibilidade com frontend
    results.push(...saquesResult.map(r => ({ ...r, tipoAnalise: "SAQUE" })));
  }
  
  // Buscar em depositos se necessário (usando índices otimizados)
  if (buscarDepositos) {
    const depositosConditions: any[] = [];
    
    // Usar índices existentes para otimizar consultas
    if (filtros.analista_id) {
      depositosConditions.push(eq(depositos.auditoriaUsuario, filtros.analista_id));
    }
    if (filtros.id_cliente) {
      depositosConditions.push(like(depositos.idCliente, `%${filtros.id_cliente}%`));
    }
    if (filtros.data_inicio) {
      depositosConditions.push(gte(depositos.dataAnalise, filtros.data_inicio));
    }
    if (filtros.data_fim) {
      depositosConditions.push(lte(depositos.dataAnalise, filtros.data_fim));
    }
    
    let depositosQuery = db.select().from(depositos);
    if (depositosConditions.length > 0) {
      depositosQuery = depositosQuery.where(and(...depositosConditions)) as any;
    }
    
    // Ordenar usando índice idx_depositos_data
    const depositosResult = await depositosQuery.orderBy(desc(depositos.dataAnalise), desc(depositos.id));
    // Adicionar tipo para compatibilidade com frontend
    results.push(...depositosResult.map(r => ({ ...r, tipoAnalise: "DEPOSITO" })));
  }
  
  // Ordenar resultados combinados por data de análise (mais recente primeiro)
  // Usa ordenação em memória apenas quando necessário (resultados já vêm ordenados)
  return results.sort((a, b) => {
    const dataA = new Date(a.dataAnalise).getTime();
    const dataB = new Date(b.dataAnalise).getTime();
    if (dataB !== dataA) {
      return dataB - dataA; // Descendente por data
    }
    // Se mesma data, ordenar por ID (mais recente primeiro)
    return (b.id || 0) - (a.id || 0);
  });
}

