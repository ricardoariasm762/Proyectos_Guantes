import { describe, expect, it } from 'vitest';
import type { ManoLandmarks } from '../../types/mediapipe';
import { extraerFeatures, extraerFeaturesParManos } from '../features';
import { manoEnPinza, manoExtendida } from './helpersLandmarks';

function trasladarMano(mano: ManoLandmarks, dx: number, dy: number, dz: number): ManoLandmarks {
  return mano.map((p) => ({
    x: p.x + dx,
    y: p.y + dy,
    z: p.z + dz,
  }));
}

function escalarManoDesdeMuneca(mano: ManoLandmarks, factor: number): ManoLandmarks {
  const muneca = mano[0];
  return mano.map((p) => ({
    x: muneca.x + (p.x - muneca.x) * factor,
    y: muneca.y + (p.y - muneca.y) * factor,
    z: muneca.z + (p.z - muneca.z) * factor,
  }));
}

describe('features - extracción de vector biomecánico de 79 características', () => {
  it('retorna exactamente 79 valores finitos para una mano válida y 79 ceros para entrada inválida', () => {
    const mano = manoEnPinza(0.06);
    const vector = extraerFeatures(mano);

    expect(vector).toHaveLength(79);
    expect(vector.every((v) => Number.isFinite(v))).toBe(true);

    const nulo = extraerFeatures(null);
    expect(nulo).toHaveLength(79);
    expect(nulo.every((v) => v === 0)).toBe(true);

    const parVacio = extraerFeaturesParManos([]);
    expect(parVacio.manoPrincipal).toHaveLength(79);
    expect(parVacio.manoSecundaria).toHaveLength(79);

    const par = extraerFeaturesParManos([manoExtendida()]);
    expect(par.manoPrincipal).toHaveLength(79);
    expect(par.manoSecundaria.every((v) => v === 0)).toBe(true);
  });

  it('es invariante a la traslación 3D de la mano', () => {
    const base = manoEnPinza(0.05);
    const trasladada = trasladarMano(base, 1.35, -0.72, 0.48);

    const fBase = extraerFeatures(base);
    const fTrasladada = extraerFeatures(trasladada);

    expect(fTrasladada).toHaveLength(79);
    for (let i = 0; i < 79; i++) {
      expect(fTrasladada[i]).toBeCloseTo(fBase[i], 6);
    }
  });

  it('es invariante al escalado uniforme positivo de la mano', () => {
    const base = manoEnPinza(0.05);
    const escaladaGrande = escalarManoDesdeMuneca(base, 3.25);
    const escaladaPequena = escalarManoDesdeMuneca(base, 0.35);

    const fBase = extraerFeatures(base);
    const fGrande = extraerFeatures(escaladaGrande);
    const fPequena = extraerFeatures(escaladaPequena);

    for (let i = 0; i < 79; i++) {
      expect(fGrande[i]).toBeCloseTo(fBase[i], 5);
      expect(fPequena[i]).toBeCloseTo(fBase[i], 4);
    }
  });
});
