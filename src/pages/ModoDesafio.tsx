// Módulo Modo Desafío (Evaluación Contrarreloj de 5 minutos y Leaderboard histórico)
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgresoStore } from '../store/useProgresoStore';
import { useTimer } from '../hooks/useTimer';
import { formatearTiempo, formatearFecha } from '../utils/puntuacion';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

interface PreguntaDesafio {
  pasoId: number;
  pasoTitulo: string;
  situacion: string;
  opciones: {
    texto: string;
    esCorrecta: boolean;
    feedback: string;
  }[];
}

const PREGUNTAS_DESAFIO: PreguntaDesafio[] = [
  {
    pasoId: 1,
    pasoTitulo: 'Lavado Quirúrgico de Manos',
    situacion:
      'Tras 4 minutos de frotado quirúrgico, realizas el enjuague de manos. ¿Cuál es la postura y dirección correcta del agua?',
    opciones: [
      {
        texto: 'Dedos más altos que codos, permitiendo que el agua escurra desde las puntas de los dedos hacia los codos.',
        esCorrecta: true,
        feedback: '¡Correcto! El flujo retrógrado evita que bacterias de los codos contaminen las manos limpias.',
      },
      {
        texto: 'Bajar las manos hacia el lavabo para que el agua escurra más rápido por gravedad hacia el desagüe.',
        esCorrecta: false,
        feedback: 'Error crítico: Al bajar las manos el agua no estéril de codos y brazos resbala hacia los dedos.',
      },
      {
        texto: 'Sacudirse vigorosamente las manos dentro del lavabo para retirar el exceso de agua.',
        esCorrecta: false,
        feedback: 'Error: Sacudir las manos genera aerosoles contaminados y riesgo de golpear superficies del lavabo.',
      },
    ],
  },
  {
    pasoId: 2,
    pasoTitulo: 'Secado con Compresa Estéril',
    situacion:
      'Has secado la mano y antebrazo derechos con el extremo superior de la compresa. ¿Cómo procedes para secar la extremidad izquierda?',
    opciones: [
      {
        texto: 'Invertir la compresa y usar exclusivamente el extremo opuesto no usado, sin regresar a zonas ya secas.',
        esCorrecta: true,
        feedback: '¡Correcto! Cada extremidad debe contactar una sección virgen y estéril de la toalla.',
      },
      {
        texto: 'Frotar con la misma sección del codo izquierdo hacia los dedos para aprovechar la humedad.',
        esCorrecta: false,
        feedback: 'Error crítico: Nunca se seca de proximal a distal ni se reutiliza la misma área de la compresa.',
      },
      {
        texto: 'Apoyar la compresa en la mesa de instrumental para doblarla en cuatro partes antes de continuar.',
        esCorrecta: false,
        feedback: 'Error crítico: Contaminas la toalla con la superficie de la mesa.',
      },
    ],
  },
  {
    pasoId: 3,
    pasoTitulo: 'Toma de Guante Derecho',
    situacion:
      'Frente a la envoltura estéril abierta, vas a calzar tu mano dominante (derecha). ¿Por dónde debes sostener el guante con la mano izquierda desenguantada?',
    opciones: [
      {
        texto: 'Únicamente por la cara interna del puño doblado (la parte que quedará en contacto con tu piel).',
        esCorrecta: true,
        feedback: '¡Correcto! La cara interna se considera no estéril una vez tocada por piel desenguantada.',
      },
      {
        texto: 'Por el dedo pulgar del guante para facilitar la orientación anatómica de la mano.',
        esCorrecta: false,
        feedback: 'Error crítico: Tocar el exterior del guante con piel desnuda anula inmediatamente la esterilidad.',
      },
      {
        texto: 'Por el borde exterior de la muñeca para poder estirarlo con fuerza.',
        esCorrecta: false,
        feedback: 'Error: La cara exterior es la superficie estéril que entrará al paciente; no puede tocarse con piel.',
      },
    ],
  },
  {
    pasoId: 4,
    pasoTitulo: 'Introducción de Mano Dominante',
    situacion:
      'Al introducir la mano derecha, los dedos meñique y anular se desvían hacia el mismo compartimento. ¿Qué conducta aséptica debes tomar?',
    opciones: [
      {
        texto: 'Continuar sin corregir en este momento; el ajuste de dedos se realiza cuando ambas manos estén enguantadas.',
        esCorrecta: true,
        feedback: '¡Excelente criterio! Tocar los dedos con la mano desnuda contaminaría el guante irremediablemente.',
      },
      {
        texto: 'Tirar con los dedos de la mano izquierda desnuda para separar el látex y acomodar el meñique.',
        esCorrecta: false,
        feedback: 'Error crítico: Contaminaste la superficie externa del guante derecho con tu mano izquierda desenguantada.',
      },
      {
        texto: 'Retirar inmediatamente el guante con la mano izquierda y volver a guardarlo en el paquete.',
        esCorrecta: false,
        feedback: 'Error: El guante ya tuvo contacto con piel; no puede reingresar al envoltorio estéril.',
      },
    ],
  },
  {
    pasoId: 5,
    pasoTitulo: 'Guante Contralateral (Mano Izquierda)',
    situacion:
      'Con tu mano derecha ya enguantada (estéril), vas a tomar el guante izquierdo. ¿Cómo debes sujetarlo?',
    opciones: [
      {
        texto: 'Introducir 4 dedos bajo el puño doblado (cara externa estéril), manteniendo el pulgar derecho bien abducido (separado).',
        esCorrecta: true,
        feedback: '¡Exacto! Regla estéril con estéril. El pulgar abducido evita rozar la piel de la muñeca izquierda.',
      },
      {
        texto: 'Hacer pinza con pulgar e índice sobre la cara interna doblada del puño izquierdo.',
        esCorrecta: false,
        feedback: 'Error crítico: La cara interna está en contacto con piel; tu mano enguantada estéril no debe tocarla.',
      },
      {
        texto: 'Tomar la punta de los dedos del guante izquierdo y jalarlo hacia arriba.',
        esCorrecta: false,
        feedback: 'Error: Esta maniobra voltea el guante e impide introducir la mano con técnica aséptica.',
      },
    ],
  },
  {
    pasoId: 6,
    pasoTitulo: 'Ajuste de Puños y Despliegue',
    situacion:
      'Ambas manos están calzadas pero los puños siguen doblados. ¿Cuál es la maniobra para desplegarlos manteniendo esterilidad?',
    opciones: [
      {
        texto: 'Deslizar los dedos enguantados únicamente por la cara externa del puño para desdoblarlo sobre la muñeca o bata.',
        esCorrecta: true,
        feedback: '¡Perfecto! Al tocar solo la cara externa, ambas superficies continúan 100% asépticas.',
      },
      {
        texto: 'Introducir los dedos debajo del puño contra el antebrazo para tirar hacia el codo.',
        esCorrecta: false,
        feedback: 'Error crítico: Los dedos enguantados tocaron la piel del antebrazo, contaminando el guante.',
      },
      {
        texto: 'Apoyar las manos en las axilas para sujetar los puños y empujarlos hacia atrás.',
        esCorrecta: false,
        feedback: 'Error crítico: El área axilar se considera zona contaminada en quirófano.',
      },
    ],
  },
];

