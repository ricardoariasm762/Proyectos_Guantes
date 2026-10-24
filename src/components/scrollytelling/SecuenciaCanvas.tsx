import React, { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TOTAL_FRAMES, generarRutasFrames } from '../../utils/preloadImages';

gsap.registerPlugin(ScrollTrigger);

export interface SecuenciaCanvasProps {
  /** Número total de fotogramas (por defecto 78) */
  totalFrames?: number;
  /** Imágenes ya precargadas en memoria (opcional) */
  imagenes?: HTMLImageElement[];
  /** Callback para sincronizar paso actual o HUD con el frame actual */
  onFrameChange?: (currentFrame: number, progreso: number) => void;
  /** Componentes hijos superpuestos (como TextosPasos) */
  children?: React.ReactNode;
  /** Altura del contenedor de scroll (ej: '400vh', '600vh') */
  alturaScroll?: string;
}

/**
 * Componente SecuenciaCanvas
 * Reproduce una secuencia de imágenes cuadro a cuadro sincronizada con el scroll mediante GSAP ScrollTrigger.
 * Aplica escalado "Object-Fit: Cover" para adaptarse a cualquier resolución sin deformar la imagen.
 */
export const SecuenciaCanvas: React.FC<SecuenciaCanvasProps> = ({
  totalFrames = TOTAL_FRAMES,
  imagenes: imagenesProp,
  onFrameChange,
  children,
  alturaScroll = '600vh',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const proxyRef = useRef<{ frame: number }>({ frame: 0 });

  // Refs estables para evitar que actualizaciones de estado en el padre reinicien GSAP
  const onFrameChangeRef = useRef(onFrameChange);
  useEffect(() => {
    onFrameChangeRef.current = onFrameChange;
  }, [onFrameChange]);

  const [images, setImages] = useState<HTMLImageElement[]>(imagenesProp || []);
  const imagesRef = useRef<HTMLImageElement[]>(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const [isLoaded, setIsLoaded] = useState<boolean>(
    Boolean(imagenesProp && imagenesProp.length > 0)
  );
  const [progresoCarga, setProgresoCarga] = useState<number>(0);

  // 1. Precarga: decodifica fuera del hilo principal y habilita la secuencia al llegar un mínimo
  useEffect(() => {
    if (imagenesProp && imagenesProp.length > 0) {
      // El estado inicial ya parte de las props: solo hay que apuntar la ref al nuevo conjunto
      imagesRef.current = imagenesProp;
      return;
    }

    let isMounted = true;
    const loadedImages: HTMLImageElement[] = new Array(totalFrames);
    let processedCount = 0;
    const urls = generarRutasFrames(totalFrames);
    // Basta con tener una porción lista para empezar; el resto sigue cargando en segundo plano
    const minimoParaIniciar = Math.min(totalFrames, 12);

    const registrar = (index: number, img: HTMLImageElement) => {
      loadedImages[index] = img;
      processedCount++;
      if (!isMounted) return;
      setProgresoCarga(Math.round((processedCount / totalFrames) * 100));
      imagesRef.current = loadedImages;
      if (processedCount === minimoParaIniciar) {
        setImages(loadedImages);
        setIsLoaded(true);
      }
      if (processedCount === totalFrames) {
        setImages(loadedImages.slice());
      }
    };

    urls.forEach((url, index) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      img
        .decode()
        .catch(() => undefined) // un frame dañado no debe bloquear toda la secuencia
        .finally(() => registrar(index, img));
    });

    return () => {
      isMounted = false;
    };
  }, [imagenesProp, totalFrames]);

  // Sincroniza el tamaño físico del canvas con su tamaño CSS y la densidad de pantalla
  const ajustarCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ancho = Math.round(canvas.clientWidth * dpr);
    const alto = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== ancho || canvas.height !== alto) {
      canvas.width = ancho;
      canvas.height = alto;
    }
    return { ancho, alto };
  }, []);

  // 2. Función para dibujar el Canvas con efecto "Object-Fit: Cover"
  const renderFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const imgs = imagesRef.current;
    if (!imgs || imgs.length === 0) return;

    // Si el frame pedido aún no llegó, se usa el más cercano ya cargado hacia atrás
    let safeIndex = Math.min(imgs.length - 1, Math.max(0, Math.floor(index)));
    while (safeIndex > 0 && !(imgs[safeIndex]?.complete && imgs[safeIndex].naturalWidth)) {
      safeIndex--;
    }
    const img = imgs[safeIndex];
    if (!img || !img.complete) return;
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    if (!imgWidth || !imgHeight) return;

    const { ancho: canvasWidth, alto: canvasHeight } = ajustarCanvas(canvas);
    if (!canvasWidth || !canvasHeight) return;

    // 3. Fórmula "Object-Fit: Cover" para llenar la pantalla sin deformar
    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;
    const x = (canvasWidth - renderWidth) / 2;
    const y = (canvasHeight - renderHeight) / 2;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(img, x, y, renderWidth, renderHeight);
  }, [ajustarCanvas]);

  // 3. Animación GSAP vinculada al scroll mediante el hook useGSAP
  useGSAP(
    () => {
      if (!isLoaded || imagesRef.current.length === 0) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      renderFrame(0);

      const maxFrame = totalFrames - 1;
      const proxy = { frame: 0 };
      proxyRef.current = proxy;

      const animation = gsap.to(proxy, {
        frame: maxFrame,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (self) => {
            const currentFrame = Math.min(
              maxFrame,
              Math.max(0, Math.round(proxy.frame))
            );

            renderFrame(currentFrame);

            if (onFrameChangeRef.current) {
              onFrameChangeRef.current(currentFrame, self.progress);
            }
          },
        },
      });

      // Redibuja al cambiar el tamaño; ResizeObserver cubre también cambios de layout (sidebar, rotación)
      const redibujar = () => {
        renderFrame(Math.min(maxFrame, Math.max(0, Math.round(proxyRef.current.frame))));
      };
      const observer = new ResizeObserver(redibujar);
      observer.observe(canvas);

      return () => {
        observer.disconnect();
        animation.scrollTrigger?.kill();
        animation.kill();
      };
    },
    { dependencies: [isLoaded, totalFrames], scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: alturaScroll,
        backgroundColor: '#0B1329',
      }}
    >
      {/* Pantalla de carga mientras se preparan los fotogramas */}
      {!isLoaded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            zIndex: 50,
            gap: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38BDF8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            Cargando secuencia quirúrgica: {progresoCarga}%
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/*
        Contenedor del canvas con fijación Sticky nativa:
        Garantiza que el lienzo permanezca anclado en pantalla durante todo el scroll
        sin parpadeos, saltos de layout ni pantallas negras.
      */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '100svh',
          overflow: 'hidden',
          backgroundColor: '#0B1329',
          zIndex: 1,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Capa superpuesta para textos, pasos o componentes hijos */}
      {children && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default SecuenciaCanvas;
