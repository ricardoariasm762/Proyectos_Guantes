// Hook reutilizable para temporizadores (progresivo y regresivo)
// Universidad Cooperativa de Colombia - Campus Pasto

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  modo?: 'ascendente' | 'descendente';
  duracionInicialSegundos?: number;
  alFinalizar?: () => void;
  autoInicio?: boolean;
}

export function useTimer({
  modo = 'ascendente',
  duracionInicialSegundos = 0,
  alFinalizar,
  autoInicio = false,
}: UseTimerOptions = {}) {
  const [segundos, setSegundos] = useState<number>(duracionInicialSegundos);
  const [estaCorriendo, setEstaCorriendo] = useState<boolean>(autoInicio);
  const intervalRef = useRef<number | null>(null);
  const alFinalizarRef = useRef(alFinalizar);

  useEffect(() => {
    alFinalizarRef.current = alFinalizar;
  }, [alFinalizar]);

  const iniciar = useCallback(() => {
    setEstaCorriendo(true);
  }, []);

  const pausar = useCallback(() => {
    setEstaCorriendo(false);
  }, []);

  const reiniciar = useCallback(
    (nuevoValor?: number) => {
      setEstaCorriendo(false);
      setSegundos(nuevoValor !== undefined ? nuevoValor : duracionInicialSegundos);
    },
    [duracionInicialSegundos]
  );

  useEffect(() => {
    if (!estaCorriendo) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSegundos((prev) => {
        if (modo === 'descendente') {
          if (prev <= 1) {
            setEstaCorriendo(false);
            if (alFinalizarRef.current) {
              alFinalizarRef.current();
            }
            return 0;
          }
          return prev - 1;
        } else {
          return prev + 1;
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [estaCorriendo, modo]);

  return {
    segundos,
    estaCorriendo,
    iniciar,
    pausar,
    reiniciar,
  };
}
