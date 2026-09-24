// Definiciones de tipos para el Simulador de Técnica Estéril
// Proyecto: Fortalecimiento de competencias en postura de guantes quirúrgicos
// Universidad Cooperativa de Colombia - Campus Pasto

export interface Usuario {
  id: string;
  nombre: string;
  semestre: number;
  grupo: string;
}

export interface Paso {
  id: number;
  titulo: string;
  descripcion: string;
  puntosCriticos: string[];
  tiempoEstimadoSegundos?: number;
  consejoAsepsia: string;
}

export type ModoPractica = 'guiado' | 'simulacion' | 'desafio';

export interface IntentoPractica {
  id: string;
  fecha: string;
  puntaje: number;
  tiempoSegundos: number;
  errores: number;
  pasosCompletados: number;
  modo: ModoPractica;
  detallesErrores?: string[];
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
