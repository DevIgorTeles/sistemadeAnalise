import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, json, index, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "analista"]).default("analista").notNull(),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  password: varchar("password", { length: 255 }), // Adicionado para autenticação local
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  // Índice em email para consultas de login (buscas frequentes)
  emailIdx: index("idx_users_email").on(table.email),
  // Índice composto para listagens filtradas
  roleAtivoIdx: index("idx_users_role_ativo").on(table.role, table.ativo),
  // Índice em lastSignedIn para ordenações
  lastSignedInIdx: index("idx_users_last_signed_in").on(table.lastSignedIn),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes table: stores client information and aggregated status
 */
export const clientes = mysqlTable("clientes", {
  idCliente: varchar("id_cliente", { length: 64 }).primaryKey(),
  nomeCompleto: varchar("nome_completo", { length: 255 }),
  statusCliente: mysqlEnum("status_cliente", ["OK", "MONITORAR", "CRITICO"]).default("OK").notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

/**
 * Saques table: stores SAQUE analysis records
 */
export const saques = mysqlTable("saques", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: varchar("id_cliente", { length: 64 }).notNull(),
  nomeCompleto: varchar("nome_completo", { length: 255 }),
  dataAnalise: date("data_analise").notNull(),
  dataCriacaoConta: date("data_criacao_conta"),
  // Campos específicos de Saque
  horarioSaque: varchar("horario_saque", { length: 8 }), // HH:MM:SS
  valorSaque: decimal("valor_saque", { precision: 18, scale: 2 }),
  metricaSaque: varchar("metrica_saque", { length: 100 }), // Ex: SALDO 1000->4.999
  categoriaSaque: varchar("categoria_saque", { length: 50 }), // CASSINO, SPORTBOOK, OUTROS
  jogoEsporteSaque: varchar("jogo_esporte_saque", { length: 255 }),
  financeiro: decimal("financeiro", { precision: 18, scale: 2 }), // Positivo = casa ganhando, Negativo = cliente dando lucro
  // Tempo de Analise
  tempoAnaliseSegundos: int("tempo_analise_segundos"), // Duracao em segundos
  // Legacy CSV-compatible columns
  qtdApostas: int("qtd_apostas"),
  retornoApostas: decimal("retorno_apostas", { precision: 18, scale: 2 }),
  observacao: text("observacao"),
  // Internal BD2 fields
  fonteConsulta: varchar("fonte_consulta", { length: 64 }),
  analistaId: int("analista_id"), // ID do usuário que fez a análise (nullable para análises antigas)
  auditoriaUsuario: boolean("auditoria_usuario"), // TRUE = auditoria marcada, FALSE = não marcada
  auditoriaData: timestamp("auditoria_data"), // Nullable - só preencher quando auditoriaUsuario = TRUE
}, (table) => ({
  // Índice composto mais usado: busca saques por cliente e data
  clienteDataIdx: index("idx_saques_cliente_data").on(table.idCliente, table.dataAnalise),
  // Índice em idCliente para listagens de saques de um cliente
  clienteIdx: index("idx_saques_cliente").on(table.idCliente),
  // Índice em dataAnalise para ordenações e filtros por data
  dataAnaliseIdx: index("idx_saques_data").on(table.dataAnalise),
  // Índice em analistaId para filtrar por analista
  analistaIdIdx: index("idx_saques_analista_id").on(table.analistaId),
  // Índice em auditoriaUsuario para filtrar análises auditadas
  auditoriaUsuarioIdx: index("idx_saques_auditoria_usuario").on(table.auditoriaUsuario),
  // Índice em auditoriaData para ordenações
  auditoriaDataIdx: index("idx_saques_auditoria_data").on(table.auditoriaData),
  // Índice composto para métricas por auditoria e data
  usuarioDataIdx: index("idx_saques_usuario_data").on(table.auditoriaUsuario, table.dataAnalise),
}));

export type Saque = typeof saques.$inferSelect;
export type InsertSaque = typeof saques.$inferInsert;

/**
 * Depositos table: stores DEPOSITO analysis records
 */
export const depositos = mysqlTable("depositos", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: varchar("id_cliente", { length: 64 }).notNull(),
  nomeCompleto: varchar("nome_completo", { length: 255 }),
  dataAnalise: date("data_analise").notNull(),
  dataCriacaoConta: date("data_criacao_conta"),
  // Campos específicos de Deposito
  valorDeposito: decimal("valor_deposito", { precision: 18, scale: 2 }),
  ganhoPerda: decimal("ganho_perda", { precision: 18, scale: 2 }), // Positivo = ganho, Negativo = perda
  financeiro: decimal("financeiro", { precision: 18, scale: 2 }), // Positivo = casa ganhando, Negativo = cliente dando lucro
  categoriaDeposito: varchar("categoria_deposito", { length: 50 }), // CASSINO, SPORTBOOK, OUTROS
  jogoEsporteDepositoApos: varchar("jogo_esporte_deposito_apos", { length: 255 }), // OUTROS se nao realizou apostas
  // Tempo de Analise
  tempoAnaliseSegundos: int("tempo_analise_segundos"), // Duracao em segundos
  // Legacy CSV-compatible columns
  qtdApostas: int("qtd_apostas"),
  retornoApostas: decimal("retorno_apostas", { precision: 18, scale: 2 }),
  observacao: text("observacao"),
  // Internal BD2 fields
  fonteConsulta: varchar("fonte_consulta", { length: 64 }),
  analistaId: int("analista_id"), // ID do usuário que fez a análise (nullable para análises antigas)
  auditoriaUsuario: boolean("auditoria_usuario"), // TRUE = auditoria marcada, FALSE = não marcada
  auditoriaData: timestamp("auditoria_data"), // Nullable - só preencher quando auditoriaUsuario = TRUE
}, (table) => ({
  // Índice composto mais usado: busca depositos por cliente e data
  clienteDataIdx: index("idx_depositos_cliente_data").on(table.idCliente, table.dataAnalise),
  // Índice em idCliente para listagens de depositos de um cliente
  clienteIdx: index("idx_depositos_cliente").on(table.idCliente),
  // Índice em dataAnalise para ordenações e filtros por data
  dataAnaliseIdx: index("idx_depositos_data").on(table.dataAnalise),
  // Índice em auditoriaUsuario para filtrar por analista
  auditoriaUsuarioIdx: index("idx_depositos_auditoria_usuario").on(table.auditoriaUsuario),
  // Índice em auditoriaData para ordenações
  auditoriaDataIdx: index("idx_depositos_auditoria_data").on(table.auditoriaData),
  // Índice composto para métricas por analista e data
  usuarioDataIdx: index("idx_depositos_usuario_data").on(table.auditoriaUsuario, table.dataAnalise),
}));

