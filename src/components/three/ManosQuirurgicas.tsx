import React, { useRef, useEffect, Component, type ReactNode } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  pasoActual: number;
  reproduciendo: boolean;
  mostrarTextoFlotante?: boolean;
}

/** Paleta cromática por paso para el anillo highlight y la interfaz tridimensional */
const COLORES_PASO: Record<number, string> = {
  1: '#00B4D8', // Paso 1: Azul cian antiséptico (Lavado)
  2: '#38BDF8', // Paso 2: Celeste claro (Secado de manos)
  3: '#F59E0B', // Paso 3: Ámbar advertencia (Tomar solo por el doblez interno)
  4: '#10B981', // Paso 4: Verde esmeralda (Inserción mano derecha)
  5: '#8B5CF6', // Paso 5: Púrpura clínico (Bolsillo estéril mano izquierda)
  6: '#059669', // Paso 6: Verde quirúrgico (Ajuste final y esterilidad 100%)
};

/** Textos de instrucción flotantes sincronizados por paso */
const INSTRUCCIONES_PASO: Record<number, string> = {
  1: 'Paso 1: Lavado quirúrgico (manos por encima de los codos)',
  2: 'Paso 2: Secado con compresa estéril por toques suaves',
  3: 'Paso 3: Tomar guante derecho únicamente por el borde doblado',
  4: 'Paso 4: Introducir mano derecha sin tocar el exterior estéril',
  5: 'Paso 5: Calzar mano izquierda usando el bolsillo estéril',
  6: 'Paso 6: Desplegar y ajustar ambos puños sobre la muñeca',
};

/**
 * Anillo highlight posicionado bajo el modelo sobre el campo quirúrgico.
 * Cambia dinámicamente de color según el paso activo.
 */
const AnilloHighlight: React.FC<{ color: string }> = ({ color }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Micro-pulsación sutil de escala
    const escala = 1 + Math.sin(t * 3) * 0.03;
    meshRef.current.scale.set(escala, escala, 1);
  });

  return (
    <group position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Anillo exterior pulsante */}
      <mesh ref={meshRef}>
        <ringGeometry args={[0.92, 1.08, 64]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Disco interior difuso */}
      <mesh position={[0, 0, -0.005]}>
        <ringGeometry args={[0.0, 0.9, 64]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
};

/**
 * Texto flotante tridimensional (Billboarding) situado arriba de las manos.
 */
const TextoFlotante: React.FC<{ texto: string; color: string }> = ({ texto, color }) => {
  return (
    <Html
      position={[0, 1.35, 0]}
      center
      distanceFactor={7}
      zIndexRange={[100, 0]}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: `2px solid ${color}`,
          boxShadow: `0 4px 18px ${color}55`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.3s ease',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
        <span>{texto}</span>
      </div>
    </Html>
  );
};

/**
 * Fallback procedural anatómico que se activa si el GLB no carga.
 */
