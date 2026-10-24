import React from 'react';
import { Environment, ContactShadows } from '@react-three/drei';

/**
 * Esquema de iluminación profesional para entorno de quirófano.
 * Implementa iluminación de tres puntos (Key, Fill, Rim), Environment Map HDRI para PBR
 * y sombras de contacto volumétricas de alta resolución (ContactShadows).
 */
const LucesQuirofano: React.FC = () => {
  return (
    <>

      {/* Environment Map HDRI de estudio para reflejos metálicos y brillo de guantes de látex */}
      <Environment preset="studio" background={false} />

      {/* Luz ambiental suave para evitar zonas de oscuridad absoluta */}
      <ambientLight intensity={0.4} />

      {/* Luz principal (Key Light) - Simula el foco cialítico del quirófano centrado en el campo de trabajo */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={2.0}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* Luz de relleno (Fill Light) - Tonalidad fría (#E0F7FA) para suavizar sombras duras */}
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#E0F7FA" />

      {/* Luz de contorno (Rim/Back Light) - Azul cian quirúrgico (#00B4D8) para separar el modelo del fondo */}
      <spotLight
        position={[0, 8, -8]}
        intensity={1.0}
        angle={0.6}
        penumbra={1}
        color="#00B4D8"
        castShadow
      />

      {/* Luz puntual cálida clínica - Aporta naturalidad a los tonos de piel */}
      <pointLight position={[2, 4, 2]} intensity={0.3} color="#FFF8E1" />

      {/* Sombras de contacto proyectadas justo sobre la superficie de la mesa / campo */}
      <ContactShadows
        position={[0, -0.49, 0]}
        opacity={0.6}
        scale={15}
        blur={2.5}
        far={5}
        color="#000000"
      />
    </>
  );
};

export default LucesQuirofano;
