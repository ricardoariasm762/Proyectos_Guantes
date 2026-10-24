import React from 'react';
import { Sparkles, Layers, Activity } from 'lucide-react';

interface Props {
  porcentaje: number;
  cargadas: number;
  total: number;
}

/**
 * Pantalla de Carga y Precarga en Memoria (Preloader.tsx)
 * Muestra el progreso en tiempo real de la precarga de imágenes fotográficas
 * para garantizar una experiencia sin parpadeos similar a las páginas de Apple.
 */
export const Preloader: React.FC<Props> = ({ porcentaje, cargadas, total }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B1329 0%, #0F172A 50%, #03213A 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Halo de luz médico en el fondo */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 180, 216, 0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Ícono animado */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.25) 0%, rgba(0, 119, 182, 0.35) 100%)',
            border: '1px solid rgba(0, 180, 216, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 180, 216, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <Activity size={32} color="#38BDF8" />
        </div>

        {/* Títulos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(0, 180, 216, 0.18)',
              color: '#38BDF8',
              border: '1px solid rgba(0, 180, 216, 0.35)',
            }}
          >
            <Sparkles size={12} />
            Scrollytelling Quirúrgico
          </span>
          <span
            style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            Secuencia Fotográfica
          </span>
        </div>

        <h2
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            margin: '0.5rem 0 0.5rem 0',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
          }}
        >
          Preparando Secuencia
        </h2>

        <p
          style={{
            fontSize: '0.9rem',
            color: '#94A3B8',
            lineHeight: 1.55,
            margin: '0 0 1.75rem 0',
          }}
        >
          Cargando {total} fotogramas en memoria para garantizar una reproducción continua y fluida a 60 fps durante el scroll.
        </p>

        {/* Barra de Progreso */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '0.85rem',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              width: `${porcentaje}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00B4D8 0%, #38BDF8 50%, #48CAE4 100%)',
              borderRadius: '9999px',
              transition: 'width 0.15s ease-out',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.8)',
            }}
          />
        </div>

        {/* Indicadores numéricos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: '0.82rem',
            color: '#94A3B8',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Layers size={13} color="#38BDF8" />
            {cargadas} de {total} fotogramas
          </span>
          <span style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.9rem' }}>
            {porcentaje}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
