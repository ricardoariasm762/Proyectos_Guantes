import React, { useState, useEffect } from 'react';
import { generarRutasFrames, preloadImages, TOTAL_FRAMES } from '../utils/preloadImages';
import SecuenciaCanvas from '../components/scrollytelling/SecuenciaCanvas';
import TextosPasos from '../components/scrollytelling/TextosPasos';
import Preloader from '../components/scrollytelling/Preloader';
import { Camera, Layers, CheckCircle2 } from 'lucide-react';

const NOMBRES_PASOS_CORTOS = [
  '1. Lavado',
  '2. Secado',
  '3. Guante Der',
  '4. Calce Der',
  '5. Bolsillo Izq',
  '6. Ajuste Final',
];

/**
 * FASE 4: Ensamblaje y Responsive (TutorialScroll.tsx)
 * Página principal de la experiencia Apple-Style Image Sequence Scrollytelling.
 * Gestiona el ciclo de vida de precarga (Preloader), la sincronización con GSAP
 * y el despliegue responsivo para desktop y dispositivos móviles.
 */
export const TutorialScroll: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progresoCarga, setProgresoCarga] = useState<number>(0);
  const [cargadas, setCargadas] = useState<number>(0);
  const [imagenes, setImagenes] = useState<HTMLImageElement[]>([]);
  const [pasoActivo, setPasoActivo] = useState<number>(1);
  const [frameActual, setFrameActual] = useState<number>(0);

  // Precarga asíncrona de los 78 fotogramas al montar el componente
  useEffect(() => {
    let montado = true;
    const rutas = generarRutasFrames(TOTAL_FRAMES);

    preloadImages(rutas, (pct, count) => {
      if (montado) {
        setProgresoCarga(pct);
        setCargadas(count);
      }
    }).then((imgs) => {
      if (montado) {
        setImagenes(imgs);
        // Pequeño retardo cosmético para transicionar suavemente desde el 100%
        setTimeout(() => {
          if (montado) setIsLoading(false);
        }, 300);
      }
    });

    return () => {
      montado = false;
    };
  }, []);

  const handleFrameChange = React.useCallback((frameIndex: number) => {
    setFrameActual(frameIndex);
    const pasoCalculado = Math.min(
      6,
      Math.max(1, Math.floor((frameIndex / TOTAL_FRAMES) * 6) + 1)
    );
    setPasoActivo(pasoCalculado);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: '#0B1329',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. Pantalla de carga hasta resolver todas las imágenes en memoria */}
      {isLoading && (
        <Preloader
          porcentaje={progresoCarga}
          cargadas={cargadas}
          total={TOTAL_FRAMES}
        />
      )}

      {/* 2. Barra Superior Flotante de Estado y Progreso (HUD Aséptico) */}
      {!isLoading && (
        <header
          style={{
            position: 'fixed',
            top: '76px',
            left: 'calc(1.25rem + 105px)',
            right: '1.25rem',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            gap: '1rem',
          }}
        >
          {/* Badge de Técnica Médica */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: '#FFFFFF',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                color: '#FFFFFF',
              }}
            >
              <Camera size={13} />
            </span>
            <span>Secuencia Fotográfica Apple-Style</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>
              Paso {pasoActivo} de 6
            </span>
          </div>

          {/* Selector de pasos visual en desktop */}
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '0.35rem 0.6rem',
              borderRadius: '9999px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              gap: '0.35rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
            className="hud-pasos-responsive"
          >
            {NOMBRES_PASOS_CORTOS.map((nombre, i) => {
              const pasoNum = i + 1;
              const esActivo = pasoNum === pasoActivo;
              const yaCompletado = pasoNum < pasoActivo;

              return (
                <span
                  key={i}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: esActivo ? 700 : 500,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    background: esActivo
                      ? 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)'
                      : yaCompletado
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'transparent',
                    color: esActivo
                      ? '#FFFFFF'
                      : yaCompletado
                      ? '#6EE7B7'
                      : 'rgba(255, 255, 255, 0.6)',
                    border: esActivo
                      ? '1px solid rgba(255, 255, 255, 0.3)'
                      : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {yaCompletado && <CheckCircle2 size={11} />}
                  {nombre}
                </span>
              );
            })}
          </div>

          {/* Contador de fotogramas */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: 'rgba(255, 255, 255, 0.85)',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Layers size={13} color="#38BDF8" />
            <span>
              Frame <strong style={{ color: '#FFFFFF' }}>{frameActual + 1}</strong> / {TOTAL_FRAMES}
            </span>
          </div>
        </header>
      )}

      {/*
      {/*
        3. Experiencia de Scrollytelling Apple-Style:
        SecuenciaCanvas gestiona el contenedor de scroll (600vh) y ancla el canvas mediante sticky,
        mientras renderiza la capa de textos superpuestos.
      */}
      {!isLoading && (
        <SecuenciaCanvas
          imagenes={imagenes}
          totalFrames={TOTAL_FRAMES}
          onFrameChange={handleFrameChange}
          alturaScroll="600vh"
        >
          <TextosPasos pasoActivo={pasoActivo} />
        </SecuenciaCanvas>
      )}
    </div>
  );
};

export default TutorialScroll;
