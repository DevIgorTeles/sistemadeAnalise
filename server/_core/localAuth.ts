
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { verifyPassword, generateTokens } from "../auth"; // Funções de hash e token
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";



export function registerLocalAuthRoutes(app: Express) {
  // POST /api/local-login
  // Body: { email: string, password?: string }
  app.post("/api/local-login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios" });
        return;
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) {
        res.status(500).json({ error: "Banco de dados não disponível" });
        return;
      }

      const user = await dbInstance.select().from(users).where(eq(users.email, email)).limit(1);

      if (user.length === 0 || !user[0].password) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }

      // Verificar se o usuário está ativo
      if (user[0].ativo !== 1) {
        res.status(403).json({ error: "Usuário inativo. Entre em contato com o administrador." });
        return;
      }

      const passwordMatch = await verifyPassword(password, user[0].password);

      if (!passwordMatch) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }

      const now = new Date();

      // Atualiza o último login
      await db.upsertUser({
        openId: user[0].openId,
        lastSignedIn: now,
      });

      // Cria o token de sessão e o cookie
      const sessionToken = await sdk.createSessionToken(user[0].openId, {
        name: user[0].name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: user[0] });
    } catch (error) {
      console.error("[LocalAuth] login failed", String(error), (error as any)?.stack ?? "");
      res.status(500).json({ error: "Local login failed" });
    }
  });
}
