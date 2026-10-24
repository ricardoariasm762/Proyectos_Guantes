// Hook personalizado para orquestar la validación híbrida (IA + Reglas Clínicas) en tiempo real
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ManoLandmarks, ManoInfo } from '../types/mediapipe';
import type { ResultadoValidacionHibrida, FuentePrediccion, DetallePasoIA } from '../types';
import { validarHibrido } from '../utils/validacionHibrida';
import { iaService } from '../services/iaService';
import { usePracticaStore } from '../store/usePracticaStore';

export interface UseIAValidationProps {
  landmarks: ManoLandmarks[] | null;
  handedness: ManoInfo[] | string[] | null;
  pasoEsperado: number;
  activo?: boolean;
}

export interface UseIAValidationReturn {
  resultado: ResultadoValidacionHibrida | null;
  isIALoading: boolean;
  isIAReady: boolean;
  error: string | null;
  recargarModelo: () => Promise<boolean>;
}

/**
 * Normaliza la fuente devuelta por la validación clínica/híbrida al enum FuentePrediccion
 */
function normalizarFuente(fuente: string): FuentePrediccion {
  const f = fuente.toUpperCase();
  if (f === 'IA' || f === 'REGLAS' || f === 'CONSENSO' || f === 'MIXTO') {
    return f;
  }
  return 'CONSENSO';
}

/**
 * Hook para integrar la validación híbrida en tiempo real con la cámara.
 * Soporta invocación tanto mediante objeto de propiedades como mediante argumentos posicionales.
 */
export function useIAValidation(
  propsOrLandmarks: UseIAValidationProps | ManoLandmarks[] | null,
  handednessArg?: ManoInfo[] | string[] | null,
  pasoEsperadoArg?: number
): UseIAValidationReturn {
  // Desestructuración flexible para compatibilidad con firmas de llamada
  const isObjectProps = propsOrLandmarks !== null && typeof propsOrLandmarks === 'object' && 'pasoEsperado' in propsOrLandmarks;

  const landmarks = (isObjectProps ? propsOrLandmarks.landmarks : propsOrLandmarks) as ManoLandmarks[] | null;
  const handedness = (isObjectProps ? propsOrLandmarks.handedness : handednessArg) as ManoInfo[] | string[] | null;
  const pasoEsperado = (isObjectProps ? propsOrLandmarks.pasoEsperado : (pasoEsperadoArg ?? 1)) as number;
  const activo = isObjectProps ? (propsOrLandmarks.activo ?? true) : true;

  const [resultado, setResultado] = useState<ResultadoValidacionHibrida | null>(null);
  const [isIALoading, setIsIALoading] = useState<boolean>(true);
  const [isIAReady, setIsIAReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Referencias para evitar inferencias duplicadas y respuestas fuera de orden
  const ultimosLandmarksRef = useRef<ManoLandmarks[] | null>(null);
  const ultimoPasoRef = useRef<number>(pasoEsperado);
  const solicitudRef = useRef<number>(0);

  const registrarValidacion = usePracticaStore((s) => s.registrarValidacion);

  /**
   * Carga inicial o recarga bajo demanda del modelo de IA TensorFlow.js
   */
  const cargarModeloIA = useCallback(async (): Promise<boolean> => {
    setIsIALoading(true);
    setError(null);

    try {
      const exito = await iaService.cargarModelo();
      setIsIAReady(iaService.isReady());
      setError(iaService.getError());
      setIsIALoading(false);
      return exito;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al inicializar IA.';
      setError(msg);
      setIsIAReady(false);
      setIsIALoading(false);
      return false;
    }
  }, []);

  // 1. Cargar el modelo al montar el componente
  useEffect(() => {
    let cancelado = false;

    const iniciar = async () => {
      try {
        const exito = await iaService.cargarModelo();
        if (!cancelado) {
          setIsIAReady(exito);
          setError(iaService.getError());
          setIsIALoading(false);
        }
      } catch (err: unknown) {
        if (!cancelado) {
          const msg = err instanceof Error ? err.message : 'Error al inicializar IA.';
          setError(msg);
          setIsIAReady(false);
          setIsIALoading(false);
        }
      }
    };

    iniciar();

    return () => {
      cancelado = true;
    };
  }, []);

  // 2. Ejecutar validación híbrida ante cambios relevantes de landmarks o de paso
  useEffect(() => {
    if (!activo || !landmarks || landmarks.length === 0) {
      return;
    }

    // El tracker solo emite un array nuevo por detección: la identidad basta como huella
    const pasoHaCambiado = ultimoPasoRef.current !== pasoEsperado;
    if (!pasoHaCambiado && landmarks === ultimosLandmarksRef.current) {
      return;
    }

    ultimosLandmarksRef.current = landmarks;
    ultimoPasoRef.current = pasoEsperado;
    const solicitud = ++solicitudRef.current;

    const validar = async () => {
      try {
        const res = await validarHibrido(
          landmarks as unknown as Parameters<typeof validarHibrido>[0],
          (handedness || []) as unknown as Parameters<typeof validarHibrido>[1],
          pasoEsperado
        );

        // Descartar respuestas que llegaron después de una más reciente
        if (solicitud !== solicitudRef.current) return;

        setResultado(res);

        // Registrar en el store para métricas y análisis de sesión
        const detalle: DetallePasoIA = {
          numero: pasoEsperado,
          correcto: res.correcto,
          confianza: res.confianza,
          fuente: normalizarFuente(res.fuente),
          mensaje: res.mensaje,
          errorDetectado: res.pasoDetectado?.startsWith('INCORRECTO')
            ? res.pasoDetectado
            : undefined,
        };

        registrarValidacion(detalle);
      } catch (err) {
        console.error('Error en validación IA:', err);
        setError('No se pudo validar la postura en este momento.');
      }
    };

    validar();
  }, [landmarks, handedness, pasoEsperado, activo, registrarValidacion]);

  return {
    resultado,
    isIALoading,
    isIAReady,
    error,
    recargarModelo: cargarModeloIA,
  };
}

export default useIAValidation;
