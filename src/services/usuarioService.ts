// Servicio de gestión de usuarios exclusivo para rol ADMIN
// Conectado a los endpoints /api/admin/usuarios de Spring Boot
// Universidad Cooperativa de Colombia - Campus Pasto

import { api } from './api';
import type { Usuario, UsuarioRequest } from '../types';

const ADMIN_USUARIOS_URL = '/api/admin/usuarios';

/**
 * Lista todos los usuarios registrados en el sistema (requiere rol ADMIN)
 */
export async function listarUsuarios(): Promise<Usuario[]> {
  const response = await api.get<Usuario[]>(ADMIN_USUARIOS_URL);
  return response.data;
}

/**
 * Crea un nuevo usuario con cualquier rol (ESTUDIANTE, DOCENTE, ADMIN)
 */
export async function crearUsuario(data: UsuarioRequest): Promise<Usuario> {
  const response = await api.post<Usuario>(ADMIN_USUARIOS_URL, data);
  return response.data;
}

/**
 * Actualiza los datos o contraseña de un usuario existente
 */
export async function actualizarUsuario(id: number, data: UsuarioRequest): Promise<Usuario> {
  const response = await api.put<Usuario>(`${ADMIN_USUARIOS_URL}/${id}`, data);
  return response.data;
}

/**
 * Elimina un usuario por su ID (cascada en backend de progreso e intentos)
 */
export async function eliminarUsuario(id: number): Promise<void> {
  await api.delete(`${ADMIN_USUARIOS_URL}/${id}`);
}

/**
 * Obtiene los detalles de un usuario específico por su ID
 */
export async function obtenerUsuario(id: number): Promise<Usuario> {
  const response = await api.get<Usuario>(`${ADMIN_USUARIOS_URL}/${id}`);
  return response.data;
}
