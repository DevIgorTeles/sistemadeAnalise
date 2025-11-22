/**
 * Utilitários para trabalhar com o fuso horário de Brasília (UTC-3)
 * Todas as datas e horários devem respeitar o fuso oficial de Brasília
 */

const TIMEZONE_BRASILIA = 'America/Sao_Paulo'; // UTC-3 (UTC-3:00)

/**
 * Obtém a data atual no fuso horário de Brasília
 * Retorna Date atual (UTC), a conversão de timezone é feita na formatação
 */
export function getDataAtualBrasilia(): Date {
  // Date sempre trabalha em UTC internamente
  // A conversão para timezone de Brasília é feita apenas na formatação
  return new Date();
}

/**
 * Converte uma data para o fuso horário de Brasília
 * Retorna a data original (Date sempre trabalha em UTC internamente)
 * A conversão de timezone é feita apenas na formatação
 */
export function paraDataBrasilia(data: Date | string | number): Date {
  const date = typeof data === 'string' || typeof data === 'number' 
    ? new Date(data) 
    : data;
  
  // Date sempre trabalha em UTC internamente, então retornamos a data original
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date;
  }
  
  return date;
}

/**
 * Formata uma data no fuso horário de Brasília para string ISO (YYYY-MM-DD)
 * IMPORTANTE: Se receber uma string YYYY-MM-DD, retorna ela mesma (já está no formato correto)
 */
export function paraISOStringBrasilia(data: Date | string | number): string {
  // Se já for string no formato YYYY-MM-DD, retornar diretamente
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }
  
  const date = paraDataBrasilia(data);
  
  // Para Date objects, pegar componentes no timezone local (não UTC)
  // Isso garante que a data selecionada seja salva exatamente como foi escolhida
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}`;
}

/**
 * Formata uma data e hora no fuso horário de Brasília para formato brasileiro
 */
export function formatarDataHoraBrasilia(data: Date | string | number | null | undefined): string {
  if (!data) return "—";
  
  try {
    const date = paraDataBrasilia(data);
    if (Number.isNaN(date.getTime())) return "—";
    
    return date.toLocaleString('pt-BR', {
      timeZone: TIMEZONE_BRASILIA,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return "—";
  }
}

/**
 * Formata apenas a data (sem hora) no fuso horário de Brasília
 */
export function formatarDataBrasilia(data: Date | string | number | null | undefined): string {
  if (!data) return "—";
  
  try {
    const date = paraDataBrasilia(data);
    if (Number.isNaN(date.getTime())) return "—";
    
    return date.toLocaleDateString('pt-BR', {
      timeZone: TIMEZONE_BRASILIA,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return "—";
  }
}

/**
 * Formata apenas o horário (sem data) no fuso horário de Brasília
 */
export function formatarHoraBrasilia(data: Date | string | number | null | undefined): string {
  if (!data) return "—";
  
  try {
    const date = paraDataBrasilia(data);
    if (Number.isNaN(date.getTime())) return "—";
    
    return date.toLocaleTimeString('pt-BR', {
      timeZone: TIMEZONE_BRASILIA,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return "—";
  }
}

/**
 * Obtém apenas a data (YYYY-MM-DD) atual no fuso horário de Brasília
 */
export function getDataHojeBrasilia(): string {
  return paraISOStringBrasilia(getDataAtualBrasilia());
}

