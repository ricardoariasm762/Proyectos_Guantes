// Tests unitarios para el store usePracticaStore (Manejo de estados y telemetría de IA)
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { describe, it, expect, beforeEach } from 'vitest';
import { usePracticaStore } from '../usePracticaStore';
import type { DetallePasoIA } from '../../types';

describe('usePracticaStore - Telemetría y Máquina de Estados de IA', () => {
  beforeEach(() => {
    usePracticaStore.getState().resetear();
  });

  it('debe iniciar la práctica con la versión de modelo especificada y valores iniciales limpios', () => {
    const store = usePracticaStore.getState();
    store.iniciarPractica('v1.0-2026-10');

    const state = usePracticaStore.getState();
    expect(state.pasoActual).toBe(1);
    expect(state.pasosCompletados).toEqual([]);
    expect(state.errores).toBe(0);
    expect(state.detallePasosIA).toEqual([]);
    expect(state.confianzas).toEqual([]);
    expect(state.versionModeloActiva).toBe('v1.0-2026-10');
    expect(state.enCurso).toBe(true);
  });

  it('debe registrar validaciones clínicas y acumular niveles de confianza', () => {
    const store = usePracticaStore.getState();
    store.iniciarPractica('v1.0-test');

    const validacion1: DetallePasoIA = {
      numero: 1,
      correcto: true,
      confianza: 0.92,
      fuente: 'IA',
      mensaje: 'Lavado correcto',
    };

    const validacion2: DetallePasoIA = {
      numero: 1,
      correcto: true,
      confianza: 0.88,
      fuente: 'CONSENSO',
      mensaje: 'Postura confirmada',
    };

    store.registrarValidacion(validacion1);
    store.registrarValidacion(validacion2);

    const state = usePracticaStore.getState();
    expect(state.detallePasosIA).toHaveLength(2);
    expect(state.confianzas).toEqual([0.92, 0.88]);
    expect(state.calcularConfianzaPromedio()).toBe(0.9);
  });

  it('debe calcular correctamente la fuente dominante', () => {
    const store = usePracticaStore.getState();
    store.iniciarPractica('v1.0');

    store.registrarValidacion({
      numero: 1,
      correcto: true,
      confianza: 0.9,
      fuente: 'IA',
      mensaje: 'Paso 1',
    });
    store.registrarValidacion({
      numero: 2,
      correcto: true,
      confianza: 0.85,
      fuente: 'CONSENSO',
      mensaje: 'Paso 2',
    });
    store.registrarValidacion({
      numero: 3,
      correcto: true,
      confianza: 0.95,
      fuente: 'CONSENSO',
      mensaje: 'Paso 3',
    });

    expect(store.calcularFuenteDominante()).toBe('CONSENSO');
  });

  it('debe generar el JSON de detalleIA con estructura válida y serializable', () => {
    const store = usePracticaStore.getState();
    store.iniciarPractica('v1.0-produccion');

    store.registrarValidacion({
      numero: 1,
      correcto: true,
      confianza: 0.96,
      fuente: 'CONSENSO',
      mensaje: 'Paso 1 verificado',
    });

    const jsonDetalle = store.generarDetalleIA();
    expect(typeof jsonDetalle).toBe('string');

    const parseado = JSON.parse(jsonDetalle);
    expect(parseado.versionModelo).toBe('v1.0-produccion');
    expect(parseado.confianzaPromedio).toBe(0.96);
    expect(parseado.fuenteDominante).toBe('CONSENSO');
    expect(parseado.pasos).toHaveLength(1);
    expect(parseado.pasos[0].numero).toBe(1);
  });

  it('debe controlar el avance de pasos y acumulación de errores', () => {
    const store = usePracticaStore.getState();
    store.iniciarPractica('v1.0');

    store.avanzarPaso();
    expect(usePracticaStore.getState().pasoActual).toBe(2);
    expect(usePracticaStore.getState().pasosCompletados).toEqual([1]);

    store.registrarError('Contaminación de borde');
    expect(usePracticaStore.getState().errores).toBe(1);
  });
});
