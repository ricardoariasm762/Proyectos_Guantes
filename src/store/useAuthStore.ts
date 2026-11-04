// Store de autenticación y sesión del estudiante con soporte JWT Spring Boot
// Universidad Cooperativa de Colombia - Campus Pasto

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Usuario } from '../types';
import type { AuthBackendResponse } from '../services/authService';

export interface LoginParams {
  nombre: string;
  apellido?: string;
  email?: string;
  semestre?: number;
  grupo?: string;
  rol?: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';
  token?: string;
  id?: number | string;
}

interface AuthState {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  loginConJwt: (authResp: AuthBackendResponse, metadataExtra?: { semestre?: number; grupo?: string }) => void;
  logout: () => void;
  actualizarUsuario: (datos: Partial<Omit<Usuario, 'id'>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      estaAutenticado: false,

      loginConJwt: (authResp, metadataExtra) => {
        if (!authResp?.token) {
          throw new Error('No se puede iniciar sesión sin un token JWT válido del backend.');
        }

        localStorage.setItem('token', authResp.token);

        const usuarioMapeado: Usuario = {
          id: Number(authResp.id),
          nombre: `${authResp.nombre || ''} ${authResp.apellido || ''}`.trim() || authResp.email,
          apellido: authResp.apellido,
          email: authResp.email,
          semestre: Number(metadataExtra?.semestre ?? 5),
          grupo: (metadataExtra?.grupo || 'A').trim().toUpperCase(),
          rol: authResp.rol,
          fechaRegistro: new Date().toISOString(),
          token: authResp.token,
        };

        set({
          usuario: usuarioMapeado,
          estaAutenticado: true,
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('jwt');
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
