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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        flexWrap: 'wrap',
        padding: '0.9rem 1.2rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E2E8F0',
        width: '100%',
      }}
    >
      {/* 1. BOTÓN INICIAR PRÁCTICA (PRIMARIO - Visible antes de comenzar) */}
      {!practicaActiva && !practicaCompletada && (
        <button
          onClick={onIniciar}
          disabled={cargandoIA}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.75rem 1.6rem',
            backgroundColor: cargandoIA ? '#94A3B8' : '#0077B6',
            color: '#FFFFFF',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: cargandoIA ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 119, 182, 0.3)',
          }}
          onMouseOver={(e) => {
            if (!cargandoIA) e.currentTarget.style.backgroundColor = '#0096C7';
          }}
          onMouseOut={(e) => {
            if (!cargandoIA) e.currentTarget.style.backgroundColor = '#0077B6';
          }}
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.75rem 1.4rem',
            backgroundColor: enPausa ? '#0077B6' : '#F1F5F9',
            color: enPausa ? '#FFFFFF' : '#1E293B',
            borderRadius: '8px',
            border: `1px solid ${enPausa ? '#0077B6' : '#CBD5E1'}`,
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = enPausa ? '#0096C7' : '#E2E8F0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = enPausa ? '#0077B6' : '#F1F5F9';
          }}
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.75rem 1.2rem',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            borderRadius: '8px',
            border: '1px solid #FECACA',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#FEE2E2';
            e.currentTarget.style.borderColor = '#FCA5A5';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
            e.currentTarget.style.borderColor = '#FECACA';
          }}
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.6rem',
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: guardandoResultado ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 5px rgba(22, 163, 74, 0.35)',
          }}
          onMouseOver={(e) => {
            if (!guardandoResultado) e.currentTarget.style.backgroundColor = '#15803D';
          }}
          onMouseOut={(e) => {
            if (!guardandoResultado) e.currentTarget.style.backgroundColor = '#16A34A';
          }}
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