const DURACION_DESAFIO_SEGUNDOS = 300; // 5 minutos exactos

const ModoDesafio: React.FC = () => {
  const navigate = useNavigate();
  const { agregarIntento, intentos } = useProgresoStore();

  const [estadoDesafio, setEstadoDesafio] = useState<'inicio' | 'jugando' | 'finalizado'>('inicio');
  const [pasoActualIdx, setPasoActualIdx] = useState(0);
  const [errores, setErrores] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [modalResultado, setModalResultado] = useState(false);
  const [ultimoPuntaje, setUltimoPuntaje] = useState(0);
  const [tiempoEmpleados, setTiempoEmpleados] = useState(0);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<number | null>(null);
  const [mostrarFeedbackPaso, setMostrarFeedbackPaso] = useState(false);

  const terminarPorTiempo = () => {
    finalizarDesafio(true);
  };

  const { segundos, iniciar, pausar, reiniciar } = useTimer({
    modo: 'descendente',
    duracionInicialSegundos: DURACION_DESAFIO_SEGUNDOS,
    alFinalizar: terminarPorTiempo,
  });

  const comenzarDesafio = () => {
    soundManager.playClick();
    setEstadoDesafio('jugando');
    setPasoActualIdx(0);
    setErrores(0);
    setAciertos(0);
    setOpcionSeleccionada(null);
    setMostrarFeedbackPaso(false);
    reiniciar(DURACION_DESAFIO_SEGUNDOS);
    iniciar();
  };

  const seleccionarOpcion = (indiceOpcion: number) => {
    if (mostrarFeedbackPaso) return;

    setOpcionSeleccionada(indiceOpcion);
    setMostrarFeedbackPaso(true);

    const preg = PREGUNTAS_DESAFIO[pasoActualIdx];
    const elegida = preg.opciones[indiceOpcion];

    if (elegida.esCorrecta) {
      soundManager.playSuccess();
      setAciertos((prev) => prev + 1);
    } else {
      soundManager.playError();
      setErrores((prev) => prev + 1);
    }
  };

  const siguientePregunta = () => {
    soundManager.playClick();
    setOpcionSeleccionada(null);
    setMostrarFeedbackPaso(false);

    if (pasoActualIdx < PREGUNTAS_DESAFIO.length - 1) {
      setPasoActualIdx((prev) => prev + 1);
    } else {
      finalizarDesafio(false);
    }
  };

  const finalizarDesafio = (porTiempoAgotado = false) => {
    pausar();
    const tiempoConsumido = DURACION_DESAFIO_SEGUNDOS - segundos;
    setTiempoEmpleados(tiempoConsumido);

    // Cálculo de puntaje del Desafío:
    // Máximo 100 puntos: cada acierto aporta ~16.6 pts, penalización de tiempo si se agota
    const puntosAciertos = Math.round((aciertos / PREGUNTAS_DESAFIO.length) * 85);
    // Bono de tiempo si termina rápido y bien
    const bonoTiempo = !porTiempoAgotado && aciertos >= 5 && tiempoConsumido < 180 ? 15 : 10;
    const puntajeCalculado = porTiempoAgotado ? Math.max(0, puntosAciertos - 20) : Math.min(100, puntosAciertos + bonoTiempo);

    setUltimoPuntaje(puntajeCalculado);

    agregarIntento({
      puntaje: puntajeCalculado,
      tiempoSegundos: tiempoConsumido,
      errores,
      pasosCompletados: aciertos,
      modo: 'desafio',
    });

    setEstadoDesafio('finalizado');
    setModalResultado(true);

    if (puntajeCalculado >= 80) {
      soundManager.playSuccess();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // Fallback
      }
    }
  };

  // Historial de mejores intentos en Desafío (Leaderboard)
  const mejoresDesafios = intentos
    .filter((i) => i.modo === 'desafio')
    .sort((a, b) => b.puntaje - a.puntaje || a.tiempoSegundos - b.tiempoSegundos)
    .slice(0, 5);

  const preguntaActual = PREGUNTAS_DESAFIO[pasoActualIdx];

  return (
    <div className="modo-desafio-page">
      <div className="page-header-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge-pill badge-warning badge-size-sm">
                <Flame size={14} /> Modo Examen
              </span>
              <span className="badge-pill badge-secondary badge-size-sm">5:00 min límite</span>
            </div>
            <h1 className="page-title">Modo Desafío Quirúrgico</h1>
            <p className="page-description">
              Ponga a prueba sus conocimientos asépticos bajo presión de tiempo y sin ayudas visuales.
            </p>
          </div>

          {estadoDesafio === 'jugando' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: segundos < 60 ? 'var(--color-contaminated-bg)' : '#ffffff',
                  border: `2px solid ${segundos < 60 ? 'var(--color-contaminated)' : 'var(--color-primary)'}`,
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <Clock size={20} style={{ color: segundos < 60 ? 'var(--color-contaminated)' : 'var(--color-primary)' }} />
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: segundos < 60 ? 'var(--color-contaminated-dark)' : 'var(--color-primary-dark)',
                  }}
                >
                  {formatearTiempo(segundos)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pantalla Inicial (Instrucciones y Botón Comenzar) */}
      {estadoDesafio === 'inicio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
          <Card
            titulo="Instrucciones de la Evaluación"
            subtitulo="Simulación de Examen Práctico Clínico"
            icono={<AlertCircle size={22} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                En el <strong>Modo Desafío</strong> te enfrentarás a los 6 momentos críticos de la postura de guantes quirúrgicos. Se evaluará tu capacidad de respuesta inmediata y toma de decisiones asépticas correctas bajo la presión de un reloj contrarreloj.
              </p>

              <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Clock size={16} className="text-secondary" />
                  <span>Tiempo total: 5 minutos (300 segundos).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  <HelpCircle size={16} className="text-secondary" />
                  <span>6 situaciones clínicas con 3 alternativas cada una.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Award size={16} className="text-secondary" />
                  <span>Bonificación por velocidad y penalización por contaminación.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={comenzarDesafio}
              className="btn-primary-action"
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
            >
              <Play size={20} />
              <span>Iniciar Desafío Quirúrgico</span>
            </button>
          </Card>

          {/* Leaderboard histórico */}
          <Card
            titulo="Mejores Marcas del Estudiante"
            subtitulo="Tabla de clasificación local"
            icono={<Trophy size={22} />}
          >
            {mejoresDesafios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <Trophy size={42} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem' }}>Aún no has registrado intentos en Modo Desafío.</p>
                <small>¡Completa tu primera evaluación para clasificar!</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {mejoresDesafios.map((int, i) => (
                  <div
                    key={int.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: i === 0 ? 'var(--color-primary-ice)' : 'var(--bg-muted)',
                      border: i === 0 ? '1px solid var(--color-primary-soft)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: i === 0 ? 'var(--color-primary)' : 'var(--border-strong)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        #{i + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
                          {int.puntaje} pts
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {formatearFecha(int.fecha)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        {formatearTiempo(int.tiempoSegundos)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: int.errores === 0 ? 'var(--color-sterile-dark)' : 'var(--color-contaminated)' }}>
                        {int.errores} {int.errores === 1 ? 'error' : 'errores'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Pantalla Durante el Desafío (Preguntas activas) */}
      {estadoDesafio === 'jugando' && (
        <div>
          {/* Progreso del examen */}
          <div style={{ marginBottom: '1.25rem', background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <ProgressBar
              valor={Math.round(((pasoActualIdx + 1) / PREGUNTAS_DESAFIO.length) * 100)}
              etiqueta={`Situación ${pasoActualIdx + 1} de ${PREGUNTAS_DESAFIO.length}`}
              color="primary"
            />
          </div>

          <Card
            titulo={`Momento Clínico: ${preguntaActual.pasoTitulo}`}
            icono={<AlertCircle size={20} />}
            acciones={
              <Badge variant="secondary">
                Aciertos: {aciertos} • Fallos: {errores}
              </Badge>
            }
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {preguntaActual.situacion}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {preguntaActual.opciones.map((opc, idx) => {
                const seleccionada = opcionSeleccionada === idx;
                let bgStyle = '#ffffff';
                let borderStyle = '1px solid var(--border-strong)';
                let icon = null;

                if (mostrarFeedbackPaso) {
                  if (opc.esCorrecta) {
                    bgStyle = 'var(--color-sterile-bg)';
                    borderStyle = '2px solid var(--color-sterile)';
                    icon = <CheckCircle2 size={20} style={{ color: 'var(--color-sterile)', flexShrink: 0 }} />;
                  } else if (seleccionada && !opc.esCorrecta) {
                    bgStyle = 'var(--color-contaminated-bg)';
                    borderStyle = '2px solid var(--color-contaminated)';
                    icon = <XCircle size={20} style={{ color: 'var(--color-contaminated)', flexShrink: 0 }} />;
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => seleccionarOpcion(idx)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: bgStyle,
                      border: borderStyle,
                      cursor: mostrarFeedbackPaso ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--bg-muted)',
                        color: 'var(--color-primary-dark)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {opc.texto}
                      </div>
                      {mostrarFeedbackPaso && (opc.esCorrecta || seleccionada) && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: opc.esCorrecta ? 'var(--color-sterile-dark)' : 'var(--color-contaminated-dark)',
                          }}
                        >
                          {opc.feedback}
                        </div>
                      )}
                    </div>
                    {icon}
                  </div>
                );
              })}
            </div>

            {mostrarFeedbackPaso && (
              <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={siguientePregunta}
                  className="btn-primary-action"
                  style={{ margin: 0, padding: '0.75rem 1.75rem' }}
                >
                  <span>{pasoActualIdx === PREGUNTAS_DESAFIO.length - 1 ? 'Finalizar Desafío' : 'Siguiente Situación'}</span>
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal de Resultados */}
      <Modal
        isOpen={modalResultado}
        onClose={() => setModalResultado(false)}
        title="Resultado del Desafío Quirúrgico"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={comenzarDesafio}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RotateCcw size={15} />
              <span>Intentar de nuevo</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-primary-action"
              style={{ margin: 0, padding: '0.6rem 1.25rem' }}
            >
              Ir al Dashboard
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: ultimoPuntaje >= 80 ? 'var(--color-sterile-bg)' : 'var(--color-warning-bg)',
              color: ultimoPuntaje >= 80 ? 'var(--color-sterile)' : 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={36} />
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
            Puntuación Final: {ultimoPuntaje} / 100
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
            {ultimoPuntaje >= 80
              ? '¡Excelente desempeño! Tus competencias técnicas y de criterio aséptico están en nivel óptimo.'
              : 'Evaluación completada. Se recomienda reforzar las normas de asepsia en los pasos con infracción.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIEMPO EMPLEADO</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary-dark)', fontFamily: 'monospace' }}>
                {formatearTiempo(tiempoEmpleados)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACIERTOS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-sterile)' }}>
                {aciertos} / 6
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ERRORES</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: errores > 0 ? 'var(--color-contaminated)' : 'var(--color-sterile)' }}>
                {errores}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModoDesafio;