import React from 'react';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

interface Props {
  /** Si es false, desactiva efectos secundarios */
  modoRendimiento?: boolean;
}

/**
 * Pipeline de post-procesamiento cinematográfico quirúrgico.
 * Incluye resplandor sutil (Bloom) en instrumental metálico,
 * viñeteado óptico enfocado (Vignette) y mapeo de tonos cinematográfico ACES Filmic.
 */
const EfectosPost: React.FC<Props> = ({ modoRendimiento = false }) => {
  if (modoRendimiento) return null;

  return (
    <EffectComposer multisampling={2}>
      {/* Bloom sutil: otorga brillo especular al instrumental y superficies de acero inoxidable */}
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.05}
      />

      {/* Viñeteado clínico: oscurecimiento perimetral sutil que enfoca la mirada al centro quirúrgico */}
      <Vignette
        offset={0.15}
        darkness={0.45}
        eskil={false}
      />

      {/* Tone mapping cinematográfico ACES Filmic para colores equilibrados */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};

export default EfectosPost;
