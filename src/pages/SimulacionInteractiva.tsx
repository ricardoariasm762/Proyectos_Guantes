// Simulación interactiva háptica con Drag and Drop y detección de zonas asépticas
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useProgresoStore } from '../store/useProgresoStore';
import { useTimer } from '../hooks/useTimer';
import { formatearTiempo, calcularPrecision } from '../utils/puntuacion';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  HandMetal,
  ShieldAlert,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Award,
  Info,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { registrarIntento } from '../services/intentoService';
import { procesarColocacion } from '../utils/simulacionInteractivaLogic';

interface ObjetoArrastrableProps {
  id: string;
  etiqueta: string;
  icono: string;
  descripcion: string;
  bloqueado?: boolean;
  seleccionado?: boolean;
  onSeleccionar?: () => void;
}

const ObjetoArrastrable: React.FC<ObjetoArrastrableProps> = ({
  id,
  etiqueta,
  icono,
  descripcion,
  bloqueado = false,
  seleccionado = false,
  onSeleccionar,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: bloqueado,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.75 : bloqueado ? 0.45 : 1,
    cursor: bloqueado ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`draggable-item-card ${seleccionado ? 'item-selected-tap' : ''}`}
      onClick={(e) => {
        if (!bloqueado && onSeleccionar) {
          e.stopPropagation();
          onSeleccionar();
        }
      }}
      role="button"
      tabIndex={bloqueado ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !bloqueado && onSeleccionar) {
          e.preventDefault();
          onSeleccionar();
        }
      }}
      aria-pressed={seleccionado}
    >
      <div
        style={{
          background: bloqueado ? 'var(--bg-muted)' : seleccionado ? '#f0f9ff' : '#ffffff',
          border: isDragging
            ? '2px solid var(--color-primary)'
            : seleccionado
            ? '2px solid #0284c7'
            : '2px solid var(--color-primary-soft)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: isDragging
            ? 'var(--shadow-xl)'
            : seleccionado
            ? '0 0 0 3px rgba(56, 189, 248, 0.4), var(--shadow-md)'
            : 'var(--shadow-sm)',
          userSelect: 'none',
          minHeight: '44px',
        }}
      >
        <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>{icono}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary-dark)' }}>
            {etiqueta}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {descripcion}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ZonaObjetivoProps {
  id: string;
  tipo: 'esteril' | 'contaminada';
  titulo: string;
  subtitulo: string;
  icono: React.ReactNode;
  estaCalzada?: boolean;
  seleccionActiva?: boolean;
  onClickZona?: () => void;
}

const ZonaObjetivo: React.FC<ZonaObjetivoProps> = ({
  id,
  tipo,
  titulo,
  subtitulo,
  icono,
  estaCalzada = false,
  seleccionActiva = false,
  onClickZona,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const esEsteril = tipo === 'esteril';
  const destacada = isOver || seleccionActiva;

  return (
    <div
      ref={setNodeRef}
      onClick={() => {
        if (onClickZona) onClickZona();
      }}
      role={seleccionActiva ? 'button' : undefined}
      tabIndex={seleccionActiva ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClickZona) {
          e.preventDefault();
          onClickZona();
        }
      }}
      style={{
        flex: 1,
        borderRadius: 'var(--radius-lg)',
        border: `3px dashed ${
          isOver
            ? esEsteril
              ? 'var(--color-sterile)'
              : 'var(--color-contaminated)'
            : seleccionActiva
            ? esEsteril
              ? 'var(--color-primary)'
              : 'var(--color-contaminated)'
            : esEsteril
            ? 'var(--color-sterile-border)'
            : 'var(--color-contaminated-border)'
        }`,
        background: isOver
          ? esEsteril
            ? 'var(--color-sterile-bg)'
            : 'var(--color-contaminated-bg)'
          : seleccionActiva
          ? esEsteril
            ? 'rgba(224, 242, 254, 0.65)'
            : 'rgba(254, 226, 226, 0.65)'
          : esEsteril
          ? 'rgba(236, 253, 245, 0.45)'
          : 'rgba(254, 242, 242, 0.45)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'all 0.15s ease',
        minHeight: '170px',
        boxShadow: destacada ? 'var(--shadow-md)' : 'none',
        cursor: seleccionActiva ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: esEsteril ? 'var(--color-sterile-bg)' : 'var(--color-contaminated-bg)',
          color: esEsteril ? 'var(--color-sterile-dark)' : 'var(--color-contaminated-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem',
        }}
      >
        {icono}
      </div>

      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: esEsteril ? 'var(--color-sterile-dark)' : 'var(--color-contaminated-dark)' }}>
        {titulo}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
        {estaCalzada ? '¡Guante calzado con técnica aséptica!' : subtitulo}
      </div>

      {estaCalzada && (
        <Badge variant="success" size="sm" icon={<CheckCircle2 size={12} />}>
          Calzada
        </Badge>
      )}
    </div>
  );
};

