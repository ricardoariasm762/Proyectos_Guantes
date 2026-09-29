// Definiciones de tipos para el módulo de Visión por Computador con MediaPipe Hands
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import type React from 'react';

/**
 * Coordenadas 3D normalizadas de un punto de referencia (landmark).
 * x, y están en el rango [0.0, 1.0] normalizados según las dimensiones de la imagen/video.
 * z representa la profundidad relativa respecto a la muñeca.
 */
export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * Conjunto de 21 landmarks correspondientes a una mano individual detectada.
 */
export type ManoLandmarks = Landmark3D[];

/**
 * Identificación de lateralidad de la mano detectada por MediaPipe.
 */
export type ManoLateralidad = 'Left' | 'Right';

/**
 * Información de lateralidad con índice y nivel de confianza.
 */
export interface ManoInfo {
  index: number;
  score: number;
  categoryName: ManoLateralidad;
  displayName?: string;
}

/**
 * Enumeración semántica de los 21 puntos clave de MediaPipe Hands.
 */
export const PuntosMano = {
  MUNICA: 0,
  // Pulgar
  PULGAR_CMC: 1,
  PULGAR_MCP: 2,
  PULGAR_IP: 3,
  PULGAR_TIP: 4,
  // Índice
  INDICE_MCP: 5,
  INDICE_PIP: 6,
  INDICE_DIP: 7,
  INDICE_TIP: 8,
  // Medio
  MEDIO_MCP: 9,
  MEDIO_PIP: 10,
  MEDIO_DIP: 11,
  MEDIO_TIP: 12,
  // Anular
  ANULAR_MCP: 13,
  ANULAR_PIP: 14,
  ANULAR_DIP: 15,
  ANULAR_TIP: 16,
  // Meñique
  MENIQUE_MCP: 17,
  MENIQUE_PIP: 18,
  MENIQUE_DIP: 19,
  MENIQUE_TIP: 20,
} as const;

export type PuntosMano = (typeof PuntosMano)[keyof typeof PuntosMano];


/**
 * Conexiones anatómicas estándar entre landmarks para renderizado en Canvas (HAND_CONNECTIONS).
 */
export const CONEXIONES_MANO: ReadonlyArray<[number, number]> = [
  // Palma y base de dedos
  [PuntosMano.MUNICA, PuntosMano.PULGAR_CMC],
  [PuntosMano.MUNICA, PuntosMano.INDICE_MCP],
  [PuntosMano.INDICE_MCP, PuntosMano.MEDIO_MCP],
  [PuntosMano.MEDIO_MCP, PuntosMano.ANULAR_MCP],
  [PuntosMano.ANULAR_MCP, PuntosMano.MENIQUE_MCP],
  [PuntosMano.MUNICA, PuntosMano.MENIQUE_MCP],
  // Pulgar
  [PuntosMano.PULGAR_CMC, PuntosMano.PULGAR_MCP],
  [PuntosMano.PULGAR_MCP, PuntosMano.PULGAR_IP],
  [PuntosMano.PULGAR_IP, PuntosMano.PULGAR_TIP],
  // Índice
  [PuntosMano.INDICE_MCP, PuntosMano.INDICE_PIP],
  [PuntosMano.INDICE_PIP, PuntosMano.INDICE_DIP],
  [PuntosMano.INDICE_DIP, PuntosMano.INDICE_TIP],
  // Medio
  [PuntosMano.MEDIO_MCP, PuntosMano.MEDIO_PIP],
  [PuntosMano.MEDIO_PIP, PuntosMano.MEDIO_DIP],
  [PuntosMano.MEDIO_DIP, PuntosMano.MEDIO_TIP],
  // Anular
  [PuntosMano.ANULAR_MCP, PuntosMano.ANULAR_PIP],
  [PuntosMano.ANULAR_PIP, PuntosMano.ANULAR_DIP],
  [PuntosMano.ANULAR_DIP, PuntosMano.ANULAR_TIP],
  // Meñique
  [PuntosMano.MENIQUE_MCP, PuntosMano.MENIQUE_PIP],
  [PuntosMano.MENIQUE_PIP, PuntosMano.MENIQUE_DIP],
  [PuntosMano.MENIQUE_DIP, PuntosMano.MENIQUE_TIP],
];

/**
 * Resultado devuelto por el motor de validación para cada paso evaluado.
 */
export interface ResultadoValidacion {
  correcto: boolean;
  mensaje: string;
  detalles?: string[];
}

/**
 * Función validadora que recibe los landmarks de ambas manos y su lateralidad.
 */
export type ValidadorPasoFn = (
  manosLandmarks: ManoLandmarks[],
  handednesses: ManoInfo[]
) => ResultadoValidacion;

/**
 * Definición estructurada de un paso de la técnica con sus metadatos y regla de validación.
 */
export interface PasoSimulacion {
  id: number;
  numero: number;
  titulo: string;
  instruccion: string;
  tiempoEstimadoSegundos: number;
  consejoAsepsia: string;
  validar: ValidadorPasoFn;
}

/**
 * Estado general expuesto por el hook useHandTracking.
 */
export interface EstadoHandTracking {
  isReady: boolean;
  isLoading: boolean;
  landmarks: ManoLandmarks[];
  handedness: ManoInfo[];
  fps: number;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  reiniciarDetector: () => Promise<void>;
}

/**
 * Estados del flujo de la práctica en el módulo de simulación por cámara.
 */
export type EstadoPracticaCamara = 'inactivo' | 'preparacion' | 'en_curso' | 'pausado' | 'completado';

/**
 * Payload para registro del intento de simulación en el backend de Spring Boot.
 */
export interface IntentoSimulacionBackendPayload {
  puntaje: number;
  tiempoSegundos: number;
  errores: number;
  modo: 'SIMULACION';
  pasosCompletados: number;
}
