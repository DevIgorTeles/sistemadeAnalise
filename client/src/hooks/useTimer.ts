import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerOptions {
  autoStart?: boolean;
  onTick?: (seconds: number) => void;
}

/**
 * Hook para gerenciar cronômetro/timer
 * Retorna tempo em segundos e controles de play/pause/reset
 */
export function useTimer(options: UseTimerOptions = {}) {
  const { autoStart = false, onTick } = options;
  const [segundos, setSegundos] = useState(0);
  const [ativo, setAtivo] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (ativo) {
      intervalRef.current = setInterval(() => {
        setSegundos((prev) => {
          const novo = prev + 1;
          onTick?.(novo);
          return novo;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ativo, onTick]);

  const iniciar = useCallback(() => setAtivo(true), []);
  const pausar = useCallback(() => setAtivo(false), []);
  const resetar = useCallback(() => {
    setSegundos(0);
    setAtivo(false);
  }, []);
  const reiniciar = useCallback(() => {
    setSegundos(0);
    setAtivo(true);
  }, []);

  return {
    segundos,
    ativo,
    iniciar,
    pausar,
    resetar,
    reiniciar,
  };
}

