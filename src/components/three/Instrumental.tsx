import React from 'react';

/**
 * Instrumental y bandeja quirúrgica de acero pulido (pinzas hemostáticas y tijeras).
 * Añade detalle y contexto clínico realista en el área periférica de la mesa.
 */
const Instrumental: React.FC = () => {
  return (
    <group position={[1.2, -0.4, 0.5]}>
      {/* Bandeja metálica quirúrgica */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
        <meshStandardMaterial color="#B0B4B8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Pinza quirúrgica (cuerpo de ramas simétricas) */}
      <group position={[0, 0.08, 0]} rotation={[0, 0.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.25, 8]} />
          <meshStandardMaterial color="#D8D8D8" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, 0.15]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.25, 8]} />
          <meshStandardMaterial color="#D8D8D8" metalness={1} roughness={0.1} />
        </mesh>
      </group>

      {/* Tijeras quirúrgicas de Mayo / Metzenbaum */}
      <group position={[0.2, 0.08, 0]} rotation={[0, -0.2, 0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.02, 0.015, 0.2]} />
          <meshStandardMaterial color="#D8D8D8" metalness={1} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
};

export default Instrumental;
