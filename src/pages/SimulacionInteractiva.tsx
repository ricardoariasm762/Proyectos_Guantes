// Simulación interactiva háptica con Drag and Drop y detección de zonas asépticas
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
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

interface ObjetoArrastrableProps {
  id: string;
  etiqueta: string;
  icono: string;
  descripcion: string;
  bloqueado?: boolean;
}

const ObjetoArrastrable: React.FC<ObjetoArrastrableProps> = ({
  id,
  etiqueta,
  icono,
  descripcion,
  bloqueado = false,
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
      className="draggable-item-card"
    >
      <div
        style={{
          background: bloqueado ? 'var(--bg-muted)' : '#ffffff',
          border: isDragging ? '2px solid var(--color-primary)' : '2px solid var(--color-primary-soft)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: isDragging ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: '1.75rem' }}>{icono}</div>
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
}

const ZonaObjetivo: React.FC<ZonaObjetivoProps> = ({
  id,
  tipo,
  titulo,
  subtitulo,
  icono,
  estaCalzada = false,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const esEsteril = tipo === 'esteril';

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        borderRadius: 'var(--radius-lg)',
        border: `3px dashed ${
          isOver
            ? esEsteril
              ? 'var(--color-sterile)'
              : 'var(--color-contaminated)'
            : esEsteril
            ? 'var(--color-sterile-border)'
            : 'var(--color-contaminated-border)'
        }`,
        background: isOver
          ? esEsteril
            ? 'var(--color-sterile-bg)'
            : 'var(--color-contaminated-bg)'
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
        boxShadow: isOver ? 'var(--shadow-md)' : 'none',
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

  const [errores, setErrores] = useState(0);
  const [mensajeAlerta, setMensajeAlerta] = useState<string | null>(null);
  const [alertaEsError, setAlertaEsError] = useState(false);
  const [modalExito, setModalExito] = useState(false);
  const [puntajeFinal, setPuntajeFinal] = useState(0);

  const { segundos, iniciar, pausar, reiniciar } = useTimer({
    autoInicio: true,
  });

  useEffect(() => {
    iniciar();
    return () => pausar();
  }, [iniciar, pausar]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const arrastradoId = active.id.toString();
    const destinoId = over.id.toString();

    // 1. Detección de contacto con zonas contaminadas
    if (destinoId === 'droppable-zona-contaminada' || destinoId === 'droppable-suelo-quirurgico') {
      soundManager.playError();
      setErrores((prev) => prev + 1);
      setAlertaEsError(true);
      setMensajeAlerta(
        '¡CONTAMINACIÓN INMEDIATA! El insumo tocó una superficie no estéril. En quirófano real, este guante debe desecharse.'
      );
      return;
    }

    // 2. Lógica para Fase 1: Calzar Guante Derecho
    if (faseActual === 1) {
      if (arrastradoId === 'draggable-guante-derecho') {
        if (destinoId === 'droppable-mano-derecha') {
          soundManager.playSuccess();
          setManoDerechaCalzada(true);
          setFaseActual(2);
          setAlertaEsError(false);
          setMensajeAlerta('¡Excelente! Mano derecha calzada tomando únicamente el borde doblado.');
        } else if (destinoId === 'droppable-mano-izquierda') {
          soundManager.playError();
          setErrores((prev) => prev + 1);
          setAlertaEsError(true);
          setMensajeAlerta('Error: Intentas calzar el guante derecho en la mano izquierda.');
        }
      } else {
        soundManager.playError();
        setErrores((prev) => prev + 1);
        setAlertaEsError(true);
        setMensajeAlerta('Debes comenzar tomando el guante de tu mano dominante (derecho).');
      }
    }

    // 3. Lógica para Fase 2: Calzar Guante Izquierdo
    else if (faseActual === 2) {
      if (arrastradoId === 'draggable-guante-izquierdo') {
        if (destinoId === 'droppable-mano-izquierda') {
          soundManager.playSuccess();
          setManoIzquierdaCalzada(true);
          setFaseActual(3);
          setAlertaEsError(false);
          setMensajeAlerta('¡Perfecto! Mano izquierda calzada con técnica de bolsillo estéril.');
        } else {
          soundManager.playError();
          setErrores((prev) => prev + 1);
          setAlertaEsError(true);
          setMensajeAlerta('El guante izquierdo debe calzarse en la mano izquierda receptora.');
        }
      }
    }

    // 4. Lógica para Fase 3: Ajuste de Puños
    else if (faseActual === 3) {
      if (arrastradoId === 'draggable-ajuste-punos') {
        if (destinoId === 'droppable-campo-esteril-central') {
          soundManager.playSuccess();
          setPunosAjustados(true);
          finalizarSimulacion();
        } else {
          soundManager.playError();
          setErrores((prev) => prev + 1);
          setAlertaEsError(true);
          setMensajeAlerta('El ajuste de puños debe hacerse en la zona segura estéril sin tocar piel.');
        }
      }
    }
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
              Arrastre y calce los guantes quirúrgicos evitando el contacto con cualquier superficie contaminada.
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary-ice)', padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-soft)' }}>
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
      <DndContext onDragEnd={handleDragEnd}>
        <div className="simulacion-canvas-board">
          {/* Barra superior de herramientas arrastrables */}
          <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Info size={16} />
              <span>Elementos disponibles en la envoltura estéril:</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <ObjetoArrastrable
                id="draggable-guante-derecho"
                etiqueta="Guante Derecho"
                icono="🧤"
                descripcion="Pinza sobre cara interna del puño"
                bloqueado={manoDerechaCalzada}
              />

              <ObjetoArrastrable
                id="draggable-guante-izquierdo"
                etiqueta="Guante Izquierdo"
                icono="🧤"
                descripcion="Bolsillo estéril bajo el puño"
                bloqueado={!manoDerechaCalzada || manoIzquierdaCalzada}
              />

              <ObjetoArrastrable
                id="draggable-ajuste-punos"
                etiqueta="Ajuste de Puños"
                icono="✨"
                descripcion="Desdoblar puños sin rozar piel"
                bloqueado={!manoDerechaCalzada || !manoIzquierdaCalzada || punosAjustados}
              />
            </div>
          </div>

          {/* Superficie de la mesa quirúrgica */}
          <div className="surgical-table-surface" style={{ minHeight: '340px' }}>
            {/* ZONA ESTÉRIL (CAMPO QUIRÚRGICO) */}
            <div className="zone-sterile-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-sterile-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ CAMPO ESTÉRIL QUIRÚRGICO (ZONA SEGURA)
                </span>
                <Badge variant="success" size="sm">Asepsia Garantizada</Badge>
              </div>

              {/* Objetivos droppables: Manos receptoras */}
              <div style={{ display: 'flex', gap: '1.25rem', flex: 1 }}>
                <ZonaObjetivo
                  id="droppable-mano-derecha"
                  tipo="esteril"
                  titulo="Mano Derecha Receptora"
                  subtitulo="Arrastre aquí el guante derecho"
                  icono={<HandMetal size={24} />}
                  estaCalzada={manoDerechaCalzada}
                />

                <ZonaObjetivo
                  id="droppable-mano-izquierda"
                  tipo="esteril"
                  titulo="Mano Izquierda Receptora"
                  subtitulo="Arrastre aquí el guante izquierdo"
                  icono={<HandMetal size={24} />}
                  estaCalzada={manoIzquierdaCalzada}
                />

                <ZonaObjetivo
                  id="droppable-campo-esteril-central"
                  tipo="esteril"
                  titulo="Zona de Ajuste Final"
                  subtitulo="Suelte aquí para desdoblar puños"
                  icono={<CheckCircle2 size={24} />}
                  estaCalzada={punosAjustados}
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
              />
            </div>
          </div>

          {/* Barra inferior de suelo/zona bajo cintura */}
          <div style={{ background: '#f1f5f9', borderTop: '1px solid var(--border-light)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
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