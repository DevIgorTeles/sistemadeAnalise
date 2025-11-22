/**
 * Utilitários de formatação reutilizáveis
 * Centraliza formatação de datas, tempo, moeda e outros valores
 * IMPORTANTE: Todas as datas usam fuso horário de Brasília (UTC-3)
 */

import { formatarDataBrasilia, formatarDataHoraBrasilia } from "./timezone";

/**
 * Formata uma data para o padrão brasileiro (usa fuso horário de Brasília)
 */
export function formatarData(data: string | Date | number | null | undefined): string {
  if (!data) return "—";
  try {
    return formatarDataBrasilia(data);
  } catch {
    return "—";
  }
}

/**
 * Formata uma data e hora para o padrão brasileiro (usa fuso horário de Brasília)
 */
export function formatarDataHora(data: string | Date | number | null | undefined): string {
  if (!data) return "—";
  try {
    return formatarDataHoraBrasilia(data);
  } catch {
    return "—";
  }
}

/**
 * Formata tempo em segundos para formato legível (ex: "2h 30m 15s" ou "45m 30s")
 */
export function formatarTempo(segundos: number): string {
  if (segundos < 0) return "0s";
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  }
  if (minutos > 0) {
    return `${minutos}m ${segs}s`;
  }
  return `${segs}s`;
}

/**
 * Formata valor monetário para Real brasileiro
 */
export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined) return "R$ 0,00";
  
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  if (Number.isNaN(num)) return "R$ 0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Converte string para Date de forma segura
 */
export function toDate(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Normaliza string removendo espaços e convertendo para maiúsculas
 */
export function normalizarString(str: string | null | undefined): string {
  if (!str) return "";
  return str.trim().toUpperCase();
}

