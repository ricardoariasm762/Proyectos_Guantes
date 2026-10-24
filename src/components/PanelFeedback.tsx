// Panel lateral con feedback biomecánico en vivo, progreso y telemetría de técnica estéril
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React from 'react';
import type { PasoSimulacion, ResultadoValidacion } from '../types/mediapipe';
import type { ResultadoValidacionHibrida } from '../types/ia';
import { formatearTiempo } from '../utils/puntuacion';
import { IndicadorConfianza } from './IndicadorConfianza';
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
  resultadoValidacion: (ResultadoValidacion & Partial<ResultadoValidacionHibrida>) | null;
  tiempoTranscurrido: number;
  errores: number;
  practicaActiva: boolean;
  practicaCompletada: boolean;
  tiempoSostenidoSegundos?: number; // Tiempo continuo con postura correcta (meta: 1.5s)
  isIALoading?: boolean;
  isIAReady?: boolean;
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
  isIALoading = false,
  isIAReady = true,
}) => {
  const pasoInfo = pasos.find((p) => p.numero === pasoActual) || pasos[0];
  const esCorrecto = resultadoValidacion?.correcto ?? false;
  const confianza = resultadoValidacion?.confianza ?? (esCorrecto ? 0.9 : 0.4);
  const fuente = resultadoValidacion?.fuente ?? 'reglas';
  const progresoPorcentaje = Math.round(
    (practicaCompletada ? 6 : pasosCompletados.length) * (100 / 6)
  );

  // Progreso de sostenimiento de la postura correcta hacia los 1.5 segundos
  const progresoSostenidoPct = Math.min(100, Math.round((tiempoSostenidoSegundos / 1.5) * 100));

  const estadoFeedbackClass = !practicaActiva && !practicaCompletada
    ? ''
    : esCorrecto
    ? 'status-correct'
    : 'status-error';

  return (
    <aside aria-label="Panel de retroalimentación" className="panel-feedback-container">
      {/* 1. MÉTRICAS CLAVE (TIMER Y ERRORES) */}
      <div className="panel-metrics-grid">
        {/* Cronómetro */}
        <div className="metric-card-timer">
          <div className="metric-card-timer-icon">
            <Clock size={20} />
          </div>
          <div>
            <div className="metric-card-label">TIEMPO</div>
            <div className="metric-card-value">
              {formatearTiempo(tiempoTranscurrido)}
            </div>
          </div>
        </div>

        {/* Contador de Errores */}
        <div className={`metric-card-errors ${errores > 0 ? 'has-errors' : ''}`}>
          <div className="metric-card-errors-icon">
            <AlertOctagon size={20} />
          </div>
          <div>
            <div className="metric-card-label">ERRORES</div>
            <div className="metric-card-value">{errores}</div>
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

      {/* 3. TELEMETRÍA DE CONFIANZA Y FUENTE HÍBRIDA */}
      {practicaActiva && (
        <IndicadorConfianza
          confianza={confianza}
          fuente={fuente}
          isIALoading={isIALoading}
          isIAReady={isIAReady}
        />
      )}

      {/* 4. RETROALIMENTACIÓN EN VIVO DEL PASO ACTUAL */}
      <div className={`feedback-status-box ${estadoFeedbackClass}`}>
        <div className="feedback-status-header">
          {!practicaActiva && !practicaCompletada ? (
            <ShieldCheck size={20} className="feedback-status-header-icon" />
          ) : esCorrecto ? (
            <CheckCircle2 size={20} className="feedback-status-header-icon" />
          ) : (
            <AlertCircle size={20} className="feedback-status-header-icon" />
          )}

          <span className="feedback-status-tag">
            {!practicaActiva && !practicaCompletada
              ? 'Listo para iniciar'
              : esCorrecto
              ? 'Postura Correcta'
              : 'Ajuste Requerido'}
          </span>
        </div>

        <div className="feedback-status-desc">
          {!practicaActiva && !practicaCompletada
            ? 'Presiona "Iniciar práctica" para que la cámara comience a validar tu postura.'
            : resultadoValidacion?.mensaje ?? pasoInfo?.instruccion}
        </div>

        {/* Barra de sostenimiento de postura (1.5 segundos para avanzar) */}
        {practicaActiva && esCorrecto && (
          <div className="sustained-posture-container">
            <div className="sustained-posture-label">
              <span>Mantén la postura...</span>
              <span>{tiempoSostenidoSegundos.toFixed(1)}s / 1.5s</span>
            </div>
            <div className="sustained-posture-track">
              <div
                className="sustained-posture-fill"
                style={{ width: `${progresoSostenidoPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. CONSEJO ASÉPTICO DEL PASO */}
      {pasoInfo?.consejoAsepsia && (
        <div className="asepsia-tip-box">
          <Lightbulb size={16} className="asepsia-tip-icon" />
          <div className="asepsia-tip-text">
            <strong>Principio de asepsia:</strong> {pasoInfo.consejoAsepsia}
          </div>
        </div>
      )}

      {/* 6. LISTA DE LOS 6 PASOS CLÍNICOS */}
      <div className="protocol-steps-section">
        <div className="protocol-steps-title">Pasos del Protocolo</div>

        <div className="protocol-steps-list">
          {pasos.map((paso) => {
            const completado = pasosCompletados.includes(paso.numero) || (practicaCompletada && paso.numero <= 6);
            const actual = paso.numero === pasoActual && !practicaCompletada;

            return (
              <div
                key={paso.numero}
                className={`protocol-step-item ${
                  actual ? 'step-active' : completado ? 'step-completed' : ''
                }`}
              >
                {/* Indicador de estado */}
                <div className="protocol-step-badge">
                  {completado ? <Check size={13} strokeWidth={3} /> : paso.numero}
                </div>

                {/* Título del paso */}
                <div className="protocol-step-text" title={paso.titulo}>
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
