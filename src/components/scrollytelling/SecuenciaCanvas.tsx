import React, { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TOTAL_FRAMES, generarRutasFrames } from '../../utils/preloadImages';

gsap.registerPlugin(ScrollTrigger);

export interface SecuenciaCanvasProps {
  /** Número total de fotogramas (por defecto 240) */
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

  // Devuelve el fotograma listo más cercano hacia atrás (o null si aún no hay ninguno)
  const fotogramaListo = (imgs: HTMLImageElement[], index: number): HTMLImageElement | null => {
    let i = Math.min(imgs.length - 1, Math.max(0, index));
    while (i > 0 && !(imgs[i]?.complete && imgs[i].naturalWidth)) i--;
    const img = imgs[i];
    return img && img.complete && img.naturalWidth ? img : null;
  };

  // 2. Dibuja el fotograma con "object-fit: cover" de forma nítida.
  const renderFrame = useCallback((posicion: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const imgs = imagesRef.current;
    if (!imgs || imgs.length === 0) return;

    const indexExacto = Math.round(Math.max(0, posicion));
    const img = fotogramaListo(imgs, indexExacto);
    if (!img) return;

    const { ancho: canvasWidth, alto: canvasHeight } = ajustarCanvas(canvas);
    if (!canvasWidth || !canvasHeight) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.globalAlpha = 1;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const cover = Math.max(canvasWidth / iw, canvasHeight / ih);
    const renderWidth = iw * cover;
    const renderHeight = ih * cover;

    context.drawImage(
      img,
      (canvasWidth - renderWidth) / 2,
      (canvasHeight - renderHeight) / 2,
      renderWidth,
      renderHeight
    );
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

            renderFrame(proxy.frame);

            if (onFrameChangeRef.current) {
              onFrameChangeRef.current(currentFrame, self.progress);
            }
          },
        },
      });

      // Redibuja al cambiar el tamaño; ResizeObserver cubre también cambios de layout (sidebar, rotación)
      const redibujar = () => {
        renderFrame(Math.min(maxFrame, Math.max(0, proxyRef.current.frame)));
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
        En móvil, proporción 16:9 debajo del navbar. En desktop, pantalla completa.
      */}
      <div
        className="scrolly-sticky-viewport"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          aspectRatio: '16/9',
          maxHeight: '100svh',
          overflow: 'hidden',
          backgroundColor: '#0B1329',
          zIndex: 30,
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
          className="scrolly-steps-overlay"
          style={{
            position: 'relative',
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
