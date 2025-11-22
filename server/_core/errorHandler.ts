/**
 * Sistema de tratamento de erros padronizado
 * Garante respostas consistentes e seguras de erro
 */

import type { TRPCError } from "@trpc/server";
import type { Response } from "express";
import { logger } from "./logger";

export interface ErrorResponse {
  error: string;
  code?: string;
  requestId?: string;
  // Stack trace apenas em desenvolvimento
  stack?: string;
}

/**
 * Tipos de erro padronizados
 */
export enum ErrorCode {
  // Erros de autenticação
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  
  // Erros de validação
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  
  // Erros de recurso
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  
  // Erros do servidor
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  
  // Erros de rate limiting
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
}

/**
 * Mapeia código HTTP para código de erro
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 429:
      return ErrorCode.TOO_MANY_REQUESTS;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}

/**
 * Gera mensagem de erro segura (não expõe detalhes internos em produção)
 */
function getSafeErrorMessage(error: Error | unknown, isDevelopment: boolean): string {
  if (!(error instanceof Error)) {
    return "Ocorreu um erro inesperado";
  }

  // Em desenvolvimento, mostrar mensagem completa
  if (isDevelopment) {
    return error.message;
  }

  // Em produção, usar mensagens genéricas para erros internos
  // Mas manter mensagens específicas para erros de validação/autorização
  if (error.name === "ValidationError" || error.message.includes("obrigatório")) {
    return error.message;
  }

  if (error.message.includes("UNAUTHORIZED") || error.message.includes("autentic")) {
    return "Não autorizado. Faça login novamente.";
  }

  if (error.message.includes("FORBIDDEN") || error.message.includes("permissão")) {
    return "Acesso negado. Você não tem permissão para realizar esta ação.";
  }

  if (error.message.includes("NOT_FOUND") || error.message.includes("não encontrado")) {
    return "Recurso não encontrado.";
  }

  // Erro genérico para erros internos
  return "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.";
}

/**
 * Cria resposta de erro padronizada
 */
export function createErrorResponse(
  error: Error | unknown,
  requestId?: string,
  code?: ErrorCode
): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === "development";
  const errorCode = code || getErrorCodeFromStatus(500);
  const message = getSafeErrorMessage(error, isDevelopment);

  const response: ErrorResponse = {
    error: message,
    code: errorCode,
    requestId,
  };

  // Stack trace apenas em desenvolvimento
  if (isDevelopment && error instanceof Error && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Trata erro tRPC e retorna resposta padronizada
 */
export function handleTRPCError(
  error: TRPCError,
  requestId?: string
): { status: number; response: ErrorResponse } {
  const status = getStatusFromTRPCError(error);
  const code = getErrorCodeFromTRPCError(error);
  const response = createErrorResponse(error, requestId, code);

  return { status, response };
}

/**
 * Obtém código HTTP do erro tRPC
 */
function getStatusFromTRPCError(error: TRPCError): number {
  switch (error.code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "BAD_REQUEST":
    case "PARSE_ERROR":
    case "METHOD_NOT_SUPPORTED":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "TIMEOUT":
      return 408;
    case "TOO_MANY_REQUESTS":
      return 429;
    case "INTERNAL_SERVER_ERROR":
    default:
      return 500;
  }
}

/**
 * Obtém código de erro do erro tRPC
 */
function getErrorCodeFromTRPCError(error: TRPCError): ErrorCode {
  switch (error.code) {
    case "UNAUTHORIZED":
      return ErrorCode.UNAUTHORIZED;
    case "FORBIDDEN":
      return ErrorCode.FORBIDDEN;
    case "BAD_REQUEST":
    case "PARSE_ERROR":
      return ErrorCode.BAD_REQUEST;
    case "NOT_FOUND":
      return ErrorCode.NOT_FOUND;
    case "CONFLICT":
      return ErrorCode.CONFLICT;
    case "TOO_MANY_REQUESTS":
      return ErrorCode.TOO_MANY_REQUESTS;
    case "TIMEOUT":
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}

/**
 * Envia resposta de erro HTTP padronizada
 */
export function sendErrorResponse(
  res: Response,
  error: Error | unknown,
  status: number = 500,
  requestId?: string
): void {
  const isDevelopment = process.env.NODE_ENV === "development";
  const code = getErrorCodeFromStatus(status);
  const response = createErrorResponse(error, requestId, code);

  // Logar erro
  if (error instanceof Error) {
    logger.error("Erro ao processar requisição", { requestId }, error);
  } else {
    logger.error("Erro desconhecido ao processar requisição", { requestId });
  }

  // Enviar resposta
  res.status(status).json(response);
}

