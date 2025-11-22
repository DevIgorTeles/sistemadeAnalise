import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logger } from "./logger";
// Rate limiting por usuário é aplicado no Express, não precisa importar aqui

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx }) {
    // Adicionar request ID ao erro se disponível
    const requestId = ctx?.req ? logger.getRequestId(ctx.req) : undefined;
    
    // Logar erro
    if (error.code === "INTERNAL_SERVER_ERROR") {
      logger.logError(
        "Erro interno no tRPC",
        error.cause instanceof Error ? error.cause : new Error(error.message),
        ctx?.req,
        { path: ctx?.req?.path, code: error.code }
      );
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        requestId,
        // Stack trace apenas em desenvolvimento
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware de rate limiting por usuário (aplicado via Express antes do tRPC)
// Este middleware apenas garante contexto para logging
const rateLimitMiddleware = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  // O rate limiting real é aplicado no Express antes do tRPC
  // Este middleware pode ser usado para logging ou outras verificações
  return next(opts);
});

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  
  if (!ctx.user) {
    logger.logRequest("warn", "Tentativa de acesso não autorizado", ctx.req, {
      path: ctx.req.path,
    });
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Logar acesso autenticado para auditoria (apenas em debug)
  logger.logRequest("debug", "Acesso autenticado", ctx.req, {
    userId: ctx.user.id,
    path: ctx.req.path,
  });

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(rateLimitMiddleware).use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
