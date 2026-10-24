import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import ManosQuirurgicas from './ManosQuirurgicas';
import MesaQuirurgica from './MesaQuirurgica';
import CampoEsteril from './CampoEsteril';
import Instrumental from './Instrumental';
import LucesQuirofano from './LucesQuirofano';
import CamaraCinematografica from './CamaraCinematografica';
import EfectosPost from './EfectosPost';
import FondoQuirofano from './FondoQuirofano';
import Loader from './Loader';

interface Props {
  pasoActual: number;
  reproduciendo: boolean;
  calidadAlta?: boolean;
}

/**
 * Escena principal del simulador de técnica estéril.
 * Ensambla Canvas con mapeo ACES Filmic, sombras suaves, ambientación hospitalaria,
 * instrumental clínico, modelo quirúrgico y post-procesamiento selectivo.
 */
const EscenaTutorial: React.FC<Props> = ({
  pasoActual,
  reproduciendo,
  calidadAlta = true,
}) => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Overlay de carga nativo de React, inmune a errores de unmount en React 19 */}
      <Loader />

      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [2.5, 1.8, 3.8], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, calidadAlta ? 2 : 1.5]}
      >
        <Suspense fallback={null}>
          {/* Fondo aséptico y niebla de profundidad para desvanecimiento suave */}
          <color attach="background" args={['#F0F4F8']} />
          <fog attach="fog" args={['#F0F4F8', 12, 35]} />

          {/* Sistema de Iluminación Quirúrgica de 3 Puntos + HDRI */}
          <LucesQuirofano />

          {/* Arquitectura de Quirófano y Mobiliario Clínico */}
          <FondoQuirofano />
          <MesaQuirurgica />
          <CampoEsteril />
          <Instrumental />

          {/* Modelo Principal de Manos Quirúrgicas (GLB o Fallback Procedural) */}
          <ManosQuirurgicas pasoActual={pasoActual} reproduciendo={reproduciendo} />

          {/* Controlador Cinemático de Cámara por Paso */}
          <CamaraCinematografica pasoActual={pasoActual} />

          {/* Pipeline de Post-procesamiento */}
          {calidadAlta && <EfectosPost modoRendimiento={!calidadAlta} />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EscenaTutorial;
