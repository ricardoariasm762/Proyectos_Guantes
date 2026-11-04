// Servicio de seguimiento académico para el rol DOCENTE y ADMIN
// Reutiliza exclusivamente los endpoints existentes en /api/intentos y /api/progreso
// Universidad Cooperativa de Colombia - Campus Pasto

import axios from 'axios';
import { PASOS_TECNICA } from '../data/pasosTecnica';
import type { DetalleIACompleto, FuentePrediccion } from '../types';
import { api } from './api';

export interface PasoIntentoBackendDTO {
  id: number;
  numeroPaso: number;
  nombrePaso?: string | null;
  descripcion?: string | null;
  exitoso?: boolean | null;
  tiempoSegundos?: number | null;
  precision?: number | null;
  observacionesError?: string | null;
  fechaHora?: string | null;
}

export interface IntentoBackendDTO {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  modoPractica: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  puntaje?: number | null;
  duracionSegundos?: number | null;
  completado?: boolean | null;
  observaciones?: string | null;
  confianzaPromedio?: number | null;
  fuentePrediccion?: FuentePrediccion | null;
  versionModelo?: string | null;
  detalleIA?: string | null;
  pasos?: PasoIntentoBackendDTO[] | null;
}

export interface ProgresoBackendDTO {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  intentosTotales: number;
  intentosExitosos: number;
  tiempoTotalSegundos: number;
  promedioPuntaje: number;
  mejorPuntaje: number;
  nivelAlcanzado: string;
  ultimoAcceso?: string | null;
}

export interface ResumenEstudianteDocente {
  usuarioId: number;
  nombre: string;
  email: string;
  numeroIntentos: number;
  mejorPuntaje: number;
  promedioPuntaje: number;
  ultimoIntentoFecha: string | null;
  ultimoIntentoPuntaje: number | null;
  ultimoIntentoModo: string | null;
}

export interface ErrorPorPasoEstudiante {
  numeroPaso: number;
  etiquetaCorta: string;
  tituloPaso: string;
  errores: number;
  intentosAfectados: number;
  ultimoMotivo: string | null;
}

/**
 * Consulta todos los intentos registrados en la plataforma (requiere rol DOCENTE o ADMIN).
 */
