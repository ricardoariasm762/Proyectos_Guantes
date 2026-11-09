// Lógica y máquina de estados para la simulación interactiva háptica y táctil
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

export interface EstadoSimulacionInteractiva {
  faseActual: 1 | 2 | 3;
  manoDerechaCalzada: boolean;
  manoIzquierdaCalzada: boolean;
  punosAjustados: boolean;
  insumoSeleccionadoId: string | null;
  errores: number;
  mensajeAlerta: string | null;
  alertaEsError: boolean;
  simulacionFinalizada: boolean;
}

export const ESTADO_INICIAL_SIMULACION: EstadoSimulacionInteractiva = {
  faseActual: 1,
  manoDerechaCalzada: false,
  manoIzquierdaCalzada: false,
  punosAjustados: false,
  insumoSeleccionadoId: null,
  errores: 0,
  mensajeAlerta: null,
  alertaEsError: false,
  simulacionFinalizada: false,
};

/**
 * Determina si un insumo estéril está bloqueado según la fase clínica actual.
 */
export const esInsumoBloqueado = (
  estado: Pick<EstadoSimulacionInteractiva, 'faseActual' | 'manoDerechaCalzada' | 'manoIzquierdaCalzada' | 'punosAjustados'>,
  insumoId: string
): boolean => {
  switch (insumoId) {
    case 'draggable-guante-derecho':
      return estado.manoDerechaCalzada;
    case 'draggable-guante-izquierdo':
      return !estado.manoDerechaCalzada || estado.manoIzquierdaCalzada;
    case 'draggable-ajuste-punos':
      return !estado.manoDerechaCalzada || !estado.manoIzquierdaCalzada || estado.punosAjustados;
    default:
      return true;
  }
};

/**
 * Gestiona la selección táctil (Tap-to-Place) alternando entre seleccionar y deseleccionar.
 * Si el insumo está bloqueado clínicamente, no permite la selección.
 */
export const seleccionarInsumoTactil = (
  estado: EstadoSimulacionInteractiva,
  insumoId: string
): EstadoSimulacionInteractiva => {
  if (esInsumoBloqueado(estado, insumoId)) {
    return estado;
  }

  const nuevaSeleccion = estado.insumoSeleccionadoId === insumoId ? null : insumoId;
  return {
    ...estado,
    insumoSeleccionadoId: nuevaSeleccion,
  };
};

/**
 * Ejecuta la colocación o interacción entre un insumo y una zona de destino.
 * Valida reglas de asepsia, concordancia anatómica y avance de fases.
 */
export const procesarColocacion = (
  estado: EstadoSimulacionInteractiva,
  arrastradoId: string,
  destinoId: string
): EstadoSimulacionInteractiva => {
  // 1. Detección de contacto con zonas contaminadas
  if (destinoId === 'droppable-zona-contaminada' || destinoId === 'droppable-suelo-quirurgico') {
    return {
      ...estado,
      errores: estado.errores + 1,
      alertaEsError: true,
      mensajeAlerta:
        '¡CONTAMINACIÓN INMEDIATA! El insumo tocó una superficie no estéril. En quirófano real, este guante debe desecharse.',
      insumoSeleccionadoId: null,
    };
  }

  // 2. Lógica para Fase 1: Calzar Guante Derecho
  if (estado.faseActual === 1) {
    if (arrastradoId === 'draggable-guante-derecho') {
      if (destinoId === 'droppable-mano-derecha') {
        return {
          ...estado,
          faseActual: 2,
          manoDerechaCalzada: true,
          alertaEsError: false,
          mensajeAlerta: '¡Excelente! Mano derecha calzada tomando únicamente el borde doblado.',
          insumoSeleccionadoId: null,
        };
      } else if (destinoId === 'droppable-mano-izquierda') {
        return {
          ...estado,
          errores: estado.errores + 1,
          alertaEsError: true,
          mensajeAlerta: 'Error: Intentas calzar el guante derecho en la mano izquierda.',
          insumoSeleccionadoId: null,
        };
      }
    } else {
      return {
        ...estado,
        errores: estado.errores + 1,
        alertaEsError: true,
        mensajeAlerta: 'Debes comenzar tomando el guante de tu mano dominante (derecho).',
        insumoSeleccionadoId: null,
      };
    }
  }

  // 3. Lógica para Fase 2: Calzar Guante Izquierdo
  else if (estado.faseActual === 2) {
    if (arrastradoId === 'draggable-guante-izquierdo') {
      if (destinoId === 'droppable-mano-izquierda') {
        return {
          ...estado,
          faseActual: 3,
          manoIzquierdaCalzada: true,
          alertaEsError: false,
          mensajeAlerta: '¡Perfecto! Mano izquierda calzada con técnica de bolsillo estéril.',
          insumoSeleccionadoId: null,
        };
      } else {
        return {
          ...estado,
          errores: estado.errores + 1,
          alertaEsError: true,
          mensajeAlerta: 'El guante izquierdo debe calzarse en la mano izquierda receptora.',
          insumoSeleccionadoId: null,
        };
      }
    }
  }

  // 4. Lógica para Fase 3: Ajuste de Puños
  else if (estado.faseActual === 3) {
    if (arrastradoId === 'draggable-ajuste-punos') {
      if (destinoId === 'droppable-campo-esteril-central') {
        return {
          ...estado,
          punosAjustados: true,
          simulacionFinalizada: true,
          alertaEsError: false,
          insumoSeleccionadoId: null,
        };
      } else {
        return {
          ...estado,
          errores: estado.errores + 1,
          alertaEsError: true,
          mensajeAlerta: 'El ajuste de puños debe hacerse en la zona segura estéril sin tocar piel.',
          insumoSeleccionadoId: null,
        };
      }
    }
  }

  return estado;
};

/**
 * Ejecuta la acción táctil de colocar el insumo previamente seleccionado en la zona tocada.
 */
export const ejecutarTapToPlace = (
  estado: EstadoSimulacionInteractiva,
  destinoId: string
): EstadoSimulacionInteractiva => {
  if (!estado.insumoSeleccionadoId) {
    return estado;
  }
  return procesarColocacion(estado, estado.insumoSeleccionadoId, destinoId);
};
