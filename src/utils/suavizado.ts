// Filtro de suavizado temporal de landmarks (EMA + Buffer Circular) para reducir jitter
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import type { Landmark3D, ManoLandmarks } from '../types/mediapipe';

/**
 * Buffer circular interno para los últimos N frames
 */
const TAMANO_BUFFER_POR_DEFECTO = 5;
const ALPHA_EMA_POR_DEFECTO = 0.5;

// Variables de estado del filtro global
let bufferCircular: ManoLandmarks[] = [];
let ultimoEstadoEma: ManoLandmarks | null = null;

/**
 * Resetea el buffer circular y el estado EMA acumulado.
 * Llamar al cambiar de paso, reiniciar la práctica o al perder el tracking.
 */
export function resetearBuffer(): void {
  bufferCircular = [];
  ultimoEstadoEma = null;
}

/**
 * Aplica un filtro de media móvil exponencial (EMA con alpha = 0.5) respaldado por
 * un buffer circular de los últimos N=5 frames para eliminar el jitter en los 21 landmarks.
 *
 * Fórmula: ema = alpha * actual + (1 - alpha) * anterior
 *
 * @param landmarks Puntos clave detectados en el frame actual (21 puntos)
 * @param alpha Factor de ponderación (por defecto 0.5)
 * @returns Colección de 21 landmarks estabilizados
 */
export function suavizarLandmarks(
  landmarks: ManoLandmarks | undefined | null,
  alpha = ALPHA_EMA_POR_DEFECTO
): ManoLandmarks {
  if (!landmarks || landmarks.length !== 21) {
    return [];
  }

  // 1. Mantener buffer circular de los últimos 5 frames
  bufferCircular.push(landmarks);
  if (bufferCircular.length > TAMANO_BUFFER_POR_DEFECTO) {
    bufferCircular.shift();
  }

  // 2. Si no hay estado previo, inicializar con el frame actual
  if (!ultimoEstadoEma || ultimoEstadoEma.length !== 21) {
    ultimoEstadoEma = landmarks.map((p) => ({ ...p }));
    return ultimoEstadoEma;
  }

  // 3. Aplicar EMA landmark por landmark: ema = alpha * actual + (1 - alpha) * anterior
  const suavizados: ManoLandmarks = [];
  for (let i = 0; i < 21; i++) {
    const act = landmarks[i];
    const ant = ultimoEstadoEma[i];

    const x = alpha * act.x + (1 - alpha) * ant.x;
    const y = alpha * act.y + (1 - alpha) * ant.y;
    const z = alpha * act.z + (1 - alpha) * ant.z;

    suavizados.push({
      x,
      y,
      z,
      visibility: act.visibility,
    });
  }

  ultimoEstadoEma = suavizados;
  return suavizados;
}

/**
 * Opciones para la clase configurable SuavizadorLandmarks
 */
export interface OpcionesSuavizado {
  tamanoVentana?: number;
  factorEma?: number;
}

/**
 * Gestor multi-mano con buffers independientes para cada mano (0 o 1).
 * Utilizado por hooks que procesan múltiples manos en paralelo.
 */
export class SuavizadorLandmarks {
  private tamanoVentana: number;
  private factorEma: number;
  private historialManos: Map<number, ManoLandmarks[]> = new Map();
  private estadoEma: Map<number, ManoLandmarks> = new Map();

  constructor(opciones: OpcionesSuavizado = {}) {
    this.tamanoVentana = opciones.tamanoVentana ?? TAMANO_BUFFER_POR_DEFECTO;
    this.factorEma = opciones.factorEma ?? ALPHA_EMA_POR_DEFECTO;
  }

  public suavizar(landmarks: ManoLandmarks, manoId = 0): ManoLandmarks {
    if (!landmarks || landmarks.length !== 21) {
      return landmarks;
    }

    let buffer = this.historialManos.get(manoId);
    if (!buffer) {
      buffer = [];
      this.historialManos.set(manoId, buffer);
    }

    buffer.push(landmarks);
    if (buffer.length > this.tamanoVentana) {
      buffer.shift();
    }

    const prevEma = this.estadoEma.get(manoId);
    if (!prevEma || prevEma.length !== 21) {
      const inicial = landmarks.map((p) => ({ ...p }));
      this.estadoEma.set(manoId, inicial);
      return inicial;
    }

    const alpha = this.factorEma;
    const suavizados: ManoLandmarks = [];

    for (let i = 0; i < 21; i++) {
      const act = landmarks[i];
      const ant = prevEma[i];

      const x = alpha * act.x + (1 - alpha) * ant.x;
      const y = alpha * act.y + (1 - alpha) * ant.y;
      const z = alpha * act.z + (1 - alpha) * ant.z;

      suavizados.push({ x, y, z, visibility: act.visibility });
    }

    this.estadoEma.set(manoId, suavizados);
    return suavizados;
  }

  public suavizarTodas(manosLista: ManoLandmarks[]): ManoLandmarks[] {
    if (!manosLista || manosLista.length === 0) {
      return [];
    }
    return manosLista.map((mano, idx) => this.suavizar(mano, idx));
  }

  public reiniciar(): void {
    this.historialManos.clear();
    this.estadoEma.clear();
    resetearBuffer();
  }
}

/**
 * Instancia singleton compartida
 */
export const suavizadorGlobal = new SuavizadorLandmarks({
  tamanoVentana: 5,
  factorEma: 0.5,
});

/**
 * Función utilitaria pura para promediar frames
 */
export function promediarLandmarksBuffer(bufferFrames: ManoLandmarks[]): ManoLandmarks {
  if (!bufferFrames || bufferFrames.length === 0) return [];
  if (bufferFrames.length === 1) return bufferFrames[0];

  const cantidad = bufferFrames.length;
  const resultado: Landmark3D[] = [];

  for (let i = 0; i < 21; i++) {
    let sumaX = 0;
    let sumaY = 0;
    let sumaZ = 0;

    for (const frame of bufferFrames) {
      if (frame[i]) {
        sumaX += frame[i].x;
        sumaY += frame[i].y;
        sumaZ += frame[i].z;
      }
    }

    resultado.push({
      x: sumaX / cantidad,
      y: sumaY / cantidad,
      z: sumaZ / cantidad,
    });
  }

  return resultado;
}
