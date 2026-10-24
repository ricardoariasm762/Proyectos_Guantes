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

// Rutas locales servidas desde public/ para máxima velocidad, privacidad y funcionamiento offline
const WASM_LOCAL_URL = '/wasm';
const MODEL_LOCAL_URL = '/models/hand_landmarker.task';

// Rutas de respaldo por CDN en caso de contingencia
const WASM_FALLBACK_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_FALLBACK_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Inferencia limitada a 30 FPS para optimización de CPU/GPU
const INTERVALO_MIN_MS = 1000 / 30;
// React solo recibe landmarks a 20 Hz: suficiente para UI y validación, la mitad de renders
const INTERVALO_UI_MS = 1000 / 20;

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

/**
 * Carga HandLandmarker con estrategia multietapa (Local -> CDN, GPU -> CPU).
 */
async function crearLandmarker(): Promise<HandLandmarker> {
  let vision;
  try {
    vision = await FilesetResolver.forVisionTasks(WASM_LOCAL_URL);
  } catch (errLocalWasm) {
    console.warn('WASM local no disponible, intentando CDN de respaldo...', errLocalWasm);
    try {
      vision = await FilesetResolver.forVisionTasks(WASM_FALLBACK_URL);
    } catch (errCdn) {
      throw new Error('No se pudieron cargar los módulos de visión artificial.', { cause: errCdn });
    }
  }

  let errorCapturado: unknown = null;
  for (const ruta of [MODEL_LOCAL_URL, MODEL_FALLBACK_URL]) {
    for (const delegate of ['GPU', 'CPU'] as const) {
      try {
        return await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: ruta, delegate },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      } catch (err) {
        errorCapturado = err;
      }
    }
  }

  console.error('Fallo al inicializar HandLandmarker en todas las fuentes:', errorCapturado);
  throw new Error(
    'No se pudo cargar el modelo de visión artificial. Verifica tu conexión e inténtalo de nuevo.',
    { cause: errorCapturado }
  );
}

/**
 * Solicita el stream de la cámara frontal con mensajes de error comprensibles.
 */
async function abrirCamara(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      'Tu navegador no permite usar la cámara. Abre el simulador en Chrome, Edge o Firefox actualizados.'
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
  } catch (err: unknown) {
    const nombre = (err as { name?: string }).name;
    if (nombre === 'NotAllowedError' || nombre === 'PermissionDeniedError') {
      throw new Error(
        'Permiso de cámara denegado. Haz clic en el ícono de cámara de la barra de direcciones, permite el acceso y pulsa Reintentar.',
        { cause: err }
      );
    }
    if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError') {
      throw new Error('No se encontró ninguna cámara. Conecta una cámara web y pulsa Reintentar.', {
        cause: err,
      });
    }
    if (nombre === 'NotReadableError' || nombre === 'TrackStartError') {
      throw new Error(
        'Otra aplicación está usando la cámara (Zoom, Teams, otra pestaña). Ciérrala y pulsa Reintentar.',
        { cause: err }
      );
    }
    throw new Error('No se pudo acceder a la cámara del dispositivo.', { cause: err });
  }
}

function detenerStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function cerrarLandmarker(landmarker: HandLandmarker | null) {
  try {
    landmarker?.close();
  } catch {
    // El landmarker ya estaba cerrado
  }
}

