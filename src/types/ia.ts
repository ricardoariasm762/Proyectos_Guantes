// Definiciones de tipos para el subsistema de Inteligencia Artificial y Validación Híbrida
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

/**
 * Representa una muestra individual de entrenamiento para el dataset de IA.
 * Contiene el vector de 79 features biomecánicas y metadatos de captura.
 */
export interface MuestraEntrenamiento {
  features: number[];
  label: LabelTecnica;
  timestamp: number;
  metadata?: {
    persona: string;
    iluminacion: 'buena' | 'regular' | 'mala';
    distancia: 'cerca' | 'media' | 'lejos';
  };
}

/**
 * Predicción inferida por la red neuronal TensorFlow.js client-side.
 */
export interface PrediccionIA {
  label: LabelTecnica;
  confianza: number;
  probabilidades: Record<string, number>;
}

/**
 * Decisión integrada producida por la capa de fusión híbrida (IA + Reglas Clínicas).
 */
export interface ResultadoValidacionHibrida {
  correcto: boolean;
  confianza: number;
  fuente: 'ia' | 'reglas' | 'consenso';
  mensaje: string;
  pasoDetectado: string;
}

/**
 * Clases de clasificación del modelo supervisado.
 * Consta de los 6 pasos oficiales de la técnica más 3 patrones de fallo aséptico crítico.
 */
export type LabelTecnica =
  | 'paso_1_lavado'
  | 'paso_2_secado'
  | 'paso_3_tomar_guante_der'
  | 'paso_4_introducir_mano_der'
  | 'paso_5_tomar_guante_izq'
  | 'paso_6_ajustar_punos'
  | 'INCORRECTO_contaminacion'
  | 'INCORRECTO_tocar_exterior'
  | 'INCORRECTO_pinza_debil';

/**
 * Lista ordenada de todas las etiquetas del clasificador.
 */
export const TODAS_LAS_LABELS: readonly LabelTecnica[] = [
  'paso_1_lavado',
  'paso_2_secado',
  'paso_3_tomar_guante_der',
  'paso_4_introducir_mano_der',
  'paso_5_tomar_guante_izq',
  'paso_6_ajustar_punos',
  'INCORRECTO_contaminacion',
  'INCORRECTO_tocar_exterior',
  'INCORRECTO_pinza_debil',
] as const;

/**
 * Diccionario de nombres legibles en español para la interfaz gráfica.
 */
export const DESCRIPCIONES_LABELS: Record<LabelTecnica, string> = {
  paso_1_lavado: 'Paso 1: Lavado quirúrgico de manos',
  paso_2_secado: 'Paso 2: Secado con compresa estéril',
  paso_3_tomar_guante_der: 'Paso 3: Tomar guante derecho (pinza doblez)',
  paso_4_introducir_mano_der: 'Paso 4: Introducir mano derecha (dedos juntos)',
  paso_5_tomar_guante_izq: 'Paso 5: Repetir con mano izquierda (bolsillo)',
  paso_6_ajustar_punos: 'Paso 6: Ajustar puños (ambas extendidas)',
  INCORRECTO_contaminacion: 'Error: Contaminación / Manos bajo cintura',
  INCORRECTO_tocar_exterior: 'Error: Tocar superficie externa estéril',
  INCORRECTO_pinza_debil: 'Error: Pinza débil o dedos separados',
};

/**
 * Mensajes de corrección clínica en español ante fallos detectados por el modelo de IA.
 */
export const MENSAJES_ERROR_IA: Record<string, string> = {
  INCORRECTO_contaminacion: '⚠️ ¡Contaminación detectada! Aleja las manos del campo no estéril y manténlas arriba.',
  INCORRECTO_tocar_exterior: '⚠️ Estás tocando la parte externa del guante. Usa solo el borde doblado.',
  INCORRECTO_pinza_debil: '⚠️ La pinza es débil. Junta más el pulgar y el índice para asegurar la sujeción.',
};

/**
 * Payload para crear y registrar una versión del modelo IA en el backend (solo administradores).
 */
export interface ModeloIARequest {
  version: string;
  accuracy: number;
  numClases: number;
  numMuestras: number;
  descripcion?: string;
  activo?: boolean;
}

