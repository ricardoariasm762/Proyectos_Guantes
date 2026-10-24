// Modal de resumen al finalizar una sesión de práctica por cámara
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React from 'react';
import { Award, Bot, CheckCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatearTiempo } from '../../utils/puntuacion';
import {
  MENSAJE_DESEMPENO,
  TOTAL_PASOS_SIMULACION,
  nivelDesempeno,
} from '../../utils/puntajeSimulacion';

export interface ResumenSesionModalProps {
  abierto: boolean;
  puntaje: number;
  segundos: number;
  errores: number;
  pasosCompletados: number;
  /** null cuando no hubo validaciones suficientes para promediar. */
  confianzaPromedio: number | null;
  versionModelo: string;
  guardando: boolean;
  onCerrar: () => void;
  onReintentar: () => void;
  onGuardar: () => void;
}

export const ResumenSesionModal: React.FC<ResumenSesionModalProps> = ({
  abierto,
  puntaje,
  segundos,
  errores,
  pasosCompletados,
  confianzaPromedio,
  versionModelo,
  guardando,
  onCerrar,
  onReintentar,
  onGuardar,
}) => (
  <Modal
    isOpen={abierto}
    onClose={onCerrar}
    title="Práctica finalizada"
    size="md"
    footer={
      <div className="resumen-acciones">
        <button type="button" className="btn-secundario" onClick={onReintentar}>
          <RotateCcw size={16} aria-hidden="true" />
          Practicar de nuevo
        </button>
        <button type="button" className="btn-primario" onClick={onGuardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar resultado'}
        </button>
      </div>
    }
  >
    <div className="resumen-sesion">
      <div className="resumen-puntaje">
        <span className="resumen-puntaje-icono" aria-hidden="true">
          <Award size={28} />
        </span>
        <span className="resumen-etiqueta">Puntaje obtenido</span>
        <strong className="resumen-valor">
          {puntaje}
          <span className="resumen-maximo"> / 1000</span>
        </strong>
        <p className="resumen-mensaje">{MENSAJE_DESEMPENO[nivelDesempeno(puntaje)]}</p>
        <span className="resumen-modelo">
          <Bot size={14} aria-hidden="true" />
          Modelo de evaluación: <strong>{versionModelo}</strong>
        </span>
      </div>

      <dl className="resumen-metricas">
        <div className="resumen-metrica">
          <Clock size={18} aria-hidden="true" />
          <dt>Tiempo</dt>
          <dd>{formatearTiempo(segundos)}</dd>
        </div>
        <div className="resumen-metrica" data-estado={errores > 0 ? 'error' : 'ok'}>
          <AlertTriangle size={18} aria-hidden="true" />
          <dt>Faltas</dt>
          <dd>{errores}</dd>
        </div>
        <div className="resumen-metrica">
          <CheckCircle size={18} aria-hidden="true" />
          <dt>Pasos</dt>
          <dd>
            {pasosCompletados} / {TOTAL_PASOS_SIMULACION}
          </dd>
        </div>
        <div className="resumen-metrica">
          <Bot size={18} aria-hidden="true" />
          <dt>Confianza</dt>
          <dd>{confianzaPromedio === null ? '—' : `${confianzaPromedio}%`}</dd>
        </div>
      </dl>
    </div>
  </Modal>
);

export default ResumenSesionModal;
