/**
 * Operações de banco de dados relacionadas a fraudes
 */

import { eq, and, desc } from "drizzle-orm";
import { fraudes, clientes, users } from "../../drizzle/schema";
import { getDb } from "./connection";
import type { InsertFraude } from "../../drizzle/schema";

/**
 * Reporta uma nova fraude
 */
export async function reportarFraude(fraude: InsertFraude) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Inserir registro de fraude
  const result = await db.insert(fraudes).values(fraude);
  
  // Atualizar status do cliente para MONITORAR
  await db.update(clientes)
    .set({ statusCliente: "MONITORAR" })
    .where(eq(clientes.idCliente, fraude.idCliente));
  
  return result;
}

/**
 * Lista fraudes com paginação
 */
export async function listarFraudes(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: fraudes.id,
      idCliente: fraudes.idCliente,
      dataRegistro: fraudes.dataRegistro,
      dataAnalise: fraudes.dataAnalise,
      descricaoDetalhada: fraudes.descricaoDetalhada,
      motivoPadrao: fraudes.motivoPadrao,
      motivoLivre: fraudes.motivoLivre,
      analistaId: fraudes.analistaId,
      analistaNome: users.name,
    })
    .from(fraudes)
    .leftJoin(users, eq(fraudes.analistaId, users.id))
    .orderBy(desc(fraudes.dataRegistro))
    .limit(limit)
    .offset(offset);
  
  return result;
}

/**
 * Busca fraudes de um cliente específico
 */
export async function getFraudesPorCliente(idCliente: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: fraudes.id,
      idCliente: fraudes.idCliente,
      dataRegistro: fraudes.dataRegistro,
      dataAnalise: fraudes.dataAnalise,
      descricaoDetalhada: fraudes.descricaoDetalhada,
      motivoPadrao: fraudes.motivoPadrao,
      motivoLivre: fraudes.motivoLivre,
      analistaId: fraudes.analistaId,
      analistaNome: users.name,
    })
    .from(fraudes)
    .leftJoin(users, eq(fraudes.analistaId, users.id))
    .where(eq(fraudes.idCliente, idCliente))
    .orderBy(desc(fraudes.dataRegistro));
  
  return result;
}

/**
 * Busca fraude por análise específica
 */
export async function getFraudePorAnalise(idCliente: string, dataAnalise: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      id: fraudes.id,
      idCliente: fraudes.idCliente,
      dataRegistro: fraudes.dataRegistro,
      dataAnalise: fraudes.dataAnalise,
      descricaoDetalhada: fraudes.descricaoDetalhada,
      motivoPadrao: fraudes.motivoPadrao,
      motivoLivre: fraudes.motivoLivre,
      analistaId: fraudes.analistaId,
      analistaNome: users.name,
    })
    .from(fraudes)
    .leftJoin(users, eq(fraudes.analistaId, users.id))
    .where(and(
      eq(fraudes.idCliente, idCliente),
      eq(fraudes.dataAnalise, dataAnalise)
    ))
    .orderBy(desc(fraudes.dataRegistro))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

