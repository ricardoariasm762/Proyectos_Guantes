// Componente para renderizado de video en espejo y superposición de landmarks en Canvas
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React, { useEffect, useRef } from 'react';
import {
  type ManoLandmarks,
  type ManoInfo,
  CONEXIONES_MANO,
  PuntosMano,
} from '../types/mediapipe';
import { Lock, AlertTriangle, RefreshCw, Eye, EyeOff, Bot, Cpu } from 'lucide-react';

export interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  landmarks: ManoLandmarks[];
  handedness: ManoInfo[];
  pasoCorrecto: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  fps: number;
  alertaIluminacion: boolean;
  isIAReady?: boolean;
  isIALoading?: boolean;
  onReintentar?: () => void;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  videoRef,
  canvasRef,
  landmarks,
  handedness,
  pasoCorrecto,
  isReady,
  isLoading,
  error,
  fps,
  alertaIluminacion,
  isIAReady,
  isIALoading,
  onReintentar,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Dibuja el esqueleto y los 21 puntos anatómicos sobre el Canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sincronizar dimensiones internas del canvas con la resolución del video
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Limpiar frame anterior
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) {
      return;
    }

    // Dibujar cada mano detectada
    landmarks.forEach((puntosMano, handIdx) => {
      if (!puntosMano || puntosMano.length < 21) return;

      const info = handedness[handIdx];
      const esIzquierda = info ? info.categoryName === 'Left' : handIdx === 0;

      // Colores de diseño según especificación:
      // Mano izquierda: Azul (#0077B6 / #0284C7)
      // Mano derecha: Naranja (#EA580C / #F97316)
      const colorPunto = esIzquierda ? '#0284C7' : '#EA580C';
      const colorPuntoRelleno = esIzquierda ? '#38BDF8' : '#FDBA74';

      // Color de las conexiones: Verde si la postura del paso es correcta, Rojo/Ámbar si no
      const colorLinea = pasoCorrecto ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.75)';
      const anchoLinea = pasoCorrecto ? 3.5 : 2.5;

      // 1. Dibujar conexiones anatómicas (líneas)
      ctx.lineWidth = anchoLinea;
      ctx.strokeStyle = colorLinea;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const [idxInicio, idxFin] of CONEXIONES_MANO) {
        const pInicio = puntosMano[idxInicio];
        const pFin = puntosMano[idxFin];

        if (pInicio && pFin) {
          ctx.beginPath();
          ctx.moveTo(pInicio.x * canvas.width, pInicio.y * canvas.height);
          ctx.lineTo(pFin.x * canvas.width, pFin.y * canvas.height);
          ctx.stroke();
        }
      }

      // 2. Dibujar los 21 puntos clave (círculos de radio 4px con halo)
      puntosMano.forEach((pto, ptoIdx) => {
        const x = pto.x * canvas.width;
        const y = pto.y * canvas.height;

        // Puntos terminales o muñeca ligeramente más destacados
        const esPunta =
          ptoIdx === PuntosMano.MUNICA ||
          ptoIdx === PuntosMano.PULGAR_TIP ||
          ptoIdx === PuntosMano.INDICE_TIP ||
          ptoIdx === PuntosMano.MEDIO_TIP ||
          ptoIdx === PuntosMano.ANULAR_TIP ||
          ptoIdx === PuntosMano.MENIQUE_TIP;

        const radio = esPunta ? 5.5 : 4;

        // Borde blanco exterior para alto contraste
        ctx.beginPath();
        ctx.arc(x, y, radio + 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Relleno coloreado según lateralidad
        ctx.beginPath();
        ctx.arc(x, y, radio, 0, 2 * Math.PI);
        ctx.fillStyle = esPunta ? colorPunto : colorPuntoRelleno;
        ctx.fill();

        // Borde interior
        ctx.lineWidth = 1;
        ctx.strokeStyle = colorPunto;
        ctx.stroke();
      });

      // 3. Etiqueta flotante de lateralidad sobre la muñeca
      const munica = puntosMano[PuntosMano.MUNICA];
      if (munica) {
        const labelX = munica.x * canvas.width;
        const labelY = Math.max(20, munica.y * canvas.height - 14);
        const texto = esIzquierda ? 'Mano Izquierda' : 'Mano Derecha';

        ctx.save();
        // Como el canvas está en espejo con CSS scaleX(-1), invertimos el texto localmente
        // para que sea legible de izquierda a derecha por el usuario
        ctx.translate(labelX, labelY);
        ctx.scale(-1, 1);
        ctx.font = 'bold 11px system-ui, sans-serif';
        const metrics = ctx.measureText(texto);
        const bgWidth = metrics.width + 12;
        const bgHeight = 18;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(-bgWidth / 2, -bgHeight / 2 - 2, bgWidth, bgHeight, 4);
        ctx.fill();

        ctx.fillStyle = esIzquierda ? '#7DD3FC' : '#FDBA74';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(texto, 0, 0);
        ctx.restore();
      }
    });
  }, [landmarks, handedness, pasoCorrecto, canvasRef, videoRef]);

  return (
    <div ref={containerRef} className="video-canvas-container">
      {/* Elemento de Video nativo (en espejo) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="video-native-feed"
        style={{ display: isReady ? 'block' : 'none' }}
      />

      {/* Capa de Canvas superpuesta para dibujar los landmarks (en espejo sincronizado) */}
      <canvas
        ref={canvasRef}
        className="video-landmarks-canvas"
        style={{ display: isReady ? 'block' : 'none' }}
      />

      {/* AVISO DE PRIVACIDAD OBLIGATORIO */}
      <div className="video-privacy-bar">
        <Lock size={13} className="video-privacy-icon" />
        <span>🔒 Tu cámara se procesa localmente. Ningún video se envía a servidores.</span>
      </div>

      {/* INSIGNIAS SUPERIORES: FPS Y DETECCIÓN */}
      {isReady && (
        <div className="video-top-badges">
          {/* Contador de manos */}
          <div
            className={`video-badge-pill ${
              landmarks.length >= 2
                ? 'detected-2'
                : landmarks.length === 1
                ? 'detected-1'
                : 'detected-0'
            }`}
          >
            {landmarks.length > 0 ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>
              {landmarks.length === 0
                ? 'Esperando manos...'
                : landmarks.length === 1
                ? '1 mano detectada'
                : '2 manos detectadas'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Estado de IA TensorFlow.js */}
            <div
              className="video-fps-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: isIAReady ? 'var(--color-primary-soft)' : isIALoading ? 'var(--color-warning)' : 'var(--text-muted)',
              }}
              title={
                isIAReady
                  ? 'Red Neuronal client-side activa'
                  : isIALoading
                  ? 'Cargando pesos de IA...'
                  : 'Modo contingencia: Sistema Experto de Reglas Clínicas'
              }
            >
              {isIAReady ? <Bot size={13} /> : <Cpu size={13} />}
              <span>{isIAReady ? 'IA Activa' : isIALoading ? 'Cargando IA' : 'Reglas'}</span>
            </div>

            {/* Medidor de FPS */}
            <div
              className={`video-fps-badge ${
                fps >= 24 ? 'fps-optimal' : fps >= 18 ? 'fps-medium' : 'fps-low'
              }`}
            >
              {fps} FPS
            </div>
          </div>
        </div>
      )}

      {/* ALERTA DE ILUMINACIÓN INSUFICIENTE */}
      {isReady && alertaIluminacion && (
        <div className="video-lighting-alert">
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>Iluminación inestable o movimiento rápido. Mejora la luz y mantén las manos estables.</span>
        </div>
      )}

      {/* PANTALLA DE CARGA */}
      {isLoading && (
        <div className="video-loading-overlay">
          <div className="video-loading-spinner" />
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Iniciando cámara y MediaPipe...</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
            Cargando modelo de visión artificial en el navegador. Por favor permite el acceso a tu cámara.
          </div>
        </div>
      )}

      {/* PANTALLA DE ERROR */}
      {error && !isLoading && (
        <div className="video-error-overlay">
          <div className="video-error-icon-box">
            <AlertTriangle size={26} />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-contaminated)' }}>Acceso a Cámara / IA</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--border-strong)', maxWidth: '360px', lineHeight: 1.4 }}>
            {error}
          </div>
          {onReintentar && (
            <button
              onClick={onReintentar}
              className="btn-ctrl-primary"
              style={{ marginTop: '8px', padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <RefreshCw size={14} />
              Reintentar conexión
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCanvas;
