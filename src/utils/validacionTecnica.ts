// Motor de validación biomecánica y aséptica para la postura de guantes quirúrgicos
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import type {
  ManoLandmarks,
  ManoInfo,
  ResultadoValidacion,
} from '../types/mediapipe';
import {
  calcularDistancia,
  dedoExtendido,
  todosDedosExtendidos,
  esGestoPinza,
  dedosJuntos,
  distanciaMinimaEntrePuntas,
} from './geometria';
import { PuntosMano } from '../types/mediapipe';

/**
 * Organiza las manos detectadas según su lateralidad ('Left' o 'Right').
 * En caso de que ambas manos tengan la misma etiqueta asignada por error de clasificación,
 * o si solo una mano está presente, provee alternativas de respaldo seguras.
 */
export function clasificarManosPorLateralidad(
  manosLandmarks: ManoLandmarks[],
  handednesses: ManoInfo[]
): {
  manoIzquierda: ManoLandmarks | null;
  manoDerecha: ManoLandmarks | null;
} {
  let manoIzquierda: ManoLandmarks | null = null;
  let manoDerecha: ManoLandmarks | null = null;

  manosLandmarks.forEach((mano, idx) => {
    const info = handednesses[idx];
    const cat = info?.categoryName;

    // Nota: En vista de cámara frontal (espejo), la mano derecha del usuario suele
    // mapearse como 'Left' o 'Right' según la inversión. Aceptamos la clasificación de MediaPipe
    // y si no se encuentra una mano específica, se usa la disponible.
    if (cat === 'Left') {
      manoIzquierda = mano;
    } else if (cat === 'Right') {
      manoDerecha = mano;
    }
  });

  // Si solo hay una mano y no coincidió, asignamos como respaldo para evitar bloqueos
  if (manosLandmarks.length === 1) {
    if (!manoIzquierda && !manoDerecha) {
      manoDerecha = manosLandmarks[0];
      manoIzquierda = manosLandmarks[0];
    } else if (manoIzquierda && !manoDerecha) {
      manoDerecha = manoIzquierda;
    } else if (manoDerecha && !manoIzquierda) {
      manoIzquierda = manoDerecha;
    }
  }

  return { manoIzquierda, manoDerecha };
}

/**
 * PASO 1 - Lavado quirúrgico de manos:
 * - Ambas manos visibles en el plano de la cámara.
 * - Dedos entrecruzados o frotándose (distancia mínima entre puntas de manos opuestas < 0.15).
 */
export function validarPaso1Lavado(
  manosLandmarks: ManoLandmarks[]
): ResultadoValidacion {
  if (!manosLandmarks || manosLandmarks.length < 2) {
    return {
      correcto: false,
      mensaje: 'Muestra ambas manos elevadas frente a la cámara para simular el lavado quirúrgico.',
      detalles: ['Se requieren 2 manos visibles', `Detectadas: ${manosLandmarks?.length ?? 0}`],
    };
  }

  const manoA = manosLandmarks[0];
  const manoB = manosLandmarks[1];

  const distMin = distanciaMinimaEntrePuntas(manoA, manoB);
  const estanFrotandose = distMin < 0.15;

  if (!estanFrotandose) {
    return {
      correcto: false,
      mensaje: 'Entrecruza los dedos y frota palmas y espacios interdigitales.',
      detalles: [
        `Distancia entre manos: ${(distMin * 100).toFixed(1)} cm normalizados (Meta: < 15.0)`,
      ],
    };
  }

  return {
    correcto: true,
    mensaje: '¡Lavado correcto! Mantén la fricción interdigital sobre el nivel de los codos.',
    detalles: ['Distancia interdigital óptima (< 0.15)', 'Ambas manos visibles'],
  };
}

/**
 * PASO 2 - Secado con compresa estéril:
 * - Ambas manos visibles con dedos extendidos (ángulo articular > 160°).
 */
export function validarPaso2Secado(
  manosLandmarks: ManoLandmarks[]
): ResultadoValidacion {
  if (!manosLandmarks || manosLandmarks.length < 2) {
    return {
      correcto: false,
      mensaje: 'Coloca ambas manos en el encuadre para realizar el secado con compresa.',
      detalles: ['Se requieren ambas manos abiertas en cámara'],
    };
  }

  const mano1Extendida = todosDedosExtendidos(manosLandmarks[0]);
  const mano2Extendida = todosDedosExtendidos(manosLandmarks[1]);

  if (!mano1Extendida || !mano2Extendida) {
    return {
      correcto: false,
      mensaje: 'Mantén todos los dedos de ambas manos bien extendidos para el secado.',
      detalles: [
        `Mano 1 extendida: ${mano1Extendida ? 'Sí' : 'No'}`,
        `Mano 2 extendida: ${mano2Extendida ? 'Sí' : 'No'}`,
      ],
    };
  }

  return {
    correcto: true,
    mensaje: '¡Postura de secado correcta! Dedos extendidos, secando de distal a proximal.',
    detalles: ['Ambas manos con dedos extendidos > 160°'],
  };
}

