// Dashboard principal del estudiante con métricas en tiempo real y gráficos Recharts
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProgresoStore } from '../store/useProgresoStore';
import { formatearTiempo, formatearFecha } from '../utils/puntuacion';
import {
  ClipboardCheck,
  Award,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  Box,
  HandMetal,
  Trophy,
  Activity,
  Calendar,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const {
    intentos,
    totalIntentos,
    promedioPuntaje,
    mejorTiempo,
    rachaActual,
  } = useProgresoStore();

  const numIntentos = totalIntentos();
  const promPuntaje = promedioPuntaje();
  const mejorSeg = mejorTiempo();
  const racha = rachaActual();

  // Preparar datos para el gráfico de los últimos 10 intentos (en orden cronológico)
  const ultimos10 = [...intentos].slice(0, 10).reverse();
  const chartData = ultimos10.map((item, idx) => ({
    indice: `#${idx + 1}`,
    fechaCorta: new Date(item.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
    puntaje: item.puntaje,
    modo: item.modo,
  }));

  const getModoBadge = (modo: string) => {
    switch (modo) {
      case 'guiado':
        return <Badge variant="primary" size="sm">Guiado</Badge>;
      case 'simulacion':
        return <Badge variant="secondary" size="sm">Simulación</Badge>;
      case 'desafio':
        return <Badge variant="warning" size="sm">Desafío</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{modo}</Badge>;
    }
  };

  return (
    <div className="dashboard-page">
      {/* Banner de Bienvenida y Acción Rápida */}
      <div className="quick-action-banner">
        <div>
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-soft)', fontWeight: 700 }}>
            Facultad de Ciencias de la Salud • Enfermería
          </span>
          <h2 className="banner-title">
            ¡Hola, {usuario ? usuario.nombre : 'Estudiante'}!
          </h2>
          <p className="banner-subtitle">
            Semestre {usuario?.semestre}° • Grupo {usuario?.grupo}. Bienvenido al simulador de técnica aséptica en postura de guantes quirúrgicos.
          </p>
        </div>

        <button
          type="button"
          className="btn-banner-action"
          onClick={() => navigate('/practica-guiada')}
        >
          <span>Iniciar Nueva Práctica</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Grid de 4 Estadísticas Clave Reales del Store */}
      <div className="dashboard-metrics-grid">
        <StatCard
          titulo="Total de Prácticas"
          valor={numIntentos}
          subtitulo={numIntentos === 0 ? 'Sin intentos registrados' : `${numIntentos} sesiones finalizadas`}
          icono={ClipboardCheck}
          colorIcono="primary"
          onClick={() => navigate('/practica-guiada')}
        />

        <StatCard
          titulo="Precisión Promedio"
          valor={`${promPuntaje}%`}
          subtitulo={promPuntaje >= 80 ? 'Nivel aséptico sobresaliente' : 'En proceso de fortalecimiento'}
          icono={Award}
          colorIcono="success"
        />

        <StatCard
          titulo="Mejor Tiempo"
          valor={mejorSeg > 0 ? formatearTiempo(mejorSeg) : '--:--'}
          subtitulo={mejorSeg > 0 ? 'Tiempo récord de postura' : 'Requiere completar práctica'}
          icono={Clock}
          colorIcono="secondary"
        />

        <StatCard
          titulo="Racha sin Errores"
          valor={`${racha} ${racha === 1 ? 'práctica' : 'prácticas'}`}
          subtitulo="Intentos consecutivos 100% asépticos"
          icono={Flame}
          colorIcono="warning"
        />
      </div>

      {/* Gráfico y Actividad Reciente */}
      <div className="dashboard-charts-grid">
        {/* Gráfico de Evolución con Recharts */}
        <Card
          titulo="Evolución del Puntaje Aséptico"
          subtitulo="Desempeño en los últimos intentos registrados"
          icono={<TrendingUp size={20} />}
        >
          {chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Activity size={44} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No hay datos suficientes para graficar.</p>
              <p style={{ fontSize: '0.85rem' }}>Realiza tu primera práctica guiada o simulación para visualizar tu curva de aprendizaje.</p>
              <button
                type="button"
                className="btn-primary-action"
                style={{ margin: '1rem auto 0', padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
                onClick={() => navigate('/practica-guiada')}
              >
                Comenzar Práctica
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', height: 260, marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0077b6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0077b6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="indice" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as { indice: string; puntaje: number; modo: string; fechaCorta: string };
                        return (
                          <div style={{ background: '#0f172a', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 700 }}>Intento {data.indice} ({data.fechaCorta})</div>
                            <div style={{ color: '#38bdf8' }}>Puntaje: {data.puntaje} / 100</div>
                            <div style={{ textTransform: 'capitalize', color: '#94a3b8', fontSize: '11px' }}>Modo: {data.modo}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="puntaje"
                    stroke="#0077b6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Actividad Reciente */}
        <Card
          titulo="Actividad Reciente"
          subtitulo="Últimos intentos guardados"
          icono={<Activity size={20} />}
          acciones={
            intentos.length > 0 && (
              <span
                style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/perfil')}
              >
                Ver todo
              </span>
            )
          }
        >
          {intentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>No hay registros recientes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {intentos.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      {getModoBadge(item.modo)}
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {formatearFecha(item.fecha)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      ⏱️ {formatearTiempo(item.tiempoSegundos)} • {item.errores} {item.errores === 1 ? 'error' : 'errores'}
                    </div>
                  </div>

                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: item.puntaje >= 80 ? 'var(--color-sterile-dark)' : 'var(--color-primary-dark)' }}>
                    {item.puntaje}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Accesos Rápidos a Módulos Didácticos */}
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>
          Módulos Didácticos Disponibles
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div
            className="card-container card-hover-effect"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            onClick={() => navigate('/tutorial3d')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary-ice)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box size={22} />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>Tutorial 3D</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Visor anatómico 360°</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Examine la cinemática de la postura de guantes con controles orbitales de cámara, velocidad y hotspots informativos.
            </p>
          </div>

          <div
            className="card-container card-hover-effect"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            onClick={() => navigate('/simulacion')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--color-sterile-bg)', color: 'var(--color-sterile-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HandMetal size={22} />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--color-sterile-dark)' }}>Simulación Háptica</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Drag & Drop con zonas</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Arrastre y calce los guantes distinguiendo en tiempo real el campo estéril de las áreas contaminadas con alertas sonoras.
            </p>
          </div>

          <div
            className="card-container card-hover-effect"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            onClick={() => navigate('/desafio')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={22} />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>Modo Desafío</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>5:00 min Contrarreloj</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Evaluación rápida sin pistas visuales. Tome decisiones asépticas precisas bajo presión de tiempo y califique en el Leaderboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;