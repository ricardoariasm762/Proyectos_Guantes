// Herramienta interna de recolección de datos biomecánicos para entrenamiento del modelo de IA
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import VideoCanvas from '../components/VideoCanvas';
import { extraerFeatures } from '../utils/features';
import type { MuestraEntrenamiento, LabelTecnica } from '../types/ia';
import { TODAS_LAS_LABELS, DESCRIPCIONES_LABELS } from '../types/ia';
import {
  Database,
  Download,
  Upload,
  Trash2,
  Play,
  Square,
  Lock,
  Info,
  CheckCircle,
  AlertCircle,
  Camera,
} from 'lucide-react';

const STORAGE_KEY = 'recolector_muestras_dataset';
const META_MUESTRAS_POR_CLASE = 200;

export const RecolectorDatos: React.FC = () => {
  // 1. Hook de tracking de manos con MediaPipe
  const {
    isReady,
    isLoading,
    landmarks,
    handedness,
    fps,
    error,
    alertaIluminacion,
    videoRef,
    canvasRef,
    reiniciarDetector,
  } = useHandTracking();

  // 2. Parámetros de captura y metadatos anónimos
  const [labelSeleccionada, setLabelSeleccionada] = useState<LabelTecnica>('paso_1_lavado');
  const [personaId, setPersonaId] = useState<string>('persona_1');
  const [iluminacion, setIluminacion] = useState<'buena' | 'regular' | 'mala'>('buena');
  const [distancia, setDistancia] = useState<'cerca' | 'media' | 'lejos'>('media');

  // 3. Dataset en memoria y persistencia
  const [muestras, setMuestras] = useState<MuestraEntrenamiento[]>(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_KEY);
      return guardadas ? JSON.parse(guardadas) : [];
    } catch {
      return [];
    }
  });

  // 4. Estado de grabación automática (ráfaga de 5s a 20 FPS)
  const [grabando, setGrabando] = useState<boolean>(false);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);
  const [muestrasRafagaActual, setMuestrasRafagaActual] = useState<number>(0);

  const intervaloGrabacionRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const landmarksRef = useRef(landmarks);

  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  // Persistir cambios en localStorage para evitar pérdida accidental de datos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(muestras));
    } catch (e) {
      console.warn('No se pudo guardar dataset en localStorage (límite de cuota):', e);
    }
  }, [muestras]);

  /**
   * Captura una muestra individual a partir del frame actual
   */
  const capturarMuestra = useCallback((): boolean => {
    const manosActuales = landmarksRef.current;
    if (!manosActuales || manosActuales.length === 0 || !manosActuales[0]) {
      return false;
    }

    const features = extraerFeatures(manosActuales[0]);
    if (!features || features.length !== 79) {
      return false;
    }

    const nuevaMuestra: MuestraEntrenamiento = {
      features,
      label: labelSeleccionada,
      timestamp: Date.now(),
      metadata: {
        persona: personaId,
        iluminacion,
        distancia,
      },
    };

    setMuestras((prev) => [...prev, nuevaMuestra]);
    return true;
  }, [distancia, iluminacion, labelSeleccionada, personaId]);

  /**
   * Inicia la grabación continua durante 5 segundos a 20 FPS (~100 frames)
   */
  const handleIniciarGrabacion5s = () => {
    if (grabando) return;

    if (!landmarks || landmarks.length === 0) {
      alert('Por favor coloca tus manos frente a la cámara antes de comenzar a grabar.');
      return;
    }

    setGrabando(true);
    setSegundosRestantes(5);
    setMuestrasRafagaActual(0);

    const tiempoInicio = Date.now();
    const duracionMs = 5000;
    const intervaloMs = 50; // 20 FPS = 50ms por frame

    intervaloGrabacionRef.current = window.setInterval(() => {
      const transcurrido = Date.now() - tiempoInicio;
      const restantes = Math.max(0, Math.ceil((duracionMs - transcurrido) / 1000));
      setSegundosRestantes(restantes);

      const capturado = capturarMuestra();
      if (capturado) {
        setMuestrasRafagaActual((m) => m + 1);
      }

      if (transcurrido >= duracionMs) {
        if (intervaloGrabacionRef.current) {
          clearInterval(intervaloGrabacionRef.current);
          intervaloGrabacionRef.current = null;
        }
        setGrabando(false);
      }
    }, intervaloMs);
  };

  /**
   * Detiene manualmente la grabación en curso
   */
  const handleDetenerGrabacion = () => {
    if (intervaloGrabacionRef.current) {
      clearInterval(intervaloGrabacionRef.current);
      intervaloGrabacionRef.current = null;
    }
    setGrabando(false);
  };

  /**
   * Limpieza de timers al desmontar
   */
  useEffect(() => {
    return () => {
      if (intervaloGrabacionRef.current) {
        clearInterval(intervaloGrabacionRef.current);
      }
    };
  }, []);

  /**
   * Exporta el dataset completo en formato JSON descargable
   */
  const handleExportarJSON = () => {
    if (muestras.length === 0) {
      alert('No hay muestras capturadas en el dataset para exportar.');
      return;
    }

    const payload = {
      descripcion: 'Dataset de técnica estéril - Proyecto Guantes Quirúrgicos UCC Pasto',
      fecha: new Date().toISOString(),
      num_features: 79,
      total_muestras: muestras.length,
      clases: TODAS_LAS_LABELS,
      data: muestras,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset_tecnica_esteril_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Permite importar un dataset JSON existente para continuar la recolección
   */
  const handleImportarJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const contenido = JSON.parse(e.target?.result as string);
        const listaMuestras: MuestraEntrenamiento[] = Array.isArray(contenido)
          ? contenido
          : Array.isArray(contenido.data)
          ? contenido.data
          : [];

        if (listaMuestras.length === 0) {
          alert('El archivo JSON no contiene un array válido de muestras.');
          return;
        }

        setMuestras((prev) => [...prev, ...listaMuestras]);
        alert(`¡Se importaron ${listaMuestras.length} muestras correctamente!`);
      } catch {
        alert('Error al leer el archivo JSON: formato inválido.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  /**
   * Elimina las muestras de la clase activa o todo el dataset
   */
  const handleLimpiarClaseActual = () => {
    const conteo = muestras.filter((m) => m.label === labelSeleccionada).length;
    if (conteo === 0) return;
    if (
      confirm(`¿Seguro que deseas eliminar las ${conteo} muestras de "${DESCRIPCIONES_LABELS[labelSeleccionada]}"?`)
    ) {
      setMuestras((prev) => prev.filter((m) => m.label !== labelSeleccionada));
    }
  };

  const handleLimpiarTodo = () => {
    if (muestras.length === 0) return;
    if (
      confirm(`¿Estás seguro de ELIMINAR TODO EL DATASET (${muestras.length} muestras)? Esta acción no se puede deshacer.`)
    ) {
      setMuestras([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Conteo de muestras por cada clase
  const conteoPorClase: Record<string, number> = {};
  for (const label of TODAS_LAS_LABELS) {
    conteoPorClase[label] = 0;
  }
  for (const muestra of muestras) {
    if (conteoPorClase[muestra.label] !== undefined) {
      conteoPorClase[muestra.label] += 1;
    }
  }

  const totalMuestras = muestras.length;
  const metaTotalEsperada = TODAS_LAS_LABELS.length * META_MUESTRAS_POR_CLASE; // 1,800 muestras
  const progresoTotalPct = Math.min(100, Math.round((totalMuestras / metaTotalEsperada) * 100));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1rem',
      }}
    >
      {/* ENCABEZADO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={24} style={{ color: '#0077B6' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Recolector de Datos Biomecánicos
            </h1>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '0.25rem', marginBottom: 0 }}>
            Herramienta interna para captura de vectores de características (79 features) para el entrenamiento del modelo de IA.
          </p>
        </div>

        {/* Acciones de exportación / importación */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportarJSON}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={14} />
            Importar JSON
          </button>
          <button
            onClick={handleExportarJSON}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#0077B6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 119, 182, 0.25)',
            }}
          >
            <Download size={14} />
            Exportar dataset.json ({totalMuestras})
          </button>
        </div>
      </div>

      {/* AVISO DE PRIVACIDAD Y RECOMENDACIÓN CLÍNICA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <Lock size={18} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.45 }}>
            <strong>Privacidad y Ética:</strong> Tu cámara se procesa estrictamente en tu navegador.
            Ningún video ni imagen se transmite ni se almacena; únicamente se guardan las 79 coordenadas matemáticas y ángulos.
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <Info size={18} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.45 }}>
            <strong>Recomendación para la investigación:</strong> Recolecta mínimo <strong>200 muestras por clase</strong> con al menos <strong>3 personas diferentes</strong> variando ángulo, distancia e iluminación para máxima generalización.
          </div>
        </div>
      </div>

      {/* DISPOSICIÓN PRINCIPAL: CÁMARA (IZQUIERDA) Y CONTROLES (DERECHA) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA: VIDEO CON LANDMARKS Y BOTÓN DE DISPARO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <VideoCanvas
            videoRef={videoRef}
            canvasRef={canvasRef}
            landmarks={landmarks}
            handedness={handedness}
            pasoCorrecto={landmarks.length > 0}
            isReady={isReady}
            isLoading={isLoading}
            error={error}
            fps={fps}
            alertaIluminacion={alertaIluminacion}
            onReintentar={reiniciarDetector}
          />

          {/* BARRA DE CAPTURA RÁPIDA */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                Acciones de Grabación
              </span>
              {grabando && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#DC2626',
                      animation: 'pulse 1s infinite',
                    }}
                  />
                  Grabando ({segundosRestantes}s restantes - {muestrasRafagaActual} frames)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {!grabando ? (
                <button
                  onClick={handleIniciarGrabacion5s}
                  disabled={!isReady || landmarks.length === 0}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    backgroundColor: landmarks.length > 0 ? '#0077B6' : '#94A3B8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: landmarks.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: '0 4px 10px rgba(0, 119, 182, 0.25)',
                  }}
                >
                  <Play size={16} fill="white" />
                  Grabar 5s (~100 frames)
                </button>
              ) : (
                <button
                  onClick={handleDetenerGrabacion}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Square size={16} fill="white" />
                  Detener Grabación
                </button>
              )}

              <button
                onClick={capturarMuestra}
                disabled={!isReady || landmarks.length === 0 || grabando}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: landmarks.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                <Camera size={15} />
                Capturar 1 frame
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CONFIGURACIÓN DE METADATOS Y MONITOREO DE CLASES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* TARJETA 1: SELECTOR DE CLASE Y METADATOS */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Configuración de la Muestra
            </h2>

            {/* Selector de clase (9 opciones) */}
            <div>
              <label
                htmlFor="selector-etiqueta"
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '0.35rem',
                }}
              >
                Etiqueta / Gesto Clínico a Registrar:
              </label>
              <select
                id="selector-etiqueta"
                value={labelSeleccionada}
                onChange={(e) => setLabelSeleccionada(e.target.value as LabelTecnica)}
                disabled={grabando}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #0077B6',
                  backgroundColor: '#F0F9FF',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#0369A1',
                  cursor: 'pointer',
                }}
              >
                {TODAS_LAS_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {DESCRIPCIONES_LABELS[label]} ({conteoPorClase[label]} muestras)
                  </option>
                ))}
              </select>
            </div>

            {/* Metadatos anónimos: Sujeto, Iluminación, Distancia */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
              }}
            >
              <div>
                <label
                  htmlFor="input-sujeto"
                  style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}
                >
                  Sujeto / ID
                </label>
                <input
                  id="input-sujeto"
                  type="text"
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  disabled={grabando}
                  placeholder="persona_1"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="select-iluminacion"
                  style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}
                >
                  Iluminación
                </label>
                <select
                  id="select-iluminacion"
                  value={iluminacion}
                  onChange={(e) => setIluminacion(e.target.value as 'buena' | 'regular' | 'mala')}
                  disabled={grabando}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="select-distancia"
                  style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}
                >
                  Distancia
                </label>
                <select
                  id="select-distancia"
                  value={distancia}
                  onChange={(e) => setDistancia(e.target.value as 'cerca' | 'media' | 'lejos')}
                  disabled={grabando}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="cerca">Cerca (&lt;0.5m)</option>
                  <option value="media">Media (0.5-1m)</option>
                  <option value="lejos">Lejos (&gt;1m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* TARJETA 2: MONITOREO DE MUESTRAS POR CLASE */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Progreso del Dataset
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {totalMuestras} / {metaTotalEsperada} muestras totales ({progresoTotalPct}%)
                </div>
              </div>

              {/* Botón borrar clase activa */}
              <button
                onClick={handleLimpiarClaseActual}
                title="Eliminar muestras de la clase activa"
                style={{
                  padding: '5px 8px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={12} />
                Limpiar clase
              </button>
            </div>

            {/* Barra global */}
            <div
              style={{
                height: '8px',
                width: '100%',
                backgroundColor: '#F1F5F9',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progresoTotalPct}%`,
                  backgroundColor: progresoTotalPct >= 100 ? '#16A34A' : '#0077B6',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Lista detallada de las 9 clases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '340px', overflowY: 'auto' }}>
              {TODAS_LAS_LABELS.map((label) => {
                const count = conteoPorClase[label];
                const metaAlcanzada = count >= META_MUESTRAS_POR_CLASE;
                const esSeleccionada = label === labelSeleccionada;
                const pct = Math.min(100, Math.round((count / META_MUESTRAS_POR_CLASE) * 100));

                return (
                  <div
                    key={label}
                    onClick={() => !grabando && setLabelSeleccionada(label)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: esSeleccionada ? '#F0F9FF' : '#F8FAFC',
                      border: `1.5px solid ${esSeleccionada ? '#0077B6' : '#E2E8F0'}`,
                      cursor: grabando ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: esSeleccionada ? 700 : 600,
                          color: esSeleccionada ? '#0369A1' : '#334155',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '240px',
                        }}
                      >
                        {DESCRIPCIONES_LABELS[label]}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: metaAlcanzada ? '#16A34A' : count > 0 ? '#0284C7' : '#94A3B8',
                          }}
                        >
                          {count} / {META_MUESTRAS_POR_CLASE}
                        </span>
                        {metaAlcanzada ? (
                          <CheckCircle size={13} style={{ color: '#16A34A' }} />
                        ) : count > 0 ? (
                          <AlertCircle size={13} style={{ color: '#F59E0B' }} />
                        ) : null}
                      </div>
                    </div>

                    {/* Mini barra de progreso por clase */}
                    <div
                      style={{
                        height: '4px',
                        width: '100%',
                        backgroundColor: '#E2E8F0',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: metaAlcanzada ? '#16A34A' : '#0077B6',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón peligroso: Limpiar todo */}
            {totalMuestras > 0 && (
              <button
                onClick={handleLimpiarTodo}
                style={{
                  marginTop: '0.5rem',
                  padding: '6px',
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  border: 'none',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'underline',
                }}
              >
                Eliminar todo el dataset local
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecolectorDatos;
