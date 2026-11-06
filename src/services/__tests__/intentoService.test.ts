import { describe, it, expect } from 'vitest';
import { construirPayloadBackend, mapearIntentoBackend } from '../intentoService';

describe('construirPayloadBackend', () => {
  it('traduce el formato del frontend al contrato IntentoRequest del backend', () => {
    const p = construirPayloadBackend({
      puntaje: 85,
      tiempoSegundos: 92.4,
      errores: 2,
      modo: 'simulacion',
      pasosCompletados: 6,
    });
    expect(p.modoPractica).toBe('SIMULACION');
    expect(p.duracionSegundos).toBe(92);
    expect(p.completado).toBe(true);
    expect(p.observaciones).toBe('Errores: 2 | Pasos completados: 6');
    expect(p).not.toHaveProperty('modo');
    expect(p).not.toHaveProperty('tiempoSegundos');
  });

  it('normaliza la confianza a 0..1 y omite confianza vacía', () => {
    expect(construirPayloadBackend({ modo: 'DESAFIO', confianzaPromedio: 87 }).confianzaPromedio).toBe(0.87);
    expect(construirPayloadBackend({ modo: 'DESAFIO', confianzaPromedio: 0.6 }).confianzaPromedio).toBe(0.6);
    expect(construirPayloadBackend({ modo: 'DESAFIO', confianzaPromedio: 0 })).not.toHaveProperty('confianzaPromedio');
  });

  it('usa GUIADO si el modo no existe en el backend', () => {
    expect(construirPayloadBackend({ modo: 'otro' }).modoPractica).toBe('GUIADO');
  });
});

describe('mapearIntentoBackend', () => {
  it('reconstruye errores y pasos desde observaciones', () => {
    const i = mapearIntentoBackend({
      id: 7,
      modoPractica: 'DESAFIO',
      fechaInicio: '2026-11-06T10:00:00',
      puntaje: 78.6,
      duracionSegundos: 120,
      observaciones: 'Errores: 3 | Pasos completados: 5',
    });
    expect(i).toMatchObject({ id: 'srv_7', modo: 'desafio', puntaje: 79, tiempoSegundos: 120, errores: 3, pasosCompletados: 5 });
  });
});
