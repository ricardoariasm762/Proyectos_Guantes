// Utilidades de puntuación y formateo de tiempo
// Universidad Cooperativa de Colombia - Campus Pasto

export function formatearTiempo(segundos: number): string {
  if (isNaN(segundos) || segundos < 0) return '00:00';
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatearFecha(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  } catch {
    return isoString;
  }
}

export function calcularPrecision(errores: number, pasosRealizados: number): number {
  if (pasosRealizados === 0) return 100;
  const penalizacion = errores * 15;
  const precision = Math.max(0, 100 - penalizacion);
  return Math.round(precision);
}
