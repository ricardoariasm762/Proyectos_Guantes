// Definiciones de tipos para el Simulador de Técnica Estéril
// Proyecto: Fortalecimiento de competencias en postura de guantes quirúrgicos
// Universidad Cooperativa de Colombia - Campus Pasto

export interface Usuario {
  id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  semestre: number;
  grupo: string;
  rol?: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';
  token?: string;
}

export interface Paso {
  id: number;
  titulo: string;
  descripcion: string;
  puntosCriticos: string[];
  tiempoEstimadoSegundos?: number;
  consejoAsepsia: string;
}

export type ModoPractica = 'GUIADO' | 'SIMULACION' | 'DESAFIO' | 'guiado' | 'simulacion' | 'desafio';

export type FuentePrediccion = 'IA' | 'REGLAS' | 'CONSENSO' | 'MIXTO';

export interface IntentoPractica {
  id: string;
  fecha: string;
  puntaje: number;
  tiempoSegundos: number;
  errores: number;
  modo: 'GUIADO' | 'SIMULACION' | 'DESAFIO' | 'guiado' | 'simulacion' | 'desafio';
  pasosCompletados: number;
  // Nuevos campos de IA
  confianzaPromedio?: number;
  fuentePrediccion?: FuentePrediccion;
  versionModelo?: string;
  detalleIA?: string;
  detallesErrores?: string[];
}

export interface DetallePasoIA {
  numero: number;
  correcto: boolean;
  confianza: number;
  fuente: FuentePrediccion;
  mensaje: string;
  errorDetectado?: string;
}

export interface DetalleIACompleto {
  pasos: DetallePasoIA[];
  confianzaPromedio: number;
  fuenteDominante: FuentePrediccion;
  versionModelo: string;
}

export interface ModeloIA {
  id: number;
  version: string;
  accuracy: number;
  numClases: number;
  numMuestras: number;
  fechaEntrenamiento: string;
  descripcion?: string;
  activo: boolean;
}

export interface ZonaSensible {
  id: string;
  nombre: string;
  tipo: 'esteril' | 'contaminada';
  x: number;
  y: number;
  ancho: number;
  alto: number;
  descripcion: string;
}

export interface ErrorComun {
  id: string;
  pasoId: number;
  titulo: string;
  descripcion: string;
  gravedad: 'critica' | 'moderada' | 'leve';
  penalizacionPuntaje: number;
}

export * from './mediapipe';
export * from './ia';