export async function listarTodosLosIntentosDocente(): Promise<IntentoBackendDTO[]> {
  const res = await api.get<IntentoBackendDTO[]>('/api/intentos');
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Consulta los intentos de práctica de un estudiante específico.
 */
export async function listarIntentosPorEstudiante(usuarioId: number): Promise<IntentoBackendDTO[]> {
  const res = await api.get<IntentoBackendDTO[]>(`/api/intentos/usuario/${usuarioId}`);
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Consulta el resumen de progreso consolidado de un estudiante específico.
 * Retorna null si el estudiante aún no registra fila de progreso (404).
 */
export async function obtenerProgresoPorEstudiante(
  usuarioId: number
): Promise<ProgresoBackendDTO | null> {
  try {
    const res = await api.get<ProgresoBackendDTO>(`/api/progreso/usuario/${usuarioId}`);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

function obtenerFechaIntento(intento: IntentoBackendDTO): string | null {
  return intento.fechaFin ?? intento.fechaInicio ?? null;
}

function timestampSeguro(iso: string | null): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Agrupa la lista global de intentos por estudiante calculando número de intentos,
 * mejor puntaje, promedio y datos del último intento.
 */
export function agruparResumenEstudiantes(
  intentos: IntentoBackendDTO[]
): ResumenEstudianteDocente[] {
  const mapa = new Map<
    number,
    {
      usuarioId: number;
      nombre: string;
      email: string;
      intentos: IntentoBackendDTO[];
    }
  >();

  for (const intento of intentos) {
    if (intento.usuarioId == null) continue;
    let entrada = mapa.get(intento.usuarioId);
    if (!entrada) {
      entrada = {
        usuarioId: intento.usuarioId,
        nombre: intento.usuarioNombre || `Estudiante #${intento.usuarioId}`,
        email: intento.usuarioEmail || 'Sin correo',
        intentos: [],
      };
      mapa.set(intento.usuarioId, entrada);
    }
    entrada.intentos.push(intento);
  }

  const resumenes: ResumenEstudianteDocente[] = [];

  for (const entrada of mapa.values()) {
    const ordenados = [...entrada.intentos].sort(
      (a, b) => timestampSeguro(obtenerFechaIntento(b)) - timestampSeguro(obtenerFechaIntento(a))
    );

    const puntajes = ordenados.map((i) => Number(i.puntaje ?? 0));
    const mejorPuntaje = puntajes.length > 0 ? Math.max(...puntajes) : 0;
    const suma = puntajes.reduce((acc, p) => acc + p, 0);
    const promedioPuntaje =
      puntajes.length > 0 ? Math.round((suma / puntajes.length) * 10) / 10 : 0;

    const ultimo = ordenados[0] ?? null;

    resumenes.push({
      usuarioId: entrada.usuarioId,
      nombre: entrada.nombre,
      email: entrada.email,
      numeroIntentos: ordenados.length,
      mejorPuntaje: Math.round(mejorPuntaje * 10) / 10,
      promedioPuntaje,
      ultimoIntentoFecha: ultimo ? obtenerFechaIntento(ultimo) : null,
      ultimoIntentoPuntaje:
        ultimo && ultimo.puntaje != null ? Math.round(Number(ultimo.puntaje) * 10) / 10 : null,
      ultimoIntentoModo: ultimo?.modoPractica ?? null,
    });
  }

  return resumenes.sort(
    (a, b) =>
      timestampSeguro(b.ultimoIntentoFecha) - timestampSeguro(a.ultimoIntentoFecha) ||
      a.nombre.localeCompare(b.nombre, 'es')
  );
}

/**
 * Calcula el desglose de errores por cada uno de los 6 pasos clínicos de un estudiante,
 * consolidando tanto `intento.pasos` (entidad PasoCompletado) como `intento.detalleIA` (telemetría JSON).
 */
export function calcularErroresPorPaso(
  intentosEstudiante: IntentoBackendDTO[]
): ErrorPorPasoEstudiante[] {
  const acumulador = new Map<
    number,
    {
      errores: number;
      intentosSet: Set<number>;
      ultimoMotivo: string | null;
    }
  >();

  for (let paso = 1; paso <= 6; paso++) {
    acumulador.set(paso, { errores: 0, intentosSet: new Set<number>(), ultimoMotivo: null });
  }

  for (const intento of intentosEstudiante) {
    const pasosRegistradosEnEntidad = new Set<number>();

    if (Array.isArray(intento.pasos)) {
      for (const p of intento.pasos) {
        const num = Number(p.numeroPaso);
        if (!acumulador.has(num)) continue;
        const huboError =
          p.exitoso === false || Boolean(p.observacionesError && p.observacionesError.trim());
        if (huboError) {
          const item = acumulador.get(num)!;
          item.errores += 1;
          item.intentosSet.add(intento.id);
          item.ultimoMotivo =
            p.observacionesError?.trim() || 'Fallo registrado en la validación del paso';
          pasosRegistradosEnEntidad.add(num);
        }
      }
    }

    if (intento.detalleIA) {
      try {
        const parsed = JSON.parse(intento.detalleIA) as Partial<DetalleIACompleto>;
        if (Array.isArray(parsed.pasos)) {
          // Agrupamos ráfagas continuas de frames fallidos por paso para no inflar un mismo incidente a 20 Hz
          let pasoEnFalloContinuo: number | null = null;

          for (const reg of parsed.pasos) {
            const num = Number(reg?.numero);
            if (!acumulador.has(num) || pasosRegistradosEnEntidad.has(num)) {
              continue;
            }

            const esFallo = reg.correcto === false || Boolean(reg.errorDetectado);
            if (esFallo) {
              if (pasoEnFalloContinuo !== num) {
                const item = acumulador.get(num)!;
                item.errores += 1;
                item.intentosSet.add(intento.id);
                item.ultimoMotivo =
                  reg.errorDetectado || reg.mensaje || 'Desviación detectada en simulación por cámara';
                pasoEnFalloContinuo = num;
              }
            } else if (pasoEnFalloContinuo === num) {
              pasoEnFalloContinuo = null;
            }
          }
        }
      } catch {
        // Ignorar JSON malformado sin interrumpir la vista del docente
      }
    }
  }

  return PASOS_TECNICA.map((pasoInfo) => {
    const datos = acumulador.get(pasoInfo.id) ?? {
      errores: 0,
      intentosSet: new Set<number>(),
      ultimoMotivo: null,
    };
    return {
      numeroPaso: pasoInfo.id,
      etiquetaCorta: `Paso ${pasoInfo.id}`,
      tituloPaso: pasoInfo.titulo,
      errores: datos.errores,
      intentosAfectados: datos.intentosSet.size,
      ultimoMotivo: datos.ultimoMotivo,
    };
  });
}