const ManosProceduralesFallback: React.FC<Props> = ({
  pasoActual,
  reproduciendo,
  mostrarTextoFlotante = true,
}) => {
  const grupoRef = useRef<THREE.Group>(null);
  const colorPaso = COLORES_PASO[pasoActual] || '#00B4D8';
  const textoPaso = INSTRUCCIONES_PASO[pasoActual] || '';

  useFrame((state) => {
    if (!grupoRef.current || !reproduciendo) return;
    const t = state.clock.getElapsedTime();
    const grupo = grupoRef.current;

    switch (pasoActual) {
      case 1:
        grupo.rotation.y = Math.sin(t * 3.5) * 0.35;
        grupo.position.x = Math.sin(t * 3.5) * 0.2;
        grupo.position.y = 0.5;
        break;
      case 2:
        grupo.rotation.y = t * 1.5;
        grupo.position.y = 0.5 + Math.sin(t * 2) * 0.12;
        break;
      case 3:
        grupo.rotation.z = -0.38 + Math.sin(t * 2) * 0.1;
        grupo.position.x = 0.2;
        break;
      case 4:
        grupo.position.y = 0.5 + Math.sin(t * 3) * 0.22;
        grupo.rotation.x = 0.35 + Math.sin(t * 3) * 0.2;
        break;
      case 5:
        grupo.rotation.z = 0.38 + Math.sin(t * 2) * 0.1;
        grupo.position.x = -0.2;
        break;
      case 6:
        grupo.rotation.y = Math.sin(t * 2.5) * 0.38;
        grupo.position.y = 0.55 + Math.abs(Math.sin(t * 3)) * 0.18;
        break;
    }
  });

  const colorPiel = '#F1C9A5';
  const colorGuante = '#F8F8F0';
  const colorPunoDoblado = '#0284c7';

  const derEnguantada = pasoActual >= 4;
  const izqEnguantada = pasoActual >= 5;
  const tienePunoDoblado = pasoActual >= 3 && pasoActual < 6;

  const renderMano = (
    esDerecha: boolean,
    enguantada: boolean,
    conDoblePuno: boolean,
    pos: [number, number, number],
    rot: [number, number, number]
  ) => {
    const matColor = enguantada ? colorGuante : colorPiel;

    return (
      <group position={pos} rotation={rot}>
        <mesh position={[0, -0.9, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.36, 1.2, 16]} />
          <meshPhysicalMaterial
            color={matColor}
            roughness={enguantada ? 0.35 : 0.55}
            clearcoat={enguantada ? 0.8 : 0.0}
            sheen={enguantada ? 0.0 : 0.3}
            envMapIntensity={1.2}
          />
        </mesh>

        {conDoblePuno && (
          <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.37, 0.37, 0.3, 16]} />
            <meshStandardMaterial color={colorPunoDoblado} roughness={0.35} metalness={0.1} />
          </mesh>
        )}

        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.68, 0.82, 0.26]} />
          <meshPhysicalMaterial
            color={matColor}
            roughness={enguantada ? 0.35 : 0.55}
            clearcoat={enguantada ? 0.8 : 0.0}
            sheen={enguantada ? 0.0 : 0.3}
            envMapIntensity={1.2}
          />
        </mesh>

        {[-0.23, -0.075, 0.075, 0.23].map((offset, i) => (
          <group key={i} position={[offset, 0.52, 0]}>
            <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
              <capsuleGeometry args={[0.07, 0.42, 8, 16]} />
              <meshPhysicalMaterial
                color={matColor}
                roughness={enguantada ? 0.35 : 0.55}
                clearcoat={enguantada ? 0.8 : 0.0}
                sheen={enguantada ? 0.0 : 0.3}
                envMapIntensity={1.2}
              />
            </mesh>
          </group>
        ))}

        <group
          position={[esDerecha ? -0.36 : 0.36, 0.05, 0.08]}
          rotation={[0.3, esDerecha ? -0.45 : 0.45, esDerecha ? 0.6 : -0.6]}
        >
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <capsuleGeometry args={[0.08, 0.38, 8, 16]} />
            <meshPhysicalMaterial
              color={matColor}
              roughness={enguantada ? 0.35 : 0.55}
              clearcoat={enguantada ? 0.8 : 0.0}
              sheen={enguantada ? 0.0 : 0.3}
              envMapIntensity={1.2}
            />
          </mesh>
        </group>
      </group>
    );
  };

  return (
    <group>
      <AnilloHighlight color={colorPaso} />
      {mostrarTextoFlotante && <TextoFlotante texto={textoPaso} color={colorPaso} />}
      <group ref={grupoRef} position={[0, 0.5, 0]}>
        {renderMano(false, izqEnguantada, tienePunoDoblado && !izqEnguantada, [-0.65, 0, 0], [0, 0, 0.15])}
        {renderMano(true, derEnguantada, tienePunoDoblado && (!derEnguantada || pasoActual === 4), [0.65, 0, 0], [0, 0, -0.15])}
      </group>
    </group>
  );
};

