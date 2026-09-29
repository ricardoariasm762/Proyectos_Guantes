// Panel lateral con feedback biomecánico en vivo, progreso y telemetría de técnica estéril
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React from 'react';
import type { PasoSimulacion, ResultadoValidacion } from '../types/mediapipe';
import { formatearTiempo } from '../utils/puntuacion';
import {
  Clock,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ShieldCheck,
  Check,
} from 'lucide-react';
import ProgressBar from './ui/ProgressBar';

export interface PanelFeedbackProps {
  pasoActual: number;
  pasos: PasoSimulacion[];
  pasosCompletados: number[];
  resultadoValidacion: ResultadoValidacion | null;
  tiempoTranscurrido: number;
  errores: number;
  practicaActiva: boolean;
  practicaCompletada: boolean;
  tiempoSostenidoSegundos?: number; // Tiempo continuo con postura correcta (meta: 1.5s)
}

export const PanelFeedback: React.FC<PanelFeedbackProps> = ({
  pasoActual,
  pasos,
  pasosCompletados,
  resultadoValidacion,
  tiempoTranscurrido,
  errores,
  practicaActiva,
  practicaCompletada,
  tiempoSostenidoSegundos = 0,
}) => {
  const pasoInfo = pasos.find((p) => p.numero === pasoActual) || pasos[0];
  const esCorrecto = resultadoValidacion?.correcto ?? false;
  const progresoPorcentaje = Math.round(
    (practicaCompletada ? 6 : pasosCompletados.length) * (100 / 6)
  );

  // Progreso de sostenimiento de la postura correcta hacia los 1.5 segundos
  const progresoSostenidoPct = Math.min(100, Math.round((tiempoSostenidoSegundos / 1.5) * 100));

  return (
    <aside
      aria-label="Panel de retroalimentación"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        border: '1px solid #E2E8F0',
        width: '100%',
      }}
    >
      {/* 1. MÉTRICAS CLAVE (TIMER Y ERRORES) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}
      >
        {/* Cronómetro */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            padding: '0.75rem',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 119, 182, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0077B6',
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>TIEMPO</div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#0F172A',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatearTiempo(tiempoTranscurrido)}
            </div>
          </div>
        </div>

        {/* Contador de Errores */}
        <div
          style={{
            backgroundColor: errores > 0 ? '#FEF2F2' : '#F8FAFC',
            borderRadius: '10px',
            padding: '0.75rem',
            border: `1px solid ${errores > 0 ? '#FECACA' : '#E2E8F0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            transition: 'background-color 0.3s',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: errores > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: errores > 0 ? '#EF4444' : '#64748B',
            }}
          >
            <AlertOctagon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: errores > 0 ? '#991B1B' : '#64748B', fontWeight: 600 }}>
              ERRORES
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: errores > 0 ? '#DC2626' : '#0F172A',
              }}
            >
              {errores}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE PROGRESO GENERAL */}
      <div>
        <ProgressBar
          valor={progresoPorcentaje}
          etiqueta={`Progreso de la técnica (${practicaCompletada ? 6 : pasosCompletados.length}/6)`}
          color={practicaCompletada ? 'success' : 'primary'}
        />
      </div>

      {/* 3. RETROALIMENTACIÓN EN VIVO DEL PASO ACTUAL */}
      <div
        style={{
          borderRadius: '10px',
          padding: '1rem',
          backgroundColor: !practicaActiva && !practicaCompletada
            ? '#F1F5F9'
            : esCorrecto
            ? '#F0FDF4'
            : '#FEF2F2',
          border: `1.5px solid ${
            !practicaActiva && !practicaCompletada
              ? '#CBD5E1'
              : esCorrecto
              ? '#86EFAC'
              : '#FCA5A5'
          }`,
          transition: 'all 0.25s ease-in-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          {!practicaActiva && !practicaCompletada ? (
            <ShieldCheck size={20} style={{ color: '#0077B6' }} />
          ) : esCorrecto ? (
            <CheckCircle2 size={20} style={{ color: '#16A34A' }} />
          ) : (
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
          )}

          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: !practicaActiva && !practicaCompletada
                ? '#334155'
                : esCorrecto
                ? '#15803D'
                : '#B91C1C',
            }}
          >
            {!practicaActiva && !practicaCompletada
              ? 'Listo para iniciar'
              : esCorrecto
              ? 'Postura Correcta'
              : 'Ajuste Requerido'}
          </span>
        </div>

        <div
          style={{
            fontSize: '0.92rem',
            color: '#1E293B',
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          {!practicaActiva && !practicaCompletada
            ? 'Presiona "Iniciar práctica" para que la cámara comience a validar tu postura.'
            : resultadoValidacion?.mensaje ?? pasoInfo?.instruccion}
        </div>

        {/* Barra de sostenimiento de postura (1.5 segundos para avanzar) */}
        {practicaActiva && esCorrecto && (
          <div style={{ marginTop: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: '#15803D',
                fontWeight: 600,
                marginBottom: '3px',
              }}
            >
              <span>Mantén la postura...</span>
              <span>{(tiempoSostenidoSegundos).toFixed(1)}s / 1.5s</span>
            </div>
            <div
              style={{
                height: '6px',
                width: '100%',
                backgroundColor: '#DCFCE7',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progresoSostenidoPct}%`,
                  backgroundColor: '#16A34A',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. CONSEJO ASÉPTICO DEL PASO */}
      {pasoInfo?.consejoAsepsia && (
        <div
          style={{
            backgroundColor: '#F0F9FF',
            borderLeft: '4px solid #00B4D8',
            padding: '0.65rem 0.85rem',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}
        >
          <Lightbulb size={16} style={{ color: '#0077B6', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.76rem', color: '#0369A1', lineHeight: 1.4 }}>
            <strong>Principio de asepsia:</strong> {pasoInfo.consejoAsepsia}
          </div>
        </div>
      )}

      {/* 5. LISTA DE LOS 6 PASOS CLÍNICOS */}
      <div>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.6rem',
          }}
        >
          Pasos del Protocolo
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {pasos.map((paso) => {
            const completado = pasosCompletados.includes(paso.numero) || (practicaCompletada && paso.numero <= 6);
            const actual = paso.numero === pasoActual && !practicaCompletada;

            return (
              <div
                key={paso.numero}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: actual
                    ? '#E0F2FE'
                    : completado
                    ? '#F0FDF4'
                    : '#F8FAFC',
                  border: `1px solid ${
                    actual
                      ? '#0077B6'
                      : completado
                      ? '#BBF7D0'
                      : '#E2E8F0'
                  }`,
                  transition: 'all 0.2s',
                }}
              >
                {/* Indicador de estado */}
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: actual
                      ? '#0077B6'
                      : completado
                      ? '#16A34A'
                      : '#CBD5E1',
                    color: '#FFFFFF',
                    flexShrink: 0,
                  }}
                >
                  {completado ? <Check size={13} strokeWidth={3} /> : paso.numero}
                </div>

                {/* Título del paso */}
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: actual ? 700 : 500,
                    color: actual ? '#0369A1' : completado ? '#15803D' : '#64748B',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {paso.titulo}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default PanelFeedback;
