/**
 * Sistema de cache com Redis
 * Reduz carga de leitura constante no banco de dados
 */

import Redis from "ioredis";
import { ENV } from "./env";

let redisClient: Redis | null = null;
let cacheEnabled = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5; // Máximo de 5 tentativas de reconexão
let lastErrorLogTime = 0;
const ERROR_LOG_INTERVAL = 30000; // Log erros apenas a cada 30 segundos

/**
 * Inicializa cliente Redis
 */
export function initCache(): Redis | null {
  if (!ENV.redisEnabled) {
    console.log("[Cache] Redis desabilitado via REDIS_ENABLED=false");
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(ENV.redisUrl, {
      // Configurações de reconexão - limita tentativas
      retryStrategy: (times) => {
        // Após MAX_RECONNECT_ATTEMPTS tentativas, retornar null para parar reconexões
        if (times > MAX_RECONNECT_ATTEMPTS) {
          const now = Date.now();
          if (now - lastErrorLogTime > ERROR_LOG_INTERVAL) {
            console.warn(`[Cache] ⚠️ Redis não disponível após ${MAX_RECONNECT_ATTEMPTS} tentativas. Desabilitando reconexões automáticas.`);
            console.warn("[Cache] Para habilitar Redis novamente, configure REDIS_URL ou reinicie o servidor.");
            lastErrorLogTime = now;
          }
          return null; // Para de tentar reconectar
        }
        
        // Aumenta delay entre tentativas
        const delay = Math.min(times * 200, 5000); // Até 5 segundos
        return delay;
      },
      maxRetriesPerRequest: 1, // Menos tentativas por requisição
      enableReadyCheck: true,
      enableOfflineQueue: false, // Não enfileirar comandos quando offline
      // Timeouts
      connectTimeout: 5000, // 5 segundos (mais curto)
      commandTimeout: 3000, // 3 segundos
      // Lazy connect - conecta apenas quando necessário
      lazyConnect: true,
      // Logs (apenas em desenvolvimento)
      showFriendlyErrorStack: false, // Desabilitado para reduzir logs
      // Desabilitar logs automáticos do ioredis
      enableAutoPipelining: false,
    });

    // Event handlers
    redisClient.on("connect", () => {
      reconnectAttempts = 0; // Reset contador quando conectar
      console.log("[Cache] Conectando ao Redis...");
    });

    redisClient.on("ready", () => {
      cacheEnabled = true;
      reconnectAttempts = 0; // Reset contador quando pronto
      console.log("[Cache] ✅ Redis conectado e pronto");
    });

    redisClient.on("error", (error) => {
      cacheEnabled = false;
      
      // Log erros apenas a cada intervalo para evitar spam
      const now = Date.now();
      if (now - lastErrorLogTime > ERROR_LOG_INTERVAL) {
        // Só loga mensagens importantes, não todos os erros
        if (error.message && !error.message.includes("Connection is closed")) {
          console.warn(`[Cache] ⚠️ Erro no Redis: ${error.message}`);
        }
        lastErrorLogTime = now;
      }
    });

    redisClient.on("close", () => {
      cacheEnabled = false;
      // Log apenas uma vez quando fecha
      if (reconnectAttempts === 0) {
        console.log("[Cache] Conexão Redis fechada");
      }
    });

    redisClient.on("reconnecting", (delay) => {
      reconnectAttempts++;
      // Log apenas na primeira tentativa e a cada 5 tentativas
      if (reconnectAttempts === 1 || reconnectAttempts % 5 === 0) {
        console.log(`[Cache] Tentando reconectar ao Redis... (tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      }
    });

    // Conectar
    redisClient.connect().catch((error) => {
      reconnectAttempts++;
      cacheEnabled = false;
      console.warn("[Cache] ⚠️ Falha ao conectar ao Redis:", error.message);
      console.warn("[Cache] Sistema continuará funcionando sem cache");
      
      // Se falhar na primeira conexão e Redis não estiver rodando, desabilitar
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`[Cache] Redis não disponível. Para usar cache, inicie o servidor Redis ou configure REDIS_ENABLED=false`);
      }
    });

    return redisClient;
  } catch (error) {
    console.warn("[Cache] ⚠️ Falha ao inicializar Redis:", error instanceof Error ? error.message : String(error));
    console.warn("[Cache] Sistema continuará funcionando sem cache");
    cacheEnabled = false;
    return null;
  }
}

/**
 * Obtém cliente Redis (inicializa se necessário)
 */
function getRedisClient(): Redis | null {
  if (!ENV.redisEnabled) {
    return null;
  }

  if (!redisClient) {
    return initCache();
  }

  return redisClient;
}

/**
 * Verifica se cache está disponível
 */
export function isCacheAvailable(): boolean {
  return cacheEnabled && redisClient?.status === "ready";
}

/**
 * Obtém valor do cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!isCacheAvailable()) {
    return null;
  }

  try {
    const client = getRedisClient();
    if (!client) return null;

    const value = await client.get(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`[Cache] Erro ao obter chave "${key}":`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Define valor no cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300 // 5 minutos padrão
): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    if (!client) return false;

    const serialized = JSON.stringify(value);
    await client.setex(key, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.warn(`[Cache] Erro ao definir chave "${key}":`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Remove valor do cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.warn(`[Cache] Erro ao deletar chave "${key}":`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Remove múltiplas chaves do cache (por padrão)
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  if (!isCacheAvailable()) {
    return 0;
  }

  try {
    const client = getRedisClient();
    if (!client) return 0;

    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.warn(`[Cache] Erro ao deletar padrão "${pattern}":`, error instanceof Error ? error.message : String(error));
    return 0;
  }
}

/**
 * Wrapper para funções que devem usar cache
 * Tenta buscar do cache primeiro, se não encontrar, executa função e armazena resultado
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Tentar obter do cache
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Executar função
  const result = await fn();

  // Armazenar no cache (não aguardar para não bloquear)
  setCache(key, result, ttlSeconds).catch(() => {
    // Ignorar erros de cache
  });

  return result;
}

/**
 * Invalida cache relacionado a um padrão
 * Útil para invalidar cache quando dados são atualizados
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await deleteCachePattern(pattern);
}

/**
 * Fecha conexão Redis (útil para graceful shutdown)
 */
export async function closeCache(): Promise<void> {
  if (redisClient) {
    try {
      // Remover listeners para evitar reconexões durante shutdown
      redisClient.removeAllListeners();
      
      // Fechar conexão
      await redisClient.quit().catch(() => {
        // Se quit() falhar, usar disconnect() para forçar fechamento
        redisClient?.disconnect();
      });
      
      redisClient = null;
      cacheEnabled = false;
      reconnectAttempts = 0;
      console.log("[Cache] Conexão Redis fechada");
    } catch (error) {
      // Ignorar erros durante shutdown
      redisClient = null;
      cacheEnabled = false;
    }
  }
}

// Prefixos de chave para organização
export const CacheKeys = {
  user: (openId: string) => `user:${openId}`,
  userById: (id: number) => `user:id:${id}`,
  usuario: (email: string) => `usuario:email:${email}`,
  ultimaAnalise: (idCliente: string) => `analise:ultima:${idCliente}`,
  analisePorData: (idCliente: string, data: string) => `analise:${idCliente}:${data}`,
  statusAuditoria: (idCliente: string) => `auditoria:status:${idCliente}`,
  listaAuditorias: (filtros: string) => `auditorias:lista:${filtros}`,
  listaFraudes: (limit: number, offset: number) => `fraudes:lista:${limit}:${offset}`,
  listaUsuarios: () => `usuarios:lista`,
  metricasAnalises: (filtros: string) => `metricas:analises:${filtros}`,
} as const;

