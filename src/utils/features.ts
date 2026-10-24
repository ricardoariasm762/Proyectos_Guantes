// Extractor de vector de características biomecánicas (79 valores) a partir de landmarks de MediaPipe
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import type { Landmark3D, ManoLandmarks } from '../types/mediapipe';
import { PuntosMano } from '../types/mediapipe';
import { calcularAngulo } from './geometria';

/**
 * Puntas de los 5 dedos (Landmarks 4, 8, 12, 16, 20)
 */
const PUNTAS_DEDOS: readonly number[] = [
  PuntosMano.PULGAR_TIP,  // 4
  PuntosMano.INDICE_TIP,  // 8
  PuntosMano.MEDIO_TIP,   // 12
  PuntosMano.ANULAR_TIP,  // 16
  PuntosMano.MENIQUE_TIP, // 20
];

/**
 * Extrae un vector numérico de 79 características biomecánicas invariantes
 * a escala y traslación para una mano (21 landmarks 3D).
 *
 * Estructura del vector (79 floats):
 * - [0..62]  (63 valores): Coordenadas relativas (x, y, z) de los 21 landmarks respecto
 *             a la muñeca (punto 0), normalizadas dividiendo por la distancia máxima muñeca-punta.
 * - [63..67] (5 valores): Ángulos articulares de flexión/extensión de cada dedo (normalizados [0.0 - 1.0]).
 * - [68..77] (10 valores): Distancias euclidianas normalizadas entre todas las combinaciones de puntas de dedos (C(5,2) = 10).
 * - [78]     (1 valor): Ángulo de orientación de la mano/muñeca en el plano XY (normalizado [-1.0, 1.0]).
 *
 * @param landmarks Colección de los 21 landmarks detectados para la mano
 * @returns Array de 79 números listo para inferencia en TensorFlow.js
 */
export function extraerFeatures(landmarks: ManoLandmarks | undefined | null): number[] {
  // Salvaguarda: si no hay landmarks válidos, retornar vector nulo de dimensión 79
  if (!landmarks || landmarks.length !== 21) {
    return new Array(79).fill(0);
  }

  const munica = landmarks[PuntosMano.MUNICA];

  // 1. Calcular distancia máxima entre muñeca y las 5 puntas de los dedos
  let maxDistMunicaPuntas = 0.0001; // Evitar división por cero
  for (const idxPunta of PUNTAS_DEDOS) {
    const punta = landmarks[idxPunta];
    const dx = punta.x - munica.x;
    const dy = punta.y - munica.y;
    const dz = punta.z - munica.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > maxDistMunicaPuntas) {
      maxDistMunicaPuntas = dist;
    }
  }

  // 2. Normalización de los 21 puntos respecto a la muñeca y escalado por maxDist (63 valores)
  const coordsNormalizadas: Landmark3D[] = [];
  const featuresCoords: number[] = [];

  for (let i = 0; i < 21; i++) {
    const p = landmarks[i];
    const relX = (p.x - munica.x) / maxDistMunicaPuntas;
    const relY = (p.y - munica.y) / maxDistMunicaPuntas;
    const relZ = (p.z - munica.z) / maxDistMunicaPuntas;

    coordsNormalizadas.push({ x: relX, y: relY, z: relZ });
    featuresCoords.push(relX, relY, relZ);
  }

  // 3. Ángulos articulares de los 5 dedos (5 valores normalizados a [0, 1])
  // Pulgar: MCP(2) - IP(3) - TIP(4)
  const angPulgar = calcularAngulo(
    landmarks[PuntosMano.PULGAR_MCP],
    landmarks[PuntosMano.PULGAR_IP],
    landmarks[PuntosMano.PULGAR_TIP]
  ) / 180.0;

  // Índice: MCP(5) - PIP(6) - TIP(8)
  const angIndice = calcularAngulo(
    landmarks[PuntosMano.INDICE_MCP],
    landmarks[PuntosMano.INDICE_PIP],
    landmarks[PuntosMano.INDICE_TIP]
  ) / 180.0;

  // Medio: MCP(9) - PIP(10) - TIP(12)
  const angMedio = calcularAngulo(
    landmarks[PuntosMano.MEDIO_MCP],
    landmarks[PuntosMano.MEDIO_PIP],
    landmarks[PuntosMano.MEDIO_TIP]
  ) / 180.0;

  // Anular: MCP(13) - PIP(14) - TIP(16)
  const angAnular = calcularAngulo(
    landmarks[PuntosMano.ANULAR_MCP],
    landmarks[PuntosMano.ANULAR_PIP],
    landmarks[PuntosMano.ANULAR_TIP]
  ) / 180.0;

  // Meñique: MCP(17) - PIP(18) - TIP(20)
  const angMenique = calcularAngulo(
    landmarks[PuntosMano.MENIQUE_MCP],
    landmarks[PuntosMano.MENIQUE_PIP],
    landmarks[PuntosMano.MENIQUE_TIP]
  ) / 180.0;

  const featuresAngulos: number[] = [
    angPulgar,
    angIndice,
    angMedio,
    angAnular,
    angMenique,
  ];

  // 4. Distancias euclidianas entre las 5 puntas de dedos (10 valores)
  // Pares: (0,1), (0,2), (0,3), (0,4), (1,2), (1,3), (1,4), (2,3), (2,4), (3,4)
  const featuresDistanciasPuntas: number[] = [];
  for (let i = 0; i < PUNTAS_DEDOS.length; i++) {
    for (let j = i + 1; j < PUNTAS_DEDOS.length; j++) {
      const pA = coordsNormalizadas[PUNTAS_DEDOS[i]];
      const pB = coordsNormalizadas[PUNTAS_DEDOS[j]];
      const dx = pA.x - pB.x;
      const dy = pA.y - pB.y;
      const dz = pA.z - pB.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      featuresDistanciasPuntas.push(dist);
    }
  }

  // 5. Ángulo de orientación de la muñeca/palma respecto al vector Muñeca -> Nudillo Medio MCP (1 valor)
  // normalizado dividiendo Math.atan2 por Math.PI -> [-1.0, 1.0]
  const nudilloMedio = landmarks[PuntosMano.MEDIO_MCP];
  const vectorOrientacionX = nudilloMedio.x - munica.x;
  const vectorOrientacionY = nudilloMedio.y - munica.y;
  const anguloOrientacion = Math.atan2(vectorOrientacionY, vectorOrientacionX) / Math.PI;

  // 6. Concatenación final de las 79 características
  const vectorCompleto = [
    ...featuresCoords,           // 63
    ...featuresAngulos,          // 5
    ...featuresDistanciasPuntas, // 10
    anguloOrientacion,           // 1
  ];

  return vectorCompleto;
}

/**
 * Extrae características cuando hay dos manos disponibles o selecciona la mano
 * más relevante según el contexto.
 */
export function extraerFeaturesParManos(
  manosLandmarks: ManoLandmarks[] | undefined | null
): {
  manoPrincipal: number[];
  manoSecundaria: number[];
} {
  if (!manosLandmarks || manosLandmarks.length === 0) {
    return {
      manoPrincipal: new Array(79).fill(0),
      manoSecundaria: new Array(79).fill(0),
    };
  }

  return {
    manoPrincipal: extraerFeatures(manosLandmarks[0]),
    manoSecundaria: extraerFeatures(manosLandmarks[1] ?? null),
  };
}
