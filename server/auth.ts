import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui';
const JWT_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  id: number;
  openId: string;
  email?: string;
  name?: string;
  role: 'admin' | 'user';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Gera um par de tokens (access + refresh)
 */
export function generateTokens(payload: JWTPayload): TokenPair {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign(
    { id: payload.id, openId: payload.openId },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );

  return { accessToken, refreshToken };
}

/**
 * Verifica e decodifica um token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash de senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Extrai o token do header Authorization
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
