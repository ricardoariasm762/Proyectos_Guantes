// Escena 3D quirúrgica funcional con Three.js, React Three Fiber y Drei
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface SurgicalSceneProps {
  pasoActivo: number; // 1 a 6
  reproduciendo: boolean;
  velocidad: number;
}

// Representación anatómica procedural de mano y guante quirúrgico
const ManoQuirurgica: React.FC<{
  esDerecha?: boolean;
  enguantada?: boolean;
  conDoblePuño?: boolean;
  posicion: [number, number, number];
  rotacion: [number, number, number];
  etiqueta?: string;
  mostrarHotspot?: boolean;
  hotspotTexto?: string;
}> = ({
  esDerecha = true,
  enguantada = false,
  conDoblePuño = false,
  posicion,
  rotacion,
  mostrarHotspot = false,
  hotspotTexto = '',
}) => {
  const grupoRef = useRef<THREE.Group>(null);

  const colorPiel = '#f8c291';
  const colorGuante = '#38bdf8'; // Azul quirúrgico estéril
  const colorPunoDoblado = '#0284c7'; // Borde doblado distintivo

  const materialActual = enguantada ? colorGuante : colorPiel;

  return (
    <group ref={grupoRef} position={posicion} rotation={rotacion}>
      {/* Antebrazo / Muñeca */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 1.2, 16]} />
        <meshStandardMaterial color={enguantada ? colorGuante : colorPiel} roughness={0.5} />
      </mesh>

      {/* Si tiene puño doblado quirúrgico */}
      {conDoblePuño && (
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.39, 0.39, 0.35, 16]} />
          <meshStandardMaterial color={colorPunoDoblado} roughness={0.4} metalness={0.1} />
        </mesh>
      )}

      {/* Palma de la mano */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.7, 0.85, 0.28]} />
        <meshStandardMaterial color={materialActual} roughness={0.4} />
      </mesh>

      {/* Dedos: Meñique, Anular, Medio, Índice */}
      {[-0.24, -0.08, 0.08, 0.24].map((xOffset, i) => (
        <group key={i} position={[xOffset, 0.55, 0]}>
          <mesh position={[0, 0.25, 0]}>
            <capsuleGeometry args={[0.075, 0.45, 8, 16]} />
            <meshStandardMaterial color={materialActual} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Dedo Pulgar (con inclinación anatómica) */}
      <group
        position={[esDerecha ? -0.38 : 0.38, 0.05, 0.08]}
        rotation={[0.3, esDerecha ? -0.45 : 0.45, esDerecha ? 0.6 : -0.6]}
      >
        <mesh position={[0, 0.22, 0]}>
          <capsuleGeometry args={[0.085, 0.4, 8, 16]} />
          <meshStandardMaterial color={materialActual} roughness={0.4} />
        </mesh>
      </group>

      {/* Hotspot 3D interactivo con anotación HTML */}
      {mostrarHotspot && (
        <Html position={[0, 0.8, 0]} center distanceFactor={8}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>●</span>
            <span>{hotspotTexto}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// Envoltura estéril / Campo quirúrgico inferior
const CampoQuirurgico3D: React.FC = () => {
  return (
    <group position={[0, -1.6, 0]}>
      {/* Paño quirúrgico estéril azul/verde */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#0284c7" roughness={0.8} />
      </mesh>

      {/* Borde exterior de campo (zona de advertencia) */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Animador de escena según el paso activo
const EscenaAnimada: React.FC<SurgicalSceneProps> = ({ pasoActivo }) => {
  const rootGroupRef = useRef<THREE.Group>(null);

  // Animación suave continua de oscilación sutil
  useFrame(({ clock }) => {
    if (!rootGroupRef.current) return;
    const t = clock.getElapsedTime();
    rootGroupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
  });

  // Configuración de estado visual según el paso activo (1 a 6)
  // Paso 1: Lavado (manos elevadas)
  // Paso 2: Secado con compresa
  // Paso 3: Tomar guante derecho por el doblez
  // Paso 4: Calzar mano derecha
  // Paso 5: Calzar mano izquierda con bolsillo
  // Paso 6: Ajustar ambos puños
  const manoDerEnguantada = pasoActivo >= 4;
  const manoIzqEnguantada = pasoActivo >= 5;
  const tienePunoDoblado = pasoActivo >= 3 && pasoActivo < 6;

  // Coordenadas dinámicas según paso
  let posDer: [number, number, number] = [0.9, -0.2, 0];
  let rotDer: [number, number, number] = [0, 0, -0.15];
  let posIzq: [number, number, number] = [-0.9, -0.2, 0];
  let rotIzq: [number, number, number] = [0, 0, 0.15];

  let textoHotspotDer = '';
  let textoHotspotIzq = '';

  if (pasoActivo === 1) {
    // Manos elevadas por encima de codos
    posDer = [0.8, 0.4, 0.2];
    rotDer = [0.4, 0, -0.2];
    posIzq = [-0.8, 0.4, 0.2];
    rotIzq = [0.4, 0, 0.2];
    textoHotspotDer = 'Manos > Codos';
  } else if (pasoActivo === 2) {
    // Manos juntas en secado
    posDer = [0.5, 0.1, 0];
    posIzq = [-0.5, 0.1, 0];
    textoHotspotDer = 'Compresa estéril por toques';
  } else if (pasoActivo === 3) {
    // Mano izq toma puño de guante derecho
    posIzq = [-0.2, 0.2, 0.3];
    rotIzq = [0.2, 0.3, 0.3];
    posDer = [0.7, -0.1, 0];
    textoHotspotIzq = 'Toma exclusiva: borde doblado';
  } else if (pasoActivo === 4) {
    // Mano derecha entra en guante
    posDer = [0.3, 0.1, 0];
    posIzq = [-0.3, -0.2, 0];
    textoHotspotDer = 'Mano derecha calzada (puño doblado)';
  } else if (pasoActivo === 5) {
    // Mano derecha enguantada entra al bolsillo del guante izquierdo
    posDer = [-0.2, 0.3, 0.2];
    rotDer = [-0.2, -0.3, -0.3];
    posIzq = [-0.3, 0.1, 0];
    textoHotspotDer = 'Bolsillo estéril (dedos bajo puño)';
  } else if (pasoActivo === 6) {
    // Ambas manos calzadas ajustando puños
    posDer = [0.35, 0.1, 0];
    posIzq = [-0.35, 0.1, 0];
    textoHotspotDer = 'Ambos puños desplegados';
    textoHotspotIzq = 'Asepsia 100% conservada';
  }

  return (
    <group ref={rootGroupRef}>
      {/* Mano Izquierda */}
      <ManoQuirurgica
        esDerecha={false}
        enguantada={manoIzqEnguantada}
        conDoblePuño={tienePunoDoblado && !manoIzqEnguantada}
        posicion={posIzq}
        rotacion={rotIzq}
        mostrarHotspot={!!textoHotspotIzq}
        hotspotTexto={textoHotspotIzq}
      />

      {/* Mano Derecha */}
      <ManoQuirurgica
        esDerecha={true}
        enguantada={manoDerEnguantada}
        conDoblePuño={tienePunoDoblado && (!manoDerEnguantada || pasoActivo === 4)}
        posicion={posDer}
        rotacion={rotDer}
        mostrarHotspot={!!textoHotspotDer}
        hotspotTexto={textoHotspotDer}
      />

      <CampoQuirurgico3D />
    </group>
  );
};

export const SurgicalScene: React.FC<SurgicalSceneProps> = (props) => {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 4.2], fov: 45 }}
      style={{ width: '100%', height: '100%', background: '#090d16' }}
    >
      {/* Iluminación Quirúrgica */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
      <directionalLight position={[-5, 4, -3]} intensity={0.5} />
      <pointLight position={[0, 3, 2]} intensity={0.9} color="#e0f2fe" />

      {/* Escena anatómica */}
      <EscenaAnimada {...props} />

      {/* Controles de cámara orbital interactiva */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />
    </Canvas>
  );
};

export default SurgicalScene;
