import type { Express, Request, Response, NextFunction } from "express";
import { ENV } from "./env";

/**
 * Configuração de CORS adequada
 * Restringe origens permitidas e bloqueia métodos indevidos
 */

// Origens permitidas - ajustar conforme necessário
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      // Em desenvolvimento, permitir localhost
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

// Métodos HTTP permitidos
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

// Headers permitidos
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
];

// Headers expostos ao cliente
const EXPOSED_HEADERS = [
  'X-Request-Id',
  'RateLimit-Limit',
  'RateLimit-Remaining',
  'RateLimit-Reset',
];

/**
 * Verifica se a origem da requisição é permitida
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // Permitir requisições sem origem (ex: curl, Postman)
    return !ENV.isProduction;
  }

  // Em produção, sempre validar origem
  if (ENV.isProduction) {
    return ALLOWED_ORIGINS.includes(origin);
  }

  // Em desenvolvimento, permitir localhost e origens configuradas
  return ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost');
}

/**
 * Middleware de CORS
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  // Verificar origem
  if (origin && !isOriginAllowed(origin)) {
    res.status(403).json({ error: 'Origem não permitida' });
    return;
  }

  // Headers CORS
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '));

  // Preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    res.status(204).end();
    return;
  }

  next();
}

/**
 * Configura CORS na aplicação Express
 */
export function configureCors(app: Express): void {
  app.use(corsMiddleware);

  // Log de configuração
  if (!ENV.isProduction) {
    console.log('🔒 CORS configurado para origens:', ALLOWED_ORIGINS.join(', '));
  }
}