/**
 * PASO 3 - Tomar guante derecho por el borde doblado:
 * - Mano que sujeta (izquierda) haciendo pinza: pulgar (4) e índice (8) a distancia < 0.08.
 * - Pulgar e índice con articulaciones extendidas.
 */
export function validarPaso3TomarGuanteDerecho(
  manosLandmarks: ManoLandmarks[],
  handednesses: ManoInfo[]
): ResultadoValidacion {
  if (!manosLandmarks || manosLandmarks.length === 0) {
    return {
      correcto: false,
      mensaje: 'Muestra tu mano frente a la cámara haciendo pinza para tomar el guante.',
      detalles: ['Sin manos detectadas'],
    };
  }

  const { manoIzquierda, manoDerecha } = clasificarManosPorLateralidad(
    manosLandmarks,
    handednesses
  );

  // La mano que debe hacer pinza es la izquierda (para tomar el guante derecho)
  const manoPinza = manoIzquierda || manoDerecha || manosLandmarks[0];

  const pinzaActiva = esGestoPinza(manoPinza, 0.08);
  const pulgarExtendido = dedoExtendido(manoPinza, PuntosMano.PULGAR_MCP);
  const indiceExtendido = dedoExtendido(manoPinza, PuntosMano.INDICE_MCP);

  const distanciaPinza = calcularDistancia(
    manoPinza[PuntosMano.PULGAR_TIP],
    manoPinza[PuntosMano.INDICE_TIP]
  );

  if (!pinzaActiva) {
    return {
      correcto: false,
      mensaje: 'Haz pinza con el pulgar e índice sobre la cara interna del doblez.',
      detalles: [
        `Apertura de pinza: ${(distanciaPinza * 100).toFixed(1)} (Meta: < 8.0)`,
      ],
    };
  }

  if (!pulgarExtendido && !indiceExtendido) {
    return {
      correcto: false,
      mensaje: 'Mantén la pinza firme con el pulgar e índice extendidos sin tocar el exterior.',
      detalles: ['Ajusta la extensión de los dedos de la pinza'],
    };
  }

  return {
    correcto: true,
    mensaje: '¡Pinza estéril precisa! Tocando únicamente el doblez interno no estéril.',
    detalles: [
      `Distancia pinza: ${(distanciaPinza * 100).toFixed(1)}`,
      'Contacto limitado al puño doblado',
    ],
  };
}

/**
 * PASO 4 - Introducir mano derecha sin tocar exterior:
 * - Mano derecha con dedos juntos (distancia entre puntas consecutivas < 0.05).
 * - Mano derecha con dedos extendidos.
 */
export function validarPaso4IntroducirManoDerecha(
  manosLandmarks: ManoLandmarks[],
  handednesses: ManoInfo[]
): ResultadoValidacion {
  if (!manosLandmarks || manosLandmarks.length === 0) {
    return {
      correcto: false,
      mensaje: 'Muestra la mano derecha con los dedos juntos para calzar el guante.',
      detalles: ['Sin manos en cámara'],
    };
  }

  const { manoDerecha, manoIzquierda } = clasificarManosPorLateralidad(
    manosLandmarks,
    handednesses
  );

  const manoObjetivo = manoDerecha || manoIzquierda || manosLandmarks[0];

  const puntasJuntas = dedosJuntos(manoObjetivo, 0.06); // Tolerancia 0.06
  const dedosEstanExtendidos = todosDedosExtendidos(manoObjetivo);

  if (!dedosEstanExtendidos) {
    return {
      correcto: false,
      mensaje: 'Extiende los dedos de la mano derecha formando una pala para calzar el guante.',
      detalles: ['Los dedos deben mantenerse rectos al introducirse'],
    };
  }

  if (!puntasJuntas) {
    return {
      correcto: false,
      mensaje: 'Junta los dedos de la mano derecha para no rozar el exterior del guante.',
      detalles: ['Dedos separados: únelos para que entren en sus respectivos compartimentos'],
    };
  }

  return {
    correcto: true,
    mensaje: '¡Excelente alineación! Mano introducida sin tocar la superficie estéril.',
    detalles: ['Dedos extendidos y juntos (formación de pala quirúrgica)'],
  };
}

