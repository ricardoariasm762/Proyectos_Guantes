// Servicio para interactuar con los endpoints de gestión de modelos de IA en el backend Spring Boot
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { api } from './api';
import type { ModeloIA, ModeloIARequest } from '../types';

/**
 * Registra una nueva versión del modelo de IA en el backend (Requiere rol ADMIN).
 */
export const registrarVersion = async (data: ModeloIARequest): Promise<ModeloIA> => {
  const res = await api.post<ModeloIA>('/api/ia/version', data);
  return res.data;
};

/**
 * Obtiene la versión del modelo de IA que se encuentra actualmente activa.
 */
export const obtenerVersionActiva = async (): Promise<ModeloIA> => {
  const res = await api.get<ModeloIA>('/api/ia/version/activa');
  return res.data;
};

/**
 * Lista el histórico de todas las versiones registradas del modelo (Requiere rol ADMIN).
 */
export const listarVersiones = async (): Promise<ModeloIA[]> => {
  const res = await api.get<ModeloIA[]>('/api/ia/versiones');
  return res.data;
};
