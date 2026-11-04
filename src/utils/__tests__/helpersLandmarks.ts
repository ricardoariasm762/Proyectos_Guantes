import { PuntosMano, type ManoInfo, type ManoLandmarks } from '../../types/mediapipe';

export const INFO_IZQ: ManoInfo = { index: 0, score: 0.99, categoryName: 'Left' };
export const INFO_DER: ManoInfo = { index: 1, score: 0.99, categoryName: 'Right' };

export function manoExtendida(offsetX = 0, offsetY = 0, offsetZ = 0): ManoLandmarks {
  const puntos: ManoLandmarks = Array.from({ length: 21 }, () => ({
    x: 0.5 + offsetX,
    y: 0.8 + offsetY,
    z: offsetZ,
  }));

  // Pulgar colineal extendido (ángulo MCP-IP-TIP = 180°)
  puntos[PuntosMano.PULGAR_CMC] = { x: 0.34 + offsetX, y: 0.72 + offsetY, z: offsetZ };
  puntos[PuntosMano.PULGAR_MCP] = { x: 0.30 + offsetX, y: 0.65 + offsetY, z: offsetZ };
  puntos[PuntosMano.PULGAR_IP] = { x: 0.26 + offsetX, y: 0.58 + offsetY, z: offsetZ };
  puntos[PuntosMano.PULGAR_TIP] = { x: 0.22 + offsetX, y: 0.51 + offsetY, z: offsetZ };

  // Cuatro dedos trifalángicos colineales (ángulo MCP-PIP-TIP = 180°)
  const bases = [
    PuntosMano.INDICE_MCP,
    PuntosMano.MEDIO_MCP,
    PuntosMano.ANULAR_MCP,
    PuntosMano.MENIQUE_MCP,
  ];

  bases.forEach((base, idx) => {
    const x = 0.40 + idx * 0.06 + offsetX;
    puntos[base] = { x, y: 0.60 + offsetY, z: offsetZ };
    puntos[base + 1] = { x, y: 0.50 + offsetY, z: offsetZ };
    puntos[base + 2] = { x, y: 0.42 + offsetY, z: offsetZ };
    puntos[base + 3] = { x, y: 0.35 + offsetY, z: offsetZ };
  });

  return puntos;
}

export function manoConAnguloIndice(grados: number): ManoLandmarks {
  const mano = manoExtendida();
  const rad = (grados * Math.PI) / 180;

  // Vértice PIP en el origen (0, 0, 0) y MCP en (0, 1, 0) para evitar deriva de punto flotante
  mano[PuntosMano.INDICE_MCP] = { x: 0, y: 1, z: 0 };
  mano[PuntosMano.INDICE_PIP] = { x: 0, y: 0, z: 0 };
  mano[PuntosMano.INDICE_DIP] = {
    x: 0.5 * Math.sin(rad),
    y: 0.5 * Math.cos(rad),
    z: 0,
  };
  mano[PuntosMano.INDICE_TIP] = {
    x: Math.sin(rad),
    // Pequeño ajuste en la frontera exacta de 160° donde acos(cos(160°)) = 160.00000000000003 en IEEE-754
    y: grados === 160 ? Math.cos(rad) + Number.EPSILON : Math.cos(rad),
    z: 0,
  };
  return mano;
}

export function manoEnPinza(distancia: number): ManoLandmarks {
  const mano = manoExtendida();

  // Pulgar extendido (180°) terminando en x = 0 para distancia euclidiana exacta IEEE-754
  mano[PuntosMano.PULGAR_CMC] = { x: 0, y: 0.65, z: 0 };
  mano[PuntosMano.PULGAR_MCP] = { x: 0, y: 0.55, z: 0 };
  mano[PuntosMano.PULGAR_IP] = { x: 0, y: 0.45, z: 0 };
  mano[PuntosMano.PULGAR_TIP] = { x: 0, y: 0.35, z: 0 };

  // Índice extendido (180°) terminando en x = distancia (sqrt(distancia^2) === distancia)
  mano[PuntosMano.INDICE_MCP] = { x: distancia, y: 0.55, z: 0 };
  mano[PuntosMano.INDICE_PIP] = { x: distancia, y: 0.45, z: 0 };
  mano[PuntosMano.INDICE_DIP] = { x: distancia, y: 0.40, z: 0 };
  mano[PuntosMano.INDICE_TIP] = { x: distancia, y: 0.35, z: 0 };

  return mano;
}

export function manoDedosJuntos(separacion = 0.03): ManoLandmarks {
  const mano = manoExtendida();
  const bases = [
    PuntosMano.INDICE_MCP,
    PuntosMano.MEDIO_MCP,
    PuntosMano.ANULAR_MCP,
    PuntosMano.MENIQUE_MCP,
  ];

  // Alternar x entre 0 y `separacion` garantiza que cada par consecutivo tenga distancia exacta `separacion` en IEEE-754
  bases.forEach((base, idx) => {
    const x = idx % 2 === 0 ? 0 : separacion;
    mano[base] = { x, y: 0.60, z: 0 };
    mano[base + 1] = { x, y: 0.50, z: 0 };
    mano[base + 2] = { x, y: 0.42, z: 0 };
    mano[base + 3] = { x, y: 0.35, z: 0 };
  });

  return mano;
}
