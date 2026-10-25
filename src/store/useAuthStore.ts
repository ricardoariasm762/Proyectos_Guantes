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
  login: (datos: LoginParams) => void;
  loginConJwt: (authResp: AuthBackendResponse, metadataExtra?: { semestre?: number; grupo?: string }) => void;
  logout: () => void;
  actualizarUsuario: (datos: Partial<Omit<Usuario, 'id'>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      estaAutenticado: false,

      login: (datos) => {
        // El rol debe provenir de credenciales verificadas; por defecto es ESTUDIANTE
        const rolAsignado: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = datos.rol || 'ESTUDIANTE';

        if (datos.token) {
          localStorage.setItem('token', datos.token);
        }

        const nuevoUsuario: Usuario = {
          id: typeof datos.id === 'number' ? datos.id : Number(datos.id) || Date.now(),
          nombre: datos.nombre.trim(),
          apellido: datos.apellido?.trim(),
          email: datos.email?.trim() || 'usuario@ucc.edu.co',
          semestre: Number(datos.semestre ?? 5),
          grupo: (datos.grupo || 'A').trim().toUpperCase(),
          rol: rolAsignado,
          fechaRegistro: new Date().toISOString(),
          token: datos.token,
        };

        set({
          usuario: nuevoUsuario,
          estaAutenticado: true,
        });
      },

      loginConJwt: (authResp, metadataExtra) => {
        if (authResp.token) {
          localStorage.setItem('token', authResp.token);
        }

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
