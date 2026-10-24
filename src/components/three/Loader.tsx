import React from 'react';
import { useProgress } from '@react-three/drei';

/**
 * Componente Loader para mostrar retroalimentación visual profesional
 * del progreso de descarga de los modelos 3D y texturas.
 * Renderizado como overlay HTML nativo de React, garantizando 100% de estabilidad en React 19.
 */
const Loader: React.FC = () => {
  const { active, progress } = useProgress();

  if (!active && progress >= 100) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.92)',
          padding: '1.5rem 2.25rem',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            border: '3px solid rgba(56, 189, 248, 0.2)',
            borderTop: '3px solid #00B4D8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '0.85rem',
          }}
        />
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
        </style>
        <div style={{ color: '#38BDF8', fontSize: '15px', fontWeight: 700, marginBottom: '0.25rem' }}>
          Cargando entorno quirúrgico...
        </div>
        <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
          {progress.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

export default Loader;
