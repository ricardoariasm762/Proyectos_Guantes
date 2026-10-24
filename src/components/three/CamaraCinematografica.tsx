import React, { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  pasoActual: number;
}

/**
 * Coordenadas de cámara y puntos de enfoque (target) optimizados
 * para destacar los gestos críticos de cada paso de la técnica abierta.
 */
const POSICIONES = [
  { pos: [2.5, 1.8, 3.8], target: [0, 0.5, 0] },     // Paso 1: Vista general amplia (manos sobre codos)
  { pos: [1.8, 1.4, 2.6], target: [0.3, 0.5, 0] },   // Paso 2: Cercana a secado de manos y compresa
  { pos: [-1.8, 1.4, 2.6], target: [-0.3, 0.5, 0] }, // Paso 3: Lateral izquierdo para tomar el doblez
  { pos: [0, 3.2, 2.0], target: [0, 0.5, 0] },       // Paso 4: Cenital superior para inserción derecha
  { pos: [1.6, 1.5, 3.0], target: [0, 0.5, 0] },     // Paso 5: Vista 3/4 frontal para bolsillo estéril
  { pos: [0, 1.2, 3.5], target: [0, 0.5, 0] },       // Paso 6: Frontal directo para ajuste simultáneo
];

/**
 * Controlador de cámara cinematográfica con transiciones suaves (lerp)
 * al cambiar de paso clínico y control orbital interactivo para el estudiante.
 */
const CamaraCinematografica: React.FC<Props> = ({ pasoActual }) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetRef = useRef(new THREE.Vector3(0, 0.5, 0));
  const posObjetivoRef = useRef(new THREE.Vector3(3, 2, 5));
  const enTransicionRef = useRef(true);

  // Al cambiar de paso, reconfigurar posición y target objetivo
  useEffect(() => {
    const objetivo = POSICIONES[pasoActual - 1] || POSICIONES[0];
    posObjetivoRef.current.set(...(objetivo.pos as [number, number, number]));
    targetRef.current.set(...(objetivo.target as [number, number, number]));
    enTransicionRef.current = true;
  }, [pasoActual]);

  // Interpolación por fotograma
  useFrame((_, delta) => {
    if (enTransicionRef.current) {
      const factor = Math.min(delta * 2.5, 0.15);
      camera.position.lerp(posObjetivoRef.current, factor);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetRef.current, factor);
        controlsRef.current.update();
      } else {
        camera.lookAt(targetRef.current);
      }

      // Cuando la distancia es mínima, ceder el control manual absoluto al estudiante
      if (camera.position.distanceTo(posObjetivoRef.current) < 0.04) {
        enTransicionRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={10}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2}
      onStart={() => {
        // Si el usuario interactúa manualmente, pausar la transición automática para evitar tirones
        enTransicionRef.current = false;
      }}
    />
  );
};

export default CamaraCinematografica;
