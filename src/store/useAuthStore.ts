// Store de autenticación y sesión del estudiante
// Universidad Cooperativa de Colombia - Campus Pasto

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  login: (datos: { nombre: string; semestre: number; grupo: string }) => void;
  logout: () => void;
  actualizarUsuario: (datos: Partial<Omit<Usuario, 'id'>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      estaAutenticado: false,

      login: (datos) => {
        const nuevoUsuario: Usuario = {
          id: `estudiante_${Date.now()}`,
          nombre: datos.nombre.trim(),
          semestre: Number(datos.semestre),
          grupo: datos.grupo.trim().toUpperCase(),
        };
        set({
          usuario: nuevoUsuario,
          estaAutenticado: true,
        });
      },

      logout: () => {
        set({
          usuario: null,
          estaAutenticado: false,
        });
      },

      actualizarUsuario: (datosActualizados) => {
        set((state) => {
          if (!state.usuario) return state;
          return {
            usuario: {
              ...state.usuario,
              ...datosActualizados,
            },
          };
        });
      },
    }),
    {
      name: 'simulador_auth_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
