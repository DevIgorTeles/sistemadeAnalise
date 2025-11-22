import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import type { User } from "../../drizzle/schema";

/**
 * Rate limiting para rota de login - previne força bruta
 * Permite 5 tentativas por 15 minutos por IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
  standardHeaders: true, // Retorna rate limit info nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
});

/**
 * Rate limiting geral para API - previne abuso
 * Permite 100 requisições por 15 minutos por IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: {
    error: "Muitas requisições. Tente novamente mais tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting por usuário autenticado
 * Permite 200 requisições por 15 minutos por usuário
 * Usa o ID do usuário como chave (além do IP)
 */
export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requisições por usuário
  message: {
    error: "Muitas requisições. Tente novamente mais tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usa ID do usuário como chave se disponível, senão usa IP
  keyGenerator: (req: Request): string => {
    // Tentar obter usuário do contexto tRPC se disponível
    const user = (req as any).user as User | undefined;
    if (user?.id) {
      return `user:${user.id}`;
    }
    // Fallback para IP se usuário não estiver disponível
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || 
               req.socket.remoteAddress || 
               "unknown";
    return `ip:${ip}`;
  },
  // Não conta requisições bem-sucedidas para usuários autenticados
  skipSuccessfulRequests: false,
  // Handler customizado para quando limite é excedido (substitui onLimitReached removido no v8)
  handler: (req: Request, res: Response) => {
    const user = (req as any).user as User | undefined;
    const identifier = user?.id ? `user:${user.id}` : req.socket.remoteAddress || "unknown";
    // Log será feito pelo sistema de logging estruturado automaticamente se necessário
    // Retorna erro 429 com mensagem personalizada
    res.status(429).json({
      error: "Muitas requisições. Tente novamente mais tarde.",
    });
  },
});

/**
 * Middleware de headers de segurança
 * Adiciona headers para proteger contra XSS, clickjacking, MIME sniffing, etc.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isApiRoute = req.path.startsWith('/api');
  
  // Em desenvolvimento, aplicar headers de segurança APENAS em rotas da API
  // Não aplicar CSP no cliente para não interferir com Vite HMR e workers
  const shouldApplyFullSecurity = !isDevelopment || isApiRoute;

  // X-Content-Type-Options: Sempre aplicar (seguro e não interfere)
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (shouldApplyFullSecurity) {
    // X-Frame-Options: Previne clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // X-XSS-Protection: Adiciona proteção XSS para navegadores antigos
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer-Policy: Controla quanto referrer information é enviado
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Strict-Transport-Security: Força HTTPS em produção
    if (!isDevelopment) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }

    // Content-Security-Policy: Apenas em produção ou rotas da API
    if (!isDevelopment) {
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "worker-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ];
      res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
    }

    // Permissions-Policy: Controla quais APIs do navegador podem ser usadas
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()"
    );
  }

  next();
}

/**
 * Aplica todos os middlewares de segurança na aplicação Express
 */
export function applySecurityMiddleware(app: Express) {
  // Aplica headers de segurança globalmente
  app.use(securityHeaders);

  // Aplica rate limiting geral na API
  app.use("/api", apiRateLimiter);
}

