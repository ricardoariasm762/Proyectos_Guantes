// Página de administración de versiones del modelo de IA (Acceso restringido a rol ADMIN)
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React, { useEffect, useState } from 'react';
import { listarVersiones, registrarVersion } from '../services/modeloIAService';
import type { ModeloIA } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Bot, PlusCircle, CheckCircle2, History, AlertCircle, RefreshCw } from 'lucide-react';

const AdminModelosIA: React.FC = () => {
  const [versiones, setVersiones] = useState<ModeloIA[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [form, setForm] = useState({
    version: '',
    accuracy: 0.95,
    numClases: 9,
    numMuestras: 150,
    descripcion: '',
    activo: true,
  });

  const cargar = async () => {
    setCargando(true);
    setMensajeError(null);
    try {
      const data = await listarVersiones();
      setVersiones(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.warn('Error al listar versiones de modelos:', err);
      setMensajeError('No se pudo conectar con el endpoint /api/ia/versiones del backend.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeExito(null);
    setMensajeError(null);

    try {
      const nuevaVersion = await registrarVersion({
        version: form.version.trim(),
        accuracy: Number(form.accuracy),
        numClases: Number(form.numClases),
        numMuestras: Number(form.numMuestras),
        descripcion: form.descripcion.trim(),
        activo: Boolean(form.activo),
      });

      setMensajeExito(`Versión ${nuevaVersion.version} registrada exitosamente.`);
      if (nuevaVersion.activo) {
        localStorage.setItem('versionModeloActiva', nuevaVersion.version);
      }

      setForm({
        version: '',
        accuracy: 0.95,
        numClases: 9,
        numMuestras: 150,
        descripcion: '',
        activo: false,
      });

      await cargar();
    } catch (err: unknown) {
      console.error('Error al registrar versión del modelo:', err);
      setMensajeError('Error al guardar la versión. Verifica tus permisos de administrador.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="admin-modelos-page" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.5rem', borderRadius: '10px' }}>
              <Bot size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              Administración de Modelos IA
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
            Registro, versionamiento y monitoreo de las redes neuronales de clasificación aséptica.
          </p>
        </div>

        <button
          type="button"
          onClick={cargar}
          disabled={cargando}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.9rem',
            background: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
          <span>Actualizar lista</span>
        </button>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{mensajeError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Formulario de Registro */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Registrar Nueva Versión</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Versión del Modelo *
              </label>
              <input
                type="text"
                placeholder="Ej: v1.0-2026-10"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Accuracy (0.0 - 1.0) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.95"
                  value={form.accuracy}
                  onChange={(e) => setForm({ ...form, accuracy: parseFloat(e.target.value) || 0 })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Nº Clases *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="9"
                  value={form.numClases}
                  onChange={(e) => setForm({ ...form, numClases: parseInt(e.target.value) || 9 })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Nº Muestras de Entrenamiento *
              </label>
              <input
                type="number"
                min="0"
                placeholder="150"
                value={form.numMuestras}
                onChange={(e) => setForm({ ...form, numMuestras: parseInt(e.target.value) || 0 })}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Descripción / Notas de Entrenamiento
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Modelo entrenado con dataset ampliado y regularización L2."
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <input
                type="checkbox"
                id="check-activo"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="check-activo" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#1E293B' }}>
                Marcar como versión activa inmediatamente
              </label>
            </div>

            <button
              type="submit"
              disabled={guardando}
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: guardando ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'opacity 0.2s',
              }}
            >
              {guardando ? 'Registrando versión...' : 'Registrar Versión'}
            </button>
          </form>
        </Card>

        {/* Tabla de Versiones Registradas */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <History size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Historial de Versiones</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Versión</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Accuracy</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Clases</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Muestras</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {versiones.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {cargando ? 'Cargando versiones desde el backend...' : 'No hay versiones registradas aún.'}
                    </td>
                  </tr>
                ) : (
                  versiones.map((v) => (
                    <tr key={v.id ?? v.version} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        {v.version}
                        {v.descripcion && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {v.descripcion}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontWeight: 700, color: v.accuracy >= 0.9 ? '#16A34A' : '#D97706' }}>
                          {(v.accuracy * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{v.numClases}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{v.numMuestras}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {v.fechaEntrenamiento ? new Date(v.fechaEntrenamiento).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {v.activo ? (
                          <Badge variant="primary" size="sm">Activa</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inactiva</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminModelosIA;
