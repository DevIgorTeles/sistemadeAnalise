import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// OAuth removido - Sistema local com JWT
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerLocalAuthRoutes } from "./localAuth";
import { applySecurityMiddleware, userRateLimiter } from "./security";
import { validateEnvironmentVariables } from "./envValidation";
import { configureCors } from "./cors";
import { initCache, closeCache } from "./cache";
import { closeDb } from "../db";
import { logger } from "./logger";
import { sendErrorResponse } from "./errorHandler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Validar variáveis de ambiente críticas antes de iniciar
  try {
    validateEnvironmentVariables();
  } catch (error) {
    logger.error(
      "Erro ao validar variáveis de ambiente",
      undefined,
      error instanceof Error ? error : undefined
    );
    process.exit(1);
  }

  // Inicializar cache (Redis)
  initCache();

  const app = express();
  const server = createServer(app);
  
  // Configure body parser with larger size limit for file uploads (antes de outros middlewares)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Configurar CORS antes de outros middlewares
  configureCors(app);
  
  // Aplica middlewares de segurança (headers e rate limiting) - APENAS em rotas da API
  // Aplicar antes das rotas para que os headers sejam aplicados nas respostas da API
  applySecurityMiddleware(app);
  
  // IMPORTANTE: Rotas da API DEVEM ser registradas ANTES do Vite
  // O Vite usa app.use("*", ...) que captura todas as rotas, então precisa vir depois
  
  // Sistema local com JWT - sem OAuth
  // Rate limiting por usuário nas rotas tRPC protegidas
  // (O rate limiting geral por IP já é aplicado em applySecurityMiddleware)
  
  // tRPC API com middleware de rate limiting por usuário
  app.use(
    "/api/trpc",
    // Middleware para aplicar rate limiting por usuário após autenticação
    async (req, res, next) => {
      try {
        // Criar contexto temporário para obter usuário
        const context = await createContext({ req, res });
        
        // Se usuário estiver autenticado, aplicar rate limiting por usuário
        if (context.user) {
          // Adicionar usuário à requisição para o rate limiter
          (req as any).user = context.user;
          
          // Usar rate limiter do Express (aplicado aqui)
          // O rate limiter precisa ser aplicado como middleware Express
          return userRateLimiter(req, res, next);
        }
        
        // Se não autenticado, apenas continuar (rate limiting por IP já foi aplicado)
        next();
      } catch (error) {
        // Se houver erro na autenticação, continuar sem rate limiting por usuário
        next();
      }
    },
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Local development login route (creates session cookie for a given openId)
  registerLocalAuthRoutes(app);
  
  // development mode uses Vite, production mode uses static files
  // Setup Vite DEPOIS das rotas da API para não interceptar requisições da API
  // O Vite middleware captura rotas não processadas e serve o cliente React
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Em produção, servir arquivos estáticos
    serveStatic(app);
  }

  // Middleware de tratamento de erros (deve ser o ÚLTIMO)
  // Express requer 4 parâmetros para identificar como error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!res.headersSent) {
      const requestId = logger.getRequestId(req);
      sendErrorResponse(res, err, 500, requestId);
    }
  });

  // Tratamento de erros do servidor HTTP
  server.on('error', (error: NodeJS.ErrnoException) => {
    logger.error("Erro no servidor HTTP", undefined, error);
    if (error.code === 'EADDRINUSE') {
      logger.error("Porta já está em uso");
    }
  });

  // Tratamento de erros não capturados do processo
  process.on('uncaughtException', (error: Error) => {
    logger.error("Exceção não capturada", undefined, error);
    // Não fazer exit imediato - deixar o servidor tentar continuar
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error(
      "Promise rejeitada não tratada",
      undefined,
      reason instanceof Error ? reason : new Error(String(reason))
    );
    // Não fazer exit imediato - apenas logar
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.info(`Porta ${preferredPort} está ocupada, usando porta ${port}`);
  }

  server.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}/`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Recebido sinal ${signal}. Iniciando graceful shutdown...`);
    
    server.close(async () => {
      logger.info("Servidor HTTP fechado");
      
      // Fechar conexões de banco de dados
      await closeDb();
      
      // Fechar conexão Redis
      await closeCache();
      
      logger.info("✅ Graceful shutdown concluído");
      process.exit(0);
    });

    // Timeout para forçar shutdown se necessário
    setTimeout(() => {
      logger.error("⚠️ Forçando shutdown após timeout");
      process.exit(1);
    }, 10000); // 10 segundos
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  logger.error("Erro ao iniciar servidor", undefined, error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
});