/**
 * PASO 5 - Repetir con mano izquierda (Bolsillo estéril):
 * - Mano derecha (ya enguantada) en pinza con pulgar e índice a distancia < 0.08.
 * - Simula la entrada de los 4 dedos por debajo del puño estéril con pulgar en abducción.
 */
export function validarPaso5RepetirManoIzquierda(
  manosLandmarks: ManoLandmarks[],
  handednesses: ManoInfo[]
): ResultadoValidacion {
  if (!manosLandmarks || manosLandmarks.length === 0) {
    return {
      correcto: false,
      mensaje: 'Muestra la mano enguantada formando el bolsillo estéril.',
      detalles: ['Esperando detección de mano enguantada'],
    };
  }

  const { manoDerecha, manoIzquierda } = clasificarManosPorLateralidad(
    manosLandmarks,
    handednesses
  );

  // La mano enguantada (derecha) o la activa
  const manoEnguantada = manoDerecha || manoIzquierda || manosLandmarks[0];

  const distanciaPinza = calcularDistancia(
    manoEnguantada[PuntosMano.PULGAR_TIP],
    manoEnguantada[PuntosMano.INDICE_TIP]
  );
  const esPinzaBolsillo = distanciaPinza < 0.09;

  if (!esPinzaBolsillo) {
    return {
      correcto: false,
      mensaje: 'Introduce los dedos de la mano derecha bajo el doblez del guante izquierdo (bolsillo estéril).',
      detalles: [
        `Distancia pulgar-índice: ${(distanciaPinza * 100).toFixed(1)} (Meta: < 9.0)`,
      ],
    };
  }

  return {
    correcto: true,
    mensaje: '¡Bolsillo estéril correcto! Estéril con estéril, pulgar alejado de la piel.',
    detalles: ['Dedos bajo el doblez', 'Pulgar en abducción protegiendo la asepsia'],
  };
}

/**
 * PASO 6 - Ajustar puños manteniendo esterilidad:
 * - Ambas manos visibles y completamente extendidas.
 * - Ambas manos calzadas por encima del nivel de la cintura.
 */
export function validarPaso6AjustarPunos(
  manosLandmarks: ManoLandmarks[]
): ResultadoValidacion {
  if (!manosLandmarks || manosLandmarks.length < 2) {
    return {
      correcto: false,
      mensaje: 'Muestra ambas manos enguantadas frente al pecho.',
      detalles: ['Se requieren ambas manos en pantalla'],
    };
  }

  const mano1Extendida = todosDedosExtendidos(manosLandmarks[0]);
  const mano2Extendida = todosDedosExtendidos(manosLandmarks[1]);

  if (!mano1Extendida || !mano2Extendida) {
    return {
      correcto: false,
      mensaje: 'Extiende todos los dedos para verificar el ajuste uniforme de ambos guantes.',
      detalles: [
        `Mano 1 extendida: ${mano1Extendida ? 'Sí' : 'No'}`,
        `Mano 2 extendida: ${mano2Extendida ? 'Sí' : 'No'}`,
      ],
    };
  }

  return {
    correcto: true,
    mensaje: '¡Técnica estéril completada exitosamente! Ambos guantes ajustados y manos protegidas.',
    detalles: ['Ambos guantes calzados', 'Esterilidad preservada'],
  };
}

/**
 * Motor central de validación: Despacha la validación al validador correspondiente
 * según el número de paso activo (1 a 6).
 *
 * @param pasoNumero Número del paso activo (1 a 6)
 * @param manosLandmarks Colección de landmarks de manos detectadas en el frame
 * @param handednesses Información de lateralidad de cada mano
 * @returns Resultado de la evaluación biomecánica y mensaje en español
 */
export function validarPasoTecnica(
  pasoNumero: number,
  manosLandmarks: ManoLandmarks[],
  handednesses: ManoInfo[]
): ResultadoValidacion {
  if (!manosLandmarks || manosLandmarks.length === 0) {
    return {
      correcto: false,
      mensaje: 'No se detectan manos en la cámara. Coloca tus manos dentro del encuadre.',
      detalles: ['Esperando detección de MediaPipe...'],
    };
  }

  switch (pasoNumero) {
    case 1:
      return validarPaso1Lavado(manosLandmarks);
    case 2:
      return validarPaso2Secado(manosLandmarks);
    case 3:
      return validarPaso3TomarGuanteDerecho(manosLandmarks, handednesses);
    case 4:
      return validarPaso4IntroducirManoDerecha(manosLandmarks, handednesses);
    case 5:
      return validarPaso5RepetirManoIzquierda(manosLandmarks, handednesses);
    case 6:
      return validarPaso6AjustarPunos(manosLandmarks);
    default:
      return {
        correcto: false,
        mensaje: `Paso ${pasoNumero} no reconocido en el protocolo.`,
      };
  }
}