export type Deposito = typeof depositos.$inferSelect;
export type InsertDeposito = typeof depositos.$inferInsert;

/**
 * Fraudes table: stores fraud reports
 */
export const fraudes = mysqlTable("fraudes", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: varchar("id_cliente", { length: 64 }).notNull(),
  dataRegistro: timestamp("data_registro").defaultNow().notNull(),
  dataAnalise: date("data_analise").notNull(), // Data da análise quando a fraude foi reportada
  descricaoDetalhada: text("descricao_detalhada").notNull(), // Campo descritivo obrigatório
  motivoPadrao: varchar("motivo_padrao", { length: 255 }).notNull(),
  motivoLivre: text("motivo_livre"),
  analistaId: int("analista_id"),
}, (table) => ({
  // Índice em idCliente para buscar fraudes de um cliente
  clienteIdx: index("idx_fraudes_cliente").on(table.idCliente),
  // Índice em dataRegistro para ordenações
  dataRegistroIdx: index("idx_fraudes_data_registro").on(table.dataRegistro),
  // Índice em analistaId para filtrar por analista
  analistaIdx: index("idx_fraudes_analista").on(table.analistaId),
}));

export type Fraude = typeof fraudes.$inferSelect;
export type InsertFraude = typeof fraudes.$inferInsert;

