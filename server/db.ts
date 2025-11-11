import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, analises, fraudes, logsAuditoria } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcryptjs';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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
    console.log(`[Database] upsertUser requested for openId=${user.openId}`);
    const values: InsertUser = {
      openId: user.openId,
    };
    
    const updateSet: Record<string, unknown> = {};
    
    // Handle password hashing if provided
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
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });

    console.log(`[Database] upsertUser succeeded for openId=${user.openId}`);
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listarUsuarios() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  
  return result;
}

// OPA-specific queries
export async function getUltimaAnalise(idCliente: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(analises)
    .where(eq(analises.idCliente, idCliente))
    .orderBy(desc(analises.dataAnalise))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function verificarDuplicidade(idCliente: string, dataAnalise: string) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(analises)
    .where(and(
      eq(analises.idCliente, idCliente),
      eq(analises.dataAnalise, dataAnalise as any)
    ))
    .limit(1);
  
  return result.length > 0;
}

export async function criarAnalise(analise: typeof analises.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure client exists
  const cliente = await db.select().from(clientes).where(eq(clientes.idCliente, analise.idCliente)).limit(1);
  if (cliente.length === 0) {
    await db.insert(clientes).values({ idCliente: analise.idCliente, nomeCompleto: analise.nomeCompleto });
  }
  
  const result = await db.insert(analises).values(analise);
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

export async function registrarAuditoria(tipo: string, detalhe: Record<string, any>, usuarioId?: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(logsAuditoria).values({
    tipo,
    detalhe,
    usuarioId,
  });
}

export async function listarMetricasAnalises(filtros: {
  analista_id?: number;
  data_inicio?: Date;
  data_fim?: Date;
  tipo_analise?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (filtros.analista_id) {
    conditions.push(eq(analises.auditoriaUsuario, filtros.analista_id));
  }
  if (filtros.tipo_analise) {
    conditions.push(eq(analises.tipoAnalise, filtros.tipo_analise));
  }
  
  let query = db.select().from(analises);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query.orderBy(desc(analises.dataAnalise));
  return result;
}

