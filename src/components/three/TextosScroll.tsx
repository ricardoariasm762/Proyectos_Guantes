import React from 'react';
import { Scroll } from '@react-three/drei';
import { motion } from 'framer-motion';
import { PASOS_TECNICA } from '../../data/pasosTecnica';
import { CheckCircle2, ChevronDown, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * FASE 2: La Capa de Texto HTML (TextosScroll.tsx)
 * Renderiza 6 secciones con altura 100vh dentro de <Scroll html>.
 * Cada sección está alineada a la derecha para dejar despejado el modelo 3D
 * e implementa animaciones de entrada fluidas con Framer Motion (whileInView).
 */
export const TextosScroll: React.FC = () => {
  return (
    <Scroll html style={{ width: '100%' }}>
      {PASOS_TECNICA.map((paso, index) => {
        const numeroPaso = index + 1;
        const numeroFormateado = `0${numeroPaso}`;

        return (
          <section
            key={paso.id}
            className="seccion-scroll-paso"
            style={{
              height: '100vh',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end', // Alineado a la derecha para no tapar las manos
              padding: '0 6% 0 0',
              boxSizing: 'border-box',
              pointerEvents: 'none',
              position: 'relative',
            }}
          >
            <motion.div
              className="tarjeta-paso-scroll"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.4 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: '460px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Número grande de fondo con toque editorial */}
              <span className="numero-editorial-fondo" aria-hidden="true">
                {numeroFormateado}
              </span>

              {/* Cabecera del paso */}
              <div className="tarjeta-header">
                <span className="badge-paso">
                  <Sparkles size={13} />
                  Paso {numeroPaso}
                </span>
                <span className="badge-tecnica">Técnica Abierta</span>
              </div>

              {/* Título y Descripción */}
              <h2 className="tarjeta-titulo">{paso.titulo}</h2>
              <p className="tarjeta-descripcion">{paso.descripcion}</p>

              {/* Puntos Críticos */}
              {paso.puntosCriticos && paso.puntosCriticos.length > 0 && (
                <div className="contenedor-puntos-criticos">
                  <h4 className="titulo-puntos-criticos">
                    <CheckCircle2 size={15} color="#0077B6" />
                    Puntos Críticos:
                  </h4>
                  <ul className="lista-puntos-criticos">
                    {paso.puntosCriticos.map((punto, pIdx) => (
                      <li key={pIdx} className="item-punto-critico">
                        <span className="bullet-punto">•</span>
                        <span>{punto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alerta de Asepsia */}
              {paso.consejoAsepsia && (
                <div className="alerta-asepsia">
                  <ShieldAlert size={16} className="icono-asepsia" />
                  <p className="texto-asepsia">
                    <strong>Asepsia crítica:</strong> {paso.consejoAsepsia}
                  </p>
                </div>
              )}

              {/* Indicador de scroll animado en la primera sección */}
              {numeroPaso === 1 && (
                <div className="contenedor-indicador-scroll">
                  <motion.div
                    className="indicador-scroll-animado"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  >
                    <span>Desliza para comenzar</span>
                    <ChevronDown size={16} />
                  </motion.div>
                </div>
              )}
            </motion.div>
          </section>
        );
      })}
    </Scroll>
  );
};

export default TextosScroll;
