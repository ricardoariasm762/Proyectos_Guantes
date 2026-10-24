// Simulador Biomecánico por Cámara con IA híbrida (MediaPipe + TF.js + reglas clínicas)
// Este componente solo compone: el tracking, la validación y el flujo clínico viven en hooks.
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React, { useCallback, useState } from 'react';
import confetti from 'canvas-confetti';
import { useHandTracking } from '../hooks/useHandTracking';
import { useSesionPractica, type EventoSesion } from '../hooks/useSesionPractica';
import { VideoCanvas } from './VideoCanvas';
import { PanelFeedback } from './PanelFeedback';
import { ControlesSimulacion } from './ControlesSimulacion';
import { ResumenSesionModal } from './simulacion/ResumenSesionModal';
import { PASOS_SIMULACION_VISION } from '../data/pasosTecnica';
import { soundManager } from '../utils/sound';
import { calcularPuntajeSimulacion } from '../utils/puntajeSimulacion';
import { useProgresoStore } from '../store/useProgresoStore';
import { usePracticaStore } from '../store/usePracticaStore';
import { registrarIntento } from '../services/intentoService';

export interface ResultadoSesion {
  puntaje: number;
  tiempoSegundos: number;
  errores: number;
  pasosCompletados: number;
}

export interface SimulacionCamaraProps {
  /** Se invoca una sola vez al guardar, con el resultado y si el backend lo recibió. */
  onIntentoGuardado?: (resultado: ResultadoSesion, sincronizado: boolean) => void;
}

const leerVersionModelo = () => localStorage.getItem('versionModeloActiva') || 'v1.0';

export const SimulacionCamara: React.FC<SimulacionCamaraProps> = ({ onIntentoGuardado }) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [versionModelo] = useState(leerVersionModelo);

  const agregarIntentoStore = useProgresoStore((s) => s.agregarIntento);

  // Cámara + MediaPipe (aislado de la UI)
  const camara = useHandTracking();
  const { landmarks, handedness, pausarTracking, reanudarTracking } = camara;

  // Efectos secundarios (sonido, confeti) ligados a eventos clínicos de la sesión
  const manejarEvento = useCallback((evento: EventoSesion) => {
    if (evento === 'falta') {
      soundManager.playError();
      return;
    }
    soundManager.playSuccess();
    if (evento === 'completada') {
      confetti({ particleCount: 130, spread: 85, origin: { y: 0.6 } });
      setModalAbierto(true);
    }
  }, []);

  const sesion = useSesionPractica({ landmarks, handedness, onEvento: manejarEvento });
  const { estado, ia } = sesion;

  const practicaActiva = estado.fase === 'activa' || estado.fase === 'pausada';
  const practicaCompletada = estado.fase === 'completada';
  const enPausa = estado.fase === 'pausada';

  const handleIniciar = () => {
    soundManager.playClick();
    usePracticaStore.getState().iniciarPractica(versionModelo);
    reanudarTracking();
    sesion.iniciar();
  };

  const handlePausarReanudar = () => {
    soundManager.playClick();
    if (enPausa) {
      reanudarTracking();
      sesion.reanudar();
    } else {
      pausarTracking();
      sesion.pausar();
    }
  };

  const handleReiniciar = () => {
    soundManager.playClick();
    setModalAbierto(false);
    reanudarTracking();
    sesion.reiniciar();
  };

  const puntaje = calcularPuntajeSimulacion(
    estado.pasosCompletados.length,
    estado.errores,
    estado.segundos
  );

  const handleGuardar = async () => {
    if (guardando) return;
    setGuardando(true);
    soundManager.playClick();

    const resultado: ResultadoSesion = {
      puntaje,
      tiempoSegundos: estado.segundos,
      errores: estado.errores,
      pasosCompletados: estado.pasosCompletados.length,
    };
    const confianza = sesion.obtenerConfianzaPromedio();

    // 1. Historial local (Zustand + localStorage): siempre disponible, incluso sin red
    agregarIntentoStore({
      ...resultado,
      modo: 'simulacion',
      detallesErrores: [
        `Práctica con ${resultado.errores} faltas en ${resultado.tiempoSegundos}s.` +
          (confianza === null ? '' : ` Confianza promedio: ${confianza}%.`),
      ],
    });
    usePracticaStore.getState().finalizarPractica();

    // 2. Backend Spring Boot: un único POST (si falla, queda respaldado para reintento)
    const { sincronizado } = await registrarIntento({
      ...resultado,
      modo: 'SIMULACION',
      incluirMetadatosIA: true,
    });

    onIntentoGuardado?.(resultado, sincronizado);
    setGuardando(false);
    setModalAbierto(false);
  };

  return (
    <section className="simulacion-camara" aria-labelledby="titulo-simulacion-camara">
      <header className="simulacion-camara-encabezado">
        <h1 id="titulo-simulacion-camara">Simulación por cámara</h1>
        <p>
          Coloca tus manos frente a la cámara y sigue los seis pasos de la técnica. La validación se
          ejecuta en tu dispositivo.
        </p>
      </header>

      <div className="simulacion-camara-layout">
        <div className="simulacion-camara-principal">
          <VideoCanvas
            videoRef={camara.videoRef}
            canvasRef={camara.canvasRef}
            landmarks={landmarks}
            handedness={handedness}
            pasoCorrecto={ia.resultado?.correcto ?? false}
            isReady={camara.isReady}
            isLoading={camara.isLoading}
            error={camara.error || ia.error}
            fps={camara.fps}
            alertaIluminacion={camara.alertaIluminacion}
            isIAReady={ia.isIAReady}
            isIALoading={ia.isIALoading}
            onReintentar={camara.reiniciarDetector}
          />

          <ControlesSimulacion
            practicaActiva={practicaActiva}
            practicaCompletada={practicaCompletada}
            enPausa={enPausa}
            cargandoIA={camara.isLoading || !camara.isReady}
            onIniciar={handleIniciar}
            onPausarReanudar={handlePausarReanudar}
            onReiniciar={handleReiniciar}
            onFinalizarGuardar={() => setModalAbierto(true)}
            guardandoResultado={guardando}
          />
        </div>

        <PanelFeedback
          pasoActual={estado.pasoActual}
          pasos={PASOS_SIMULACION_VISION}
          pasosCompletados={estado.pasosCompletados}
          resultadoValidacion={ia.resultado}
          tiempoTranscurrido={estado.segundos}
          errores={estado.errores}
          practicaActiva={practicaActiva}
          practicaCompletada={practicaCompletada}
          tiempoSostenidoSegundos={estado.sostenido}
          isIALoading={ia.isIALoading}
          isIAReady={ia.isIAReady}
        />
      </div>

      <ResumenSesionModal
        abierto={modalAbierto}
        puntaje={puntaje}
        segundos={estado.segundos}
        errores={estado.errores}
        pasosCompletados={estado.pasosCompletados.length}
        confianzaPromedio={sesion.obtenerConfianzaPromedio()}
        versionModelo={versionModelo}
        guardando={guardando}
        onCerrar={() => setModalAbierto(false)}
        onReintentar={handleReiniciar}
        onGuardar={handleGuardar}
      />
    </section>
  );
};

export default SimulacionCamara;
