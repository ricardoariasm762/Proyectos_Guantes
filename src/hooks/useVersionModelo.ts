// Hook para consultar y sincronizar la versión activa del modelo de IA desde el backend
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import { useEffect, useState } from 'react';
import { obtenerVersionActiva } from '../services/modeloIAService';
import type { ModeloIA } from '../types';

/**
 * Consulta la versión activa del modelo de IA al iniciar la aplicación
 * y la almacena en localStorage para persistencia y referencia en intentos.
 */
export const useVersionModelo = () => {
  const [version, setVersion] = useState<ModeloIA | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const v = await obtenerVersionActiva();
        if (!cancelado) {
          setVersion(v);
          if (v?.version) {
            localStorage.setItem('versionModeloActiva', v.version);
          }
        }
      } catch (error) {
        console.warn('No se pudo cargar la versión activa del modelo desde el backend:', error);
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };

    cargar();

    return () => {
      cancelado = true;
    };
  }, []);

  return { version, loading };
};

export default useVersionModelo;