const SimulacionInteractiva: React.FC = () => {
  const navigate = useNavigate();
  const agregarIntento = useProgresoStore((state) => state.agregarIntento);

  // Fases de la simulación:
  // 1: Colocar Guante Derecho en Mano Derecha
  // 2: Colocar Guante Izquierdo en Mano Izquierda con mano derecha enguantada
  // 3: Ajuste de puños
  const [faseActual, setFaseActual] = useState<1 | 2 | 3>(1);
  const [manoDerechaCalzada, setManoDerechaCalzada] = useState(false);
  const [manoIzquierdaCalzada, setManoIzquierdaCalzada] = useState(false);
  const [punosAjustados, setPunosAjustados] = useState(false);
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState<string | null>(null);

  const [errores, setErrores] = useState(0);
  const [mensajeAlerta, setMensajeAlerta] = useState<string | null>(null);
  const [alertaEsError, setAlertaEsError] = useState(false);
  const [modalExito, setModalExito] = useState(false);
  const [puntajeFinal, setPuntajeFinal] = useState(0);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 6,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 120,
      tolerance: 8,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const { segundos, iniciar, pausar, reiniciar } = useTimer({
    autoInicio: true,
  });

  useEffect(() => {
    iniciar();
    return () => pausar();
  }, [iniciar, pausar]);

  const ejecutarColocacion = (arrastradoId: string, destinoId: string) => {
    const estadoPrevio = {
      faseActual,
      manoDerechaCalzada,
      manoIzquierdaCalzada,
      punosAjustados,
      insumoSeleccionadoId,
      errores,
      mensajeAlerta,
      alertaEsError,
      simulacionFinalizada: false,
    };

    const siguiente = procesarColocacion(estadoPrevio, arrastradoId, destinoId);

    if (siguiente.alertaEsError) {
      soundManager.playError();
    } else {
      soundManager.playSuccess();
    }

    setFaseActual(siguiente.faseActual);
    setManoDerechaCalzada(siguiente.manoDerechaCalzada);
    setManoIzquierdaCalzada(siguiente.manoIzquierdaCalzada);
    setPunosAjustados(siguiente.punosAjustados);
    setErrores(siguiente.errores);
    setAlertaEsError(siguiente.alertaEsError);
    setMensajeAlerta(siguiente.mensajeAlerta);
    setInsumoSeleccionadoId(siguiente.insumoSeleccionadoId);

    if (siguiente.simulacionFinalizada) {
      finalizarSimulacion();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setInsumoSeleccionadoId(null);
    const { active, over } = event;
    if (!over) return;

    ejecutarColocacion(active.id.toString(), over.id.toString());
  };

  const handleZonaClick = (destinoId: string) => {
    if (insumoSeleccionadoId) {
      ejecutarColocacion(insumoSeleccionadoId, destinoId);
    }
  };

  const handleSeleccionarInsumo = (id: string) => {
    setInsumoSeleccionadoId((prev) => (prev === id ? null : id));
  };

  const finalizarSimulacion = () => {
    pausar();
    const tiempoTotal = segundos;
    const precision = calcularPrecision(errores, 3);
    const score = Math.max(0, Math.min(100, Math.round(precision - (tiempoTotal > 120 ? 10 : 0))));

    setPuntajeFinal(score);

    agregarIntento({
      puntaje: score,
      tiempoSegundos: tiempoTotal,
      errores,
      pasosCompletados: 6,
      modo: 'simulacion',
    });

    // Registrar también en el backend para que el docente lo vea y quede en todos los dispositivos
    void registrarIntento({
      puntaje: score,
      tiempoSegundos: tiempoTotal,
      errores,
      pasosCompletados: 6,
      modo: 'SIMULACION',
    });

    try {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // Fallback
    }

    setModalExito(true);
  };

  const reiniciarSimulacion = () => {
    setFaseActual(1);
    setManoDerechaCalzada(false);
    setManoIzquierdaCalzada(false);
    setPunosAjustados(false);
    setInsumoSeleccionadoId(null);
    setErrores(0);
    setMensajeAlerta(null);
    setModalExito(false);
    reiniciar(0);
    iniciar();
  };

  const precisionActual = calcularPrecision(errores, faseActual);

  return (
    <div className="simulacion-interactiva-page">
      <div className="page-header-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge-pill badge-primary badge-size-sm">
                <HandMetal size={14} /> Espacio Háptico
              </span>
              <span className="badge-pill badge-secondary badge-size-sm">Técnica Abierta</span>
            </div>
            <h1 className="page-title">Simulación Interactiva Drag & Drop</h1>
            <p className="page-description">
              Arrastre o toque para seleccionar y calzar los guantes quirúrgicos evitando el contacto con cualquier superficie contaminada.
            </p>
          </div>

          <div className="simulacion-stats-bar">
            <div className="simulacion-stat-card">
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                {formatearTiempo(segundos)}
              </span>
            </div>

            <div className={`simulacion-stat-card ${errores > 0 ? 'stat-card-error' : ''}`}>
              <ShieldAlert size={18} style={{ color: errores > 0 ? 'var(--color-contaminated)' : 'var(--text-muted)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: errores > 0 ? 'var(--color-contaminated-dark)' : 'var(--text-secondary)' }}>
                {errores} {errores === 1 ? 'error' : 'errores'}
              </span>
            </div>

            <div className="simulacion-stat-card stat-card-precision">
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                {precisionActual}% Precisión
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de Fase */}
      <div style={{ marginBottom: '1.25rem', background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <ProgressBar
          valor={punosAjustados ? 100 : faseActual === 1 ? 33 : faseActual === 2 ? 66 : 90}
          etiqueta={`Etapa ${faseActual} de 3: ${
            faseActual === 1
              ? 'Calzar mano dominante (derecha)'
              : faseActual === 2
              ? 'Calzar mano izquierda (técnica de bolsillo estéril)'
              : 'Ajuste final de ambos puños sin tocar piel'
          }`}
          color={faseActual === 3 && punosAjustados ? 'success' : 'primary'}
        />
      </div>

      {/* Alerta de Feedback Didáctico */}
      {mensajeAlerta && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: alertaEsError ? 'var(--color-contaminated-bg)' : 'var(--color-sterile-bg)',
            border: `1px solid ${alertaEsError ? 'var(--color-contaminated-border)' : 'var(--color-sterile-border)'}`,
            color: alertaEsError ? 'var(--color-contaminated-dark)' : 'var(--color-sterile-dark)',
            fontSize: '0.92rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {alertaEsError ? <AlertOctagon size={20} /> : <CheckCircle2 size={20} />}
          <span>{mensajeAlerta}</span>
        </div>
      )}

      {/* Tablero Háptico con DndContext */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="simulacion-canvas-board">
          {/* Barra superior de herramientas arrastrables */}
          <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Info size={16} />
              <span>Elementos disponibles en la envoltura estéril:</span>
            </div>

            <div className="supplies-cards-wrap">
              <ObjetoArrastrable
                id="draggable-guante-derecho"
                etiqueta="Guante Derecho"
                icono="🧤"
                descripcion="Pinza sobre cara interna del puño"
                bloqueado={manoDerechaCalzada}
                seleccionado={insumoSeleccionadoId === 'draggable-guante-derecho'}
                onSeleccionar={() => handleSeleccionarInsumo('draggable-guante-derecho')}
              />

              <ObjetoArrastrable
                id="draggable-guante-izquierdo"
                etiqueta="Guante Izquierdo"
                icono="🧤"
                descripcion="Bolsillo estéril bajo el puño"
                bloqueado={!manoDerechaCalzada || manoIzquierdaCalzada}
                seleccionado={insumoSeleccionadoId === 'draggable-guante-izquierdo'}
                onSeleccionar={() => handleSeleccionarInsumo('draggable-guante-izquierdo')}
              />

              <ObjetoArrastrable
                id="draggable-ajuste-punos"
                etiqueta="Ajuste de Puños"
                icono="✨"
                descripcion="Desdoblar puños sin rozar piel"
                bloqueado={!manoDerechaCalzada || !manoIzquierdaCalzada || punosAjustados}
                seleccionado={insumoSeleccionadoId === 'draggable-ajuste-punos'}
                onSeleccionar={() => handleSeleccionarInsumo('draggable-ajuste-punos')}
              />
            </div>
          </div>

          {/* Notificación didáctica si el modo toque está activo */}
          {insumoSeleccionadoId && (
            <div
              style={{
                background: '#e0f2fe',
                borderBottom: '1px solid #bae6fd',
                color: '#0369a1',
                padding: '0.55rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <span>👆 Modo táctil activo: Toca la zona receptora correspondiente para colocarlo.</span>
              <button
                type="button"
                onClick={() => setInsumoSeleccionadoId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px',
                }}
              >
                Cancelar selección
              </button>
            </div>
          )}

          {/* Superficie de la mesa quirúrgica */}
          <div className="surgical-table-surface" style={{ minHeight: '340px' }}>
            {/* ZONA ESTÉRIL (CAMPO QUIRÚRGICO) */}
            <div className="zone-sterile-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-sterile-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ CAMPO ESTÉRIL QUIRÚRGICO (ZONA SEGURA)
                </span>
                <Badge variant="success" size="sm">Asepsia Garantizada</Badge>
              </div>

              {/* Objetivos droppables: Manos receptoras */}
              <div className="sterile-droppables-grid">
                <ZonaObjetivo
                  id="droppable-mano-derecha"
                  tipo="esteril"
                  titulo="Mano Derecha Receptora"
                  subtitulo="Arrastre o toque aquí para calzar el guante derecho"
                  icono={<HandMetal size={24} />}
                  estaCalzada={manoDerechaCalzada}
                  seleccionActiva={insumoSeleccionadoId !== null}
                  onClickZona={() => handleZonaClick('droppable-mano-derecha')}
                />

                <ZonaObjetivo
                  id="droppable-mano-izquierda"
                  tipo="esteril"
                  titulo="Mano Izquierda Receptora"
                  subtitulo="Arrastre o toque aquí para calzar el guante izquierdo"
                  icono={<HandMetal size={24} />}
                  estaCalzada={manoIzquierdaCalzada}
                  seleccionActiva={insumoSeleccionadoId !== null}
                  onClickZona={() => handleZonaClick('droppable-mano-izquierda')}
                />

                <ZonaObjetivo
                  id="droppable-campo-esteril-central"
                  tipo="esteril"
                  titulo="Zona de Ajuste Final"
                  subtitulo="Suelte o toque aquí para desdoblar puños"
                  icono={<CheckCircle2 size={24} />}
                  estaCalzada={punosAjustados}
                  seleccionActiva={insumoSeleccionadoId !== null}
                  onClickZona={() => handleZonaClick('droppable-campo-esteril-central')}
                />
              </div>
            </div>

            {/* ZONA CONTAMINADA (ZONA DE PELIGRO) */}
            <div className="zone-contaminated-area">
              <ZonaObjetivo
                id="droppable-zona-contaminada"
                tipo="contaminada"
                titulo="Área Contaminada"
                subtitulo="Borde de mesa / No estéril"
                icono={<AlertOctagon size={28} />}
                seleccionActiva={insumoSeleccionadoId !== null}
                onClickZona={() => handleZonaClick('droppable-zona-contaminada')}
              />
            </div>
          </div>

          {/* Barra inferior de suelo/zona bajo cintura */}
          <div className="simulacion-bottom-bar">
            <div style={{ fontSize: '0.8rem', color: 'var(--color-contaminated-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertOctagon size={16} />
              <span>Zona bajo nivel de cintura: Todo contacto accidental provocará contaminación inmediata.</span>
            </div>

            <button
              type="button"
              onClick={reiniciarSimulacion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#ffffff',
                border: '1px solid var(--border-strong)',
                padding: '0.55rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '40px',
              }}
            >
              <RotateCcw size={14} />
              <span>Reiniciar Simulación</span>
            </button>
          </div>
        </div>
      </DndContext>

      {/* Modal de Éxito al calzar ambas manos */}
      <Modal
        isOpen={modalExito}
        onClose={() => setModalExito(false)}
        title="¡Simulación Quirúrgica Exitosa!"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={reiniciarSimulacion}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Repetir Simulación
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

          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
            Puntaje de Simulación: {puntajeFinal} / 100
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
            Has completado la colocación aséptica de ambos guantes quirúrgicos respetando los límites de campo estéril.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '1rem', background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIEMPO</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary-dark)', fontFamily: 'monospace' }}>
                {formatearTiempo(segundos)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTAMINACIONES</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: errores > 0 ? 'var(--color-contaminated)' : 'var(--color-sterile)' }}>
                {errores}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRECISIÓN</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {precisionActual}%
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SimulacionInteractiva;