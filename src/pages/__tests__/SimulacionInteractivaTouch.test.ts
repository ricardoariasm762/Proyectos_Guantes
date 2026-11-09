// Tests unitarios para la interacción táctil Tap-to-Place y máquina de estados de Simulación Interactiva
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ESTADO_INICIAL_SIMULACION,
  seleccionarInsumoTactil,
  ejecutarTapToPlace,
  procesarColocacion,
  esInsumoBloqueado,
  type EstadoSimulacionInteractiva,
} from '../../utils/simulacionInteractivaLogic';

describe('SimulacionInteractiva - Interacción Táctil y Tap-to-Place', () => {
  let estado: EstadoSimulacionInteractiva;

  beforeEach(() => {
    estado = { ...ESTADO_INICIAL_SIMULACION };
  });

  describe('1. Selección Táctil de Insumos (Tap-to-Select)', () => {
    it('debe seleccionar un insumo disponible al tocarlo (ej. guante derecho en fase 1)', () => {
      expect(estado.insumoSeleccionadoId).toBeNull();

      estado = seleccionarInsumoTactil(estado, 'draggable-guante-derecho');
      expect(estado.insumoSeleccionadoId).toBe('draggable-guante-derecho');
    });

    it('debe deseleccionar el insumo si se toca por segunda vez consecutiva (toggle)', () => {
      estado = seleccionarInsumoTactil(estado, 'draggable-guante-derecho');
      expect(estado.insumoSeleccionadoId).toBe('draggable-guante-derecho');

      estado = seleccionarInsumoTactil(estado, 'draggable-guante-derecho');
      expect(estado.insumoSeleccionadoId).toBeNull();
    });

    it('no debe permitir seleccionar insumos bloqueados clínicamente', () => {
      // En Fase 1 el guante izquierdo y el ajuste de puños están bloqueados
      expect(esInsumoBloqueado(estado, 'draggable-guante-izquierdo')).toBe(true);
      expect(esInsumoBloqueado(estado, 'draggable-ajuste-punos')).toBe(true);

      const estadoSinCambios = seleccionarInsumoTactil(estado, 'draggable-guante-izquierdo');
      expect(estadoSinCambios.insumoSeleccionadoId).toBeNull();

      const estadoSinCambios2 = seleccionarInsumoTactil(estado, 'draggable-ajuste-punos');
      expect(estadoSinCambios2.insumoSeleccionadoId).toBeNull();
    });
  });

  describe('2. Colocación Táctil (Tap-to-Place) y Transición de Fases', () => {
    it('debe calzar el guante derecho en la mano derecha receptora y avanzar a Fase 2', () => {
      // 1. Tocar para seleccionar guante derecho
      estado = seleccionarInsumoTactil(estado, 'draggable-guante-derecho');
      expect(estado.insumoSeleccionadoId).toBe('draggable-guante-derecho');

      // 2. Tocar zona objetivo mano derecha
      estado = ejecutarTapToPlace(estado, 'droppable-mano-derecha');

      expect(estado.manoDerechaCalzada).toBe(true);
      expect(estado.faseActual).toBe(2);
      expect(estado.errores).toBe(0);
      expect(estado.alertaEsError).toBe(false);
      expect(estado.insumoSeleccionadoId).toBeNull();
      expect(estado.mensajeAlerta).toContain('Mano derecha calzada');
    });

    it('en Fase 2 debe permitir seleccionar el guante izquierdo y calzarlo en la mano izquierda receptora', () => {
      // Avanzar a fase 2
      estado.faseActual = 2;
      estado.manoDerechaCalzada = true;

      // El guante derecho ahora está bloqueado y el izquierdo disponible
      expect(esInsumoBloqueado(estado, 'draggable-guante-derecho')).toBe(true);
      expect(esInsumoBloqueado(estado, 'draggable-guante-izquierdo')).toBe(false);

      // Seleccionar guante izquierdo
      estado = seleccionarInsumoTactil(estado, 'draggable-guante-izquierdo');
      expect(estado.insumoSeleccionadoId).toBe('draggable-guante-izquierdo');

      // Colocar en mano izquierda
      estado = ejecutarTapToPlace(estado, 'droppable-mano-izquierda');

      expect(estado.manoIzquierdaCalzada).toBe(true);
      expect(estado.faseActual).toBe(3);
      expect(estado.errores).toBe(0);
      expect(estado.alertaEsError).toBe(false);
      expect(estado.insumoSeleccionadoId).toBeNull();
      expect(estado.mensajeAlerta).toContain('Mano izquierda calzada');
    });

    it('en Fase 3 debe permitir ajustar puños en la zona segura estéril central y finalizar la simulación', () => {
      // Avanzar a fase 3
      estado.faseActual = 3;
      estado.manoDerechaCalzada = true;
      estado.manoIzquierdaCalzada = true;

      expect(esInsumoBloqueado(estado, 'draggable-ajuste-punos')).toBe(false);

      // Seleccionar ajuste de puños
      estado = seleccionarInsumoTactil(estado, 'draggable-ajuste-punos');
      expect(estado.insumoSeleccionadoId).toBe('draggable-ajuste-punos');

      // Colocar en campo estéril central
      estado = ejecutarTapToPlace(estado, 'droppable-campo-esteril-central');

      expect(estado.punosAjustados).toBe(true);
      expect(estado.simulacionFinalizada).toBe(true);
      expect(estado.alertaEsError).toBe(false);
      expect(estado.insumoSeleccionadoId).toBeNull();
    });

    it('no debe ejecutar ninguna colocación si no hay ningún insumo seleccionado', () => {
      expect(estado.insumoSeleccionadoId).toBeNull();

      const estadoSinEfecto = ejecutarTapToPlace(estado, 'droppable-mano-derecha');
      expect(estadoSinEfecto).toEqual(estado);
    });
  });

  describe('3. Detección de Faltas Asépticas y Contaminación por Toque', () => {
    it('debe incrementar el conteo de errores al tocar una zona contaminada con un insumo seleccionado', () => {
      estado = seleccionarInsumoTactil(estado, 'draggable-guante-derecho');
      expect(estado.insumoSeleccionadoId).toBe('draggable-guante-derecho');

      // Tocar zona contaminada
      estado = ejecutarTapToPlace(estado, 'droppable-zona-contaminada');

      expect(estado.errores).toBe(1);
      expect(estado.alertaEsError).toBe(true);
      expect(estado.mensajeAlerta).toContain('CONTAMINACIÓN INMEDIATA');
      expect(estado.insumoSeleccionadoId).toBeNull();
      expect(estado.manoDerechaCalzada).toBe(false);
    });

    it('debe registrar error si el insumo toca el suelo quirúrgico', () => {
      estado = seleccionarInsumoTactil(estado, 'draggable-guante-derecho');
      estado = ejecutarTapToPlace(estado, 'droppable-suelo-quirurgico');

      expect(estado.errores).toBe(1);
      expect(estado.alertaEsError).toBe(true);
      expect(estado.mensajeAlerta).toContain('CONTAMINACIÓN INMEDIATA');
    });

    it('debe incrementar error al intentar calzar el guante derecho en la mano izquierda en Fase 1', () => {
      estado = seleccionarInsumoTactil(estado, 'draggable-guante-derecho');
      estado = ejecutarTapToPlace(estado, 'droppable-mano-izquierda');

      expect(estado.errores).toBe(1);
      expect(estado.alertaEsError).toBe(true);
      expect(estado.mensajeAlerta).toContain('Intentas calzar el guante derecho en la mano izquierda');
      expect(estado.manoDerechaCalzada).toBe(false);
    });

    it('debe mantener paridad exacta entre colocación por Drag & Drop y colocación Tap-to-Place', () => {
      // Mismo comportamiento con procesarColocacion directo (Drag & Drop)
      const resDnd = procesarColocacion(estado, 'draggable-guante-derecho', 'droppable-mano-derecha');

      // Comportamiento con tap to place
      const resTap = ejecutarTapToPlace(
        seleccionarInsumoTactil(estado, 'draggable-guante-derecho'),
        'droppable-mano-derecha'
      );

      expect(resDnd).toEqual(resTap);
    });
  });
});
