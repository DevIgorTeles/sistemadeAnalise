/**
 * Sistema de logging estruturado
 * Suporta níveis (info/warn/error/debug), request IDs e integração com sistemas centralizados
 */

import type { Request } from "express";
import { nanoid } from "nanoid";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: number;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;
  private requestIdMap = new WeakMap<Request, string>();

  constructor() {
    // Em produção, só loga warn/error. Em desenvolvimento, loga tudo
    this.minLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  /**
   * Gera ou recupera request ID para uma requisição
   */
  getRequestId(req: Request): string {
    let requestId = this.requestIdMap.get(req);
    if (!requestId) {
      // Tentar pegar do header X-Request-ID se existir
      requestId = (req.headers["x-request-id"] as string) || nanoid();
      this.requestIdMap.set(req, requestId);
    }
    return requestId;
  }

  /**
   * Verifica se deve logar baseado no nível mínimo configurado
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Formata log para saída estruturada
   */
  private formatLog(entry: LogEntry): string {
    const parts: string[] = [
      `[${entry.level.toUpperCase()}]`,
      entry.timestamp,
      entry.message,
    ];

    if (entry.context) {
      const contextParts: string[] = [];
      
      if (entry.context.requestId) {
        contextParts.push(`requestId=${entry.context.requestId}`);
      }
      
      if (entry.context.userId) {
        contextParts.push(`userId=${entry.context.userId}`);
      }
      
      if (entry.context.email) {
        contextParts.push(`email=${entry.context.email}`);
      }
      
      if (entry.context.ipAddress) {
        contextParts.push(`ip=${entry.context.ipAddress}`);
      }
      
      if (entry.context.path) {
        contextParts.push(`path=${entry.context.path}`);
      }
      
      if (entry.context.method) {
        contextParts.push(`method=${entry.context.method}`);
      }

      // Outros campos customizados
      Object.entries(entry.context).forEach(([key, value]) => {
        if (!["requestId", "userId", "email", "ipAddress", "path", "method", "userAgent"].includes(key)) {
          contextParts.push(`${key}=${JSON.stringify(value)}`);
        }
      });

      if (contextParts.length > 0) {
        parts.push(contextParts.join(" | "));
      }
    }

    if (entry.error) {
      parts.push(`error="${entry.error.message}"`);
      // Stack trace apenas em desenvolvimento ou se for erro crítico
      if (this.isDevelopment && entry.error.stack) {
        parts.push(`stack=${entry.error.stack}`);
      }
    }

    return parts.join(" | ");
  }

  /**
   * Cria entrada de log estruturada
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        // Stack apenas em desenvolvimento
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  /**
   * Extrai contexto de uma requisição Express
   */
  extractContextFromRequest(
    req: Request,
    additionalContext?: Partial<LogContext>
  ): LogContext {
    const requestId = this.getRequestId(req);
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || undefined;

    return {
      requestId,
      ipAddress,
      userAgent,
      path: req.path,
      method: req.method,
      ...additionalContext,
    };
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog("debug")) return;
    const entry = this.createLogEntry("debug", message, context);
    console.debug(this.formatLog(entry));
  }

  /**
   * Log de informação
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog("info")) return;
    const entry = this.createLogEntry("info", message, context);
    console.log(this.formatLog(entry));
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog("warn")) return;
    const entry = this.createLogEntry("warn", message, context);
    console.warn(this.formatLog(entry));
  }

  /**
   * Log de erro
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog("error")) return;
    const entry = this.createLogEntry("error", message, context, error);
    console.error(this.formatLog(entry));
  }

  /**
   * Log com contexto de requisição
   */
  logRequest(
    level: LogLevel,
    message: string,
    req: Request,
    additionalContext?: Partial<LogContext>
  ): void {
    const context = this.extractContextFromRequest(req, additionalContext);
    const method = level === "error" ? this.error.bind(this) :
                   level === "warn" ? this.warn.bind(this) :
                   level === "info" ? this.info.bind(this) :
                   this.debug.bind(this);
    method(message, context);
  }

  /**
   * Log de erro com requisição
   */
  logError(
    message: string,
    error: Error,
    req?: Request,
    additionalContext?: Partial<LogContext>
  ): void {
    const context = req
      ? this.extractContextFromRequest(req, additionalContext)
      : additionalContext;
    this.error(message, context, error);
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Helper para criar contexto de log com usuário
 */
export function createUserContext(
  userId?: number,
  email?: string
): Partial<LogContext> {
  return {
    userId,
    email: email ? hashEmailPartial(email) : undefined,
  };
}

/**
 * Hash parcial de email para logs (mantém privacidade mas permite identificação)
 */
function hashEmailPartial(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) {
    return "***@***";
  }
  const localPart = parts[0];
  const domain = parts[1];
  const maskedLocal = localPart.substring(0, 2) + "***";
  return `${maskedLocal}@${domain}`;
}

