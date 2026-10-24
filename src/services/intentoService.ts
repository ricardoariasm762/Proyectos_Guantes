// Servicio de comunicación REST con los endpoints de intentos de práctica en el backend Spring Boot
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { api } from './api';
import type { IntentoPractica } from '../types';
import { usePracticaStore } from '../store/usePracticaStore';

export interface GuardarIntentoParams {
  puntaje: number;
  tiempoSegundos: number;
  errores: number;
  modo: 'GUIADO' | 'SIMULACION' | 'DESAFIO' | 'guiado' | 'simulacion' | 'desafio';
  pasosCompletados: number;
  incluirMetadatosIA?: boolean;
}

const STORAGE_KEY_RESPALDO = 'intentos_pendientes_sincronizacion';

/**
 * Respalda un intento en localStorage en caso de fallo de conexión con el backend
 */
export const respaldarIntentoLocal = (payload: Record<string, unknown>): void => {
  try {
    const previos = JSON.parse(localStorage.getItem(STORAGE_KEY_RESPALDO) || '[]');
    previos.push({
      ...payload,
      _fechaRespaldo: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY_RESPALDO, JSON.stringify(previos));
  } catch (err) {
    console.warn('No se pudo respaldar el intento en localStorage:', err);
  }
};

/**
 * Envía el resultado del intento al backend Spring Boot.
 * Si incluirMetadatosIA es verdadero, extrae la telemetría acumulada en el store.
 */
export const guardarIntento = async (params: GuardarIntentoParams): Promise<IntentoPractica> => {
  const modoNormalizado = params.modo.toUpperCase() as 'GUIADO' | 'SIMULACION' | 'DESAFIO';

  const payload: Record<string, unknown> = {
    puntaje: params.puntaje,
    tiempoSegundos: params.tiempoSegundos,
    errores: params.errores,
    modo: modoNormalizado,
    pasosCompletados: params.pasosCompletados,
  };

  // Si se solicita, añadir metadatos de IA desde el store
  if (params.incluirMetadatosIA) {
    const store = usePracticaStore.getState();
    payload.confianzaPromedio = store.calcularConfianzaPromedio();
    payload.fuentePrediccion = store.calcularFuenteDominante();
    payload.versionModelo = store.versionModeloActiva || localStorage.getItem('versionModeloActiva') || 'v1.0';
    payload.detalleIA = store.generarDetalleIA();
  }

  try {
    const res = await api.post<IntentoPractica>('/api/intentos', payload);
    return res.data;
  } catch (error) {
    // Almacenar respaldo local para prevenir pérdida de datos
    respaldarIntentoLocal(payload);
    throw error;
  }
};

export interface ResultadoRegistro {
  sincronizado: boolean;
  intento?: IntentoPractica;
}

/**
 * Variante que nunca lanza: guarda una sola vez y reporta si el backend respondió.
 * Si falla, el intento queda respaldado localmente por `guardarIntento`.
 */
export const registrarIntento = async (params: GuardarIntentoParams): Promise<ResultadoRegistro> => {
  try {
    const intento = await guardarIntento(params);
    return { sincronizado: true, intento };
  } catch {
    return { sincronizado: false };
  }
};

/**
 * Consulta la lista de todos los intentos registrados del usuario autenticado
 */
export const listarIntentos = async (): Promise<IntentoPractica[]> => {
  const res = await api.get<IntentoPractica[]>('/api/intentos');
  return res.data;
};

/**
 * Elimina un intento por su identificador
 */
export const eliminarIntento = async (id: number | string): Promise<void> => {
  await api.delete(`/api/intentos/${id}`);
};

/**
 * Sincroniza intentos pendientes respaldados localmente cuando se recupera la conexión
 */
export const sincronizarIntentosPendientes = async (): Promise<number> => {
  try {
    const pendientesRaw = localStorage.getItem(STORAGE_KEY_RESPALDO);
    if (!pendientesRaw) return 0;

    const pendientes: Record<string, unknown>[] = JSON.parse(pendientesRaw);
    if (!Array.isArray(pendientes) || pendientes.length === 0) return 0;

    let sincronizados = 0;
    const restantes: Record<string, unknown>[] = [];

    for (const item of pendientes) {
      try {
        const datos = { ...item };
        delete datos._fechaRespaldo;
        await api.post('/api/intentos', datos);
        sincronizados++;
      } catch {
        restantes.push(item);
      }
    }

    if (restantes.length > 0) {
      localStorage.setItem(STORAGE_KEY_RESPALDO, JSON.stringify(restantes));
    } else {
      localStorage.removeItem(STORAGE_KEY_RESPALDO);
    }

    return sincronizados;
  } catch (error) {
    console.warn('Error al sincronizar intentos pendientes:', error);
    return 0;
  }
};
