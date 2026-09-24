// Store de progreso e historial de prácticas del estudiante
// Universidad Cooperativa de Colombia - Campus Pasto

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IntentoPractica } from '../types';

interface ProgresoState {
  intentos: IntentoPractica[];
  agregarIntento: (intento: Omit<IntentoPractica, 'id' | 'fecha'>) => IntentoPractica;
  eliminarIntento: (id: string) => void;
  reiniciarProgreso: () => void;
  // Getters / Selectores
  totalIntentos: () => number;
  promedioPuntaje: () => number;
  mejorTiempo: () => number;
  rachaActual: () => number;
  tiempoTotalSegundos: () => number;
}

export const useProgresoStore = create<ProgresoState>()(
  persist(
    (set, get) => ({
      intentos: [],

      agregarIntento: (datos) => {
        const nuevoIntento: IntentoPractica = {
          ...datos,
          id: `intento_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fecha: new Date().toISOString(),
        };

        set((state) => ({
          intentos: [nuevoIntento, ...state.intentos],
        }));

        return nuevoIntento;
      },

      eliminarIntento: (id) => {
        set((state) => ({
          intentos: state.intentos.filter((item) => item.id !== id),
        }));
      },

      reiniciarProgreso: () => {
        set({ intentos: [] });
      },

      totalIntentos: () => {
        return get().intentos.length;
      },

      promedioPuntaje: () => {
        const { intentos } = get();
        if (intentos.length === 0) return 0;
        const suma = intentos.reduce((acc, curr) => acc + curr.puntaje, 0);
        return Math.round(suma / intentos.length);
      },

      mejorTiempo: () => {
        const { intentos } = get();
        if (intentos.length === 0) return 0;
        // Se considera mejor tiempo el menor tiempo con puntaje aceptable (≥ 70)
        const conAprobado = intentos.filter((i) => i.puntaje >= 70);
        if (conAprobado.length > 0) {
          return Math.min(...conAprobado.map((i) => i.tiempoSegundos));
        }
        return Math.min(...intentos.map((i) => i.tiempoSegundos));
      },

      rachaActual: () => {
        const { intentos } = get();
        let racha = 0;
        for (const intento of intentos) {
          if (intento.errores === 0) {
            racha++;
          } else {
            break;
          }
        }
        return racha;
      },

      tiempoTotalSegundos: () => {
        const { intentos } = get();
        return intentos.reduce((acc, curr) => acc + curr.tiempoSegundos, 0);
      },
    }),
    {
      name: 'simulador_progreso_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
