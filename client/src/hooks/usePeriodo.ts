import { useState, useMemo } from "react";

type Periodo = "hoje" | "ontem" | "mes";

interface PeriodoData {
  dataInicio: Date;
  dataFim: Date;
}

/**
 * Hook para gerenciar seleção de período (hoje, ontem, mês)
 * Retorna datas calculadas baseadas no período selecionado
 */
export function usePeriodo(periodoInicial: Periodo = "hoje") {
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial);

  const { dataInicio, dataFim } = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (periodo) {
      case "hoje": {
        const fimHoje = new Date(hoje);
        fimHoje.setHours(23, 59, 59, 999);
        return {
          dataInicio: hoje,
          dataFim: fimHoje,
        };
      }
      case "ontem": {
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const fimOntem = new Date(ontem);
        fimOntem.setHours(23, 59, 59, 999);
        return {
          dataInicio: ontem,
          dataFim: fimOntem,
        };
      }
      case "mes": {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        inicioMes.setHours(0, 0, 0, 0);
        const fimMes = new Date(hoje);
        fimMes.setHours(23, 59, 59, 999);
        return {
          dataInicio: inicioMes,
          dataFim: fimMes,
        };
      }
      default:
        return {
          dataInicio: hoje,
          dataFim: hoje,
        };
    }
  }, [periodo]);

  return {
    periodo,
    setPeriodo,
    dataInicio,
    dataFim,
  };
}

