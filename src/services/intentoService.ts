// Servicio de comunicación REST con los endpoints de intentos de práctica en el backend Spring Boot
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { api } from './api';
import type { IntentoPractica } from '../types';
import { usePracticaStore } from '../store/usePracticaStore';
import { useAuthStore } from '../store/useAuthStore';

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
      _usuarioId: useAuthStore.getState().usuario?.id ?? null,
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
const MODOS_BACKEND = ['GUIADO', 'EVALUACION', 'LIBRE', 'ENTRENAMIENTO', 'SIMULACION', 'DESAFIO'];

const aNumero = (valor: unknown): number | undefined => {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Convierte los datos del intento al contrato de IntentoRequest del backend
 * (modoPractica, duracionSegundos, completado, observaciones).
 * Acepta también el formato antiguo (modo, tiempoSegundos, errores, pasosCompletados)
 * para poder sincronizar respaldos guardados antes de esta corrección.
 */
export const construirPayloadBackend = (datos: Record<string, unknown>): Record<string, unknown> => {
  const modoCrudo = String(datos.modoPractica ?? datos.modo ?? 'GUIADO').toUpperCase();
  const modoPractica = MODOS_BACKEND.includes(modoCrudo) ? modoCrudo : 'GUIADO';

  const puntaje = aNumero(datos.puntaje);
  const duracionSegundos = aNumero(datos.duracionSegundos ?? datos.tiempoSegundos);
  const errores = aNumero(datos.errores);
  const pasosCompletados = aNumero(datos.pasosCompletados);

  const payload: Record<string, unknown> = {
    modoPractica,
    puntaje: puntaje ?? 0,
    duracionSegundos: duracionSegundos !== undefined ? Math.round(duracionSegundos) : undefined,
    completado: datos.completado !== undefined ? Boolean(datos.completado) : true,
  };

  if (typeof datos.observaciones === 'string' && datos.observaciones.trim()) {
    payload.observaciones = datos.observaciones;
  } else if (errores !== undefined || pasosCompletados !== undefined) {
    payload.observaciones = `Errores: ${errores ?? 0} | Pasos completados: ${pasosCompletados ?? 0}`;
  }

  // El backend exige confianza entre 0.0 y 1.0; si llega en porcentaje se normaliza
  let confianza = aNumero(datos.confianzaPromedio);
  if (confianza !== undefined && confianza > 0) {
    if (confianza > 1) confianza = confianza / 100;
    payload.confianzaPromedio = Math.min(1, Math.max(0, Number(confianza.toFixed(4))));
  }
  if (datos.fuentePrediccion) payload.fuentePrediccion = datos.fuentePrediccion;
  if (datos.versionModelo) payload.versionModelo = datos.versionModelo;
  if (datos.detalleIA) payload.detalleIA = datos.detalleIA;
  if (Array.isArray(datos.pasos)) payload.pasos = datos.pasos;

  return payload;
};

export const guardarIntento = async (params: GuardarIntentoParams): Promise<IntentoPractica> => {
  const datos: Record<string, unknown> = {
    puntaje: params.puntaje,
    tiempoSegundos: params.tiempoSegundos,
    errores: params.errores,
    modo: params.modo,
    pasosCompletados: params.pasosCompletados,
  };

  // Si se solicita, añadir metadatos de IA desde el store
  if (params.incluirMetadatosIA) {
    const store = usePracticaStore.getState();
    datos.confianzaPromedio = store.calcularConfianzaPromedio();
    datos.fuentePrediccion = store.calcularFuenteDominante();
    datos.versionModelo = store.versionModeloActiva || localStorage.getItem('versionModeloActiva') || 'v1.0';
    datos.detalleIA = store.generarDetalleIA();
  }

  const payload = construirPayloadBackend(datos);

  try {
    const res = await api.post<IntentoBackendResponse>('/api/intentos', payload);
    return mapearIntentoBackend(res.data);
  } catch (error) {
    // Almacenar respaldo local para prevenir pérdida de datos
    respaldarIntentoLocal(payload);
    throw error;
  }
};

/** Respuesta de IntentoResponse del backend */
export interface IntentoBackendResponse {
  id: number;
  usuarioId?: number;
  modoPractica?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  puntaje?: number | null;
  duracionSegundos?: number | null;
  completado?: boolean | null;
  observaciones?: string | null;
  confianzaPromedio?: number | null;
  fuentePrediccion?: IntentoPractica['fuentePrediccion'] | null;
  versionModelo?: string | null;
  detalleIA?: string | null;
  pasos?: { exitoso?: boolean | null }[] | null;
}

const extraerEntero = (texto: string | null | undefined, etiqueta: RegExp): number | undefined => {
  if (!texto) return undefined;
  const m = texto.match(etiqueta);
  return m ? Number(m[1]) : undefined;
};

/**
 * Convierte un intento del backend al formato que usan el dashboard y el perfil.
 */
export const mapearIntentoBackend = (r: IntentoBackendResponse): IntentoPractica => {
  const modo = String(r.modoPractica ?? 'GUIADO').toLowerCase();
  const pasos = Array.isArray(r.pasos) ? r.pasos : [];
  const erroresPasos = pasos.filter((p) => p.exitoso === false).length;
  return {
    id: `srv_${r.id}`,
    fecha: r.fechaFin ?? r.fechaInicio ?? new Date().toISOString(),
    puntaje: Math.round(Number(r.puntaje ?? 0)),
    tiempoSegundos: Number(r.duracionSegundos ?? 0),
    errores: extraerEntero(r.observaciones, /Errores:\s*(\d+)/i) ?? erroresPasos,
    modo: (['guiado', 'simulacion', 'desafio'].includes(modo) ? modo : 'guiado') as IntentoPractica['modo'],
    pasosCompletados:
      extraerEntero(r.observaciones, /Pasos completados:\s*(\d+)/i) ?? pasos.filter((p) => p.exitoso !== false).length,
    confianzaPromedio: r.confianzaPromedio ?? undefined,
    fuentePrediccion: r.fuentePrediccion ?? undefined,
    versionModelo: r.versionModelo ?? undefined,
    detalleIA: r.detalleIA ?? undefined,
  };
};

/**
 * Historial del usuario autenticado guardado en el servidor (disponible en cualquier dispositivo).
 */
export const listarMisIntentos = async (): Promise<IntentoPractica[]> => {
  const res = await api.get<IntentoBackendResponse[]>('/api/intentos/mis-intentos');
  const lista = Array.isArray(res.data) ? res.data.map(mapearIntentoBackend) : [];
  return lista.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
};

/**
 * Intentos del usuario actual que siguen pendientes de sincronizar en este dispositivo.
 */
export const listarPendientesUsuarioActual = (): IntentoPractica[] => {
  try {
    const usuarioId = useAuthStore.getState().usuario?.id;
    const pendientes = JSON.parse(localStorage.getItem(STORAGE_KEY_RESPALDO) || '[]');
    if (!Array.isArray(pendientes) || usuarioId == null) return [];
    return pendientes
      .filter((p: Record<string, unknown>) => p._usuarioId === usuarioId)
      .map((p: Record<string, unknown>, i: number) => {
        const payload = construirPayloadBackend(p);
        return {
          ...mapearIntentoBackend({ id: i, ...payload, fechaFin: String(p._fechaRespaldo ?? '') || null } as IntentoBackendResponse),
          id: `pendiente_${i}`,
        };
      });
  } catch {
    return [];
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

    const usuarioId = useAuthStore.getState().usuario?.id;
    if (usuarioId == null) return 0;

    let sincronizados = 0;
    const restantes: Record<string, unknown>[] = [];

    for (const item of pendientes) {
      // Respaldos sin dueño (versiones anteriores) se descartan para no asignarlos a otro usuario
      if (item._usuarioId === undefined || item._usuarioId === null) continue;
      // Respaldos de otro usuario del mismo dispositivo se conservan para su propia sesión
      if (item._usuarioId !== usuarioId) {
        restantes.push(item);
        continue;
      }
      try {
        await api.post('/api/intentos', construirPayloadBackend(item));
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
