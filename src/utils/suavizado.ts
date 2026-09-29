// Filtro de suavizado de landmarks para reducir jitter y ruido en tiempo real
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import type { Landmark3D, ManoLandmarks } from '../types/mediapipe';

export interface OpcionesSuavizado {
  tamanoVentana?: number; // Número de frames en el buffer (por defecto 5)
  factorEma?: number;     // Factor alfa para EMA [0.0 - 1.0], donde valores cercanos a 1 priorizan el frame actual
}

/**
 * Clase que gestiona el suavizado temporal de landmarks de manos usando
 * un búfer de ventana móvil con media ponderada exponencial (EMA).
 */
export class SuavizadorLandmarks {
  private tamanoVentana: number;
  private factorEma: number;
  // Búfer de historial por índice de mano: manoId (0 o 1) -> lista de frames (cada frame es ManoLandmarks)
  private historialManos: Map<number, ManoLandmarks[]> = new Map();
  // Estado previo EMA por mano
  private estadoEma: Map<number, ManoLandmarks> = new Map();

  constructor(opciones: OpcionesSuavizado = {}) {
    this.tamanoVentana = opciones.tamanoVentana ?? 5;
    this.factorEma = opciones.factorEma ?? 0.65;
  }

  /**
   * Suaviza una colección de landmarks para una mano específica.
   *
   * @param landmarks Nuevos landmarks detectados en el frame actual (21 puntos)
   * @param manoId Identificador o índice de la mano (0 para primera mano, 1 para segunda)
   * @returns Colección de 21 landmarks suavizados
   */
  public suavizar(landmarks: ManoLandmarks, manoId = 0): ManoLandmarks {
    if (!landmarks || landmarks.length !== 21) {
      return landmarks;
    }

    // Obtener o inicializar el buffer para esta mano
    let buffer = this.historialManos.get(manoId);
    if (!buffer) {
      buffer = [];
      this.historialManos.set(manoId, buffer);
    }

    // Añadir frame actual al buffer de ventana
    buffer.push(landmarks);
    if (buffer.length > this.tamanoVentana) {
      buffer.shift();
    }

    // 1. Calcular promedio simple de la ventana móvil (SMA)
    const landmarksSma: ManoLandmarks = [];
    const numFrames = buffer.length;

    for (let i = 0; i < 21; i++) {
      let sumaX = 0;
      let sumaY = 0;
      let sumaZ = 0;

      for (const frame of buffer) {
        sumaX += frame[i].x;
        sumaY += frame[i].y;
        sumaZ += frame[i].z;
      }

      landmarksSma.push({
        x: sumaX / numFrames,
        y: sumaY / numFrames,
        z: sumaZ / numFrames,
      });
    }

    // 2. Aplicar suavizado exponencial (EMA) sobre el promedio móvil para máxima estabilidad
    const prevEma = this.estadoEma.get(manoId);
    if (!prevEma) {
      this.estadoEma.set(manoId, landmarksSma);
      return landmarksSma;
    }

    const landmarksSuavizados: ManoLandmarks = [];
    const alpha = this.factorEma;

    for (let i = 0; i < 21; i++) {
      const actual = landmarksSma[i];
      const anterior = prevEma[i];

      const x = alpha * actual.x + (1 - alpha) * anterior.x;
      const y = alpha * actual.y + (1 - alpha) * anterior.y;
      const z = alpha * actual.z + (1 - alpha) * anterior.z;

      landmarksSuavizados.push({ x, y, z });
    }

    this.estadoEma.set(manoId, landmarksSuavizados);
    return landmarksSuavizados;
  }

  /**
   * Suaviza múltiples manos en un solo llamado.
   *
   * @param manosLista Array con los landmarks de cada mano detectada
   * @returns Array con los landmarks suavizados de cada mano
   */
  public suavizarTodas(manosLista: ManoLandmarks[]): ManoLandmarks[] {
    if (!manosLista || manosLista.length === 0) {
      return [];
    }

    return manosLista.map((mano, idx) => this.suavizar(mano, idx));
  }

  /**
   * Limpia el historial y reinicia el estado de suavizado.
   * Se debe llamar al reiniciar la práctica o al perder el tracking de las manos.
   */
  public reiniciar(): void {
    this.historialManos.clear();
    this.estadoEma.clear();
  }
}

/**
 * Instancia singleton compartida para uso directo por defecto.
 */
export const suavizadorGlobal = new SuavizadorLandmarks({
  tamanoVentana: 5,
  factorEma: 0.65,
});

/**
 * Función utilitaria pura para promediar un arreglo de landmarks por índice (SMA de 21 puntos).
 *
 * @param bufferFrames Lista de frames de landmarks capturados
 * @returns Landmarks promediados
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
