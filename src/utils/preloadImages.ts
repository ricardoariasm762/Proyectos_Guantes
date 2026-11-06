/**
 * Utilidad de Precarga de Fotogramas (Frame Preloading)
 * Carga todas las imágenes de la secuencia en memoria para garantizar
 * una reproducción a 60 fps sin parpadeos ni pantallas en blanco durante el scroll.
 * Universidad Cooperativa de Colombia - Campus Pasto
 */

export const TOTAL_FRAMES = 240;

/**
 * Versión de la secuencia publicada. Los fotogramas se sirven con caché inmutable de un año,
 * por lo que cada secuencia nueva debe ir en una carpeta nueva (v3, v4...) para que
 * CloudFront y los navegadores no muestren la anterior.
 */
export const FRAMES_VERSION = 'v3';

/** Formato de los fotogramas (WebP 1920x1080 generado con scripts/generar-fotogramas.ps1). */
export const FRAMES_EXT = 'webp';

/**
 * Genera la lista ordenada de URLs para los fotogramas en /frames/<versión>/
 * con el formato frame_001.webp a frame_240.webp.
 */
export function generarRutasFrames(total: number = TOTAL_FRAMES): string[] {
  const rutas: string[] = [];
  for (let i = 1; i <= total; i++) {
    const pad = String(i).padStart(3, '0');
    rutas.push(`/frames/${FRAMES_VERSION}/frame_${pad}.${FRAMES_EXT}`);
  }
  return rutas;
}

export type ProgresoCallback = (
  porcentaje: number,
  cargadas: number,
  total: number
) => void;

/**
 * Precarga de forma asíncrona todas las URLs en elementos HTMLImageElement en memoria.
 * Retorna una promesa con el array de imágenes listas para pintar en el Canvas 2D.
 */
export function preloadImages(
  urls: string[],
  onProgress?: ProgresoCallback
): Promise<HTMLImageElement[]> {
  let cargadas = 0;
  const total = urls.length;

  if (total === 0) {
    return Promise.resolve([]);
  }

  return Promise.all(
    urls.map((url) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = url;

        img.onload = () => {
          cargadas++;
          if (onProgress) {
            const pct = Math.round((cargadas / total) * 100);
            onProgress(pct, cargadas, total);
          }
          resolve(img);
        };

        img.onerror = () => {
          // Si una imagen falla, resolvemos el objeto para no detener la secuencia completa
          cargadas++;
          if (onProgress) {
            const pct = Math.round((cargadas / total) * 100);
            onProgress(pct, cargadas, total);
          }
          resolve(img);
        };
      });
    })
  );
}
