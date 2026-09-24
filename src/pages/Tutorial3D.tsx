// Módulo de Tutorial 3D interactivo con Three.js, controles y sincronización de pasos
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState, useEffect, useRef } from 'react';
import { PASOS_TECNICA } from '../data/pasosTecnica';
import SurgicalScene from '../components/three/SurgicalScene';
import { soundManager } from '../utils/sound';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Maximize2,
  BookOpen,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const VELOCIDADES = [0.5, 1, 1.5, 2];

const Tutorial3D: React.FC = () => {
  const [pasoActivo, setPasoActivo] = useState(1); // 1 a 6
  const [reproduciendo, setReproduciendo] = useState(true);
  const [velocidad, setVelocidad] = useState(1);
  const timerRef = useRef<number | null>(null);

  const pasoDatos = PASOS_TECNICA[pasoActivo - 1];

  // Avance automático cuando está en 'play'
  useEffect(() => {
    if (!reproduciendo) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duracionBaseMs = 4500;
    const duracionEfectiva = duracionBaseMs / velocidad;

    timerRef.current = window.setInterval(() => {
      setPasoActivo((prev) => (prev < 6 ? prev + 1 : 1));
    }, duracionEfectiva);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reproduciendo, velocidad]);

  const togglePlayPausa = () => {
    soundManager.playClick();
    setReproduciendo((prev) => !prev);
  };

  const cambiarVelocidad = (vel: number) => {
    soundManager.playClick();
    setVelocidad(vel);
  };

  const seleccionarPaso = (numPaso: number) => {
    soundManager.playClick();
    setPasoActivo(numPaso);
  };

  const reiniciarTutorial = () => {
    soundManager.playClick();
    setPasoActivo(1);
    setReproduciendo(true);
  };

  return (
    <div className="tutorial-3d-page">
      <div className="page-header-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge-pill badge-primary badge-size-sm">
                <Sparkles size={14} /> Visor Tridimensional
              </span>
              <span className="badge-pill badge-secondary badge-size-sm">WebGL / Three.js</span>
            </div>
            <h1 className="page-title">Tutorial 3D: Cinemática Quirúrgica</h1>
            <p className="page-description">
              Observe y manipule espacialmente en 360° la postura de guantes con técnica abierta.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="primary" icon={<ShieldCheck size={14} />}>
              Paso {pasoActivo} de 6
            </Badge>
          </div>
        </div>
      </div>

      <div className="tutorial-3d-layout">
        {/* Contenedor del Visor 3D y Controles flotantes */}
        <div className="threejs-viewport-container">
          <SurgicalScene
            pasoActivo={pasoActivo}
            reproduciendo={reproduciendo}
            velocidad={velocidad}
          />

          {/* Indicación de interacción orbital en esquina superior */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              pointerEvents: 'none',
            }}
          >
            <Maximize2 size={13} />
            <span>Clic + Arrastrar: Rotar • Rueda: Zoom • Clic derecho: Paneo</span>
          </div>

          {/* Barra de Controles de Reproducción sobre el 3D */}
          <div className="threejs-controls-overlay">
            <button
              type="button"
              onClick={togglePlayPausa}
              style={{
                background: reproduciendo ? 'var(--color-primary)' : 'var(--color-sterile)',
                border: 'none',
                color: '#fff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
              title={reproduciendo ? 'Pausar animación' : 'Reproducir animación'}
            >
              {reproduciendo ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
            </button>

            <button
              type="button"
              onClick={reiniciarTutorial}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                padding: '0.4rem 0.7rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
              title="Reiniciar al Paso 1"
            >
              <RotateCcw size={15} />
              <span>Reiniciar</span>
            </button>

            {/* Selectores de velocidad */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
              {VELOCIDADES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => cambiarVelocidad(v)}
                  style={{
                    background: velocidad === v ? 'var(--color-primary)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {v}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel lateral sincronizado con lista de pasos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card
            titulo="Secuencia Quirúrgica"
            subtitulo="Haga clic para saltar a un paso"
            icono={<BookOpen size={20} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {PASOS_TECNICA.map((p) => {
                const esActivo = p.id === pasoActivo;
                return (
                  <div
                    key={p.id}
                    onClick={() => seleccionarPaso(p.id)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: esActivo ? 'var(--color-primary-ice)' : 'var(--bg-muted)',
                      border: esActivo ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: esActivo ? 'var(--color-primary)' : 'var(--border-strong)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {p.id}
                      </span>
                      <span
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: esActivo ? 700 : 500,
                          color: esActivo ? 'var(--color-primary-dark)' : 'var(--text-main)',
                        }}
                      >
                        {p.titulo}
                      </span>
                    </div>

                    {esActivo && <ChevronRight size={18} style={{ color: 'var(--color-primary)' }} />}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Información del Paso Activo */}
          <Card
            titulo={`Paso ${pasoDatos.id}: ${pasoDatos.titulo}`}
            icono={<CheckCircle size={20} />}
          >
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
              {pasoDatos.descripcion}
            </p>

            <div style={{ background: 'var(--color-primary-ice)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary-soft)', fontSize: '0.8rem', color: 'var(--color-primary-dark)' }}>
              <strong>Asepsia crítica:</strong> {pasoDatos.consejoAsepsia}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tutorial3D;