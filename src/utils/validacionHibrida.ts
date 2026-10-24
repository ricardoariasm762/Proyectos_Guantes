// Motor de validación híbrida: Fusión entre Sistema Experto (Reglas Clínicas) y Red Neuronal (TensorFlow.js)
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import type { ManoLandmarks, ManoInfo } from '../types/mediapipe';
import type { ResultadoValidacionHibrida, LabelTecnica } from '../types/ia';
import { validarPasoTecnica } from './validacionTecnica';
import { extraerFeatures } from './features';
import { suavizadorGlobal } from './suavizado';
import { iaService } from '../services/iaService';

/**
 * Mapeo de número de paso (1..6) a su etiqueta esperada en el modelo de Machine Learning.
 */
export const MAPEO_PASOS_LABELS: Record<number, LabelTecnica> = {
  1: 'paso_1_lavado',
  2: 'paso_2_secado',
  3: 'paso_3_tomar_guante_der',
  4: 'paso_4_introducir_mano_der',
  5: 'paso_5_tomar_guante_izq',
  6: 'paso_6_ajustar_punos',
};

/**
 * Mensajes de advertencia en español para errores detectados por el modelo de IA.
 */
export const MENSAJES_ERROR_IA: Record<string, string> = {
  INCORRECTO_contaminacion: '⚠️ ¡Contaminación detectada! Aleja las manos del campo estéril.',
  INCORRECTO_tocar_exterior: '⚠️ Estás tocando la parte externa del guante. Usa solo el borde doblado.',
  INCORRECTO_pinza_debil: '⚠️ La pinza es débil. Junta más el pulgar y el índice.',
};

/**
 * Confianza base asignada a la evaluación del sistema experto de reglas geométricas.
 */
const CONFIANZA_REGLAS_BASE = 0.90;

/**
 * Función principal de validación que fusiona en tiempo real las reglas clínicas y la predicción de IA.
 *
 * Jerarquía de decisiones de la capa de fusión:
 * 1. Si no hay manos en el encuadre → rechazar por reglas (fuente: 'reglas').
 * 2. Si el modelo de IA no está disponible → usar exclusivamente reglas clínicas (fuente: 'reglas').
 * 3. Si la confianza del modelo de IA es baja (< 0.60) → priorizar reglas clínicas (fuente: 'reglas').
 * 4. Si la IA detecta con alta certeza un error aséptico (INCORRECTO_*) no captado por las reglas → priorizar IA (fuente: 'ia').
 * 5. Si la decisión de las reglas y la IA coinciden (ambos aprueban o ambos detectan el paso) → consenso con confianza promediada (fuente: 'consenso').
 * 6. Por defecto ante discrepancias menores → confiar en el rigor de las reglas clínicas (fuente: 'reglas').
 *
 * @param manosLandmarks Puntos clave de las manos detectadas por MediaPipe
 * @param handedness Lateralidad de cada mano ('Left' | 'Right')
 * @param pasoEsperado Número de paso activo del protocolo clínico (1 a 6)
 * @returns Decisión unificada con procedencia y mensaje explicativo
 */
export function validarHibrido(
  manosLandmarks: ManoLandmarks[] | undefined | null,
  handedness: ManoInfo[] | undefined | null,
  pasoEsperado: number
): ResultadoValidacionHibrida {
  const labelEsperado = MAPEO_PASOS_LABELS[pasoEsperado] || 'paso_1_lavado';

  // 1. Verificar si hay manos presentes
  if (!manosLandmarks || manosLandmarks.length === 0) {
    return {
      correcto: false,
      confianza: 0.0,
      fuente: 'reglas',
      mensaje: 'Coloca tus manos dentro del encuadre de la cámara para iniciar la validación.',
      pasoDetectado: 'ninguno',
    };
  }

  // 2. Aplicar filtro de suavizado temporal a las manos
  const manosSuavizadas = suavizadorGlobal.suavizarTodas(manosLandmarks);

  // 3. Ejecutar Sistema Experto (Reglas Clínicas Biomecánicas)
  const resReglas = validarPasoTecnica(
    pasoEsperado,
    manosSuavizadas,
    handedness || []
  );

  // 4. Ejecutar Modelo de Inteligencia Artificial (TF.js) si está listo
  const iaDisponible = iaService.isReady();
  let prediccionIA = null;

  if (iaDisponible) {
    // Extraer vector de 79 features de la mano primaria (o primera detectada)
    const featuresMano = extraerFeatures(manosSuavizadas[0]);
    prediccionIA = iaService.predecir(featuresMano);
  }

  // REGLA 1: Si IA no está lista → usar solo reglas clínicas
  if (!iaDisponible || !prediccionIA) {
    return {
      correcto: resReglas.correcto,
      confianza: resReglas.correcto ? CONFIANZA_REGLAS_BASE : 0.80,
      fuente: 'reglas',
      mensaje: resReglas.mensaje,
      pasoDetectado: resReglas.correcto ? labelEsperado : 'postura_invalida',
    };
  }

  const { label: labelIA, confianza: confianzaIA } = prediccionIA;
  const esErrorIA = labelIA.startsWith('INCORRECTO_');

  // REGLA 2: Si confianza de IA < 0.60 → priorizar reglas clínicas
  if (confianzaIA < 0.6) {
    return {
      correcto: resReglas.correcto,
      confianza: resReglas.correcto ? CONFIANZA_REGLAS_BASE : 0.75,
      fuente: 'reglas',
      mensaje: resReglas.mensaje,
      pasoDetectado: resReglas.correcto ? labelEsperado : labelIA,
    };
  }

  // REGLA 4: Si IA detecta un error aséptico crítico que las reglas no vieron → priorizar IA
  if (esErrorIA && resReglas.correcto && confianzaIA >= 0.65) {
    const mensajeError =
      MENSAJES_ERROR_IA[labelIA] ||
      `⚠️ Error técnico detectado por la IA: postura incorrecta para el paso ${pasoEsperado}.`;

    return {
      correcto: false,
      confianza: confianzaIA,
      fuente: 'ia',
      mensaje: mensajeError,
      pasoDetectado: labelIA,
    };
  }

  // REGLA 3: Si ambos coinciden
  // Caso A: Ambos confirman que el paso es correcto
  if (resReglas.correcto && labelIA === labelEsperado) {
    const confianzaConsenso = Number(((CONFIANZA_REGLAS_BASE + confianzaIA) / 2).toFixed(2));
    return {
      correcto: true,
      confianza: confianzaConsenso,
      fuente: 'consenso',
      mensaje: resReglas.mensaje,
      pasoDetectado: labelEsperado,
    };
  }

  // Caso B: Ambos coinciden en que la postura es incorrecta
  if (!resReglas.correcto && (esErrorIA || labelIA !== labelEsperado)) {
    const confianzaConsenso = Number(((0.85 + confianzaIA) / 2).toFixed(2));
    const mensajeFallo = esErrorIA
      ? MENSAJES_ERROR_IA[labelIA] || resReglas.mensaje
      : resReglas.mensaje;

    return {
      correcto: false,
      confianza: confianzaConsenso,
      fuente: 'consenso',
      mensaje: mensajeFallo,
      pasoDetectado: labelIA,
    };
  }

  // REGLA 5: Por defecto ante discrepancia → confiar en las reglas clínicas
  return {
    correcto: resReglas.correcto,
    confianza: resReglas.correcto ? CONFIANZA_REGLAS_BASE : 0.80,
    fuente: 'reglas',
    mensaje: resReglas.mensaje,
    pasoDetectado: resReglas.correcto ? labelEsperado : labelIA,
  };
}
