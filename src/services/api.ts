// Cliente Axios único para la API REST de Spring Boot
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Fuente única del token JWT.
 * Prioriza el store de sesión y conserva la clave `token` heredada por compatibilidad.
 */
export function obtenerToken(): string | null {
  const usuario = useAuthStore.getState().usuario as { token?: string } | null;
  return usuario?.token ?? localStorage.getItem('token');
}

export const api = axios.create({
  baseURL: BACKEND_BASE_URL,
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
