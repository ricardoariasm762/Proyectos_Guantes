/**
 * Utilidad de Precarga de Fotogramas (Frame Preloading)
 * Carga todas las imágenes de la secuencia en memoria para garantizar
 * una reproducción a 60 fps sin parpadeos ni pantallas en blanco durante el scroll.
 * Universidad Cooperativa de Colombia - Campus Pasto
 */

export const TOTAL_FRAMES = 78;

/**
 * Genera la lista ordenada de URLs para los fotogramas en /frames/
 * Admite el formato estándar frame_001.jpg a frame_078.jpg.
 */
export function generarRutasFrames(total: number = TOTAL_FRAMES): string[] {
  const rutas: string[] = [];
  for (let i = 1; i <= total; i++) {
    const pad = String(i).padStart(3, '0');
    rutas.push(`/frames/frame_${pad}.jpg`);
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
