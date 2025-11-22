/**
 * Utilitários de validação e conversão de dados
 */

/**
 * Converte um valor para Date, tratando strings no formato YYYY-MM-DD
 * como data local (não UTC) para evitar problemas de timezone
 */
export function toDate(value?: string | Date | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  // Se for string no formato YYYY-MM-DD, tratar como data local (não UTC)
  // Isso evita problemas de timezone que causam diferença de um dia
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [ano, mes, dia] = value.split('-').map(Number);
    // Criar data no timezone local (Brasil)
    const date = new Date(ano, mes - 1, dia);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

