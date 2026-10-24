// Store Zustand para el estado de la práctica activa y acumulación de metadatos de IA
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { create } from 'zustand';
import type { DetallePasoIA, FuentePrediccion } from '../types';

/** Ventana máxima de validaciones conservadas (~20 s a 20 Hz) para acotar memoria. */
export const MAX_REGISTROS_IA = 400;

export interface PracticaState {
  pasoActual: number;
  pasosCompletados: number[];
  tiempoInicio: number | null;
  errores: number;
  detallesErrores: string[];
  enCurso: boolean;

  // Metadatos de IA acumulados durante el intento
  detallePasosIA: DetallePasoIA[];
  confianzas: number[];
  fuenteDominante: FuentePrediccion | null;
  versionModeloActiva: string | null;

  // Acciones
  iniciarPractica: (versionModelo?: string) => void;
  registrarValidacion: (detalle: DetallePasoIA) => void;
  registrarError: (motivo?: string) => void;
  completarPaso: (num: number) => void;
  avanzarPaso: () => void;
  finalizarPractica: () => { tiempoSegundos: number; puntaje: number };
  resetear: () => void;
  reiniciarPractica: () => void;
  irAPaso: (paso: number) => void;

  // Métodos de cálculo de telemetría de IA
  calcularConfianzaPromedio: () => number;
  calcularFuenteDominante: () => FuentePrediccion;
  generarDetalleIA: () => string;
}

export const usePracticaStore = create<PracticaState>((set, get) => ({
  pasoActual: 1,
  pasosCompletados: [],
  tiempoInicio: null,
  errores: 0,
  detallesErrores: [],
  enCurso: false,
  detallePasosIA: [],
  confianzas: [],
  fuenteDominante: null,
  versionModeloActiva: null,

  iniciarPractica: (versionModelo) => {
    const version = versionModelo || localStorage.getItem('versionModeloActiva') || 'v1.0';
    set({
      pasoActual: 1,
      pasosCompletados: [],
      tiempoInicio: Date.now(),
      errores: 0,
      detallesErrores: [],
      enCurso: true,
      detallePasosIA: [],
      confianzas: [],
      fuenteDominante: null,
      versionModeloActiva: version,
    });
  },

  registrarValidacion: (detalle) =>
    set((state) => ({
      detallePasosIA: [...state.detallePasosIA, detalle].slice(-MAX_REGISTROS_IA),
      confianzas: [...state.confianzas, detalle.confianza].slice(-MAX_REGISTROS_IA),
    })),

  registrarError: (motivo = 'Violación de asepsia o técnica incorrecta') =>
    set((state) => ({
      errores: state.errores + 1,
      detallesErrores: [...state.detallesErrores, motivo],
    })),

  completarPaso: (num) =>
    set((state) => {
      const yaCompletado = state.pasosCompletados.includes(num);
      const nuevosCompletados = yaCompletado
        ? state.pasosCompletados
        : [...state.pasosCompletados, num];
      const siguientePaso = num < 6 ? num + 1 : 6;
      return {
        pasosCompletados: nuevosCompletados,
        pasoActual: siguientePaso,
      };
    }),

  avanzarPaso: () =>
    set((state) => ({
      pasoActual: state.pasoActual < 6 ? state.pasoActual + 1 : 6,
      pasosCompletados: state.pasosCompletados.includes(state.pasoActual)
        ? state.pasosCompletados
        : [...state.pasosCompletados, state.pasoActual],
    })),

  finalizarPractica: () => {
    const { tiempoInicio, errores, pasosCompletados } = get();
    const tiempoFinal = Date.now();
    const tiempoSegundos = tiempoInicio ? Math.max(1, Math.round((tiempoFinal - tiempoInicio) / 1000)) : 0;
    const penalizacionErrores = errores * 10;
    const ponderacionPasos = (pasosCompletados.length / 6) * 100;
    const puntajeBruto = Math.round(ponderacionPasos - penalizacionErrores);
    const puntaje = Math.max(0, Math.min(100, puntajeBruto));

    set({ tiempoInicio: null, enCurso: false });
    return { tiempoSegundos, puntaje };
  },

  resetear: () =>
    set({
      pasoActual: 1,
      pasosCompletados: [],
      tiempoInicio: null,
      errores: 0,
      detallesErrores: [],
      enCurso: false,
      detallePasosIA: [],
      confianzas: [],
      fuenteDominante: null,
      versionModeloActiva: null,
    }),

  reiniciarPractica: () => get().resetear(),

  irAPaso: (paso) => {
    if (paso >= 1 && paso <= 6) {
      set({ pasoActual: paso });
    }
  },

  calcularConfianzaPromedio: () => {
    const { confianzas } = get();
    if (confianzas.length === 0) return 0;
    const suma = confianzas.reduce((a, b) => a + b, 0);
    return Number((suma / confianzas.length).toFixed(4));
  },

  calcularFuenteDominante: () => {
    const { detallePasosIA } = get();
    if (detallePasosIA.length === 0) return 'REGLAS';

    const conteos: Record<FuentePrediccion, number> = {
      IA: 0,
      REGLAS: 0,
      CONSENSO: 0,
      MIXTO: 0,
    };

    detallePasosIA.forEach((d) => {
      if (conteos[d.fuente] !== undefined) {
        conteos[d.fuente]++;
      }
    });

    const dominante = Object.entries(conteos).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0] as FuentePrediccion;

    return dominante || 'CONSENSO';
  },

  generarDetalleIA: () => {
    const { detallePasosIA, versionModeloActiva } = get();
    let pasosAIncluir = detallePasosIA;

    let payload = {
      pasos: pasosAIncluir,
      confianzaPromedio: get().calcularConfianzaPromedio(),
      fuenteDominante: get().calcularFuenteDominante(),
      versionModelo: versionModeloActiva || 'desconocida',
    };

    let jsonString = JSON.stringify(payload);

    // Salvaguarda: Reducir el tamaño del JSON si excede 10KB (~10,000 bytes)
    if (jsonString.length > 10000) {
      pasosAIncluir = pasosAIncluir.slice(-30);
      payload = {
        pasos: pasosAIncluir,
        confianzaPromedio: get().calcularConfianzaPromedio(),
        fuenteDominante: get().calcularFuenteDominante(),
        versionModelo: versionModeloActiva || 'desconocida',
      };
      jsonString = JSON.stringify(payload);
    }

    return jsonString;
  },
}));
