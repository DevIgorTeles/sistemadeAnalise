/**
 * Sistema de logging de segurança
 * Registra eventos suspeitos sem expor dados sensíveis
 */

export enum SecurityEventType {
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface SecurityLogEntry {
  type: SecurityEventType;
  userId?: number;
  email?: string; // Hash parcial para identificação
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Hash parcial de email para logs (mantém privacidade mas permite identificação)
 */
function hashEmailPartial(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) {
    return '***@***'; // Email inválido
  }
  const localPart = parts[0];
  const domain = parts[1];
  const maskedLocal = localPart.substring(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Log de evento de segurança
 * Armazena informações relevantes sem expor dados sensíveis
 */
export function logSecurityEvent(
  type: SecurityEventType,
  options: {
    userId?: number;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  } = {}
): void {
  const entry: SecurityLogEntry = {
    type,
    userId: options.userId,
    email: options.email ? hashEmailPartial(options.email) : undefined,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent?.substring(0, 200), // Limitar tamanho
    details: options.details ? sanitizeDetails(options.details) : undefined,
    timestamp: new Date(),
  };

  // Log estruturado para fácil parsing
  const logLevel = getLogLevel(type);
  const message = formatSecurityLog(entry);

  if (logLevel === 'error' || logLevel === 'warn') {
    console.error(`[SECURITY] ${message}`);
  } else {
    console.log(`[SECURITY] ${message}`);
  }

  // TODO: Em produção, enviar para sistema de logging centralizado
  // ou banco de dados de auditoria
}

/**
 * Remove dados sensíveis dos detalhes do log
 */
function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];

  for (const [key, value] of Object.entries(details)) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some(sk => keyLower.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Determina o nível de log baseado no tipo de evento
 */
function getLogLevel(type: SecurityEventType): 'error' | 'warn' | 'info' {
  switch (type) {
    case SecurityEventType.LOGIN_FAILED:
    case SecurityEventType.LOGIN_BLOCKED:
    case SecurityEventType.TOKEN_REFRESH_FAILED:
    case SecurityEventType.RATE_LIMIT_EXCEEDED:
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      return 'warn';
    case SecurityEventType.TOKEN_REVOKED:
    case SecurityEventType.PASSWORD_CHANGED:
      return 'info';
    default:
      return 'info';
  }
}

/**
 * Formata log de segurança para saída
 */
function formatSecurityLog(entry: SecurityLogEntry): string {
  const parts: string[] = [
    `type=${entry.type}`,
    `timestamp=${entry.timestamp.toISOString()}`,
  ];

  if (entry.userId) {
    parts.push(`userId=${entry.userId}`);
  }

  if (entry.email) {
    parts.push(`email=${entry.email}`);
  }

  if (entry.ipAddress) {
    parts.push(`ip=${entry.ipAddress}`);
  }

  if (entry.details && Object.keys(entry.details).length > 0) {
    parts.push(`details=${JSON.stringify(entry.details)}`);
  }

  return parts.join(' | ');
}

/**
 * Detecta padrões suspeitos e loga automaticamente
 */
export function detectSuspiciousActivity(
  eventType: SecurityEventType,
  options: {
    userId?: number;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    recentFailures?: number;
  }
): void {
  const isSuspicious =
    options.recentFailures && options.recentFailures >= 5 ||
    eventType === SecurityEventType.RATE_LIMIT_EXCEEDED;

  if (isSuspicious) {
    logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
      ...options,
      details: {
        triggerEvent: eventType,
        recentFailures: options.recentFailures,
      },
    });
  }
}

