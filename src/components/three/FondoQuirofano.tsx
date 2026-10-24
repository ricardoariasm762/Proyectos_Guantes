import React from 'react';

/**
 * Entorno envolvente de sala de operaciones (piso vinílico y paredes asépticas).
 * Otorga contexto arquitectónico hospitalario para inmersión médica profesional.
 */
const FondoQuirofano: React.FC = () => {
  return (
    <group>
      {/* Piso vinílico conductivo del quirófano */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#E8EEF2" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Pared frontal/trasera de paneles modulares asépticos */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#F0F4F8" roughness={0.9} />
      </mesh>

      {/* Pared lateral izquierda */}
      <mesh position={[-7, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#F0F4F8" roughness={0.9} />
      </mesh>

      {/* Pared lateral derecha */}
      <mesh position={[7, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#F0F4F8" roughness={0.9} />
      </mesh>
    </group>
  );
};

export default FondoQuirofano;
