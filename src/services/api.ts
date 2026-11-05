// Cliente Axios único para la API REST de Spring Boot
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const envApiUrl = import.meta.env.VITE_API_URL;
// En producción detrás de CloudFront, frontend y backend comparten el mismo dominio.
// Una URL base vacía ("") permite peticiones relativas a /api/* sin duplicar dominios.
// El valor por defecto http://localhost:8080 solo aplica en entorno de desarrollo (DEV).
const API_URL = typeof envApiUrl === 'string'
  ? envApiUrl
  : (import.meta.env.DEV ? 'http://localhost:8080' : '');

/**
 * Fuente única del token JWT.
 * Prioriza el store de sesión y conserva la clave `token` heredada por compatibilidad.
 */
export function obtenerToken(): string | null {
  const usuario = useAuthStore.getState().usuario as { token?: string } | null;
  return usuario?.token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = obtenerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo centralizado de sesión expirada: limpia el store además del token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);
