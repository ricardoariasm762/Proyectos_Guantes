import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import * as THREE from 'three';
import LucesQuirofano from './LucesQuirofano';
import FondoQuirofano from './FondoQuirofano';
import MesaQuirurgica from './MesaQuirurgica';
import CampoEsteril from './CampoEsteril';
import Instrumental from './Instrumental';
import ManosQuirurgicas from './ManosQuirurgicas';
import CamaraScroll from './CamaraScroll';
import TextosScroll from './TextosScroll';
import Loader from './Loader';
import './TutorialScroll.css';

interface Props {
  calidadAlta?: boolean;
}

/**
 * FASE 3: Ensamblaje (TutorialScroll.tsx)
 * Ensambla el Canvas de React Three Fiber con ScrollControls (pages=6, damping=0.3),
 * iluminación quirúrgica, ManosQuirurgicas estática en el centro, CamaraScroll
 * y la capa HTML TextosScroll. Sin OrbitControls para garantizar desplazamiento fluido.
 */
export const TutorialScroll: React.FC<Props> = ({ calidadAlta = true }) => {
  const [pasoActual, setPasoActual] = useState<number>(1);

  return (
    <div className="tutorial-scroll-container">
      {/* Indicador de carga nativo */}
      <Loader />

      {/* Lienzo 3D */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 2, 5], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, calidadAlta ? 2 : 1.5]}
      >
        <Suspense fallback={null}>
          {/* Fondo aséptico claro de quirófano */}
          <color attach="background" args={['#F0F4F8']} />
          <fog attach="fog" args={['#F0F4F8', 12, 35]} />

          {/*
            ScrollControls envolviendo toda la experiencia:
            - pages={6}: Una página por cada paso clínico
            - damping={0.3}: Amortiguación e inercia suave en el desplazamiento
          */}
          <ScrollControls pages={6} damping={0.3}>
            {/* 1. Iluminación y entorno quirúrgico */}
            <LucesQuirofano />
            <FondoQuirofano />
            <MesaQuirurgica />
            <CampoEsteril />
            <Instrumental />

            {/* 2. Modelo de Manos Quirúrgicas fijo en el centro (sin animación de esqueleto) */}
            <ManosQuirurgicas
              pasoActual={pasoActual}
              reproduciendo={false}
              mostrarTextoFlotante={false}
            />

            {/* 3. Controlador de cámara cinemática guiada por scroll */}
            <CamaraScroll onPasoChange={setPasoActual} />

            {/* 4. Capa de textos HTML superpuestos con Framer Motion */}
            <TextosScroll />
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default TutorialScroll;
