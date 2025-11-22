/**
 * Reexporta todas as funções de banco de dados
 * Mantém compatibilidade com código existente
 */

// Connection
export { getDb, closeDb } from "./connection";

// Usuários
export { upsertUser, getUserByOpenId, listarUsuarios } from "./usuarios";

// Análises
export {
  getUltimaAnalise,
  getDataCriacaoConta,
  verificarDuplicidade,
  getAnalisePorDataETipo,
  getAnalisePorData,
  getAnalisePorIdETipo,
  criarAnalise,
  type AnaliseInput,
} from "./analises";

// Fraudes
export {
  reportarFraude,
  listarFraudes,
  getFraudesPorCliente,
  getFraudePorAnalise,
} from "./fraudes";

// Auditorias
export {
  registrarAuditoriaAnalise,
  listarAuditorias,
  getAuditoriaPorAnalise,
  getStatusAuditoria,
  registrarAuditoria,
} from "./auditorias";

// Métricas
export {
  listarMetricasAnalises,
  type MetricasFiltros,
} from "./metricas";

