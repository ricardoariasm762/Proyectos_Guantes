import React from 'react';
import { motion } from 'framer-motion';
import { PASOS_TECNICA } from '../../data/pasosTecnica';
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  Clock,
  Award,
} from 'lucide-react';

interface Props {
  pasoActivo?: number;
}

/**
 * FASE 3: Los Textos Sincronizados (TextosPasos.tsx)
 * Renderiza 6 secciones con altura de 100vh superpuestas sobre el canvas fijo.
 * Alineadas a la derecha para mantener despejada la vista de las manos en el centro.
 * Cada tarjeta entra con fade-in + slide-up y se desvanece al salir mediante Framer Motion.
 */
export const TextosPasos: React.FC<Props> = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {PASOS_TECNICA.map((paso, index) => {
        const numeroPaso = index + 1;
        const numeroFormateado = `0${numeroPaso}`;

        return (
          <section
            key={paso.id}
            style={{
              height: '100vh',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end', // Alineado a la derecha para no tapar las manos
              padding: '0 6% 0 0',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 55, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ amount: 0.45 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: '470px',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '24px',
                padding: '2rem',
                border: '1px solid rgba(56, 189, 248, 0.28)',
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
                color: '#F8FAFC',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              }}
            >
              {/* Número grande de fondo con estilo editorial */}
              <span
                style={{
                  position: 'absolute',
                  right: '1.25rem',
                  top: '0.2rem',
                  fontSize: '5.5rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: 'rgba(56, 189, 248, 0.08)',
                  letterSpacing: '-0.05em',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 0,
                }}
                aria-hidden="true"
              >
                {numeroFormateado}
              </span>

              {/* Cabecera con Badges Médicos */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.85rem',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: 'rgba(0, 180, 216, 0.25)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    <Sparkles size={12} />
                    Paso {numeroPaso} de 6
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <Clock size={12} /> {paso.tiempoEstimadoSegundos}s
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#94A3B8',
                  }}
                >
                  Técnica Abierta
                </span>
              </div>

              {/* Título Principal del Paso */}
              <h3
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.25,
                  margin: '0 0 0.75rem 0',
                  letterSpacing: '-0.02em',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {paso.titulo}
              </h3>

              {/* Descripción Clínica */}
              <p
                style={{
                  fontSize: '0.92rem',
                  color: '#CBD5E1',
                  lineHeight: 1.6,
                  margin: '0 0 1.25rem 0',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {paso.descripcion}
              </p>

              {/* Puntos Críticos de la Técnica */}
              {paso.puntosCriticos && paso.puntosCriticos.length > 0 && (
                <div
                  style={{
                    background: 'rgba(2, 132, 199, 0.12)',
                    borderRadius: '14px',
                    padding: '0.95rem 1rem',
                    marginBottom: '1rem',
                    border: '1px solid rgba(56, 189, 248, 0.22)',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#38BDF8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <CheckCircle2 size={14} color="#38BDF8" />
                    Puntos Críticos de Ejecución:
                  </div>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    {paso.puntosCriticos.map((punto, pIdx) => (
                      <li
                        key={pIdx}
                        style={{
                          fontSize: '0.82rem',
                          color: '#E2E8F0',
                          lineHeight: 1.45,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.45rem',
                        }}
                      >
                        <span style={{ color: '#38BDF8', lineHeight: 1, marginTop: '2px' }}>•</span>
                        <span>{punto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advertencia / Consejo de Asepsia */}
              {paso.consejoAsepsia && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.8rem 0.95rem',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                    color: '#FDE68A',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#F59E0B' }} />
                  <div>
                    <strong style={{ color: '#FBBF24' }}>Asepsia estricta:</strong>{' '}
                    {paso.consejoAsepsia}
                  </div>
                </div>
              )}

              {/* Indicador animado de scroll para el Paso 1 */}
              {numeroPaso === 1 && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: '#38BDF8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>Desliza para comenzar la secuencia</span>
                    <ChevronDown size={15} />
                  </motion.div>
                </div>
              )}

              {/* Mensaje Conclusivo en Paso 6 */}
              {numeroPaso === 6 && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#6EE7B7',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Award size={18} color="#34D399" />
                  <span>
                    ¡Técnica completada! Ambos guantes quirúrgicos colocados preservando la esterilidad.
                  </span>
                </div>
              )}
            </motion.div>
          </section>
        );
      })}
    </div>
  );
};

export default TextosPasos;
