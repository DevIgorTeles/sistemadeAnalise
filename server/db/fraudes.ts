/**
 * Operações de banco de dados relacionadas a fraudes
 */

import { eq, and, desc } from "drizzle-orm";
import { fraudes, clientes, users } from "../../drizzle/schema";
import { getDb } from "./connection";
import type { InsertFraude } from "../../drizzle/schema";

/**
 * Reporta uma nova fraude
 * CORRIGIDO: Adiciona logs para debug e garante que a fraude seja salva corretamente
 */
export async function reportarFraude(fraude: InsertFraude) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log(`[Fraudes] Reportando fraude:`, {
    idCliente: fraude.idCliente,
    dataAnalise: fraude.dataAnalise,
    dataRegistro: fraude.dataRegistro,
    analistaId: fraude.analistaId,
  });
  
  // Inserir registro de fraude
  const result = await db.insert(fraudes).values(fraude);
  
  console.log(`[Fraudes] ✅ Fraude inserida com sucesso:`, result);
  
  // Atualizar status do cliente para MONITORAR
  await db.update(clientes)
    .set({ statusCliente: "MONITORAR" })
    .where(eq(clientes.idCliente, fraude.idCliente));
  
  console.log(`[Fraudes] ✅ Status do cliente ${fraude.idCliente} atualizado para MONITORAR`);
  
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
      nomeCliente: clientes.nomeCompleto,
    })
    .from(fraudes)
    .leftJoin(users, eq(fraudes.analistaId, users.id))
    .leftJoin(clientes, eq(fraudes.idCliente, clientes.idCliente))
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
 * CORRIGIDO: Busca fraude do cliente na data da análise OU a fraude mais recente do cliente
 */
export async function getFraudePorAnalise(idCliente: string, dataAnalise: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Primeiro, tentar buscar fraude específica para esta data de análise
  const resultEspecifica = await db
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
  
  // Se encontrou fraude específica para esta data, retornar
  if (resultEspecifica.length > 0) {
    return resultEspecifica[0];
  }
  
  // Se não encontrou, buscar a fraude mais recente do cliente (pode ter sido reportada em outra data)
  const resultRecente = await db
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
    .orderBy(desc(fraudes.dataRegistro))
    .limit(1);
  
  return resultRecente.length > 0 ? resultRecente[0] : null;
}