/**
 * Componente principal que carga el modelo GLB de manos quirúrgicas,
 * asigna materiales fotorrealistas de látex/piel y ejecuta animaciones
 * procedurales notorias y exageradas por paso clínico.
 */
const ModeloManosGLB: React.FC<Props> = ({
  pasoActual,
  reproduciendo,
  mostrarTextoFlotante = true,
}) => {
  const grupoRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/manos_quirurgicas.glb');

  const colorPaso = COLORES_PASO[pasoActual] || '#00B4D8';
  const textoPaso = INSTRUCCIONES_PASO[pasoActual] || '';

  // 1. Recorrido, inspección por consola y asignación de materiales realistas
  useEffect(() => {
    console.log('=== [ManosQuirurgicas] Inspección de mallas y materiales del GLB ===');
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const matOriginal = child.material;
        const nombreMat = Array.isArray(matOriginal)
          ? matOriginal.map((m) => m.name).join(', ')
          : matOriginal?.name || 'sin_nombre';

        console.log(`[Mesh detectada]: "${child.name}" | [Material original]: "${nombreMat}"`);

        child.castShadow = true;
        child.receiveShadow = true;

        const nombreMeshLower = (child.name || '').toLowerCase();
        const nombreMatLower = (nombreMat || '').toLowerCase();

        // Identificar si corresponde a piel anatómica o a guantes quirúrgicos
        const esPiel =
          nombreMeshLower.includes('piel') ||
          nombreMeshLower.includes('skin') ||
          nombreMeshLower.includes('arm') ||
          nombreMeshLower.includes('body') ||
          nombreMatLower.includes('piel') ||
          nombreMatLower.includes('skin') ||
          (pasoActual <= 2 && (nombreMeshLower.includes('model') || nombreMeshLower.includes('hand')));

        if (esPiel) {
          // Material fotorrealista de Piel: tono #F1C9A5, roughness 0.55, sheen 0.3
          child.material = new THREE.MeshPhysicalMaterial({
            name: 'Material_Piel_Realista',
            color: new THREE.Color('#F1C9A5'),
            roughness: 0.55,
            metalness: 0.0,
            sheen: 0.3,
            sheenColor: new THREE.Color('#FFE3CE'),
            envMapIntensity: 1.2,
          });
        } else {
          // Material fotorrealista de Guante quirúrgico: blanco crema #F8F8F0, roughness 0.35, clearcoat 0.8
          child.material = new THREE.MeshPhysicalMaterial({
            name: 'Material_Guante_Quirurgico',
            color: new THREE.Color('#F8F8F0'),
            roughness: 0.35,
            metalness: 0.02,
            clearcoat: 0.8,
            clearcoatRoughness: 0.15,
            envMapIntensity: 1.2,
          });
        }

        child.material.needsUpdate = true;
      }
    });
  }, [scene, pasoActual]);

  // 2. Animaciones procedurales VISIBLES y EXAGERADAS en useFrame (±0.3 a ±0.4 rad, ±0.2 unidades)
  useFrame((state) => {
    if (!grupoRef.current) return;
    const t = state.clock.getElapsedTime();
    const grupo = grupoRef.current;

    if (!reproduciendo) return;

    switch (pasoActual) {
      case 1:
        // Paso 1: Frotar - Rotación lateral (±0.35 rad) y desplazamiento horizontal (±0.2 unidades)
        grupo.rotation.y = Math.sin(t * 3.5) * 0.35;
        grupo.rotation.x = 0;
        grupo.rotation.z = Math.cos(t * 3.5) * 0.15;
        grupo.position.x = Math.sin(t * 3.5) * 0.2;
        grupo.position.y = 0.5 + Math.abs(Math.sin(t * 7)) * 0.05;
        grupo.position.z = 0;
        break;

      case 2:
        // Paso 2: Secar - Rotación circular continua (360°) y oscilación tridimensional
        grupo.rotation.y = t * 1.5;
        grupo.rotation.x = Math.sin(t * 2) * 0.3;
        grupo.rotation.z = Math.cos(t * 2) * 0.3;
        grupo.position.x = Math.cos(t * 2) * 0.18;
        grupo.position.y = 0.5 + Math.sin(t * 2) * 0.12;
        grupo.position.z = Math.sin(t * 2) * 0.1;
        break;

      case 3:
        // Paso 3: Tomar guante derecho - Inclinación hacia un lado (-0.38 rad) y acercamiento lateral
        grupo.rotation.z = -0.38 + Math.sin(t * 2) * 0.1;
        grupo.rotation.y = 0.35 + Math.sin(t * 2) * 0.08;
        grupo.rotation.x = 0.28 + Math.cos(t * 2) * 0.08;
        grupo.position.x = 0.2 + Math.sin(t * 2) * 0.06;
        grupo.position.y = 0.45 + Math.sin(t * 2) * 0.05;
        grupo.position.z = 0.1;
        break;

      case 4:
        // Paso 4: Introducir mano - Movimiento vertical de inserción (±0.22) y rotación frontal (+0.35 rad)
        grupo.position.y = 0.5 + Math.sin(t * 3) * 0.22;
        grupo.rotation.x = 0.35 + Math.sin(t * 3) * 0.2;
        grupo.rotation.y = Math.sin(t * 1.5) * 0.1;
        grupo.rotation.z = 0;
        grupo.position.x = 0.1;
        grupo.position.z = Math.cos(t * 3) * 0.08;
        break;

      case 5:
        // Paso 5: Tomar guante izquierdo - Inclinación al lado opuesto (+0.38 rad) y tracción
        grupo.rotation.z = 0.38 + Math.sin(t * 2) * 0.1;
        grupo.rotation.y = -0.35 + Math.sin(t * 2) * 0.08;
        grupo.rotation.x = 0.28 + Math.cos(t * 2) * 0.08;
        grupo.position.x = -0.2 + Math.sin(t * 2) * 0.06;
        grupo.position.y = 0.45 + Math.sin(t * 2) * 0.05;
        grupo.position.z = 0.1;
        break;

      case 6:
        // Paso 6: Ajustar - Rotación amplia (±0.38 rad) y elevación celebratoria
        grupo.rotation.y = Math.sin(t * 2.5) * 0.38;
        grupo.rotation.x = Math.sin(t * 2) * 0.25;
        grupo.rotation.z = Math.cos(t * 2.5) * 0.2;
        grupo.position.y = 0.55 + Math.abs(Math.sin(t * 3)) * 0.18;
        grupo.position.x = Math.sin(t * 1.5) * 0.1;
        grupo.position.z = 0;
        break;

      default:
        grupo.position.set(0, 0.5, 0);
        grupo.rotation.set(0, 0, 0);
        break;
    }
  });

  return (
    <group>
      {/* 3. Refuerzos visuales: Anillo highlight inferior dinámico */}
      <AnilloHighlight color={colorPaso} />

      {/* 3. Refuerzos visuales: Texto flotante superior con instrucción */}
      {mostrarTextoFlotante && <TextoFlotante texto={textoPaso} color={colorPaso} />}

      {/* Modelo GLB con animaciones procedurales */}
      <group ref={grupoRef} position={[0, 0.5, 0]} scale={1}>
        <primitive object={scene} />
      </group>
    </group>
  );
};

useGLTF.preload('/models/manos_quirurgicas.glb');

/**
 * ErrorBoundary específico para conmutar al fallback procedural ante fallos en GLB
 */
interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Advertencia: No se pudo cargar el modelo GLB. Conmutando a fallback procedural.', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Componente principal exportado.
 */
const ManosQuirurgicas: React.FC<Props> = (props) => {
  return (
    <ModelErrorBoundary fallback={<ManosProceduralesFallback {...props} />}>
      <ModeloManosGLB {...props} />
    </ModelErrorBoundary>
  );
};

export default ManosQuirurgicas;
