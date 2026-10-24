// Barra de control interactiva para inicio, pausa, reinicio y guardado de práctica
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';

export interface ControlesSimulacionProps {
  practicaActiva: boolean;
  practicaCompletada: boolean;
  enPausa: boolean;
  cargandoIA: boolean;
  onIniciar: () => void;
  onPausarReanudar: () => void;
  onReiniciar: () => void;
  onFinalizarGuardar: () => void;
  guardandoResultado?: boolean;
}

export const ControlesSimulacion: React.FC<ControlesSimulacionProps> = ({
  practicaActiva,
  practicaCompletada,
  enPausa,
  cargandoIA,
  onIniciar,
  onPausarReanudar,
  onReiniciar,
  onFinalizarGuardar,
  guardandoResultado = false,
}) => {
  return (
    <div className="controles-simulacion-bar">
      {/* 1. BOTÓN INICIAR PRÁCTICA (PRIMARIO - Visible antes de comenzar) */}
      {!practicaActiva && !practicaCompletada && (
        <button
          onClick={onIniciar}
          disabled={cargandoIA}
          className="btn-ctrl-primary"
        >
          {cargandoIA ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Cargando visión...</span>
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              <span>Iniciar práctica</span>
            </>
          )}
        </button>
      )}

      {/* 2. BOTÓN PAUSAR / REANUDAR (SECUNDARIO - Durante la práctica) */}
      {practicaActiva && !practicaCompletada && (
        <button
          onClick={onPausarReanudar}
          className={`btn-ctrl-secondary ${enPausa ? 'active-pause' : ''}`}
        >
          {enPausa ? (
            <>
              <Play size={16} fill="currentColor" />
              <span>Reanudar práctica</span>
            </>
          ) : (
            <>
              <Pause size={16} />
              <span>Pausar</span>
            </>
          )}
        </button>
      )}

      {/* 3. BOTÓN REINICIAR (PELIGRO/ADVERTENCIA - Durante o después de la práctica) */}
      {(practicaActiva || practicaCompletada) && (
        <button
          onClick={onReiniciar}
          className="btn-ctrl-danger"
        >
          <RotateCcw size={16} />
          <span>Reiniciar</span>
        </button>
      )}

      {/* 4. BOTÓN FINALIZAR Y GUARDAR (PRIMARIO - Solo si practicaCompletada es true) */}
      {practicaCompletada && (
        <button
          onClick={onFinalizarGuardar}
          disabled={guardandoResultado}
          className="btn-ctrl-success"
        >
          {guardandoResultado ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Guardando en el servidor...</span>
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              <span>Finalizar y guardar</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ControlesSimulacion;
