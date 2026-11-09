// Vista de seguimiento académico para los roles DOCENTE y ADMIN (RF-08 y RP-06)
// Consulta intentos y progreso por estudiante mediante /api/intentos y /api/progreso
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  GraduationCap,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import {
  agruparResumenEstudiantes,
  calcularErroresPorPaso,
  listarIntentosPorEstudiante,
  listarTodosLosIntentosDocente,
  obtenerProgresoPorEstudiante,
  type IntentoBackendDTO,
  type ProgresoBackendDTO,
  type ResumenEstudianteDocente,
} from '../services/docenteService';
import { formatearFecha, formatearTiempo } from '../utils/puntuacion';

const NUMERO_TABULAR: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

function variantePuntaje(puntaje: number | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
  if (puntaje == null) return 'neutral';
  if (puntaje >= 80) return 'success';
  if (puntaje >= 60) return 'warning';
  return 'danger';
}

export const PanelDocente: React.FC = () => {
  const [intentosGlobales, setIntentosGlobales] = useState<IntentoBackendDTO[]>([]);
  const [cargandoLista, setCargandoLista] = useState<boolean>(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>('');

  const [estudianteActivoId, setEstudianteActivoId] = useState<number | null>(null);
  const [intentosDetalle, setIntentosDetalle] = useState<IntentoBackendDTO[]>([]);
  const [progresoDetalle, setProgresoDetalle] = useState<ProgresoBackendDTO | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState<boolean>(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const cargarListadoGeneral = useCallback(async () => {
    setCargandoLista(true);
    setErrorLista(null);
    try {
      const lista = await listarTodosLosIntentosDocente();
      setIntentosGlobales(lista);
      const agrupados = agruparResumenEstudiantes(lista);
      setEstudianteActivoId((prev) => {
        if (prev != null && agrupados.some((e) => e.usuarioId === prev)) {
          return prev;
        }
        return agrupados[0]?.usuarioId ?? null;
      });
    } catch (err: unknown) {
      console.error('Error al consultar intentos para panel docente:', err);
      setErrorLista(
        'No fue posible obtener los intentos desde el servidor. Verifica la conexión y tu sesión activa.'
      );
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => {
    void cargarListadoGeneral();
  }, [cargarListadoGeneral]);

  const estudiantes = useMemo(
    () => agruparResumenEstudiantes(intentosGlobales),
    [intentosGlobales]
  );

  const estudiantesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  }, [estudiantes, busqueda]);

  const estudianteSeleccionado: ResumenEstudianteDocente | null = useMemo(
    () => estudiantes.find((e) => e.usuarioId === estudianteActivoId) ?? null,
    [estudiantes, estudianteActivoId]
  );

  useEffect(() => {
    if (estudianteActivoId == null) {
      setIntentosDetalle([]);
      setProgresoDetalle(null);
      return;
    }

    let cancelado = false;
    const cargarDetalleEstudiante = async () => {
      setCargandoDetalle(true);
      setErrorDetalle(null);
      try {
        const [intentosEst, progresoEst] = await Promise.all([
          listarIntentosPorEstudiante(estudianteActivoId),
          obtenerProgresoPorEstudiante(estudianteActivoId),
        ]);
        if (!cancelado) {
          setIntentosDetalle(intentosEst);
          setProgresoDetalle(progresoEst);
        }
      } catch (err: unknown) {
        console.error('Error al cargar detalle del estudiante:', err);
        if (!cancelado) {
          // Respaldo con los intentos ya cargados globalmente si falla la consulta individual
          setIntentosDetalle(
            intentosGlobales.filter((i) => i.usuarioId === estudianteActivoId)
          );
          setErrorDetalle('No se pudo actualizar el progreso individual desde /api/progreso.');
        }
      } finally {
        if (!cancelado) {
          setCargandoDetalle(false);
        }
      }
    };

    void cargarDetalleEstudiante();
    return () => {
      cancelado = true;
    };
  }, [estudianteActivoId, intentosGlobales]);

  const metricasGlobales = useMemo(() => {
    const totalIntentos = intentosGlobales.length;
    const totalEstudiantes = estudiantes.length;
    const mejorGlobal =
      estudiantes.length > 0 ? Math.max(...estudiantes.map((e) => e.mejorPuntaje)) : 0;
    const promedioGlobal =
      totalIntentos > 0
        ? Math.round(
            (intentosGlobales.reduce((acc, i) => acc + Number(i.puntaje ?? 0), 0) /
              totalIntentos) *
              10
          ) / 10
        : 0;

    return { totalEstudiantes, totalIntentos, mejorGlobal, promedioGlobal };
  }, [intentosGlobales, estudiantes]);

  const erroresPorPaso = useMemo(
    () => calcularErroresPorPaso(intentosDetalle),
    [intentosDetalle]
  );

  const intentosOrdenadosCronologicamente = useMemo(() => {
    return [...intentosDetalle].sort((a, b) => {
      const fa = Date.parse(a.fechaFin ?? a.fechaInicio ?? '') || 0;
      const fb = Date.parse(b.fechaFin ?? b.fechaInicio ?? '') || 0;
      return fa - fb;
    });
  }, [intentosDetalle]);

  const serieEvolucionEstudiante = useMemo(() => {
    return intentosOrdenadosCronologicamente.map((intento, idx) => ({
      etiqueta: `#${idx + 1}`,
      puntaje: Math.round(Number(intento.puntaje ?? 0) * 10) / 10,
      modo: intento.modoPractica,
    }));
  }, [intentosOrdenadosCronologicamente]);

  const intentosDetalleRecientesPrimero = useMemo(
    () => [...intentosOrdenadosCronologicamente].reverse(),
    [intentosOrdenadosCronologicamente]
  );

  return (
    <div className="dashboard-page">
      {/* Encabezado de página */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <GraduationCap size={26} style={{ color: 'var(--color-primary)' }} />
            <span>Seguimiento Docente de Estudiantes</span>
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Desempeño práctico, historial de intentos y análisis de errores por paso clínico.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={() => void cargarListadoGeneral()}
            disabled={cargandoLista}
            className="btn-secondary-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            <span>{cargandoLista ? 'Actualizando…' : 'Actualizar datos'}</span>
          </button>
        </div>
      </div>

      {/* Error de red general */}
      {errorLista && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-contaminated-bg)',
            color: 'var(--color-contaminated-dark)',
            border: '1px solid var(--color-contaminated-border)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorLista}</span>
        </div>
      )}

      {/* Métricas globales de seguimiento */}
      <div className="dashboard-metrics-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          titulo="Estudiantes Evaluados"
          valor={metricasGlobales.totalEstudiantes}
          subtitulo="Con al menos un intento registrado"
          icono={Users}
          colorIcono="primary"
        />
        <StatCard
          titulo="Intentos Registrados"
          valor={metricasGlobales.totalIntentos}
          subtitulo="Sesiones totales en plataforma"
          icono={ClipboardList}
          colorIcono="secondary"
        />
        <StatCard
          titulo="Mejor Puntaje Grupal"
          valor={`${metricasGlobales.mejorGlobal}`}
          subtitulo="Máximo alcanzado en evaluación"
          icono={Award}
          colorIcono="success"
        />
        <StatCard
          titulo="Promedio General"
          valor={`${metricasGlobales.promedioGlobal}`}
          subtitulo="Media global de intentos"
          icono={TrendingUp}
          colorIcono="warning"
        />
      </div>

      {/* Tabla principal de estudiantes */}
      <Card
        titulo="Resumen por Estudiante"
        subtitulo="Selecciona un estudiante para inspeccionar sus intentos y errores por paso"
        icono={<Users size={20} />}
        acciones={
          <div style={{ position: 'relative', minWidth: 'min(100%, 240px)', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o correo…"
              aria-label="Buscar estudiante por nombre o correo"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                background: '#ffffff',
              }}
            />
          </div>
        }
      >
        {cargandoLista ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Cargando listado de estudiantes e intentos…
          </div>
        ) : estudiantesFiltrados.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron estudiantes con intentos registrados para el criterio actual.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  <th scope="col" style={{ padding: '0.75rem 0.85rem' }}>Estudiante</th>
                  <th scope="col" style={{ padding: '0.75rem 0.85rem' }}>N.° Intentos</th>
                  <th scope="col" style={{ padding: '0.75rem 0.85rem' }}>Mejor Puntaje</th>
                  <th scope="col" style={{ padding: '0.75rem 0.85rem' }}>Último Intento</th>
                  <th scope="col" style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map((est) => {
                  const seleccionado = est.usuarioId === estudianteActivoId;
                  return (
                    <tr
                      key={est.usuarioId}
                      onClick={() => setEstudianteActivoId(est.usuarioId)}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        backgroundColor: seleccionado ? '#F0F9FF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{est.nombre}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{est.email}</div>
                      </td>
                      <td style={{ padding: '0.85rem', fontWeight: 600, ...NUMERO_TABULAR }}>
                        {est.numeroIntentos}
                      </td>
                      <td style={{ padding: '0.85rem', ...NUMERO_TABULAR }}>
                        <Badge variant={variantePuntaje(est.mejorPuntaje)} size="sm">
                          {est.mejorPuntaje} pts
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem', ...NUMERO_TABULAR }}>
                        {est.ultimoIntentoFecha ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {formatearFecha(est.ultimoIntentoFecha)}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {est.ultimoIntentoModo ?? 'PRÁCTICA'} • {est.ultimoIntentoPuntaje ?? 0} pts
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sin fecha</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setEstudianteActivoId(est.usuarioId);
                          }}
                          aria-pressed={seleccionado}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: seleccionado
                              ? '1px solid var(--color-primary)'
                              : '1px solid var(--border-light)',
                            background: seleccionado ? 'var(--color-primary)' : '#ffffff',
                            color: seleccionado ? '#ffffff' : 'var(--text-main)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={14} />
                          <span>{seleccionado ? 'Viendo' : 'Ver detalle'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Vista de detalle del estudiante seleccionado */}
      {estudianteSeleccionado && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card
            titulo={`Detalle Académico: ${estudianteSeleccionado.nombre}`}
            subtitulo={`${estudianteSeleccionado.email} • Resumen consolidado de progreso e intentos`}
            icono={<ClipboardList size={20} />}
            acciones={
              progresoDetalle?.nivelAlcanzado ? (
                <Badge variant="primary" size="md">
                  Nivel: {progresoDetalle.nivelAlcanzado}
                </Badge>
              ) : undefined
            }
          >
            {errorDetalle && (
              <div
                role="status"
                style={{
                  padding: '0.65rem 0.9rem',
                  marginBottom: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFBEB',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  fontSize: '0.84rem',
                }}
              >
                {errorDetalle}
              </div>
            )}

            {cargandoDetalle ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Cargando intentos y progreso del estudiante…
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Intentos Exitosos / Totales
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', ...NUMERO_TABULAR }}>
                    {progresoDetalle
                      ? `${progresoDetalle.intentosExitosos} / ${progresoDetalle.intentosTotales}`
                      : `${intentosDetalle.filter((i) => i.completado).length} / ${intentosDetalle.length}`}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Promedio de Puntaje
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', ...NUMERO_TABULAR }}>
                    {progresoDetalle?.promedioPuntaje != null
                      ? Math.round(progresoDetalle.promedioPuntaje * 10) / 10
                      : estudianteSeleccionado.promedioPuntaje}{' '}
                    pts
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Mejor Puntaje
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', ...NUMERO_TABULAR }}>
                    {progresoDetalle?.mejorPuntaje != null
                      ? Math.round(progresoDetalle.mejorPuntaje * 10) / 10
                      : estudianteSeleccionado.mejorPuntaje}{' '}
                    pts
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Clock size={14} />
                    <span>Tiempo Acumulado</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', ...NUMERO_TABULAR }}>
                    {formatearTiempo(
                      progresoDetalle?.tiempoTotalSegundos ??
                        intentosDetalle.reduce((acc, i) => acc + Number(i.duracionSegundos ?? 0), 0)
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Gráficos: Errores por Paso y Evolución */}
          <div className="dashboard-charts-grid">
            <Card
              titulo="Errores por Paso del Protocolo (Pasos 1 a 6)"
              subtitulo="Frecuencia de incidencias detectadas en la técnica estéril"
              icono={<BarChart3 size={20} />}
            >
              <div style={{ width: '100%', height: 240, marginBottom: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={erroresPorPaso} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="etiquetaCorta" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value ?? 0} errores`, 'Incidencias']}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload as { tituloPaso?: string } | undefined;
                        return item?.tituloPaso ? `${String(label)}: ${item.tituloPaso}` : String(label);
                      }}
                    />
                    <Bar dataKey="errores" fill="#023E8A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {erroresPorPaso.map((ep) => (
                  <div
                    key={ep.numeroPaso}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        Paso {ep.numeroPaso}: {ep.tituloPaso}
                      </div>
                      {ep.ultimoMotivo && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          Última observación: {ep.ultimoMotivo}
                        </div>
                      )}
                    </div>
                    <Badge variant={ep.errores > 0 ? 'danger' : 'success'} size="sm">
                      {ep.errores === 0 ? 'Sin errores' : `${ep.errores} error(es)`}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              titulo="Curva de Desempeño del Estudiante"
              subtitulo="Evolución cronológica de puntajes por intento"
              icono={<TrendingUp size={20} />}
            >
              {serieEvolucionEstudiante.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Este estudiante aún no registra intentos para graficar evolución.
                </div>
              ) : (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={serieEvolucionEstudiante}
                      margin={{ top: 10, right: 15, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradDocentePuntaje" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0077b6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0077b6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="etiqueta" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value ?? 0} pts`, 'Puntaje']} />
                      <Area
                        type="monotone"
                        dataKey="puntaje"
                        stroke="#0077b6"
                        strokeWidth={2.5}
                        fill="url(#gradDocentePuntaje)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Historial de intentos del estudiante */}
          <Card
            titulo={`Historial de Intentos (${intentosDetalleRecientesPrimero.length})`}
            subtitulo="Sesiones individuales registradas por el estudiante"
            icono={<ClipboardList size={20} />}
          >
            {intentosDetalleRecientesPrimero.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay intentos registrados para este estudiante.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        textAlign: 'left',
                        color: 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      <th scope="col" style={{ padding: '0.7rem 0.8rem' }}>Fecha</th>
                      <th scope="col" style={{ padding: '0.7rem 0.8rem' }}>Modo</th>
                      <th scope="col" style={{ padding: '0.7rem 0.8rem' }}>Puntaje</th>
                      <th scope="col" style={{ padding: '0.7rem 0.8rem' }}>Duración</th>
                      <th scope="col" style={{ padding: '0.7rem 0.8rem' }}>Evaluación</th>
                      <th scope="col" style={{ padding: '0.7rem 0.8rem' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intentosDetalleRecientesPrimero.map((intento) => {
                      const fecha = intento.fechaFin ?? intento.fechaInicio ?? '';
                      return (
                        <tr
                          key={intento.id}
                          style={{ borderBottom: '1px solid var(--border-light)' }}
                        >
                          <td style={{ padding: '0.75rem 0.8rem', ...NUMERO_TABULAR }}>
                            {fecha ? formatearFecha(fecha) : 'Sin fecha'}
                          </td>
                          <td style={{ padding: '0.75rem 0.8rem' }}>
                            <Badge variant="secondary" size="sm">
                              {intento.modoPractica || 'PRÁCTICA'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.75rem 0.8rem', fontWeight: 700, ...NUMERO_TABULAR }}>
                            {intento.puntaje != null
                              ? `${Math.round(Number(intento.puntaje) * 10) / 10} pts`
                              : '0 pts'}
                          </td>
                          <td style={{ padding: '0.75rem 0.8rem', ...NUMERO_TABULAR }}>
                            {formatearTiempo(Number(intento.duracionSegundos ?? 0))}
                          </td>
                          <td style={{ padding: '0.75rem 0.8rem' }}>
                            <Badge variant="neutral" size="sm">
                              {intento.fuentePrediccion || 'REGLAS'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.75rem 0.8rem' }}>
                            {intento.completado ? (
                              <Badge
                                variant="success"
                                size="sm"
                                icon={<CheckCircle2 size={12} />}
                              >
                                Completado
                              </Badge>
                            ) : (
                              <Badge
                                variant="warning"
                                size="sm"
                                icon={<AlertTriangle size={12} />}
                              >
                                Parcial
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default PanelDocente;