export function useHandTracking(opciones: OpcionesHandTracking = {}): UseHandTrackingReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [alertaIluminacion, setAlertaIluminacion] = useState(false);
  const [landmarks, setLandmarks] = useState<ManoLandmarks[]>([]);
  const [handedness, setHandedness] = useState<ManoInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  /**
   * Cada inicialización recibe un número de generación. Si la generación cambia
   * (desmontaje, StrictMode o reintento), la inicialización obsoleta libera sus
   * propios recursos en vez de pisar los de la vigente.
   */
  const generacionRef = useRef(0);

  const ultimaDeteccionRef = useRef(0);
  const ultimaPublicacionUIRef = useRef(0);
  const ultimoVideoTimestampRef = useRef(-1);
  const suavizadorRef = useRef<SuavizadorLandmarks | null>(null);
  if (suavizadorRef.current === null) {
    suavizadorRef.current = new SuavizadorLandmarks({
      tamanoVentana: opciones.tamanoVentanaSuavizado ?? 5,
      factorEma: 0.65,
    });
  }

  const conteoFramesRef = useRef(0);
  const inicioVentanaFpsRef = useRef(0);
  const anterioresLandmarksRef = useRef<ManoLandmarks[]>([]);
  const resolucionReducidaRef = useRef(false);
  const pausadoRef = useRef(opciones.activo === false);

  useEffect(() => {
    if (opciones.activo !== undefined) {
      pausadoRef.current = !opciones.activo;
    }
  }, [opciones.activo]);

  /**
   * Libera cámara, modelo y bucle. Es idempotente.
   */
  const liberarRecursos = useCallback(() => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    detenerStream(streamRef.current);
    streamRef.current = null;
    cerrarLandmarker(landmarkerRef.current);
    landmarkerRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.onloadedmetadata = null;
      video.srcObject = null;
    }
  }, []);

  // El bucle se reprograma a sí mismo a través de una ref para no referenciarse durante su declaración
  const bucleRef = useRef<() => void>(() => {});

  /**
   * Bucle de inferencia sincronizado con requestAnimationFrame.
   */
  const ejecutarFrame = useCallback(() => {
    animFrameIdRef.current = requestAnimationFrame(() => bucleRef.current());

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2 || pausadoRef.current) return;

    const ahora = performance.now();
    if (ahora - ultimaDeteccionRef.current < INTERVALO_MIN_MS) return;
    if (ahora <= ultimoVideoTimestampRef.current) return;
    ultimaDeteccionRef.current = ahora;

    let results;
    try {
      results = landmarker.detectForVideo(video, ahora);
      ultimoVideoTimestampRef.current = ahora;
    } catch (detectErr) {
      console.warn('Advertencia en detección de frame:', detectErr);
      return;
    }

    const hayManos = results.landmarks.length > 0;
    // El suavizado corre en cada detección para no perder precisión temporal
    const manos = hayManos ? suavizadorRef.current!.suavizarTodas(results.landmarks) : [];

    // Publicación a React limitada a 20 Hz
    if (ahora - ultimaPublicacionUIRef.current >= INTERVALO_UI_MS || !hayManos) {
      ultimaPublicacionUIRef.current = ahora;

      if (hayManos) {
        setLandmarks(manos);
        setHandedness(
          results.handedness.map((categorias, idx) => {
            const cat = categorias[0];
            return {
              index: idx,
              score: cat?.score ?? 0.9,
              categoryName: (cat?.categoryName as ManoLateralidad) || (idx === 0 ? 'Left' : 'Right'),
              displayName: cat?.displayName,
            };
          })
        );
      } else {
        setLandmarks((prev) => (prev.length === 0 ? prev : []));
        setHandedness((prev) => (prev.length === 0 ? prev : []));
      }
    }

    // Saltos bruscos de la muñeca suelen indicar mala iluminación o movimiento rápido
    const munecaAnterior = anterioresLandmarksRef.current[0]?.[0];
    const munecaActual = manos[0]?.[0];
    const esAlerta =
      !!munecaAnterior &&
      !!munecaActual &&
      Math.hypot(munecaActual.x - munecaAnterior.x, munecaActual.y - munecaAnterior.y) > 0.3;
    setAlertaIluminacion((prev) => (prev === esAlerta ? prev : esAlerta));
    anterioresLandmarksRef.current = manos;

    // FPS y degradación adaptativa de resolución
    conteoFramesRef.current += 1;
    const delta = (ahora - inicioVentanaFpsRef.current) / 1000;
    if (delta >= 1) {
      const fpsCalculados = Math.round(conteoFramesRef.current / delta);
      setFps((prev) => (prev === fpsCalculados ? prev : fpsCalculados));
      conteoFramesRef.current = 0;
      inicioVentanaFpsRef.current = ahora;

      const track = streamRef.current?.getVideoTracks()[0];
      if (fpsCalculados < 20 && !resolucionReducidaRef.current && track?.applyConstraints) {
        resolucionReducidaRef.current = true;
        track
          .applyConstraints({ width: { ideal: 320 }, height: { ideal: 240 } })
          .catch(() => {
            resolucionReducidaRef.current = false;
          });
      }
    }
  }, []);

  useEffect(() => {
    bucleRef.current = ejecutarFrame;
  }, [ejecutarFrame]);

  /**
   * Arranca cámara y modelo. Los estados de React solo se escriben tras un await,
   * así que es seguro llamarla desde el efecto de montaje.
   */
  const arrancar = useCallback(async () => {
    const generacion = ++generacionRef.current;
    const esVigente = () => generacion === generacionRef.current;

    liberarRecursos();
    suavizadorRef.current!.reiniciar();
    anterioresLandmarksRef.current = [];
    resolucionReducidaRef.current = false;
    ultimoVideoTimestampRef.current = -1;

    // Modelo y cámara en paralelo: el permiso de cámara se pide mientras descarga el modelo
    const [resModelo, resCamara] = await Promise.allSettled([crearLandmarker(), abrirCamara()]);
    const landmarker = resModelo.status === 'fulfilled' ? resModelo.value : null;
    const stream = resCamara.status === 'fulfilled' ? resCamara.value : null;

    if (!esVigente() || !landmarker || !stream) {
      cerrarLandmarker(landmarker);
      detenerStream(stream);
      if (esVigente()) {
        const fallo = resCamara.status === 'rejected' ? resCamara.reason : (resModelo as PromiseRejectedResult).reason;
        setError(fallo instanceof Error ? fallo.message : 'Error desconocido al inicializar.');
        setIsLoading(false);
      }
      return;
    }

    // A partir de aquí la limpieza del efecto (liberarRecursos) se encarga de todo
    landmarkerRef.current = landmarker;
    streamRef.current = stream;

    const video = videoRef.current;
    if (!video) {
      liberarRecursos();
      setError('No se encontró el elemento de video.');
      setIsLoading(false);
      return;
    }

    video.srcObject = stream;
    if (video.readyState < 1) {
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
    }
    await video.play().catch(() => undefined);
    if (!esVigente()) return;

    conteoFramesRef.current = 0;
    inicioVentanaFpsRef.current = performance.now();
    setIsReady(true);
    setIsLoading(false);
    animFrameIdRef.current = requestAnimationFrame(() => bucleRef.current());
  }, [liberarRecursos]);

  /**
   * Reinicio manual (botón Reintentar): limpia el estado visible y vuelve a arrancar.
   */
  const inicializar = useCallback(async () => {
    setIsLoading(true);
    setIsReady(false);
    setError(null);
    setLandmarks([]);
    setHandedness([]);
    await arrancar();
  }, [arrancar]);

  const pausarTracking = useCallback(() => {
    pausadoRef.current = true;
  }, []);

  const reanudarTracking = useCallback(() => {
    pausadoRef.current = false;
  }, []);

  useEffect(() => {
    void arrancar();
    const suavizador = suavizadorRef.current;
    return () => {
      generacionRef.current += 1; // invalida cualquier inicialización en curso
      liberarRecursos();
      suavizador?.reiniciar();
    };
  }, [arrancar, liberarRecursos]);

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
