import React, { useRef } from 'react';
import { useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface KeyframeCamara {
  position: [number, number, number];
  target: [number, number, number];
}

/**
 * 6 Keyframes de cámara configurados para cada paso de la técnica abierta:
 * 1. Vista general: pos [0, 2, 5], target [0, 0.5, 0]
 * 2. Vista superior (secado): pos [0, 4, 2], target [0, 0.5, 0]
 * 3. Zoom pinza derecha: pos [1.5, 1.5, 3], target [0.4, 0.5, 0]
 * 4. Vista lateral: pos [3, 1, 2], target [0, 0.5, 0]
 * 5. Zoom pinza izquierda: pos [-1.5, 1.5, 3], target [-0.4, 0.5, 0]
 * 6. Vista final: pos [0, 2, 6], target [0, 0.5, 0]
 */
export const KEYFRAMES_CAMARA: KeyframeCamara[] = [
  { position: [0, 2, 5], target: [0, 0.5, 0] },
  { position: [0, 4, 2], target: [0, 0.5, 0] },
  { position: [1.5, 1.5, 3], target: [0.4, 0.5, 0] },
  { position: [3, 1, 2], target: [0, 0.5, 0] },
  { position: [-1.5, 1.5, 3], target: [-0.4, 0.5, 0] },
  { position: [0, 2, 6], target: [0, 0.5, 0] },
];

interface Props {
  onPasoChange?: (paso: number) => void;
}

/**
 * Componente que controla la posición y orientación de la cámara
 * basándose en el scroll continuo del usuario.
 */
export const CamaraScroll: React.FC<Props> = ({ onPasoChange }) => {
  const scroll = useScroll();

  // Vectores temporales persistentes para interpolación suave sin recolector de basura
  const objetivoPos = useRef(new THREE.Vector3());
  const objetivoTarget = useRef(new THREE.Vector3());
  const actualTarget = useRef(new THREE.Vector3(0, 0.5, 0));
  const pasoActualRef = useRef(1);

  useFrame((state, delta) => {
    // 1. Leer offset normalizado (0 a 1)
    const offset = Math.min(Math.max(scroll.offset, 0), 1);

    // 2. Mapear de 0 a 1 a lo largo de los 6 keyframes (5 segmentos continuos)
    const segmentos = KEYFRAMES_CAMARA.length - 1;
    const progreso = offset * segmentos;
    const indice = Math.min(Math.floor(progreso), segmentos - 1);
    const fraccion = progreso - indice;

    // 3. Suavizar la transición entre el keyframe actual y el siguiente
    const t = THREE.MathUtils.smoothstep(fraccion, 0, 1);

    const actual = KEYFRAMES_CAMARA[indice];
    const siguiente = KEYFRAMES_CAMARA[indice + 1];

    const posA = new THREE.Vector3(...actual.position);
    const posB = new THREE.Vector3(...siguiente.position);
    const targetA = new THREE.Vector3(...actual.target);
    const targetB = new THREE.Vector3(...siguiente.target);

    // 4. Interpolar vector objetivo
    objetivoPos.current.lerpVectors(posA, posB, t);
    objetivoTarget.current.lerpVectors(targetA, targetB, t);

    // 5. Mover suavemente la cámara con lerp usando delta
    const factorSuave = Math.min(delta * 4, 0.18);
    state.camera.position.lerp(objetivoPos.current, factorSuave);
    actualTarget.current.lerp(objetivoTarget.current, factorSuave);

    // 6. Apuntar siempre hacia el objetivo
    state.camera.lookAt(actualTarget.current);

    // 7. Notificar cambio de paso activo (1 a 6) si hay oyente
    const pasoCalculado = Math.min(6, Math.max(1, Math.round(progreso) + 1));
    if (pasoCalculado !== pasoActualRef.current) {
      pasoActualRef.current = pasoCalculado;
      onPasoChange?.(pasoCalculado);
    }
  });

  return null;
};

export default CamaraScroll;
