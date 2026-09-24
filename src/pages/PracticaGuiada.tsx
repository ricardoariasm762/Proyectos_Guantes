// Módulo de Práctica Guiada Paso a Paso con progresión secuencial y control aséptico
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PASOS_TECNICA } from '../data/pasosTecnica';
import { useProgresoStore } from '../store/useProgresoStore';
import { useTimer } from '../hooks/useTimer';
import { formatearTiempo } from '../utils/puntuacion';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  ShieldAlert,
  Award,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

const PracticaGuiada: React.FC = () => {
  const navigate = useNavigate();
  const agregarIntento = useProgresoStore((state) => state.agregarIntento);

  const [pasoIndice, setPasoIndice] = useState(0); // 0 a 5
  const [pasosConfirmados, setPasosConfirmados] = useState<boolean[]>([false, false, false, false, false, false]);
  const [errores, setErrores] = useState(0);
  const [listaInfracciones, setListaInfracciones] = useState<string[]>([]);
  const [modalFinalizado, setModalFinalizado] = useState(false);
  const [resultadoIntento, setResultadoIntento] = useState<{
    puntaje: number;
    tiempoSegundos: number;
  } | null>(null);

  const { segundos, iniciar, pausar, reiniciar } = useTimer({
    autoInicio: true,
  });

  const pasoActual = PASOS_TECNICA[pasoIndice];
  const estaConfirmadoActual = pasosConfirmados[pasoIndice];
  const totalPasos = PASOS_TECNICA.length;
  const progresoPorcentaje = Math.round((pasosConfirmados.filter(Boolean).length / totalPasos) * 100);

  // Iniciar timer si no estaba corriendo
  useEffect(() => {
    iniciar();
    return () => pausar();
  }, [iniciar, pausar]);

  const toggleConfirmarPaso = () => {
    soundManager.playClick();
    const nuevos = [...pasosConfirmados];
    nuevos[pasoIndice] = !nuevos[pasoIndice];
    setPasosConfirmados(nuevos);
  };

  const registrarFalloAsepsia = () => {
    soundManager.playError();
    setErrores((prev) => prev + 1);
    const mensajeFallo = `Duda o error en Paso ${pasoActual.id}: ${pasoActual.titulo}`;
    setListaInfracciones((prev) => [...prev, mensajeFallo]);
  };

  const avanzarPaso = () => {
    if (!estaConfirmadoActual) return;
    soundManager.playClick();

    if (pasoIndice < totalPasos - 1) {
      setPasoIndice((prev) => prev + 1);
    } else {
      // Finalizar práctica
      pausar();
      const tiempoFinal = segundos;
      const deduccionErrores = errores * 10;
      const puntajeFinal = Math.max(0, 100 - deduccionErrores);

      const nuevo = agregarIntento({
        puntaje: puntajeFinal,
        tiempoSegundos: tiempoFinal,
        errores,
        pasosCompletados: totalPasos,
        modo: 'guiado',
        detallesErrores: listaInfracciones,
      });

      setResultadoIntento({
        puntaje: nuevo.puntaje,
        tiempoSegundos: nuevo.tiempoSegundos,
      });

      soundManager.playSuccess();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback silencioso si no hay soporte canvas
      }

      setModalFinalizado(true);
    }
  };

  const retrocederPaso = () => {
    if (pasoIndice > 0) {
      soundManager.playClick();
      setPasoIndice((prev) => prev - 1);
    }
  };

  const reiniciarTodo = () => {
    setPasoIndice(0);
    setPasosConfirmados([false, false, false, false, false, false]);
    setErrores(0);
    setListaInfracciones([]);
    setModalFinalizado(false);
    reiniciar(0);
    iniciar();
  };

  return (
    <div className="practica-guiada-page">
      <div className="page-header-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Práctica Guiada: Técnica Quirúrgica</h1>
            <p className="page-description">
              Siga estrictamente la secuencia paso a paso verificando los controles asépticos requeridos.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xs)' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                {formatearTiempo(segundos)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: errores > 0 ? 'var(--color-contaminated-bg)' : '#ffffff', padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-md)', border: `1px solid ${errores > 0 ? 'var(--color-contaminated-border)' : 'var(--border-light)'}`, boxShadow: 'var(--shadow-xs)' }}>
              <ShieldAlert size={18} style={{ color: errores > 0 ? 'var(--color-contaminated)' : 'var(--text-muted)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: errores > 0 ? 'var(--color-contaminated-dark)' : 'var(--text-secondary)' }}>
                {errores} {errores === 1 ? 'error' : 'errores'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div style={{ marginBottom: '1.75rem', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <ProgressBar
          valor={progresoPorcentaje}
          etiqueta={`Progreso de la técnica: Paso ${pasoIndice + 1} de ${totalPasos}`}
          mostrarPorcentaje={true}
          color={progresoPorcentaje === 100 ? 'success' : 'primary'}
        />

        {/* Indicadores de pasos rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
          {PASOS_TECNICA.map((p, idx) => {
            const estaEnEstePaso = idx === pasoIndice;
            const confirmado = pasosConfirmados[idx];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPasoIndice(idx)}
                style={{
                  padding: '0.45rem 0.2rem',
                  borderRadius: 'var(--radius-sm)',
                  border: estaEnEstePaso ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
                  background: confirmado ? 'var(--color-sterile-bg)' : estaEnEstePaso ? 'var(--color-primary-ice)' : 'var(--bg-muted)',
                  color: confirmado ? 'var(--color-sterile-dark)' : estaEnEstePaso ? 'var(--color-primary-dark)' : 'var(--text-secondary)',
                  fontWeight: estaEnEstePaso || confirmado ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>P{idx + 1}</span>
                {confirmado && <CheckCircle size={13} style={{ color: 'var(--color-sterile)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta del paso activo */}
      <Card
        titulo={`Paso ${pasoActual.id}: ${pasoActual.titulo}`}
        subtitulo={`Tiempo sugerido: ~${pasoActual.tiempoEstimadoSegundos}s`}
        icono={<BookOpen size={20} />}
        className="step-card-active"
        acciones={
          <Badge variant={estaConfirmadoActual ? 'success' : 'warning'}>
            {estaConfirmadoActual ? 'Paso Confirmado' : 'Pendiente de Validación'}
          </Badge>
        }
      >
        <p style={{ fontSize: '1rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          {pasoActual.descripcion}
        </p>

        {/* Puntos críticos clínicos */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
            Puntos Críticos de Asepsia (Criterios de Evaluación):
          </h4>
          <ul className="step-points-list">
            {pasoActual.puntosCriticos.map((punto, i) => (
              <li key={i} className="step-point-item">
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>•</span>
                <span>{punto}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consejo clínico */}
        <div className="step-tip-box">
          <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }} />
          <div>
            <strong>Regla aséptica clave:</strong> {pasoActual.consejoAsepsia}
          </div>
        </div>

        {/* Checkbox de confirmación y botón de registro de error */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={estaConfirmadoActual}
              onChange={toggleConfirmarPaso}
              style={{ width: '20px', height: '20px', accentColor: 'var(--color-sterile)', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: estaConfirmadoActual ? 'var(--color-sterile-dark)' : 'var(--text-main)' }}>
              He ejecutado y validado correctamente este paso
            </span>
          </label>

          <button
            type="button"
            onClick={registrarFalloAsepsia}
            style={{
              background: 'transparent',
              border: '1px dashed var(--color-contaminated)',
              color: 'var(--color-contaminated-dark)',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
            title="Registrar una duda, desliz o contacto indebido en este paso"
          >
            <ShieldAlert size={15} />
            <span>Registrar fallo o duda técnica (+1 error)</span>
          </button>
        </div>

        {/* Botones de navegación Anterior / Siguiente */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={retrocederPaso}
            disabled={pasoIndice === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              background: '#ffffff',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              cursor: pasoIndice === 0 ? 'not-allowed' : 'pointer',
              opacity: pasoIndice === 0 ? 0.5 : 1,
            }}
          >
            <ArrowLeft size={16} />
            <span>Anterior</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={reiniciarTodo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-muted)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              <span>Reiniciar</span>
            </button>

            <button
              type="button"
              onClick={avanzarPaso}
              disabled={!estaConfirmadoActual}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: estaConfirmadoActual
                  ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                  : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 700,
                cursor: estaConfirmadoActual ? 'pointer' : 'not-allowed',
                boxShadow: estaConfirmadoActual ? 'var(--shadow-md)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>{pasoIndice === totalPasos - 1 ? 'Finalizar Práctica' : 'Siguiente Paso'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {/* Modal de Finalización */}
      <Modal
        isOpen={modalFinalizado}
        onClose={() => setModalFinalizado(false)}
        title="¡Práctica Guiada Completada!"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={reiniciarTodo}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Repetir Práctica
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-primary-action"
              style={{ margin: 0, padding: '0.6rem 1.25rem' }}
            >
              Ir al Dashboard
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1rem', borderRadius: '50%', background: 'var(--color-sterile-bg)', color: 'var(--color-sterile)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={36} />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
            Puntaje Obtenido: {resultadoIntento?.puntaje ?? 0} / 100
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {resultadoIntento && resultadoIntento.puntaje >= 80
              ? '¡Excelente ejecución aséptica! Demuestra alto apego a la técnica estéril.'
              : 'Práctica completada. Revise los puntos críticos de asepsia para disminuir infracciones.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIEMPO</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {formatearTiempo(resultadoIntento?.tiempoSegundos ?? 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ERRORES</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: errores > 0 ? 'var(--color-contaminated)' : 'var(--color-sterile)' }}>
                {errores}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PASOS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                6 / 6
              </div>
            </div>
          </div>

          {listaInfracciones.length > 0 && (
            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-contaminated-dark)', marginBottom: '0.35rem' }}>
                Infracciones registradas durante la práctica:
              </div>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
                {listaInfracciones.map((inf, i) => (
                  <li key={i}>{inf}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PracticaGuiada;