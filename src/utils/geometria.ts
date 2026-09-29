// Funciones auxiliares de cálculo geométrico 3D y análisis de postura manual
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import {
  PuntosMano,
  type Landmark3D,
  type ManoLandmarks,
} from '../types/mediapipe';

/**
 * Calcula la distancia euclidiana 3D entre dos landmarks normalizados.
 *
 * @param a Primer punto de referencia
 * @param b Segundo punto de referencia
 * @returns Distancia euclidiana en el espacio normalizado
 */
export function calcularDistancia(a: Landmark3D, b: Landmark3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calcula la distancia euclidiana 2D (plano x, y) entre dos landmarks.
 * Útil para validaciones en el plano de la cámara cuando la profundidad z tiene ruido.
 *
 * @param a Primer punto de referencia
 * @param b Segundo punto de referencia
 * @returns Distancia euclidiana 2D
 */
export function calcularDistancia2D(a: Landmark3D, b: Landmark3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula el ángulo en grados formado por tres landmarks (a -> b -> c), con vértice en 'b'.
 *
 * @param a Punto inicial
 * @param b Punto vértice de la articulación
 * @param c Punto terminal
 * @returns Ángulo en grados [0°, 180°]
 */
export function calcularAngulo(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
  // Vector BA
  const v1 = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };

  // Vector BC
  const v2 = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: c.z - b.z,
  };

  // Producto punto BA · BC
  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

  // Magnitudes de ambos vectores
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) {
    return 180;
  }

  // Coseno limitado entre -1.0 y 1.0 para evitar errores de redondeo numérico en acos
  const cosTheta = Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2)));
  const radianes = Math.acos(cosTheta);
  return (radianes * 180) / Math.PI;
}

/**
 * Evalúa si un dedo específico se encuentra extendido.
 * Para los dedos trifalángicos (índice, medio, anular, meñique),
 * calcula el ángulo entre MCP (base), PIP (articulación media) y TIP (punta).
 * Se considera extendido si el ángulo es > 160°.
 *
 * @param landmarks Colección de los 21 puntos de la mano
 * @param baseIndex Índice base del dedo (1: pulgar, 5: índice, 9: medio, 13: anular, 17: meñique)
 * @returns true si el ángulo es mayor a 160°
 */
export function dedoExtendido(landmarks: ManoLandmarks, baseIndex: number): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  // Caso especial: Pulgar (MCP = 2, IP = 3, TIP = 4)
  if (baseIndex === PuntosMano.PULGAR_CMC || baseIndex === PuntosMano.PULGAR_MCP) {
    const angulo = calcularAngulo(
      landmarks[PuntosMano.PULGAR_MCP],
      landmarks[PuntosMano.PULGAR_IP],
      landmarks[PuntosMano.PULGAR_TIP]
    );
    return angulo > 150;
  }

  // Dedos convencionales: Base = MCP, Medio = PIP, Punta = TIP
  const mcp = landmarks[baseIndex];
  const pip = landmarks[baseIndex + 1];
  const tip = landmarks[baseIndex + 3];

  if (!mcp || !pip || !tip) return false;

  const angulo = calcularAngulo(mcp, pip, tip);
  return angulo > 160;
}

/**
 * Evalúa si un dedo específico se encuentra flexionado (doblado).
 * Se considera flexionado si el ángulo de la articulación es menor a 90°.
 *
 * @param landmarks Colección de los 21 puntos de la mano
 * @param baseIndex Índice base del dedo
 * @returns true si el ángulo es menor a 90°
 */
export function dedoFlexionado(landmarks: ManoLandmarks, baseIndex: number): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  if (baseIndex === PuntosMano.PULGAR_CMC || baseIndex === PuntosMano.PULGAR_MCP) {
    const angulo = calcularAngulo(
      landmarks[PuntosMano.PULGAR_MCP],
      landmarks[PuntosMano.PULGAR_IP],
      landmarks[PuntosMano.PULGAR_TIP]
    );
    return angulo < 100;
  }

  const mcp = landmarks[baseIndex];
  const pip = landmarks[baseIndex + 1];
  const tip = landmarks[baseIndex + 3];

  if (!mcp || !pip || !tip) return false;

  const angulo = calcularAngulo(mcp, pip, tip);
  return angulo < 90;
}

