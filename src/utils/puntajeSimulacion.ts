// Reglas de puntuación de la simulación por cámara (lógica pura, sin React)
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

export const TOTAL_PASOS_SIMULACION = 6;

/** Segundos que la postura correcta debe sostenerse para validar un paso. */
export const SEGUNDOS_SOSTENER_PASO = 1.5;
/** Segundos de postura incorrecta continua que cuentan como una falta. */
export const SEGUNDOS_POR_FALTA = 3;
/** Confianza mínima del validador híbrido para aceptar una postura. */
export const CONFIANZA_MINIMA = 0.8;

/**
 * Fórmula oficial de puntaje:
 * - Base: 1000 puntos, proporcional a los pasos completados
 * - Penalización por error: -50 puntos
 * - Penalización por tiempo: -1 punto por segundo > 120 s
 * - Mínimo: 0 puntos
 */
export function calcularPuntajeSimulacion(
  pasosCompletados: number,
  errores: number,
  tiempoSegundos: number
): number {
  const factorPasos = Math.min(pasosCompletados, TOTAL_PASOS_SIMULACION) / TOTAL_PASOS_SIMULACION;
  const penalizacionErrores = errores * 50;
  const penalizacionTiempo = Math.max(0, tiempoSegundos - 120);
  return Math.max(0, Math.round(1000 * factorPasos - penalizacionErrores - penalizacionTiempo));
}

export type NivelDesempeno = 'excelente' | 'bueno' | 'repasar';

export function nivelDesempeno(puntaje: number): NivelDesempeno {
  if (puntaje >= 850) return 'excelente';
  if (puntaje >= 600) return 'bueno';
  return 'repasar';
}

export const MENSAJE_DESEMPENO: Record<NivelDesempeno, string> = {
  excelente: 'Excelente dominio de la técnica estéril.',
  bueno: 'Buen desempeño. Revisa los pasos donde perdiste tiempo o cometiste faltas.',
  repasar: 'Repasa la Práctica Guiada y vuelve a intentarlo.',
};
