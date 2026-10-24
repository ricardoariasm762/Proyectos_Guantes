// Máquina de estados de una sesión de práctica por cámara
// Separa el flujo clínico (pasos, faltas, cronómetro) de la UI y del tracking.
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { ManoInfo, ManoLandmarks } from '../types/mediapipe';
import { useIAValidation } from './useIAValidation';
import {
  CONFIANZA_MINIMA,
  SEGUNDOS_POR_FALTA,
  SEGUNDOS_SOSTENER_PASO,
  TOTAL_PASOS_SIMULACION,
} from '../utils/puntajeSimulacion';

export type FaseSesion = 'inactiva' | 'activa' | 'pausada' | 'completada';
export type EventoSesion = 'paso' | 'falta' | 'completada';

export interface EstadoSesion {
  fase: FaseSesion;
  pasoActual: number;
  pasosCompletados: number[];
  errores: number;
  segundos: number;
  /** Segundos que la postura correcta lleva sostenida en el paso actual. */
  sostenido: number;
}

type Accion =
  | { tipo: 'INICIAR' }
  | { tipo: 'PAUSAR' }
  | { tipo: 'REANUDAR' }
  | { tipo: 'REINICIAR' }
  | { tipo: 'TICK' }
  | { tipo: 'SOSTENIDO'; valor: number }
  | { tipo: 'COMPLETAR_PASO' }
  | { tipo: 'FALTA' };

const ESTADO_INICIAL: EstadoSesion = {
  fase: 'inactiva',
  pasoActual: 1,
  pasosCompletados: [],
  errores: 0,
  segundos: 0,
  sostenido: 0,
};

function reducer(estado: EstadoSesion, accion: Accion): EstadoSesion {
  switch (accion.tipo) {
    case 'INICIAR':
      return { ...ESTADO_INICIAL, fase: 'activa' };
    case 'REINICIAR':
      return ESTADO_INICIAL;
    case 'PAUSAR':
      return estado.fase === 'activa' ? { ...estado, fase: 'pausada', sostenido: 0 } : estado;
    case 'REANUDAR':
      return estado.fase === 'pausada' ? { ...estado, fase: 'activa' } : estado;
    case 'TICK':
      return estado.fase === 'activa' ? { ...estado, segundos: estado.segundos + 1 } : estado;
    case 'SOSTENIDO':
      // Evita renders por variaciones menores a 80 ms
      return Math.abs(estado.sostenido - accion.valor) < 0.08 && accion.valor !== 0
        ? estado
        : { ...estado, sostenido: accion.valor };
    case 'FALTA':
      return { ...estado, errores: estado.errores + 1 };
    case 'COMPLETAR_PASO': {
      const pasosCompletados = estado.pasosCompletados.includes(estado.pasoActual)
        ? estado.pasosCompletados
        : [...estado.pasosCompletados, estado.pasoActual];
      const esUltimo = estado.pasoActual >= TOTAL_PASOS_SIMULACION;
      return {
        ...estado,
        pasosCompletados,
        sostenido: 0,
        pasoActual: esUltimo ? estado.pasoActual : estado.pasoActual + 1,
        fase: esUltimo ? 'completada' : estado.fase,
      };
    }
  }
}

interface OpcionesSesion {
  landmarks: ManoLandmarks[];
  handedness: ManoInfo[];
  onEvento?: (evento: EventoSesion) => void;
}

type ResultadoValidacion = ReturnType<typeof useIAValidation>['resultado'];

