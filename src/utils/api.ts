// Cliente HTTP para comunicación REST con el backend Spring Boot en http://localhost:8080
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface IntentoBackendPayload {
  puntaje: number;
  tiempoSegundos: number;
  errores: number;
  modo: string; // 'SIMULACION'
  pasosCompletados: number;
}

export interface IntentoBackendResponse {
  id?: string | number;
  mensaje?: string;
  exito?: boolean;
  [key: string]: unknown;
}

/**
 * Obtiene el token JWT almacenado en el navegador
 */
export function obtenerTokenJWT(): string | null {
  try {
    // 1. Intentar token directo en localStorage
    const tokenDirecto = localStorage.getItem('token') || localStorage.getItem('jwt');
    if (tokenDirecto) return tokenDirecto;

    // 2. Intentar token dentro del store de autenticación
    const authStoreRaw = localStorage.getItem('simulador_auth_storage');
    if (authStoreRaw) {
      const parsed = JSON.parse(authStoreRaw);
      if (parsed?.state?.token) return parsed.state.token;
      if (parsed?.state?.usuario?.token) return parsed.state.usuario.token;
    }
  } catch (err) {
    console.warn('No se pudo leer el token de autenticación:', err);
  }
  return null;
}

/**
 * Cliente API simplificado con interceptor de JWT
 */
export const api = {
  async get<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_BASE_URL}${endpoint}`;
    const token = obtenerTokenJWT();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return response.json() as Promise<T>;
  },

  async post<T = IntentoBackendResponse>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_BASE_URL}${endpoint}`;
    const token = obtenerTokenJWT();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return response.json() as Promise<T>;
  },
};

/**
 * Función especializada para registrar el intento de simulación en el backend
 */
export async function registrarIntentoEnBackend(
  payload: IntentoBackendPayload
): Promise<{ sincronizado: boolean; datos?: IntentoBackendResponse; error?: string }> {
  try {
    const data = await api.post<IntentoBackendResponse>('/api/intentos', payload);
    console.info('Intento registrado exitosamente en el backend Spring Boot:', data);
    return { sincronizado: true, datos: data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido de red';
    console.warn(
      'No se pudo sincronizar el intento con el backend Spring Boot (http://localhost:8080). El resultado ha sido guardado localmente de forma segura en Zustand/localStorage.',
      msg
    );
    return { sincronizado: false, error: msg };
  }
}
