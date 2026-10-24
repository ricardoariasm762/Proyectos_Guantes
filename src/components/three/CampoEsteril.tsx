import React from 'react';
import * as THREE from 'three';

/**
 * Campo quirúrgico estéril (paño verde clínico antideslumbrante).
 * Delimita el área estéril según las normas técnicas de enfermería quirúrgica.
 */
const CampoEsteril: React.FC = () => {
  return (
    <mesh
      position={[0, -0.44, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[3.6, 1.8]} />
      <meshStandardMaterial
        color="#156e3f"
        roughness={0.88}
        metalness={0.0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default CampoEsteril;
