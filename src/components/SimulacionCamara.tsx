// Módulo de Visión Artificial para práctica de técnica estéril con MediaPipe Hands
// Proyecto: Fortalecimiento de competencias en postura de guantes quirúrgicos
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { VideoCanvas } from './VideoCanvas';
import { PanelFeedback } from './PanelFeedback';
import { ControlesSimulacion } from './ControlesSimulacion';
import { PASOS_SIMULACION_VISION } from '../data/pasosTecnica';
import { validarPasoTecnica } from '../utils/validacionTecnica';
import type { ResultadoValidacion } from '../types/mediapipe';
import { soundManager } from '../utils/sound';
import { formatearTiempo } from '../utils/puntuacion';
import confetti from 'canvas-confetti';
import Modal from './ui/Modal';
import { Award, CheckCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { useProgresoStore } from '../store/useProgresoStore';

/**
 * Fórmula oficial de puntaje:
 * - Base: 1000 puntos
 * - Penalización por error: -50 puntos
 * - Penalización por tiempo: -1 punto por segundo > 120s
 * - Mínimo: 0 puntos
 */
export function calcularPuntajeSimulacion(
  pasosCompletados: number,
  errores: number,
  tiempoSegundos: number
): number {
  const base = 1000;
  const penalizacionErrores = errores * 50;
  const penalizacionTiempo = Math.max(0, tiempoSegundos - 120) * 1;
  const factorPasos = pasosCompletados / 6;
  const puntajeBruto = Math.round(base * factorPasos - penalizacionErrores - penalizacionTiempo);
  return Math.max(0, puntajeBruto);
}

export interface SimulacionCamaraProps {
  onIntentoGuardado?: (payload: {
    puntaje: number;
    tiempoSegundos: number;
    errores: number;
    pasosCompletados: number;
  }) => void;
}

export const SimulacionCamara: React.FC<SimulacionCamaraProps> = ({ onIntentoGuardado }) => {
  // 1. Hook de tracking de manos con MediaPipe
  const {
    isReady,
    isLoading,
    landmarks,
    handedness,
    fps,
    error,
    alertaIluminacion,
    videoRef,
    canvasRef,
    reiniciarDetector,
    pausarTracking,
    reanudarTracking,
  } = useHandTracking();

  // 2. Estado de la práctica
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [pasosCompletados, setPasosCompletados] = useState<number[]>([]);
  const [errores, setErrores] = useState<number>(0);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<number>(0);
  const [practicaActiva, setPracticaActiva] = useState<boolean>(false);
  const [practicaCompletada, setPracticaCompletada] = useState<boolean>(false);
  const [enPausa, setEnPausa] = useState<boolean>(false);

  // 3. Estado de validación
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacion | null>(null);
  const [tiempoSostenidoSegundos, setTiempoSostenidoSegundos] = useState<number>(0);
  const [modalResumenAbierto, setModalResumenAbierto] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // 4. Referencias temporales para umbrales de 1.5s y 3s
  const inicioCorrectoRef = useRef<number | null>(null);
  const inicioIncorrectoRef = useRef<number | null>(null);
  const intervaloTimerRef = useRef<number | null>(null);

  // Integración con el store de progreso local
  const agregarIntentoStore = useProgresoStore((state) => state.agregarIntento);

  /**
   * INICIAR PRÁCTICA
   */
  const handleIniciar = () => {
    soundManager.playClick();
    setPasoActual(1);
    setPasosCompletados([]);
    setErrores(0);
    setTiempoTranscurrido(0);
    setTiempoSostenidoSegundos(0);
    setPracticaCompletada(false);
    setEnPausa(false);
    setPracticaActiva(true);
    inicioCorrectoRef.current = null;
    inicioIncorrectoRef.current = null;
    reanudarTracking();
  };

  /**
   * PAUSAR / REANUDAR
   */
  const handlePausarReanudar = () => {
    soundManager.playClick();
    if (enPausa) {
      setEnPausa(false);
      reanudarTracking();
    } else {
      setEnPausa(true);
      pausarTracking();
      inicioCorrectoRef.current = null;
      inicioIncorrectoRef.current = null;
      setTiempoSostenidoSegundos(0);
    }
  };

  /**
   * REINICIAR PRÁCTICA
   */
  const handleReiniciar = () => {
    soundManager.playClick();
    setPracticaActiva(false);
    setPracticaCompletada(false);
    setEnPausa(false);
    setPasoActual(1);
    setPasosCompletados([]);
    setErrores(0);
    setTiempoTranscurrido(0);
    setTiempoSostenidoSegundos(0);
    setResultadoValidacion(null);
    setModalResumenAbierto(false);
    inicioCorrectoRef.current = null;
    inicioIncorrectoRef.current = null;
    reanudarTracking();
  };

  /**
   * CRONÓMETRO: Corre cada segundo mientras la práctica esté activa y no pausada
   */
  useEffect(() => {
    if (practicaActiva && !enPausa && !practicaCompletada) {
      intervaloTimerRef.current = window.setInterval(() => {
        setTiempoTranscurrido((t) => t + 1);
      }, 1000);
    } else {
      if (intervaloTimerRef.current) {
        clearInterval(intervaloTimerRef.current);
        intervaloTimerRef.current = null;
      }
    }

    return () => {
      if (intervaloTimerRef.current) {
        clearInterval(intervaloTimerRef.current);
        intervaloTimerRef.current = null;
      }
    };
  }, [practicaActiva, enPausa, practicaCompletada]);

  /**
   * BUCLE DE VALIDACIÓN EN VIVO (Evaluación continua según landmarks)
   */
  useEffect(() => {
    if (!practicaActiva || enPausa || practicaCompletada) {
      return;
    }

    // Si aún no hay detección, esperar
    if (!landmarks || landmarks.length === 0) {
      setResultadoValidacion((prev) => {
        if (!prev?.correcto && prev?.mensaje === 'Coloca tus manos frente a la cámara dentro del encuadre.') {
          return prev;
        }
        return {
          correcto: false,
          mensaje: 'Coloca tus manos frente a la cámara dentro del encuadre.',
        };
      });
      inicioCorrectoRef.current = null;
      setTiempoSostenidoSegundos((prev) => (prev === 0 ? prev : 0));
      return;
    }

    // 1. Evaluar el paso actual con el motor de validación
    const res = validarPasoTecnica(pasoActual, landmarks, handedness);
    setResultadoValidacion((prev) => {
      if (
        prev &&
        prev.correcto === res.correcto &&
        prev.mensaje === res.mensaje
      ) {
        return prev;
      }
      return res;
    });

    const ahora = Date.now();

    // 2. Lógica de postura CORRECTA (Avance si se sostiene durante 1.5s)
    if (res.correcto) {
      inicioIncorrectoRef.current = null;

      if (inicioCorrectoRef.current === null) {
        inicioCorrectoRef.current = ahora;
      }

      const tiempoSostenido = (ahora - inicioCorrectoRef.current) / 1000;
      setTiempoSostenidoSegundos((prev) =>
        Math.abs(prev - tiempoSostenido) > 0.08 ? tiempoSostenido : prev
      );

      if (tiempoSostenido >= 1.5) {
        soundManager.playSuccess();
        inicioCorrectoRef.current = null;
        setTiempoSostenidoSegundos(0);

        if (pasoActual < 6) {
          setPasosCompletados((prev) => (prev.includes(pasoActual) ? prev : [...prev, pasoActual]));
          setPasoActual((p) => p + 1);
        } else {
          // Completó los 6 pasos
          setPasosCompletados((prev) => (prev.includes(6) ? prev : [...prev, 6]));
          setPracticaActiva(false);
          setPracticaCompletada(true);
          setModalResumenAbierto(true);

          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      }
    } else {
      // 3. Lógica de postura INCORRECTA (Error cada 3 segundos sostenidos de fallo)
      inicioCorrectoRef.current = null;
      setTiempoSostenidoSegundos((prev) => (prev === 0 ? prev : 0));

      if (inicioIncorrectoRef.current === null) {
        inicioIncorrectoRef.current = ahora;
      } else {
        const tiempoIncorrecto = ahora - inicioIncorrectoRef.current;
        if (tiempoIncorrecto >= 3000) {
          soundManager.playError();
          setErrores((e) => e + 1);
          // Reiniciar para que el siguiente error cuente tras otros 3 segundos si no corrige
          inicioIncorrectoRef.current = ahora;
        }
      }
    }
  }, [landmarks, handedness, pasoActual, practicaActiva, enPausa, practicaCompletada]);

  /**
   * FINALIZAR Y GUARDAR INTENTO
   */
  const handleFinalizarGuardar = useCallback(async () => {
    setGuardando(true);
    soundManager.playClick();

    const puntajeFinal = calcularPuntajeSimulacion(
      pasosCompletados.length,
      errores,
      tiempoTranscurrido
    );

    const payload = {
      puntaje: puntajeFinal,
      tiempoSegundos: tiempoTranscurrido,
      errores: errores,
      modo: 'SIMULACION' as const,
      pasosCompletados: pasosCompletados.length >= 6 ? 6 : pasosCompletados.length,
    };

    // 1. Guardar en el store local de progreso (Zustand + localStorage)
    try {
      agregarIntentoStore({
        puntaje: payload.puntaje,
        tiempoSegundos: payload.tiempoSegundos,
        errores: payload.errores,
        modo: 'simulacion',
        pasosCompletados: payload.pasosCompletados,
        detallesErrores: [
          `Práctica por cámara completada con ${errores} faltas en ${tiempoTranscurrido}s.`,
        ],
      });
    } catch (storeErr) {
      console.warn('Error al guardar en el store local:', storeErr);
    }

    // 2. Notificar callback externo para sincronización con Backend REST (Fase 8)
    if (onIntentoGuardado) {
      try {
        await onIntentoGuardado(payload);
      } catch (backendErr) {
        console.warn('Error al enviar al backend:', backendErr);
      }
    }

    setGuardando(false);
    setModalResumenAbierto(false);
  }, [agregarIntentoStore, errores, onIntentoGuardado, pasosCompletados.length, tiempoTranscurrido]);

  const puntajeModal = calcularPuntajeSimulacion(
    pasosCompletados.length,
    errores,
    tiempoTranscurrido
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
      }}
    >
      {/* ENCABEZADO */}
      <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#0077B6',
            marginBottom: '0.35rem',
          }}
        >
          Simulador Biomecánico por Cámara
        </h1>
        <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '650px', margin: '0 auto' }}>
          La inteligencia artificial analiza la postura de tus manos en tiempo real para verificar el
          cumplimiento de la técnica estéril quirúrgica (Técnica Abierta).
        </p>
      </div>

      {/* DISPOSICIÓN PRINCIPAL: GRID RESPONSIVE (VIDEO IZQUIERDA / FEEDBACK DERECHA) */}
      <div
        className="simulacion-camara-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(300px, 380px)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA: VIDEO CANVAS + CONTROLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <VideoCanvas
            videoRef={videoRef}
            canvasRef={canvasRef}
            landmarks={landmarks}
            handedness={handedness}
            pasoCorrecto={resultadoValidacion?.correcto ?? false}
            isReady={isReady}
            isLoading={isLoading}
            error={error}
            fps={fps}
            alertaIluminacion={alertaIluminacion}
            onReintentar={reiniciarDetector}
          />

          {/* Barra de control inferior */}
          <ControlesSimulacion
            practicaActiva={practicaActiva}
            practicaCompletada={practicaCompletada}
            enPausa={enPausa}
            cargandoIA={isLoading || !isReady}
            onIniciar={handleIniciar}
            onPausarReanudar={handlePausarReanudar}
            onReiniciar={handleReiniciar}
            onFinalizarGuardar={() => setModalResumenAbierto(true)}
            guardandoResultado={guardando}
          />
        </div>

        {/* COLUMNA DERECHA: PANEL DE RETROALIMENTACIÓN */}
        <div style={{ width: '100%' }}>
          <PanelFeedback
            pasoActual={pasoActual}
            pasos={PASOS_SIMULACION_VISION}
            pasosCompletados={pasosCompletados}
            resultadoValidacion={resultadoValidacion}
            tiempoTranscurrido={tiempoTranscurrido}
            errores={errores}
            practicaActiva={practicaActiva}
            practicaCompletada={practicaCompletada}
            tiempoSostenidoSegundos={tiempoSostenidoSegundos}
          />
        </div>
      </div>

      {/* MODAL DE RESUMEN AL COMPLETAR LA PRÁCTICA */}
      <Modal
        isOpen={modalResumenAbierto}
        onClose={() => setModalResumenAbierto(false)}
        title="¡Práctica de Técnica Estéril Completada!"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            <button
              onClick={handleReiniciar}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              Practicar de nuevo
            </button>
            <button
              onClick={handleFinalizarGuardar}
              disabled={guardando}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                backgroundColor: '#0077B6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar y Registrar Intento'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          {/* Tarjeta de Puntaje Central */}
          <div
            style={{
              textAlign: 'center',
              backgroundColor: '#F0F9FF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #BAE6FD',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#0077B6',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
                boxShadow: '0 4px 10px rgba(0, 119, 182, 0.3)',
              }}
            >
              <Award size={30} />
            </div>
            <div style={{ fontSize: '0.78rem', color: '#0369A1', fontWeight: 600, textTransform: 'uppercase' }}>
              Puntaje Obtenido
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0077B6', lineHeight: 1.1 }}>
              {puntajeModal}
              <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: 500 }}> / 1000</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#0284C7', marginTop: '0.35rem' }}>
              {puntajeModal >= 850
                ? '¡Excelente dominio de la asepsia quirúrgica!'
                : puntajeModal >= 600
                ? 'Buen desempeño. Corrige los puntos críticos para mayor precisión.'
                : 'Se recomienda repasar la técnica y volver a practicar.'}
            </div>
          </div>

          {/* Desglose de Estadísticas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              textAlign: 'center',
            }}
          >
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Clock size={18} style={{ color: '#0077B6', margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Tiempo</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                {formatearTiempo(tiempoTranscurrido)}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <AlertTriangle size={18} style={{ color: errores > 0 ? '#DC2626' : '#16A34A', margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Errores</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: errores > 0 ? '#DC2626' : '#16A34A' }}>
                {errores}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <CheckCircle size={18} style={{ color: '#16A34A', margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Pasos</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>6 / 6</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Regla CSS para responsive */}
      <style>{`
        @media (max-width: 900px) {
          .simulacion-camara-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SimulacionCamara;
