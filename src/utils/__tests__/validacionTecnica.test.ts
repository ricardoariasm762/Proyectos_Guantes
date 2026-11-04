import { describe, expect, it } from 'vitest';
import { PuntosMano } from '../../types/mediapipe';
import {
  calcularAngulo,
  calcularDistancia2D,
  dedoExtendido,
  dedoFlexionado,
  dedosJuntos,
  esGestoPinza,
} from '../geometria';
import {
  promediarLandmarksBuffer,
  resetearBuffer,
  suavizadorGlobal,
  suavizarLandmarks,
} from '../suavizado';
import { calcularPrecision, formatearFecha, formatearTiempo } from '../puntuacion';
import { calcularPuntajeSimulacion, nivelDesempeno } from '../puntajeSimulacion';
import {
  clasificarManosPorLateralidad,
  validarPaso1Lavado,
  validarPaso2Secado,
  validarPaso3TomarGuanteDerecho,
  validarPaso4IntroducirManoDerecha,
  validarPaso5RepetirManoIzquierda,
  validarPaso6AjustarPunos,
  validarPasoTecnica,
} from '../validacionTecnica';
import {
  INFO_DER,
  INFO_IZQ,
  manoConAnguloIndice,
  manoDedosJuntos,
  manoEnPinza,
  manoExtendida,
} from './helpersLandmarks';

