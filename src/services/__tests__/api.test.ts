import { describe, expect, it } from 'vitest';
import { api, obtenerToken } from '../api';
import { useAuthStore } from '../../store/useAuthStore';

describe('api - cliente Axios y configuración de origen para AWS', () => {
  it('instancia el cliente axios con encabezados JSON y timeout de 10s', () => {
    expect(api.defaults.timeout).toBe(10000);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('no duplica el segmento /api en la URL base para evitar /api/api', () => {
    const baseURL = api.defaults.baseURL ?? '';
    expect(baseURL).not.toMatch(/\/api\/?$/);
  });

  it('obtiene el token desde el store de autenticación', () => {
    useAuthStore.setState({
      usuario: { id: 1, nombre: 'Test', token: 'jwt-auth-store-token' } as any,
      estaAutenticado: true,
    });
    expect(obtenerToken()).toBe('jwt-auth-store-token');
    useAuthStore.setState({ usuario: null, estaAutenticado: false });
  });
});
