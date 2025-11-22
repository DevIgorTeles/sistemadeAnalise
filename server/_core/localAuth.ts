
import type { Express, Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { verifyPassword } from "../auth"; // Funções de hash e token
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { loginRateLimiter } from "./security";
import { logSecurityEvent, SecurityEventType, detectSuspiciousActivity } from "./securityLogger";
import { createRefreshToken } from "./refreshTokens";
import { validatePassword } from "./passwordPolicy";



export function registerLocalAuthRoutes(app: Express) {
  // POST /api/local-login
  // Body: { email: string, password?: string }
  // Rate limiting aplicado para prevenir força bruta
  app.post("/api/local-login", loginRateLimiter, async (req: Request, res: Response) => {
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
        // Log tentativa de login falha
        logSecurityEvent(SecurityEventType.LOGIN_FAILED, {
          email,
          ipAddress: req.ip || req.socket.remoteAddress || undefined,
          userAgent: req.headers['user-agent'],
          details: { reason: 'password_mismatch' },
        });

        // Detectar atividade suspeita
        detectSuspiciousActivity(SecurityEventType.LOGIN_FAILED, {
          email,
          ipAddress: req.ip || req.socket.remoteAddress || undefined,
        });

        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }

      // Log login bem-sucedido
      logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
        userId: user[0].id,
        email,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'],
      });

      const now = new Date();

      // Atualiza o último login
      await db.upsertUser({
        openId: user[0].openId,
        lastSignedIn: now,
      });

      // Cria refresh token seguro (com tratamento de erro)
      let refreshToken: string | undefined;
      let expiresAt: Date | undefined;
      
      try {
        const ipAddress = req.ip || req.socket.remoteAddress || undefined;
        const userAgent = req.headers['user-agent'];
        const tokenData = await createRefreshToken(
          user[0].id,
          ipAddress,
          userAgent
        );
        refreshToken = tokenData.token;
        expiresAt = tokenData.expiresAt;
      } catch (refreshError) {
        // Se falhar ao criar refresh token, continuar sem ele (não bloquear login)
        console.warn("[LocalAuth] Falha ao criar refresh token (continuando sem ele):", 
          refreshError instanceof Error ? refreshError.message : String(refreshError));
      }

      // Cria token de sessão com expiração de 15 minutos
      const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutos
      const sessionToken = await sdk.createSessionToken(user[0].openId, {
        name: user[0].name ?? "",
        expiresInMs: SESSION_DURATION_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_DURATION_MS });

      // Retorna refresh token no body (se foi criado com sucesso)
      res.json({
        success: true,
        user: user[0],
        ...(refreshToken && expiresAt ? {
          refreshToken, // Cliente deve armazenar este token para refresh
          expiresAt: expiresAt.toISOString(),
        } : {}),
      });
    } catch (error) {
      // Log apenas a mensagem de erro genérica, sem expor dados sensíveis
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[LocalAuth] login failed:", errorMessage);

      // Log evento de segurança
      logSecurityEvent(SecurityEventType.LOGIN_FAILED, {
        email: req.body?.email,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'],
        details: { error: 'server_error' },
      });

      res.status(500).json({ error: "Erro ao processar login" });
    }
  });

  // POST /api/refresh-token
  // Body: { refreshToken: string }
  // Renova access token usando refresh token válido
  app.post("/api/refresh-token", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };

      if (!refreshToken) {
        res.status(400).json({ error: "Refresh token é obrigatório" });
        return;
      }

      const { validateRefreshToken } = await import("./refreshTokens");
      const validation = await validateRefreshToken(refreshToken);

      if (!validation) {
        logSecurityEvent(SecurityEventType.TOKEN_REFRESH_FAILED, {
          ipAddress: req.ip || req.socket.remoteAddress || undefined,
          userAgent: req.headers['user-agent'],
          details: { reason: 'invalid_or_expired_token' },
        });

        res.status(401).json({ error: "Refresh token inválido ou expirado" });
        return;
      }

      // Buscar usuário
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        res.status(500).json({ error: "Banco de dados não disponível" });
        return;
      }

      const user = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, validation.userId))
        .limit(1);

      if (user.length === 0 || user[0].ativo !== 1) {
        res.status(401).json({ error: "Usuário não encontrado ou inativo" });
        return;
      }

      // Criar novo token de sessão (15 minutos)
      const SESSION_DURATION_MS = 15 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(user[0].openId, {
        name: user[0].name ?? "",
        expiresInMs: SESSION_DURATION_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_DURATION_MS });

      res.json({
        success: true,
        user: user[0],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[LocalAuth] refresh token failed:", errorMessage);

      logSecurityEvent(SecurityEventType.TOKEN_REFRESH_FAILED, {
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'],
        details: { error: 'server_error' },
      });

      res.status(500).json({ error: "Erro ao processar refresh token" });
    }
  });

  // POST /api/logout
  // Body: { refreshToken?: string }
  // Revoga refresh token e limpa sessão
  app.post("/api/logout", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };

      if (refreshToken) {
        const { revokeRefreshToken } = await import("./refreshTokens");
        await revokeRefreshToken(refreshToken);

        logSecurityEvent(SecurityEventType.TOKEN_REVOKED, {
          ipAddress: req.ip || req.socket.remoteAddress || undefined,
          userAgent: req.headers['user-agent'],
        });
      }

      // Limpar cookie de sessão
      res.clearCookie(COOKIE_NAME);

      res.json({ success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[LocalAuth] logout failed:", errorMessage);
      res.status(500).json({ error: "Erro ao processar logout" });
    }
  });
}