describe('validacionTecnica - reglas clínicas de los pasos 1 a 6 y casos límite', () => {
  describe('Paso 1 - Lavado quirúrgico (umbral distancia mínima < 0.15)', () => {
    it('aprueba cuando ambas manos están visibles y a distancia < 0.15 (0.149)', () => {
      const manoA = manoExtendida(0, 0, 0);
      const manoB = manoExtendida(0, 0, 0.149);
      expect(validarPaso1Lavado([manoA, manoB]).correcto).toBe(true);
      expect(validarPasoTecnica(1, [manoA, manoB], [INFO_IZQ, INFO_DER]).correcto).toBe(true);
    });

    it('rechaza en el límite exacto 0.15 y cuando solo hay una mano', () => {
      const manoA = manoExtendida(0, 0, 0);
      const manoBEnLimite = manoExtendida(0, 0, 0.15);
      expect(validarPaso1Lavado([manoA, manoBEnLimite]).correcto).toBe(false);
      expect(validarPaso1Lavado([manoA]).correcto).toBe(false);
    });
  });

  describe('Paso 2 - Secado con compresa estéril (umbral extensión > 160°)', () => {
    it('aprueba cuando ambas manos tienen los dedos extendidos (> 160°)', () => {
      const manoA = manoConAnguloIndice(160.1);
      const manoB = manoExtendida(0.2, 0, 0);
      expect(
        calcularAngulo(
          manoA[PuntosMano.INDICE_MCP],
          manoA[PuntosMano.INDICE_PIP],
          manoA[PuntosMano.INDICE_TIP]
        )
      ).toBeGreaterThan(160);
      expect(dedoExtendido(manoA, PuntosMano.INDICE_MCP)).toBe(true);
      expect(validarPaso2Secado([manoA, manoB]).correcto).toBe(true);
      expect(validarPasoTecnica(2, [manoA, manoB], [INFO_IZQ, INFO_DER]).correcto).toBe(true);
    });

    it('rechaza en el límite de 160° y cuando falta una mano', () => {
      const manoEnLimite = manoConAnguloIndice(160);
      const manoCorrecta = manoExtendida(0.2, 0, 0);
      expect(
        calcularAngulo(
          manoEnLimite[PuntosMano.INDICE_MCP],
          manoEnLimite[PuntosMano.INDICE_PIP],
          manoEnLimite[PuntosMano.INDICE_TIP]
        )
      ).toBeLessThanOrEqual(160);
      expect(dedoExtendido(manoEnLimite, PuntosMano.INDICE_MCP)).toBe(false);
      expect(validarPaso2Secado([manoEnLimite, manoCorrecta]).correcto).toBe(false);
      expect(validarPaso2Secado([manoCorrecta]).correcto).toBe(false);
    });
  });

  describe('Paso 3 - Tomar guante derecho (umbral pinza < 0.08)', () => {
    it('aprueba con pinza activa menor a 0.08 (0.079) y dedos de pinza extendidos', () => {
      const mano = manoEnPinza(0.079);
      expect(esGestoPinza(mano, 0.08)).toBe(true);
      expect(validarPaso3TomarGuanteDerecho([mano], [INFO_IZQ]).correcto).toBe(true);
      expect(validarPasoTecnica(3, [mano], [INFO_IZQ]).correcto).toBe(true);
    });

    it('rechaza en el límite exacto 0.08, cuando no hay manos o cuando pulgar e índice están flexionados', () => {
      const manoLimite = manoEnPinza(0.08);
      expect(esGestoPinza(manoLimite, 0.08)).toBe(false);
      expect(validarPaso3TomarGuanteDerecho([manoLimite], [INFO_IZQ]).correcto).toBe(false);
      expect(validarPaso3TomarGuanteDerecho([], []).correcto).toBe(false);

      // Ambos dedos de la pinza flexionados (90°) con puntas cercanas (< 0.08)
      const manoFlexionada = manoEnPinza(0.04);
      manoFlexionada[PuntosMano.PULGAR_MCP] = { x: 0.40, y: 0.45, z: 0 };
      manoFlexionada[PuntosMano.PULGAR_IP] = { x: 0.40, y: 0.35, z: 0 };
      manoFlexionada[PuntosMano.PULGAR_TIP] = { x: 0.50, y: 0.35, z: 0 };
      manoFlexionada[PuntosMano.INDICE_MCP] = { x: 0.53, y: 0.45, z: 0 };
      manoFlexionada[PuntosMano.INDICE_PIP] = { x: 0.53, y: 0.35, z: 0 };
      manoFlexionada[PuntosMano.INDICE_TIP] = { x: 0.53, y: 0.35, z: 0.02 };
      expect(validarPaso3TomarGuanteDerecho([manoFlexionada], [INFO_IZQ]).correcto).toBe(false);
    });
  });

  describe('Paso 4 - Introducir mano derecha (dedos juntos: umbral geometria 0.05 / tolerancia paso 4 = 0.06)', () => {
    it('aprueba cuando los dedos están extendidos y juntos dentro del umbral 0.05', () => {
      const mano = manoDedosJuntos(0.049);
      expect(dedosJuntos(mano, 0.05)).toBe(true);
      expect(validarPaso4IntroducirManoDerecha([mano], [INFO_DER]).correcto).toBe(true);
      expect(validarPasoTecnica(4, [mano], [INFO_DER]).correcto).toBe(true);
    });

    it('evalúa los casos límite de 0.05 en dedosJuntos y 0.06 en validarPaso4IntroducirManoDerecha', () => {
      const manoEn005 = manoDedosJuntos(0.05);
      const manoEn0051 = manoDedosJuntos(0.051);
      const manoEn0061 = manoDedosJuntos(0.061);

      // En geometria.ts dedosJuntos usa `d > umbral` (<= 0.05 aprueba, > 0.05 rechaza)
      expect(dedosJuntos(manoEn005, 0.05)).toBe(true);
      expect(dedosJuntos(manoEn0051, 0.05)).toBe(false);

      // En validacionTecnica.ts Paso 4 invoca dedosJuntos(mano, 0.06), por lo que 0.051 aún aprueba y 0.061 rechaza
      expect(validarPaso4IntroducirManoDerecha([manoEn0051], [INFO_DER]).correcto).toBe(true);
      expect(validarPaso4IntroducirManoDerecha([manoEn0061], [INFO_DER]).correcto).toBe(false);
      expect(validarPaso4IntroducirManoDerecha([], []).correcto).toBe(false);
    });

    it('rechaza si algún dedo está flexionado aunque las puntas estén juntas', () => {
      const mano = manoDedosJuntos(0.03);
      mano[PuntosMano.MEDIO_TIP] = { x: 0.43, y: 0.55, z: 0 }; // Flexiona dedo medio
      expect(validarPaso4IntroducirManoDerecha([mano], [INFO_DER]).correcto).toBe(false);
    });
  });

  describe('Paso 5 - Repetir con mano izquierda / bolsillo estéril (umbral pinza < 0.09)', () => {
    it('aprueba cuando la distancia pulgar-índice es menor a 0.09 (0.089)', () => {
      const mano = manoEnPinza(0.089);
      expect(validarPaso5RepetirManoIzquierda([mano], [INFO_DER]).correcto).toBe(true);
      expect(validarPasoTecnica(5, [mano], [INFO_DER]).correcto).toBe(true);
    });

    it('rechaza en el límite exacto 0.09 y cuando no hay manos', () => {
      const manoLimite = manoEnPinza(0.09);
      expect(validarPaso5RepetirManoIzquierda([manoLimite], [INFO_DER]).correcto).toBe(false);
      expect(validarPaso5RepetirManoIzquierda([], []).correcto).toBe(false);
    });
  });

  describe('Paso 6 - Ajustar puños manteniendo esterilidad', () => {
    it('aprueba cuando ambas manos están visibles y con todos los dedos extendidos', () => {
      const manoA = manoExtendida(-0.1, 0, 0);
      const manoB = manoExtendida(0.1, 0, 0);
      expect(validarPaso6AjustarPunos([manoA, manoB]).correcto).toBe(true);
      expect(validarPasoTecnica(6, [manoA, manoB], [INFO_IZQ, INFO_DER]).correcto).toBe(true);
    });

    it('rechaza cuando una mano tiene dedos flexionados o falta una mano', () => {
      const manoA = manoExtendida(-0.1, 0, 0);
      const manoBFlex = manoConAnguloIndice(120);
      expect(validarPaso6AjustarPunos([manoA, manoBFlex]).correcto).toBe(false);
      expect(validarPaso6AjustarPunos([manoA]).correcto).toBe(false);
    });
  });

  describe('Despachador validarPasoTecnica, geometría auxiliar y suavizado EMA', () => {
    it('despacha pasos desconocidos, ausencia de manos y respaldo de lateralidad', () => {
      expect(validarPasoTecnica(1, [], []).correcto).toBe(false);
      const mano = manoExtendida();
      expect(validarPasoTecnica(99, [mano], [INFO_DER]).correcto).toBe(false);

      const respaldo = clasificarManosPorLateralidad([mano], []);
      expect(respaldo.manoIzquierda).toBe(mano);
      expect(respaldo.manoDerecha).toBe(mano);
    });

    it('cubre utilidades geométricas 2D/flexión y filtro de suavizado EMA', () => {
      expect(calcularDistancia2D({ x: 0, y: 0, z: 5 }, { x: 3, y: 4, z: -2 })).toBe(5);
      const manoFlex = manoConAnguloIndice(60);
      expect(dedoFlexionado(manoFlex, PuntosMano.INDICE_MCP)).toBe(true);
      expect(dedoFlexionado(manoExtendida(), PuntosMano.PULGAR_CMC)).toBe(false);

      resetearBuffer();
      expect(suavizarLandmarks(null)).toEqual([]);
      const m1 = manoExtendida(0, 0, 0);
      const m2 = manoExtendida(0.2, 0, 0);
      const s1 = suavizarLandmarks(m1, 0.5);
      const s2 = suavizarLandmarks(m2, 0.5);
      expect(s1).toHaveLength(21);
      expect(s2[0].x).toBeCloseTo((m1[0].x + m2[0].x) / 2, 5);

      expect(promediarLandmarksBuffer([])).toEqual([]);
      expect(promediarLandmarksBuffer([m1])).toBe(m1);
      expect(promediarLandmarksBuffer([m1, m2])[0].x).toBeCloseTo((m1[0].x + m2[0].x) / 2, 5);

      suavizadorGlobal.reiniciar();
      expect(suavizadorGlobal.suavizarTodas([])).toEqual([]);
      for (let f = 0; f < 7; f++) {
        suavizarLandmarks(manoExtendida(f * 0.01, 0, 0), 0.5);
        suavizadorGlobal.suavizarTodas([manoExtendida(f * 0.01, 0, 0)]);
      }

      expect(formatearTiempo(-5)).toBe('00:00');
      expect(formatearTiempo(125)).toBe('02:05');
      expect(formatearFecha('2026-10-25T15:30:00Z').length).toBeGreaterThan(0);
      expect(formatearFecha('fecha-invalida')).toBe('fecha-invalida');
      expect(calcularPrecision(0, 0)).toBe(100);
      expect(calcularPrecision(2, 6)).toBe(70);

      expect(calcularPuntajeSimulacion(6, 0, 90)).toBe(1000);
      expect(calcularPuntajeSimulacion(6, 2, 150)).toBe(870);
      expect(nivelDesempeno(900)).toBe('excelente');
      expect(nivelDesempeno(700)).toBe('bueno');
      expect(nivelDesempeno(400)).toBe('repasar');
    });
  });
});
