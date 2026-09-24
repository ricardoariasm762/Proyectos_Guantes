// Perfil del estudiante con edición de datos, estadísticas globales e historial editable
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useProgresoStore } from '../store/useProgresoStore';
import { formatearTiempo, formatearFecha } from '../utils/puntuacion';
import { soundManager } from '../utils/sound';
import {
  User,
  BookOpen,
  Users,
  Award,
  Clock,
  Trash2,
  Edit3,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const Perfil: React.FC = () => {
  const { usuario, actualizarUsuario } = useAuthStore();
  const {
    intentos,
    eliminarIntento,
    reiniciarProgreso,
    totalIntentos,
    promedioPuntaje,
    tiempoTotalSegundos,
  } = useProgresoStore();

  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [modalReiniciarAbierto, setModalReiniciarAbierto] = useState(false);
  const [filtroModo, setFiltroModo] = useState<'todos' | 'guiado' | 'simulacion' | 'desafio'>('todos');

  // Estado del formulario de edición
  const [editNombre, setEditNombre] = useState(usuario?.nombre || '');
  const [editSemestre, setEditSemestre] = useState(usuario?.semestre || 5);
  const [editGrupo, setEditGrupo] = useState(usuario?.grupo || 'A');

  const abrirModalEditar = () => {
    setEditNombre(usuario?.nombre || '');
    setEditSemestre(usuario?.semestre || 5);
    setEditGrupo(usuario?.grupo || 'A');
    setModalEditarAbierto(true);
  };

  const guardarEdicionPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarUsuario({
      nombre: editNombre.trim(),
      semestre: Number(editSemestre),
      grupo: editGrupo.trim().toUpperCase(),
    });
    soundManager.playSuccess();
    setModalEditarAbierto(false);
  };

  const confirmarReinicio = () => {
    soundManager.playError();
    reiniciarProgreso();
    setModalReiniciarAbierto(false);
  };

  const handleEliminarIntento = (id: string) => {
    soundManager.playClick();
    eliminarIntento(id);
  };

  const intentosFiltrados = intentos.filter((item) => {
    if (filtroModo === 'todos') return true;
    return item.modo === filtroModo;
  });

  const mejorPuntajeHistorico = intentos.length > 0 ? Math.max(...intentos.map((i) => i.puntaje)) : 0;

  return (
    <div className="perfil-page">
      <div className="page-header-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Perfil del Estudiante</h1>
            <p className="page-description">
              Información académica, métricas consolidadas e historial de entrenamiento clínico.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={abrirModalEditar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ffffff',
                border: '1px solid var(--border-strong)',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.88rem',
                color: 'var(--color-primary-dark)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <Edit3 size={16} />
              <span>Editar Datos</span>
            </button>

            <button
              type="button"
              onClick={() => setModalReiniciarAbierto(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--color-contaminated-bg)',
                border: '1px solid var(--color-contaminated-border)',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.88rem',
                color: 'var(--color-contaminated-dark)',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
              <span>Reiniciar Progreso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta de Información Académica del Estudiante */}
      <Card
        titulo="Datos del Estudiante"
        subtitulo="Universidad Cooperativa de Colombia • Campus Pasto"
        icono={<User size={20} />}
        className="mb-6"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-ice)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>NOMBRE COMPLETO</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {usuario?.nombre || 'No asignado'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-sterile-bg)', color: 'var(--color-sterile-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROGRAMA Y SEMESTRE</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Enfermería • {usuario?.semestre}° Semestre
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GRUPO / SECCIÓN</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Grupo {usuario?.grupo || 'A'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de Estadísticas Globales */}
      <div className="dashboard-metrics-grid" style={{ marginTop: '1.5rem', marginBottom: '1.75rem' }}>
        <StatCard
          titulo="Total Intentos"
          valor={totalIntentos()}
          subtitulo="Prácticas acumuladas"
          icono={CheckCircle}
          colorIcono="primary"
        />

        <StatCard
          titulo="Puntaje Promedio"
          valor={`${promedioPuntaje()}%`}
          subtitulo="Rendimiento general"
          icono={Award}
          colorIcono="success"
        />

        <StatCard
          titulo="Mejor Puntaje"
          valor={`${mejorPuntajeHistorico} pts`}
          subtitulo="Calificación máxima obtenida"
          icono={Award}
          colorIcono="purple"
        />

        <StatCard
          titulo="Tiempo Acumulado"
          valor={formatearTiempo(tiempoTotalSegundos())}
          subtitulo="Total practicado"
          icono={Clock}
          colorIcono="secondary"
        />
      </div>

      {/* Historial Completo de Prácticas */}
      <Card
        titulo="Historial de Prácticas Quirúrgicas"
        subtitulo="Registro detallado de todos los intentos almacenados"
        icono={<Clock size={20} />}
        acciones={
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['todos', 'guiado', 'simulacion', 'desafio'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFiltroModo(m)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: filtroModo === m ? '1px solid var(--color-primary)' : '1px solid var(--border-light)',
                  background: filtroModo === m ? 'var(--color-primary-ice)' : '#ffffff',
                  color: filtroModo === m ? 'var(--color-primary-dark)' : 'var(--text-secondary)',
                  fontWeight: filtroModo === m ? 700 : 500,
                  fontSize: '0.75rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        }
      >
        {intentosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>No hay intentos registrados con el filtro seleccionado.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Modo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Duración</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Errores</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Puntuación</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {intentosFiltrados.map((intento) => {
                  let badgeVariant: 'primary' | 'secondary' | 'warning' = 'primary';
                  if (intento.modo === 'simulacion') badgeVariant = 'secondary';
                  if (intento.modo === 'desafio') badgeVariant = 'warning';

                  return (
                    <tr
                      key={intento.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: 'var(--text-main)' }}>
                        {formatearFecha(intento.fecha)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={badgeVariant} size="sm">
                          {intento.modo.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatearTiempo(intento.tiempoSegundos)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ color: intento.errores > 0 ? 'var(--color-contaminated)' : 'var(--color-sterile-dark)', fontWeight: 600 }}>
                          {intento.errores} {intento.errores === 1 ? 'error' : 'errores'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: intento.puntaje >= 80 ? 'var(--color-sterile-dark)' : 'var(--color-primary-dark)' }}>
                          {intento.puntaje} / 100
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleEliminarIntento(intento.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            borderRadius: 'var(--radius-sm)',
                          }}
                          title="Eliminar este intento del historial"
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-contaminated)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={16} />
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

      {/* Modal para Editar Datos del Estudiante */}
      <Modal
        isOpen={modalEditarAbierto}
        onClose={() => setModalEditarAbierto(false)}
        title="Modificar Datos del Estudiante"
        size="md"
      >
        <form onSubmit={guardarEdicionPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="edit-nombre">Nombre Completo:</label>
            <input
              id="edit-nombre"
              type="text"
              required
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              placeholder="Ej. María Camila Narváez"
            />
          </div>

          <div className="form-row-two-col">
            <div className="form-group">
              <label htmlFor="edit-semestre">Semestre:</label>
              <select
                id="edit-semestre"
                value={editSemestre}
                onChange={(e) => setEditSemestre(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num}° Semestre
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-grupo">Grupo:</label>
              <input
                id="edit-grupo"
                type="text"
                required
                value={editGrupo}
                onChange={(e) => setEditGrupo(e.target.value)}
                placeholder="Ej. A o B"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setModalEditarAbierto(false)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              style={{ margin: 0, padding: '0.6rem 1.25rem' }}
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación para Reiniciar Progreso */}
      <Modal
        isOpen={modalReiniciarAbierto}
        onClose={() => setModalReiniciarAbierto(false)}
        title="¿Reiniciar todo el historial de práctica?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalReiniciarAbierto(false)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarReinicio}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-contaminated)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sí, Borrar Historial
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--color-contaminated)', flexShrink: 0 }}>
            <AlertTriangle size={36} />
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Esta acción eliminará de forma irreversible todos los intentos de práctica, estadísticas de precisión y tiempos almacenados en este navegador.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Perfil;