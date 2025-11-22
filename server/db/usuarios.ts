/**
 * Operações de banco de dados relacionadas a usuários
 */

import { eq, desc } from "drizzle-orm";
import { users, InsertUser } from "../../drizzle/schema";
import { getDb } from "./connection";
import { ENV } from "../_core/env";
import bcrypt from 'bcryptjs';
import { withCache, CacheKeys, deleteCache } from "../_core/cache";
import { getDataAtualBrasilia } from "../utils/timezone";

/**
 * Cria ou atualiza um usuário
 */
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
    await deleteCache(CacheKeys.listaUsuarios());

    console.log(`[Database] upsertUser succeeded for openId=${user.openId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Database] Failed to upsert user:", errorMessage);
    throw error;
  }
}

/**
 * Busca usuário por openId
 */
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
    600 // Cache por 10 minutos
  );
}

/**
 * Lista todos os usuários
 */
export async function listarUsuarios() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(users).orderBy(desc(users.createdAt));
  
  return result;
}

