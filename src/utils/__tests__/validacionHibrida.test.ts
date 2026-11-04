import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { iaService } from '../../services/iaService';
import { suavizadorGlobal } from '../suavizado';
import { validarHibrido } from '../validacionHibrida';
import {
  INFO_DER,
  INFO_IZQ,
  manoConAnguloIndice,
  manoEnPinza,
  manoExtendida,
} from './helpersLandmarks';

describe('validacionHibrida - cobertura de las 5 ramas de fusión', () => {
  beforeEach(() => {
    suavizadorGlobal.reiniciar();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Rama 1: sin manos detectadas -> rechazo inmediato por reglas con confianza 0', () => {
    const resVacio = validarHibrido([], [], 1);
    expect(resVacio.correcto).toBe(false);
    expect(resVacio.fuente).toBe('reglas');
    expect(resVacio.confianza).toBe(0);
    expect(resVacio.pasoDetectado).toBe('ninguno');

    const resNull = validarHibrido(null, null, 2);
    expect(resNull.correcto).toBe(false);
    expect(resNull.fuente).toBe('reglas');
  });

  it('Rama 2a: modelo no disponible -> deciden exclusivamente las reglas clínicas', () => {
    vi.spyOn(iaService, 'isReady').mockReturnValue(false);

    const manoPinzaOk = manoEnPinza(0.05);
    const aprueba = validarHibrido([manoPinzaOk], [INFO_IZQ], 3);
    expect(aprueba.correcto).toBe(true);
    expect(aprueba.fuente).toBe('reglas');
    expect(aprueba.confianza).toBe(0.9);

    suavizadorGlobal.reiniciar();
    const manoPinzaMal = manoEnPinza(0.12);
    const rechaza = validarHibrido([manoPinzaMal], [INFO_IZQ], 3);
    expect(rechaza.correcto).toBe(false);
    expect(rechaza.fuente).toBe('reglas');
    expect(rechaza.confianza).toBe(0.8);
  });

  it('Rama 2b: modelo disponible pero confianza < 0.60 -> deciden las reglas clínicas', () => {
    vi.spyOn(iaService, 'isReady').mockReturnValue(true);
    vi.spyOn(iaService, 'predecir').mockReturnValue({
      label: 'INCORRECTO_contaminacion',
      confianza: 0.59,
      probabilidades: { INCORRECTO_contaminacion: 0.59 },
    });

    const manoPinzaOk = manoEnPinza(0.05);
    const res = validarHibrido([manoPinzaOk], [INFO_IZQ], 3);
    expect(res.correcto).toBe(true);
    expect(res.fuente).toBe('reglas');
    expect(res.confianza).toBe(0.9);
  });

  it('Rama 3: error del modelo (INCORRECTO_*) con confianza >= 0.65 y reglas que aprueban -> prevalece IA', () => {
    vi.spyOn(iaService, 'isReady').mockReturnValue(true);
    vi.spyOn(iaService, 'predecir').mockReturnValue({
      label: 'INCORRECTO_tocar_exterior',
      confianza: 0.65,
      probabilidades: { INCORRECTO_tocar_exterior: 0.65 },
    });

    const manoPinzaOk = manoEnPinza(0.05);
    const res = validarHibrido([manoPinzaOk], [INFO_IZQ], 3);
    expect(res.correcto).toBe(false);
    expect(res.fuente).toBe('ia');
    expect(res.confianza).toBe(0.65);
    expect(res.pasoDetectado).toBe('INCORRECTO_tocar_exterior');
  });

  it('Rama 4: acuerdo entre reglas y modelo (aprobación y rechazo) -> consenso', () => {
    const isReadySpy = vi.spyOn(iaService, 'isReady').mockReturnValue(true);
    const predecirSpy = vi.spyOn(iaService, 'predecir').mockReturnValue({
      label: 'paso_2_secado',
      confianza: 0.86,
      probabilidades: { paso_2_secado: 0.86 },
    });

    const manoA = manoExtendida(-0.1, 0, 0);
    const manoB = manoExtendida(0.1, 0, 0);
    const consensoOk = validarHibrido([manoA, manoB], [INFO_IZQ, INFO_DER], 2);
    expect(consensoOk.correcto).toBe(true);
    expect(consensoOk.fuente).toBe('consenso');
    expect(consensoOk.confianza).toBeCloseTo((0.9 + 0.86) / 2, 2);

    // Acuerdo en rechazo (reglas rechazan y modelo detecta otra clase o error)
    suavizadorGlobal.reiniciar();
    isReadySpy.mockReturnValue(true);
    predecirSpy.mockReturnValue({
      label: 'INCORRECTO_pinza_debil',
      confianza: 0.75,
      probabilidades: { INCORRECTO_pinza_debil: 0.75 },
    });

    const manoFlex = manoConAnguloIndice(110);
    const consensoFallo = validarHibrido([manoFlex, manoB], [INFO_IZQ, INFO_DER], 2);
    expect(consensoFallo.correcto).toBe(false);
    expect(consensoFallo.fuente).toBe('consenso');
    expect(consensoFallo.confianza).toBeCloseTo((0.85 + 0.75) / 2, 2);
  });

  it('Rama 5: discrepancia menor (resto de casos) -> prevalecen las reglas clínicas', () => {
    vi.spyOn(iaService, 'isReady').mockReturnValue(true);

    // Caso 5a: reglas aprueban paso 3 pero IA predice otro paso normal con confianza >= 0.60
    const predecirSpy = vi.spyOn(iaService, 'predecir').mockReturnValue({
      label: 'paso_4_introducir_mano_der',
      confianza: 0.72,
      probabilidades: { paso_4_introducir_mano_der: 0.72 },
    });

    const manoPinzaOk = manoEnPinza(0.05);
    const resDiscrepanciaPositiva = validarHibrido([manoPinzaOk], [INFO_IZQ], 3);
    expect(resDiscrepanciaPositiva.correcto).toBe(true);
    expect(resDiscrepanciaPositiva.fuente).toBe('reglas');
    expect(resDiscrepanciaPositiva.confianza).toBe(0.9);

    // Caso 5b: reglas rechazan paso 3 pero IA predice el paso esperado con confianza >= 0.60
    suavizadorGlobal.reiniciar();
    predecirSpy.mockReturnValue({
      label: 'paso_3_tomar_guante_der',
      confianza: 0.88,
      probabilidades: { paso_3_tomar_guante_der: 0.88 },
    });

    const manoPinzaAbierta = manoEnPinza(0.14);
    const resDiscrepanciaNegativa = validarHibrido([manoPinzaAbierta], [INFO_IZQ], 3);
    expect(resDiscrepanciaNegativa.correcto).toBe(false);
    expect(resDiscrepanciaNegativa.fuente).toBe('reglas');
    expect(resDiscrepanciaNegativa.confianza).toBe(0.8);
  });
});
