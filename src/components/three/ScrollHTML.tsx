import React from 'react';
import { Scroll } from '@react-three/drei';
import { motion } from 'framer-motion';
import { PASOS_TECNICA } from '../../data/pasosTecnica';
import {
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

/**
 * Componente HTML para Scrollytelling.
 * Renderiza 6 secciones consecutivas de altura 100vh superpuestas sobre el lienzo 3D.
 * Cada sección presenta la información del paso correspondiente con transiciones
 * de fade-in y slide-up animadas mediante Framer Motion.
 */
const ScrollHTML: React.FC = () => {
  return (
    <Scroll html style={{ width: '100%' }}>
      {PASOS_TECNICA.map((paso, index) => {
        const numPaso = index + 1;
        // Alternamos sutilmente la alineación para equilibrar la composición visual
        // En el Paso 5 la cámara enfoca el lado izquierdo, por lo que colocamos el texto a la derecha
        const alinearDerecha = numPaso === 5;

        return (
          <section
            key={paso.id}
            style={{
              height: '100vh',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: alinearDerecha ? 'flex-end' : 'flex-start',
              padding: '2rem 5%',
              boxSizing: 'border-box',
              pointerEvents: 'none',
              position: 'relative',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 55, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ amount: 0.45 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: '480px',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid rgba(0, 180, 216, 0.22)',
                boxShadow:
                  '0 20px 45px -12px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
                color: '#0F172A',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {/* Encabezado de la Tarjeta con Badges Médicos */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.85rem',
                  flexWrap: 'wrap',
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
                      background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.18) 0%, rgba(0, 119, 182, 0.18) 100%)',
                      color: '#0077B6',
                      border: '1px solid rgba(0, 180, 216, 0.3)',
                    }}
                  >
                    <Layers size={13} />
                    Paso {numPaso} de 6
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
                      background: '#F1F5F9',
                      color: '#64748B',
                    }}
                  >
                    <Clock size={12} /> {paso.tiempoEstimadoSegundos}s
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Sparkles size={12} /> Técnica Abierta
                </span>
              </div>

              {/* Título Principal del Paso */}
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#0077B6',
                  lineHeight: 1.25,
                  margin: '0 0 0.75rem 0',
                  letterSpacing: '-0.02em',
                }}
              >
                {paso.titulo}
              </h2>

              {/* Descripción Clínica */}
              <p
                style={{
                  fontSize: '0.92rem',
                  color: '#475569',
                  lineHeight: 1.6,
                  margin: '0 0 1.2rem 0',
                }}
              >
                {paso.descripcion}
              </p>

              {/* Puntos Críticos de la Técnica */}
              {paso.puntosCriticos && paso.puntosCriticos.length > 0 && (
                <div
                  style={{
                    background: 'rgba(240, 249, 255, 0.7)',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    marginBottom: '1rem',
                    border: '1px solid rgba(186, 230, 253, 0.8)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#0369A1',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <CheckCircle2 size={14} color="#0284C7" />
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
                          color: '#334155',
                          lineHeight: 1.45,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.45rem',
                        }}
                      >
                        <span
                          style={{
                            color: '#00B4D8',
                            fontSize: '1rem',
                            lineHeight: 1,
                            marginTop: '1px',
                          }}
                        >
                          •
                        </span>
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
                    padding: '0.75rem 0.9rem',
                    background: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    borderRadius: '10px',
                    color: '#92400E',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                  }}
                >
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
                  <div>
                    <strong style={{ color: '#B45309' }}>Asepsia estricta:</strong>{' '}
                    {paso.consejoAsepsia}
                  </div>
                </div>
              )}

              {/* Indicador de Ayuda para Navegación en Paso 1 */}
              {numPaso === 1 && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: '#0077B6',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <span>Desliza hacia abajo para continuar con el recorrido</span>
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <ChevronDown size={15} />
                  </motion.div>
                </div>
              )}

              {/* Mensaje Conclusivo en Paso 6 */}
              {numPaso === 6 && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    border: '1px solid #10B981',
                    color: '#065F46',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                  }}
                >
                  <Award size={18} color="#059669" />
                  <span>
                    ¡Técnica completada! Ambos guantes calzados con esterilidad absoluta.
                  </span>
                </div>
              )}
            </motion.div>
          </section>
        );
      })}
    </Scroll>
  );
};

export default ScrollHTML;