export function useSesionPractica({ landmarks, handedness, onEvento }: OpcionesSesion) {
  const [estado, dispatch] = useReducer(reducer, ESTADO_INICIAL);
  const hayManos = landmarks.length > 0;

  // La validación depende del paso vigente y de que la sesión esté activa
  const ia = useIAValidation({
    landmarks,
    handedness,
    pasoEsperado: estado.pasoActual,
    activo: estado.fase === 'activa',
  });
  const resultado = ia.resultado;

  const inicioCorrectoRef = useRef<number | null>(null);
  const inicioIncorrectoRef = useRef<number | null>(null);
  // Resultado que validó el paso anterior: no debe contar para el paso nuevo
  const resultadoConsumidoRef = useRef<ResultadoValidacion>(null);
  // Promedio de confianza en O(1): suma y conteo en vez de un array creciente
  const confianzaRef = useRef({ suma: 0, conteo: 0 });

  const onEventoRef = useRef(onEvento);
  useEffect(() => {
    onEventoRef.current = onEvento;
  }, [onEvento]);

  const reiniciarCronometrosClinicos = () => {
    inicioCorrectoRef.current = null;
    inicioIncorrectoRef.current = null;
  };

  // Cronómetro de la sesión
  useEffect(() => {
    if (estado.fase !== 'activa') return;
    const id = window.setInterval(() => dispatch({ tipo: 'TICK' }), 1000);
    return () => window.clearInterval(id);
  }, [estado.fase]);

  // Evaluación clínica de cada resultado del validador híbrido
  useEffect(() => {
    if (estado.fase !== 'activa') return;

    if (!resultado || !hayManos || resultado === resultadoConsumidoRef.current) {
      inicioCorrectoRef.current = null;
      dispatch({ tipo: 'SOSTENIDO', valor: 0 });
      return;
    }

    if (resultado.confianza > 0) {
      confianzaRef.current.suma += resultado.confianza;
      confianzaRef.current.conteo += 1;
    }

    const ahora = Date.now();
    const esValida = resultado.correcto && resultado.confianza >= CONFIANZA_MINIMA;

    if (esValida) {
      inicioIncorrectoRef.current = null;
      inicioCorrectoRef.current ??= ahora;
      const sostenido = (ahora - inicioCorrectoRef.current) / 1000;

      if (sostenido >= SEGUNDOS_SOSTENER_PASO) {
        resultadoConsumidoRef.current = resultado;
        inicioCorrectoRef.current = null;
        const esUltimo = estado.pasoActual >= TOTAL_PASOS_SIMULACION;
        dispatch({ tipo: 'COMPLETAR_PASO' });
        onEventoRef.current?.(esUltimo ? 'completada' : 'paso');
      } else {
        dispatch({ tipo: 'SOSTENIDO', valor: sostenido });
      }
      return;
    }

    inicioCorrectoRef.current = null;
    dispatch({ tipo: 'SOSTENIDO', valor: 0 });
    inicioIncorrectoRef.current ??= ahora;
    if (ahora - inicioIncorrectoRef.current >= SEGUNDOS_POR_FALTA * 1000) {
      // La siguiente falta se cuenta tras otros 3 s si la postura no se corrige
      inicioIncorrectoRef.current = ahora;
      dispatch({ tipo: 'FALTA' });
      onEventoRef.current?.('falta');
    }
  }, [resultado, hayManos, estado.fase, estado.pasoActual]);

  const iniciar = useCallback(() => {
    reiniciarCronometrosClinicos();
    resultadoConsumidoRef.current = null;
    confianzaRef.current = { suma: 0, conteo: 0 };
    dispatch({ tipo: 'INICIAR' });
  }, []);

  const pausar = useCallback(() => {
    reiniciarCronometrosClinicos();
    dispatch({ tipo: 'PAUSAR' });
  }, []);

  const reanudar = useCallback(() => dispatch({ tipo: 'REANUDAR' }), []);

  const reiniciar = useCallback(() => {
    reiniciarCronometrosClinicos();
    resultadoConsumidoRef.current = null;
    confianzaRef.current = { suma: 0, conteo: 0 };
    dispatch({ tipo: 'REINICIAR' });
  }, []);

  /** Confianza promedio de la sesión en porcentaje, o null si no hubo validaciones. */
  const obtenerConfianzaPromedio = useCallback((): number | null => {
    const { suma, conteo } = confianzaRef.current;
    return conteo === 0 ? null : Math.round((suma / conteo) * 100);
  }, []);

  return { estado, ia, iniciar, pausar, reanudar, reiniciar, obtenerConfianzaPromedio };
}
