// Página dedicada a la Simulación por Cámara con MediaPipe Hands y validación en tiempo real
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { SimulacionCamara } from '../components/SimulacionCamara';

type Aviso = { tipo: 'exito' | 'advertencia'; mensaje: string };

export const SimulacionCamaraPage: React.FC = () => {
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // El aviso se oculta solo; el temporizador se limpia al desmontar o al llegar otro aviso
  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 6000);
    return () => window.clearTimeout(id);
  }, [aviso]);

  // El componente ya guardó el intento (un único POST): aquí solo se informa el resultado
  const handleIntentoGuardado = (_resultado: unknown, sincronizado: boolean) => {
    setAviso(
      sincronizado
        ? { tipo: 'exito', mensaje: 'Resultado guardado y sincronizado con el servidor.' }
        : {
            tipo: 'advertencia',
            mensaje:
              'Resultado guardado en este dispositivo. Se enviará al servidor cuando haya conexión.',
          }
    );
  };

  return (
    <div className="pagina-simulacion-camara">
      <nav className="pagina-simulacion-nav" aria-label="Navegación de la página">
        <Link to="/dashboard" className="enlace-volver">
          <ArrowLeft size={16} aria-hidden="true" />
          Volver al panel
        </Link>
      </nav>

      {aviso && (
        <div className={`aviso aviso-${aviso.tipo}`} role="status" aria-live="polite">
          {aviso.tipo === 'exito' ? (
            <CheckCircle size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>{aviso.mensaje}</span>
        </div>
      )}

      <SimulacionCamara onIntentoGuardado={handleIntentoGuardado} />
    </div>
  );
};

export default SimulacionCamaraPage;
