// Store para el estado de la práctica activa (en memoria)
// Universidad Cooperativa de Colombia - Campus Pasto

import { create } from 'zustand';

interface PracticaState {
  pasoActual: number;
  pasosCompletados: number[];
  tiempoInicio: number | null;
  errores: number;
  detallesErrores: string[];
  enCurso: boolean;

  iniciarPractica: () => void;
  completarPaso: (num: number) => void;
  registrarError: (motivo?: string) => void;
  finalizarPractica: () => { tiempoSegundos: number; puntaje: number };
  reiniciarPractica: () => void;
  irAPaso: (paso: number) => void;
}

export const usePracticaStore = create<PracticaState>((set, get) => ({
  pasoActual: 1,
  pasosCompletados: [],
  tiempoInicio: null,
  errores: 0,
  detallesErrores: [],
  enCurso: false,

  iniciarPractica: () => {
    set({
      pasoActual: 1,
      pasosCompletados: [],
      tiempoInicio: Date.now(),
      errores: 0,
      detallesErrores: [],
      enCurso: true,
    });
  },

  completarPaso: (num) => {
    set((state) => {
      const yaCompletado = state.pasosCompletados.includes(num);
      const nuevosCompletados = yaCompletado ? state.pasosCompletados : [...state.pasosCompletados, num];
      const siguientePaso = num < 6 ? num + 1 : 6;
      return {
        pasosCompletados: nuevosCompletados,
        pasoActual: siguientePaso,
      };
    });
  },

  registrarError: (motivo = 'Violación de asepsia') => {
    set((state) => ({
      errores: state.errores + 1,
      detallesErrores: [...state.detallesErrores, motivo],
    }));
  },

  finalizarPractica: () => {
    const { tiempoInicio, errores, pasosCompletados } = get();
    const tiempoFinal = Date.now();
    const tiempoSegundos = tiempoInicio ? Math.max(1, Math.round((tiempoFinal - tiempoInicio) / 1000)) : 60;

    // Cálculo de puntaje: base 100, penaliza 10 pts por error y premia pasos completados
    const penalizacionErrores = errores * 10;
    const ponderacionPasos = (pasosCompletados.length / 6) * 100;
    const puntajeBruto = Math.round(ponderacionPasos - penalizacionErrores);
    const puntaje = Math.max(0, Math.min(100, puntajeBruto));

    set({ enCurso: false });
    return { tiempoSegundos, puntaje };
  },

  reiniciarPractica: () => {
    set({
      pasoActual: 1,
      pasosCompletados: [],
      tiempoInicio: null,
      errores: 0,
      detallesErrores: [],
      enCurso: false,
    });
  },

  irAPaso: (paso) => {
    if (paso >= 1 && paso <= 6) {
      set({ pasoActual: paso });
    }
  },
}));
