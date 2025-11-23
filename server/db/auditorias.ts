/**
 * Operações de banco de dados relacionadas a auditorias
 */

import { eq, and, desc, gte, lte } from "drizzle-orm";
import { auditorias, saques, depositos, clientes, users, logsAuditoria } from "../../drizzle/schema";
import { getDb } from "./connection";
import { withCache, CacheKeys, deleteCache, invalidateCache } from "../_core/cache";
import { getDataAtualBrasilia } from "../utils/timezone";

/**
 * Registra uma nova auditoria e atualiza a análise mais recente do cliente
 */
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
  
  // Atualizar auditoriaData e auditoriaUsuario na análise mais recente
  if (ultimaAnalise && tipoAnalise) {
    const tabela = tipoAnalise === "saques" ? saques : depositos;
    await db
      .update(tabela)
      .set({ 
        auditoriaUsuario: true,
        auditoriaData: agora
      })
      .where(eq(tabela.id, ultimaAnalise.id));
  }

  // Invalidar cache relacionado
  await deleteCache(CacheKeys.statusAuditoria(params.idCliente));
  await invalidateCache('auditorias:lista:*');
}

/**
 * Lista auditorias com filtros opcionais
 */
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Database] Erro ao listar auditorias:", errorMessage);
    return [];
  }
}

/**
 * Busca auditoria por análise específica
 * CORRIGIDO: Busca a auditoria mais recente do cliente, independente da data da análise
 */
export async function getAuditoriaPorAnalise(idCliente: string, dataAnalise: string, tipoAnalise?: "SAQUE" | "DEPOSITO") {
  const db = await getDb();
  if (!db) return null;
  
  // Verificar se a análise específica tem auditoria marcada
  let analiseTemAuditoria = false;
  
  if (tipoAnalise === "SAQUE" || !tipoAnalise) {
    const saquesResult = await db
      .select({
        id: saques.id,
        auditoriaData: saques.auditoriaData,
        auditoriaUsuario: saques.auditoriaUsuario,
      })
      .from(saques)
      .where(and(
        eq(saques.idCliente, idCliente),
        eq(saques.dataAnalise, dataAnalise)
      ))
      .limit(1);
    
    if (saquesResult.length > 0 && saquesResult[0].auditoriaData && saquesResult[0].auditoriaUsuario) {
      analiseTemAuditoria = true;
    }
  }
  
  if ((tipoAnalise === "DEPOSITO" || !tipoAnalise) && !analiseTemAuditoria) {
    const depositosResult = await db
      .select({
        id: depositos.id,
        auditoriaData: depositos.auditoriaData,
        auditoriaUsuario: depositos.auditoriaUsuario,
      })
      .from(depositos)
      .where(and(
        eq(depositos.idCliente, idCliente),
        eq(depositos.dataAnalise, dataAnalise)
      ))
      .limit(1);
    
    if (depositosResult.length > 0 && depositosResult[0].auditoriaData && depositosResult[0].auditoriaUsuario) {
      analiseTemAuditoria = true;
    }
  }
  
  // Buscar a auditoria mais recente para este cliente (independente da data)
  // Se a análise tem auditoria marcada, retornar a auditoria mais recente
  const auditoriaResult = await db
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
  
  // Retornar auditoria se a análise tem auditoria marcada OU se há auditoria recente do cliente
  if (analiseTemAuditoria && auditoriaResult.length > 0) {
    return auditoriaResult[0];
  }
  
  // Se não tem auditoria marcada na análise, mas há auditoria recente do cliente, retornar também
  // (pode ser que a auditoria foi aplicada em outra análise do mesmo cliente)
  return auditoriaResult.length > 0 ? auditoriaResult[0] : null;
}

/**
 * Busca status de auditoria de um cliente
 */
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Database] Erro ao buscar status de auditoria:", errorMessage);
        return { temAuditoria: false, ultima: null };
      }
    },
    180 // Cache por 3 minutos
  );
}

/**
 * Registra um log de auditoria
 */
export async function registrarAuditoria(tipo: string, detalhe: Record<string, any>, usuarioId?: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(logsAuditoria).values({
    tipo,
    detalhe,
    usuarioId,
  });
}

