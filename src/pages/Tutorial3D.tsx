import React, { useState } from 'react';
import TutorialScroll from './TutorialScroll';
import TutorialScroll3D from '../components/three/TutorialScroll';
import { Camera, Box } from 'lucide-react';

/**
 * Vista del Tutorial Interactivo de Postura de Guantes Quirúrgicos.
 * Por defecto renderiza la experiencia fotográfica Apple-Style (SecuenciaCanvas + GSAP).
 * Permite alternar con el simulador 3D si el estudiante desea comparar perspectivas.
 */
export const Tutorial3D: React.FC = () => {
  const [modo, setModo] = useState<'secuencia' | '3d'>('secuencia');

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* Selector de Experiencia en Cabecera */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '0.35rem 0.45rem',
          borderRadius: '9999px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          type="button"
          onClick={() => setModo('secuencia')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            background:
              modo === 'secuencia'
                ? 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)'
                : 'transparent',
            color: modo === 'secuencia' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
            boxShadow:
              modo === 'secuencia' ? '0 2px 10px rgba(0, 180, 216, 0.4)' : 'none',
          }}
        >
          <Camera size={13} />
          Secuencia Apple-Style
        </button>

        <button
          type="button"
          onClick={() => setModo('3d')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            background:
              modo === '3d'
                ? 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)'
                : 'transparent',
            color: modo === '3d' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
            boxShadow:
              modo === '3d' ? '0 2px 10px rgba(0, 180, 216, 0.4)' : 'none',
          }}
        >
          <Box size={13} />
          Modelo 3D
        </button>
      </div>

      {/* Renderizado condicional según el modo seleccionado */}
      {modo === 'secuencia' ? (
        <TutorialScroll />
      ) : (
        <div style={{ padding: '1rem', width: '100%', boxSizing: 'border-box' }}>
          <TutorialScroll3D />
        </div>
      )}
    </div>
  );
};

export default Tutorial3D;