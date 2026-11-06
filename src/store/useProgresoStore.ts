// Store de progreso e historial de prácticas del estudiante
// Universidad Cooperativa de Colombia - Campus Pasto

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IntentoPractica } from '../types';
import {
  listarMisIntentos,
  listarPendientesUsuarioActual,
  sincronizarIntentosPendientes,
} from '../services/intentoService';

interface ProgresoState {
  intentos: IntentoPractica[];
  /** Usuario dueño del historial en caché; evita mostrar prácticas de otra cuenta en el mismo dispositivo */
  usuarioId: number | null;
  sincronizando: boolean;
  /** Vacía la caché si pertenece a otro usuario y carga el historial real desde el servidor */
  sincronizarConServidor: (usuarioId: number) => Promise<void>;
  limpiarCache: () => void;
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
      usuarioId: null,
      sincronizando: false,

      sincronizarConServidor: async (usuarioId) => {
        if (get().usuarioId !== usuarioId) {
          set({ intentos: [], usuarioId });
        }
        set({ sincronizando: true });
        try {
          await sincronizarIntentosPendientes();
          const servidor = await listarMisIntentos();
          const pendientes = listarPendientesUsuarioActual();
          // Solo se aplica si el usuario no cambió mientras llegaba la respuesta
          if (get().usuarioId === usuarioId) {
            set({
              intentos: [...pendientes, ...servidor].sort(
                (a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)
              ),
            });
          }
        } catch (err) {
          console.warn('No se pudo cargar el historial desde el servidor; se muestra la caché local.', err);
        } finally {
          set({ sincronizando: false });
        }
      },

      limpiarCache: () => {
        set({ intentos: [], usuarioId: null });
      },

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
      partialize: (state) => ({ intentos: state.intentos, usuarioId: state.usuarioId }),
    }
  )
);
