/**
 * Constantes relacionadas a análises
 * Centraliza valores fixos usados no sistema
 */

export const METRICAS_SAQUE = [
  "SALDO 1000->4.999",
  "SALDO 5000->9.999",
  "SALDO 10000->5.0000",
  "SAQUE MENSAL 5000->9.999",
  "SAQUE MENSAL 10.000->29.999",
  "SAQUE MENSAL 30.000->69.999",
  "SAQUE MENSAL 80.000->99.999",
  "SAQUE MENSAL 100.000->200.000",
  "APOSTAS 1000->4.999",
  "APOSTAS 5.000->9.999",
  "APOSTAS 10.000->29.000",
  "APOSTAS 30.000->40.999",
  "APOSTAS 50.000->79.999",
] as const;

export const CATEGORIAS = ["CASSINO", "SPORTBOOK", "N/A"] as const;

export const TIPOS_AUDITORIA = ["ESPORTIVO", "CASSINO"] as const;

export const TIPOS_ANALISE = ["SAQUE", "DEPOSITO"] as const;

export type TipoAnalise = (typeof TIPOS_ANALISE)[number];
export type TipoAuditoria = (typeof TIPOS_AUDITORIA)[number];
export type Categoria = (typeof CATEGORIAS)[number];
export type MetricasSaque = (typeof METRICAS_SAQUE)[number];

