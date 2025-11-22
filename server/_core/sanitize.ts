/**
 * Sistema de sanitização de inputs
 * Remove HTML/JS malicioso de campos de texto para prevenir XSS
 */

import DOMPurify from "isomorphic-dompurify";
import { logger } from "./logger";

/**
 * Opções padrão de sanitização - remove HTML mas mantém quebras de linha
 */
const DEFAULT_SANITIZE_OPTIONS: DOMPurify.Config = {
  ALLOWED_TAGS: [], // Não permite nenhuma tag HTML
  ALLOWED_ATTR: [], // Não permite nenhum atributo
  KEEP_CONTENT: true, // Mantém o conteúdo textual mas remove tags
  ALLOW_DATA_ATTR: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Opções mais permissivas - permite formatação básica (usar com cuidado)
 */
const PERMISSIVE_SANITIZE_OPTIONS: DOMPurify.Config = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitiza uma string removendo HTML/JS malicioso
 * @param input - String a ser sanitizada
 * @param strict - Se true, remove todo HTML. Se false, permite formatação básica
 * @returns String sanitizada
 */
export function sanitizeString(
  input: string | null | undefined,
  strict: boolean = true
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const options = strict ? DEFAULT_SANITIZE_OPTIONS : PERMISSIVE_SANITIZE_OPTIONS;
  
  try {
    // DOMPurify remove HTML/JS e retorna texto limpo
    const sanitized = DOMPurify.sanitize(input, options);
    
    // Normalizar espaços em branco (múltiplos espaços -> um espaço)
    // Mas preservar quebras de linha se não estiver em modo estrito
    const normalized = strict
      ? sanitized.replace(/\s+/g, " ").trim()
      : sanitized.trim();
    
    return normalized;
  } catch (error) {
    // Se houver erro na sanitização, retornar string vazia
    // e logar o erro
    logger.error(
      "Erro ao sanitizar string",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
    return "";
  }
}

/**
 * Sanitiza um objeto recursivamente, sanitizando todas as propriedades string
 * @param obj - Objeto a ser sanitizado
 * @param strict - Se true, remove todo HTML. Se false, permite formatação básica
 * @returns Objeto sanitizado
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  strict: boolean = true
): T {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value, strict) as T[keyof T];
    } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, strict) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item, strict)
          : typeof item === "object" && item !== null
          ? sanitizeObject(item as Record<string, unknown>, strict)
          : item
      ) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Sanitiza um array de strings
 */
export function sanitizeStringArray(
  input: (string | null | undefined)[],
  strict: boolean = true
): string[] {
  return input
    .map((item) => sanitizeString(item, strict))
    .filter((item) => item.length > 0);
}

/**
 * Remove caracteres perigosos mas mantém formato (para IDs, códigos, etc)
 */
export function sanitizeIdentifier(input: string | null | undefined): string {
  if (!input || typeof input !== "string") {
    return "";
  }
  
  // Remove caracteres especiais e HTML, mantém apenas alfanuméricos e alguns caracteres seguros
  return input.replace(/[<>\"'&]/g, "").trim();
}

