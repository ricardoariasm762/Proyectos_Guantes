// Hook para gestionar el ciclo de vida completo de MediaPipe Hands y la cámara web
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type {
  ManoLandmarks,
  ManoInfo,
  ManoLateralidad,
} from '../types/mediapipe';
import { SuavizadorLandmarks } from '../utils/suavizado';

const WASM_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Limitación a máximo 30 FPS para optimización de CPU/GPU
const INTERVALO_MIN_MS = 1000 / 30; // ~33.3 ms

export interface OpcionesHandTracking {
  activo?: boolean; // Permite pausar/reanudar el ciclo de detección
  tamanoVentanaSuavizado?: number;
}

export interface UseHandTrackingReturn {
  isReady: boolean;
  isLoading: boolean;
  landmarks: ManoLandmarks[];
  handedness: ManoInfo[];
  fps: number;
  error: string | null;
  alertaIluminacion: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  reiniciarDetector: () => Promise<void>;
  pausarTracking: () => void;
  reanudarTracking: () => void;
}

export function useHandTracking(opciones: OpcionesHandTracking = {}): UseHandTrackingReturn {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [alertaIluminacion, setAlertaIluminacion] = useState<boolean>(false);

  const [landmarks, setLandmarks] = useState<ManoLandmarks[]>([]);
  const [handedness, setHandedness] = useState<ManoInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const ultimoTiempoDeteccionRef = useRef<number>(0);
  const ultimoVideoTimestampRef = useRef<number>(-1);
  const suavizadorRef = useRef<SuavizadorLandmarks>(
    new SuavizadorLandmarks({ tamanoVentana: opciones.tamanoVentanaSuavizado ?? 5, factorEma: 0.65 })
  );

  // Métricas de FPS y salto de landmarks
  const conteoFramesRef = useRef<number>(0);
  const tiempoInicioFpsRef = useRef<number>(performance.now());
  const anterioresLandmarksRef = useRef<ManoLandmarks[]>([]);
  const resolucionReducidaRef = useRef<boolean>(false);
  const pausadoRef = useRef<boolean>(opciones.activo === false);

  /**
   * Inicializa el modelo HandLandmarker de MediaPipe con aceleración GPU (fallback a CPU).
   */
  const inicializarMediaPipe = useCallback(async (): Promise<HandLandmarker> => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);

      let landmarker: HandLandmarker;
      try {
        // Intento 1: Aceleración por GPU WebGL
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      } catch (gpuError) {
        console.warn('Aceleración GPU no disponible, recurriendo a CPU...', gpuError);
        // Intento 2: Fallback seguro en CPU
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      }

      return landmarker;
    } catch (err) {
      console.error('Error al inicializar MediaPipe Tasks Vision:', err);
      throw new Error(
        'No se pudo cargar el modelo de visión artificial. Verifica tu conexión a internet e inténtalo de nuevo.'
      );
    }
  }, []);

  /**
   * Solicita el stream de la cámara web nativa del navegador.
   */
  const iniciarCamara = useCallback(async (): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Tu navegador no soporta acceso a la cámara. Por favor utiliza Google Chrome, Microsoft Edge o Mozilla Firefox actualizados.'
      );
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      return stream;
    } catch (err: unknown) {
      const domError = err as { name?: string };
      if (domError.name === 'NotAllowedError' || domError.name === 'PermissionDeniedError') {
        throw new Error(
          'Permiso de cámara denegado. Por favor haz clic en el ícono de candado o cámara en la barra de direcciones de tu navegador y autoriza el acceso a la cámara.'
        );
      } else if (domError.name === 'NotFoundError' || domError.name === 'DevicesNotFoundError') {
        throw new Error(
          'No se detectó ninguna cámara web disponible en tu dispositivo. Conecta una cámara para practicar.'
        );
      } else if (domError.name === 'NotReadableError' || domError.name === 'TrackStartError') {
        throw new Error(
          'La cámara está en uso por otra pestaña o aplicación (ej. Zoom, Teams). Ciérrala para continuar.'
        );
      }
      throw new Error('Error al acceder a la cámara del dispositivo.');
    }
  }, []);

  /**
   * Bucle continuo de inferencia en tiempo real sincronizado con requestAnimationFrame.
   */
  const loopDeteccion = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      animFrameIdRef.current = requestAnimationFrame(loopDeteccion);
      return;
    }

    const ahora = performance.now();

    // 1. Control de tasa de cuadros: Máximo 30 FPS
    if (ahora - ultimoTiempoDeteccionRef.current >= INTERVALO_MIN_MS && !pausadoRef.current) {
      ultimoTiempoDeteccionRef.current = ahora;

      // El timestamp para detectForVideo debe ser estrictamente monótono creciente
      const videoTimestamp = ahora;
      if (videoTimestamp > ultimoVideoTimestampRef.current) {
        try {
          const results = landmarker.detectForVideo(video, videoTimestamp);
          ultimoVideoTimestampRef.current = videoTimestamp;

          if (results && results.landmarks && results.landmarks.length > 0) {
            // Aplicar filtro de suavizado temporal para eliminar jitter antes de entregar
            const manosSuavizadas = suavizadorRef.current.suavizarTodas(results.landmarks);
            setLandmarks(manosSuavizadas);

            // Mapear handedness de forma tipada
            const infosMano: ManoInfo[] = (results.handedness || []).map((catArray, idx) => {
              const cat = catArray[0];
              return {
                index: idx,
                score: cat?.score ?? 0.9,
                categoryName: (cat?.categoryName as ManoLateralidad) || (idx === 0 ? 'Left' : 'Right'),
                displayName: cat?.displayName,
              };
            });
            setHandedness(infosMano);

            // 2. Detección de estabilidad lumínica / jitter brusco
            if (anterioresLandmarksRef.current.length > 0 && manosSuavizadas.length > 0) {
              const anteriorMunica = anterioresLandmarksRef.current[0]?.[0];
              const actualMunica = manosSuavizadas[0]?.[0];
              if (anteriorMunica && actualMunica) {
                const desplazamiento = Math.hypot(
                  actualMunica.x - anteriorMunica.x,
                  actualMunica.y - anteriorMunica.y
                );
                // Si la muñeca salta más de 30% del encuadre en 33ms, suele ser pérdida por baja luz
                setAlertaIluminacion(desplazamiento > 0.3);
              }
            }
            anterioresLandmarksRef.current = manosSuavizadas;
          } else {
            setLandmarks([]);
            setHandedness([]);
            anterioresLandmarksRef.current = [];
            setAlertaIluminacion(false);
          }

          // 3. Cálculo de FPS reales y adaptación de rendimiento si cae por debajo de 20 FPS
          conteoFramesRef.current += 1;
          const deltaSegundos = (ahora - tiempoInicioFpsRef.current) / 1000;
          if (deltaSegundos >= 1.0) {
            const fpsCalculados = Math.round(conteoFramesRef.current / deltaSegundos);
            setFps(fpsCalculados);
            conteoFramesRef.current = 0;
            tiempoInicioFpsRef.current = ahora;

            // Optimización dinámica: si FPS < 20 de forma constante, reducir resolución de video
            if (fpsCalculados < 20 && !resolucionReducidaRef.current && streamRef.current) {
              const track = streamRef.current.getVideoTracks()[0];
              if (track && track.applyConstraints) {
                track
                  .applyConstraints({
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                  })
                  .then(() => {
                    resolucionReducidaRef.current = true;
                    console.info('Resolución adaptada a 320x240 para optimizar rendimiento.');
                  })
                  .catch(() => {});
              }
            }
          }
        } catch (detectErr) {
          console.warn('Advertencia en detección de frame:', detectErr);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(loopDeteccion);
  }, []);

  /**
   * Arranca o reinicia el sistema completo (cámara + modelo).
   */
  const inicializar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsReady(false);
    suavizadorRef.current.reiniciar();

    try {
      // 1. Cargar MediaPipe HandLandmarker
      const landmarker = await inicializarMediaPipe();
      landmarkerRef.current = landmarker;

      // 2. Iniciar Stream de cámara
      const stream = await iniciarCamara();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              ?.play()
              .then(() => resolve())
              .catch(() => resolve());
          };
        });
      }

      setIsReady(true);
      setIsLoading(false);

      // 3. Comenzar bucle de detección
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      animFrameIdRef.current = requestAnimationFrame(loopDeteccion);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido al inicializar.';
      setError(mensaje);
      setIsLoading(false);
      setIsReady(false);
    }
  }, [inicializarMediaPipe, iniciarCamara, loopDeteccion]);

  /**
   * Control de pausa y reanudación
   */
  const pausarTracking = useCallback(() => {
    pausadoRef.current = true;
  }, []);

  const reanudarTracking = useCallback(() => {
    pausadoRef.current = false;
  }, []);

  // Efecto de inicialización y limpieza al desmontar
  useEffect(() => {
    inicializar();

    return () => {
      // 1. Cancelar bucle de animación
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }

      // 2. Detener tracks de la cámara
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // 3. Liberar memoria WebAssembly/GPU de MediaPipe
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // Ignorar error al cerrar
        }
        landmarkerRef.current = null;
      }

      // 4. Limpiar video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      suavizadorRef.current.reiniciar();
    };
  }, [inicializar]);

  return {
    isReady,
    isLoading,
    landmarks,
    handedness,
    fps,
    error,
    alertaIluminacion,
    videoRef,
    canvasRef,
    reiniciarDetector: inicializar,
    pausarTracking,
    reanudarTracking,
  };
}
