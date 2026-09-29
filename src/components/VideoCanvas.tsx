// Componente para renderizado de video en espejo y superposición de landmarks en Canvas
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React, { useEffect, useRef } from 'react';
import {
  type ManoLandmarks,
  type ManoInfo,
  CONEXIONES_MANO,
  PuntosMano,
} from '../types/mediapipe';
import { Lock, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';

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
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#0F172A',
        aspectRatio: '4 / 3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Elemento de Video nativo (en espejo) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Efecto espejo para mayor naturalidad
          display: isReady ? 'block' : 'none',
        }}
      />

      {/* Capa de Canvas superpuesta para dibujar los landmarks (en espejo sincronizado) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          transform: 'scaleX(-1)', // Sincronizado exactamente con el video
          display: isReady ? 'block' : 'none',
        }}
      />

      {/* AVISO DE PRIVACIDAD OBLIGATORIO */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          right: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          color: '#E2E8F0',
          fontSize: '0.74rem',
          padding: '5px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Lock size={13} style={{ color: '#38BDF8', flexShrink: 0 }} />
        <span>🔒 Tu cámara se procesa localmente. Ningún video se envía a servidores.</span>
      </div>

      {/* INSIGNIAS SUPERIORES: FPS Y DETECCIÓN */}
      {isReady && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Contador de manos */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: landmarks.length > 0 ? '#FFFFFF' : '#94A3B8',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '20px',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: `1px solid ${
                landmarks.length >= 2
                  ? '#10B981'
                  : landmarks.length === 1
                  ? '#0284C7'
                  : 'rgba(255, 255, 255, 0.15)'
              }`,
            }}
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

          {/* Medidor de FPS */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: fps >= 24 ? '#34D399' : fps >= 18 ? '#FBBF24' : '#F87171',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {fps} FPS
          </div>
        </div>
      )}

      {/* ALERTA DE ILUMINACIÓN INSUFICIENTE */}
      {isReady && alertaIluminacion && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            left: '12px',
            right: '12px',
            backgroundColor: 'rgba(217, 119, 6, 0.9)',
            color: '#FFFFFF',
            fontSize: '0.76rem',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>Iluminación inestable o movimiento rápido. Mejora la luz y mantén las manos estables.</span>
        </div>
      )}

      {/* PANTALLA DE CARGA */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            gap: '12px',
            zIndex: 20,
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38BDF8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Iniciando cámara y MediaPipe...</div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', maxWidth: '300px' }}>
            Cargando modelo de visión artificial en el navegador. Por favor permite el acceso a tu cámara.
          </div>
        </div>
      )}

      {/* PANTALLA DE ERROR */}
      {error && !isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            color: '#FFFFFF',
            gap: '12px',
            zIndex: 25,
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F87171' }}>Acceso a Cámara / IA</div>
          <div style={{ fontSize: '0.82rem', color: '#CBD5E1', maxWidth: '360px', lineHeight: 1.4 }}>
            {error}
          </div>
          {onReintentar && (
            <button
              onClick={onReintentar}
              style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#0077B6',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0096C7')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0077B6')}
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