/**
 * Determina si todos los 5 dedos de una mano se encuentran extendidos.
 * Requisito clave para pasos como secado con compresa estéril y verificación final.
 *
 * @param landmarks Landmarks de la mano evaluada
 * @returns true si los 5 dedos cumplen la condición de extensión
 */
export function todosDedosExtendidos(landmarks: ManoLandmarks): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const bases = [
    PuntosMano.PULGAR_CMC,
    PuntosMano.INDICE_MCP,
    PuntosMano.MEDIO_MCP,
    PuntosMano.ANULAR_MCP,
    PuntosMano.MENIQUE_MCP,
  ];

  return bases.every((base) => dedoExtendido(landmarks, base));
}

/**
 * Evalúa si la mano está ejecutando un gesto de "pinza" entre el pulgar y el índice.
 * Se verifica que la distancia entre las puntas (pulgar: 4, índice: 8) sea inferior a un umbral (por defecto 0.08).
 *
 * @param landmarks Landmarks de la mano
 * @param umbral Distancia euclidiana máxima permitida (por defecto 0.08)
 * @returns true si la distancia pulgar-índice es menor al umbral
 */
export function esGestoPinza(landmarks: ManoLandmarks, umbral = 0.08): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const pulgarTip = landmarks[PuntosMano.PULGAR_TIP];
  const indiceTip = landmarks[PuntosMano.INDICE_TIP];

  if (!pulgarTip || !indiceTip) return false;

  const distancia = calcularDistancia(pulgarTip, indiceTip);
  return distancia < umbral;
}

/**
 * Evalúa si las puntas de los cuatro dedos (índice, medio, anular, meñique) están agrupadas/juntas.
 * Requisito para introducir la mano en el guante sin rozar el borde externo.
 *
 * @param landmarks Landmarks de la mano
 * @param umbral Distancia máxima consecutiva entre puntas (por defecto 0.05)
 * @returns true si todas las distancias consecutivas entre puntas son menores al umbral
 */
export function dedosJuntos(landmarks: ManoLandmarks, umbral = 0.05): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const tips = [
    landmarks[PuntosMano.INDICE_TIP],
    landmarks[PuntosMano.MEDIO_TIP],
    landmarks[PuntosMano.ANULAR_TIP],
    landmarks[PuntosMano.MENIQUE_TIP],
  ];

  for (let i = 0; i < tips.length - 1; i++) {
    const d = calcularDistancia(tips[i], tips[i + 1]);
    if (d > umbral) {
      return false;
    }
  }

  return true;
}

/**
 * Calcula la distancia mínima entre las puntas de los dedos de dos manos distintas.
 * Utilizado para verificar que ambas manos interactúan o se frotan (ej: lavado quirúrgico).
 *
 * @param manoA Landmarks de la primera mano
 * @param manoB Landmarks de la segunda mano
 * @returns Distancia euclidiana mínima encontrada entre pares de puntas
 */
export function distanciaMinimaEntrePuntas(manoA: ManoLandmarks, manoB: ManoLandmarks): number {
  if (!manoA || !manoB || manoA.length < 21 || manoB.length < 21) return 1.0;

  const puntasA = [
    manoA[PuntosMano.PULGAR_TIP],
    manoA[PuntosMano.INDICE_TIP],
    manoA[PuntosMano.MEDIO_TIP],
    manoA[PuntosMano.ANULAR_TIP],
    manoA[PuntosMano.MENIQUE_TIP],
  ];

  const puntasB = [
    manoB[PuntosMano.PULGAR_TIP],
    manoB[PuntosMano.INDICE_TIP],
    manoB[PuntosMano.MEDIO_TIP],
    manoB[PuntosMano.ANULAR_TIP],
    manoB[PuntosMano.MENIQUE_TIP],
  ];

  let minDist = Number.POSITIVE_INFINITY;

  for (const pA of puntasA) {
    for (const pB of puntasB) {
      const dist = calcularDistancia(pA, pB);
      if (dist < minDist) {
        minDist = dist;
      }
    }
  }

  return minDist;
}
