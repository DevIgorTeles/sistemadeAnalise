import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, json } from "drizzle-orm/mysql-core";
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
});

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
 * Analises table: stores analysis records with Saque and Deposito fields
 */
export const analises = mysqlTable("analises", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: varchar("id_cliente", { length: 64 }).notNull(),
  nomeCompleto: varchar("nome_completo", { length: 255 }),
  dataAnalise: date("data_analise").notNull(),
  dataCriacaoConta: date("data_criacao_conta"),
  tipoAnalise: varchar("tipo_analise", { length: 20 }), // SAQUE ou DEPOSITO
  // Campos para Analise de Saque
  horarioSaque: varchar("horario_saque", { length: 8 }), // HH:MM:SS
  valorSaque: decimal("valor_saque", { precision: 18, scale: 2 }),
  metricaSaque: varchar("metrica_saque", { length: 100 }), // Ex: SALDO 1000->4.999
  categoriaSaque: varchar("categoria_saque", { length: 50 }), // CASSINO, SPORTBOOK, OUTROS
  jogoEsporteSaque: varchar("jogo_esporte_saque", { length: 255 }),
  // Campos para Analise de Deposito
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
  auditoriaUsuario: int("auditoria_usuario"),
  auditoriaData: timestamp("auditoria_data").defaultNow().notNull(),
});

export type Analise = typeof analises.$inferSelect;
export type InsertAnalise = typeof analises.$inferInsert;

/**
 * Fraudes table: stores fraud reports
 */
export const fraudes = mysqlTable("fraudes", {
  id: int("id").autoincrement().primaryKey(),
  idCliente: varchar("id_cliente", { length: 64 }).notNull(),
  dataRegistro: timestamp("data_registro").defaultNow().notNull(),
  motivoPadrao: varchar("motivo_padrao", { length: 255 }).notNull(),
  motivoLivre: text("motivo_livre"),
  analistaId: int("analista_id"),
});

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
});

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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  analises: many(analises),
  fraudes: many(fraudes),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  analises: many(analises),
  fraudes: many(fraudes),
  auditorias: many(auditorias),
}));

export const analisesRelations = relations(analises, ({ one }) => ({
  cliente: one(clientes, {
    fields: [analises.idCliente],
    references: [clientes.idCliente],
  }),
  usuario: one(users, {
    fields: [analises.auditoriaUsuario],
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

