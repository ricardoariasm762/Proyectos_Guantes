// Página dedicada a la Simulación por Cámara con MediaPipe Hands y validación en tiempo real
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React, { useState } from 'react';
import { SimulacionCamara } from '../components/SimulacionCamara';
import { registrarIntentoEnBackend } from '../utils/api';
import { ArrowLeft, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SimulacionCamaraPage: React.FC = () => {
  const [notificacion, setNotificacion] = useState<{
    tipo: 'exito' | 'advertencia';
    mensaje: string;
  } | null>(null);

  const handleIntentoGuardado = async (payload: {
    puntaje: number;
    tiempoSegundos: number;
    errores: number;
    pasosCompletados: number;
  }) => {
    // Envío del intento al backend Spring Boot en http://localhost:8080/api/intentos
    const resultado = await registrarIntentoEnBackend({
      puntaje: payload.puntaje,
      tiempoSegundos: payload.tiempoSegundos,
      errores: payload.errores,
      modo: 'SIMULACION',
      pasosCompletados: payload.pasosCompletados,
    });

    if (resultado.sincronizado) {
      setNotificacion({
        tipo: 'exito',
        mensaje: '¡Intento sincronizado exitosamente con el servidor Spring Boot (/api/intentos)!',
      });
    } else {
      setNotificacion({
        tipo: 'advertencia',
        mensaje:
          'El progreso se guardó localmente. (El servidor Spring Boot en http://localhost:8080 no respondió o está offline).',
      });
    }

    setTimeout(() => {
      setNotificacion(null);
    }, 6000);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem' }}>
      {/* Navegación superior */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#0077B6',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.75rem',
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={12} />
            Módulo de Visión Artificial (MediaPipe)
          </span>
        </div>
      </div>

      {/* Alerta de notificación flotante */}
      {notificacion && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: notificacion.tipo === 'exito' ? '#F0FDF4' : '#FFFBEB',
            border: `1px solid ${notificacion.tipo === 'exito' ? '#86EFAC' : '#FDE68A'}`,
            color: notificacion.tipo === 'exito' ? '#15803D' : '#B45309',
            fontSize: '0.86rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          {notificacion.tipo === 'exito' ? (
            <CheckCircle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
          )}
          <span>{notificacion.mensaje}</span>
        </div>
      )}

      {/* Componente principal de Simulación por Cámara */}
      <SimulacionCamara onIntentoGuardado={handleIntentoGuardado} />
    </div>
  );
};

export default SimulacionCamaraPage;