/**
 * Auditorias table: stores audit flags associated with analyses
 */
export const auditorias = mysqlTable("auditorias", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: varchar("id_cliente", { length: 64 }).notNull(),
  motivo: text("motivo").notNull(),
  tipo: mysqlEnum("tipo", ["ESPORTIVO", "CASSINO"]).notNull(),
  analistaId: int("analista_id").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
}, (table) => ({
  // Índice em idCliente para buscar auditorias de um cliente
  clienteIdx: index("idx_auditorias_cliente").on(table.idCliente),
  // Índice composto: cliente + criadoEm para ordenações
  clienteCriadoIdx: index("idx_auditorias_cliente_criado").on(table.idCliente, table.criadoEm),
  // Índice em criadoEm para ordenações gerais
  criadoEmIdx: index("idx_auditorias_criado").on(table.criadoEm),
  // Índice em analistaId para filtrar por analista
  analistaIdx: index("idx_auditorias_analista").on(table.analistaId),
  // Índice composto para listagens filtradas
  tipoAnalistaIdx: index("idx_auditorias_tipo_analista").on(table.tipo, table.analistaId),
}));

export type Auditoria = typeof auditorias.$inferSelect;
export type InsertAuditoria = typeof auditorias.$inferInsert;

/**
 * Logs de auditoria: immutable audit trail
 */
export const logsAuditoria = mysqlTable("logs_auditoria", {
  id: int("id").autoincrement().primaryKey(),
  tipo: varchar("tipo", { length: 64 }).notNull(),
  detalhe: json("detalhe"),
  usuarioId: int("usuario_id"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type LogAuditoria = typeof logsAuditoria.$inferSelect;
export type InsertLogAuditoria = typeof logsAuditoria.$inferInsert;

/**
 * Refresh tokens: armazenamento seguro de tokens de refresh
 * Permite revogação e rotação de tokens
 */
export const refreshTokens = mysqlTable("refresh_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  userId: int("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: varchar("ip_address", { length: 45 }), // Suporta IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Índice em userId para revogar todos os tokens de um usuário
  userIdIdx: index("idx_refresh_tokens_user_id").on(table.userId),
  // Índice em expiresAt para limpeza de tokens expirados
  expiresAtIdx: index("idx_refresh_tokens_expires_at").on(table.expiresAt),
  // Índice composto para queries de validação
  userIdRevokedIdx: index("idx_refresh_tokens_user_revoked").on(table.userId, table.revokedAt),
}));

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = typeof refreshTokens.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  saques: many(saques),
  depositos: many(depositos),
  fraudes: many(fraudes),
  refreshTokens: many(refreshTokens),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  saques: many(saques),
  depositos: many(depositos),
  fraudes: many(fraudes),
  auditorias: many(auditorias),
}));

// Relações para tabela saques
export const saquesRelations = relations(saques, ({ one }) => ({
  cliente: one(clientes, {
    fields: [saques.idCliente],
    references: [clientes.idCliente],
  }),
  analista: one(users, {
    fields: [saques.analistaId],
    references: [users.id],
  }),
}));

// Relações para tabela depositos
export const depositosRelations = relations(depositos, ({ one }) => ({
  cliente: one(clientes, {
    fields: [depositos.idCliente],
    references: [clientes.idCliente],
  }),
  analista: one(users, {
    fields: [depositos.analistaId],
    references: [users.id],
  }),
}));

export const fraudesRelations = relations(fraudes, ({ one }) => ({
  cliente: one(clientes, {
    fields: [fraudes.idCliente],
    references: [clientes.idCliente],
  }),
  analista: one(users, {
    fields: [fraudes.analistaId],
    references: [users.id],
  }),
}));

export const auditoriasRelations = relations(auditorias, ({ one }) => ({
  cliente: one(clientes, {
    fields: [auditorias.idCliente],
    references: [clientes.idCliente],
  }),
  analista: one(users, {
    fields: [auditorias.analistaId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

