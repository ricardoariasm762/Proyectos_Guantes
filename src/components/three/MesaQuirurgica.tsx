import React from 'react';
import { RoundedBox } from '@react-three/drei';

/**
 * Mesa quirúrgica de acero inoxidable (acabado PBR físico).
 * Proporciona el soporte visual fundamental sobre el cual se asienta el campo estéril.
 */
const MesaQuirurgica: React.FC = () => {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Superficie de la mesa con bordes redondeados y material físico reflectivo */}
      <RoundedBox
        args={[4, 0.1, 2]}
        radius={0.03}
        smoothness={4}
        receiveShadow
        castShadow
      >
        <meshPhysicalMaterial
          color="#C8CDD2"
          metalness={0.85}
          roughness={0.15}
          clearcoat={0.6}
          clearcoatRoughness={0.1}
          envMapIntensity={1.5}
        />
      </RoundedBox>

      {/* Patas cilíndricas de acero tubular quirúrgico */}
      {[
        [-1.8, -0.8, -0.8],
        [1.8, -0.8, -0.8],
        [-1.8, -0.8, 0.8],
        [1.8, -0.8, 0.8],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.5, 16]} />
          <meshStandardMaterial color="#A0A4A8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

export default MesaQuirurgica;
