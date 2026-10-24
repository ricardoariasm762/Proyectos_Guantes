// Servicio de autenticación JWT conectado con el backend Spring Boot (/api/auth)
// Universidad Cooperativa de Colombia - Campus Pasto

import { api } from './api';
import type { Usuario } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol?: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';
}

export interface AuthBackendResponse {
  token: string;
  tipo: string;
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';
}

export interface UsuarioPerfilResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';
  activo: boolean;
}

/**
 * Autentica credenciales en el backend Spring Boot y retorna el token JWT oficial
 */
export async function loginBackend(credentials: LoginCredentials): Promise<AuthBackendResponse> {
  const response = await api.post<AuthBackendResponse>('/api/auth/login', credentials);
  return response.data;
}

/**
 * Registra un nuevo usuario en la base de datos PostgreSQL mediante Spring Boot
 */
export async function registerBackend(payload: RegisterPayload): Promise<AuthBackendResponse> {
  const response = await api.post<AuthBackendResponse>('/api/auth/register', payload);
  return response.data;
}

/**
 * Obtiene el perfil del usuario autenticado actual desde el backend
 */
export async function obtenerPerfilBackend(): Promise<UsuarioPerfilResponse> {
  const response = await api.get<UsuarioPerfilResponse>('/api/auth/perfil');
  return response.data;
}

/**
 * Convierte la respuesta del backend a la entidad Usuario del frontend
 */
export function mapearAuthAUsuario(
  authResp: AuthBackendResponse,
  metadataExtra?: { semestre?: number; grupo?: string }
): Usuario {
  return {
    id: String(authResp.id),
    nombre: `${authResp.nombre} ${authResp.apellido}`.trim(),
    apellido: authResp.apellido,
    email: authResp.email,
    semestre: metadataExtra?.semestre ?? 5,
    grupo: metadataExtra?.grupo ?? 'A',
    rol: authResp.rol,
    token: authResp.token,
  };
}
