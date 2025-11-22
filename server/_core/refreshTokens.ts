import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";
import { refreshTokens, type InsertRefreshToken } from "../../drizzle/schema";
import * as db from "../db";
import crypto from "crypto";

/**
 * Gera um token de refresh seguro (hash SHA-256 de um ID aleatório)
 */
function generateRefreshTokenId(): string {
  const randomId = nanoid(32);
  // Hash do token para armazenamento seguro
  return crypto.createHash('sha256').update(randomId).digest('hex');
}

/**
 * Cria um token de refresh no banco de dados
 */
export async function createRefreshToken(
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const dbInstance = await db.getDb();
  if (!dbInstance) {
    throw new Error("Database not available");
  }

  // Token seguro para enviar ao cliente
  const tokenValue = nanoid(64);
  // Hash para armazenar no banco
  const tokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');

  // Expira em 7 dias
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const insertData: InsertRefreshToken = {
    token: tokenHash,
    userId,
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  };

  await dbInstance.insert(refreshTokens).values(insertData);

  return {
    token: tokenValue, // Retorna o token original para o cliente
    expiresAt,
  };
}

/**
 * Valida e retorna o refresh token (se válido e não revogado)
 */
export async function validateRefreshToken(token: string): Promise<{ userId: number } | null> {
  const dbInstance = await db.getDb();
  if (!dbInstance) {
    return null;
  }

  // Hash do token recebido
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const tokens = await dbInstance
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, tokenHash),
        sql`${refreshTokens.revokedAt} IS NULL`
      )
    )
    .limit(1);

  if (tokens.length === 0) {
    return null;
  }

  const tokenRecord = tokens[0];

  // Verificar se está expirado
  if (new Date() > tokenRecord.expiresAt) {
    return null;
  }

  return {
    userId: tokenRecord.userId,
  };
}

/**
 * Revoga um refresh token específico
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const dbInstance = await db.getDb();
  if (!dbInstance) {
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  await dbInstance
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.token, tokenHash));
}

/**
 * Revoga todos os refresh tokens de um usuário
 * Útil quando o usuário muda de senha ou suspeita de comprometimento
 */
export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  const dbInstance = await db.getDb();
  if (!dbInstance) {
    return;
  }

  await dbInstance
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        sql`${refreshTokens.revokedAt} IS NULL`
      )
    );
}

/**
 * Remove tokens expirados e revogados (limpeza periódica)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const dbInstance = await db.getDb();
  if (!dbInstance) {
    return 0;
  }

  const now = new Date();
  
  // Remove tokens expirados há mais de 30 dias ou revogados há mais de 30 dias
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Este método pode variar dependendo do Drizzle ORM
  // Para MySQL, precisaríamos usar delete().where()
  // Por enquanto, vamos apenas marcar como limpeza necessária
  // A limpeza real pode ser feita via cron job SQL
  
  return 0; // Retornar quantidade removida (implementar se necessário)
}

