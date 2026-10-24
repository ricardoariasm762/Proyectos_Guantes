// Servicio Singleton para carga, inferencia client-side y gestión del ciclo de vida de TensorFlow.js
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import * as tf from '@tensorflow/tfjs';
import type { PrediccionIA, LabelTecnica } from '../types/ia';
import { TODAS_LAS_LABELS } from '../types/ia';

/**
 * Servicio encargado de gestionar el modelo de Machine Learning en el navegador.
 * Realiza inferencia local privada (el video y las features nunca salen del cliente).
 */
export class IAService {
  private static instance: IAService | null = null;

  private model: tf.LayersModel | null = null;
  private labels: string[] = [...TODAS_LAS_LABELS];
  private isLoading = false;
  private isLoaded = false;
  private errorCarga: string | null = null;

  constructor() {
    // Constructor privado para patrón Singleton (o instanciación directa controlada)
  }

  public static getInstance(): IAService {
    if (!IAService.instance) {
      IAService.instance = new IAService();
    }
    return IAService.instance;
  }

  /**
   * Carga el modelo TF.js y el archivo de etiquetas desde la carpeta public/.
   * Si los archivos no existen aún en el servidor local, entra en modo contingencia
   * seguro permitiendo que el sistema funcione con solo reglas clínicas.
   *
   * @param urlModelo Ruta al archivo model.json exportado de TensorFlow
   * @param urlLabels Ruta al archivo labels.json con el orden de las clases
   */
  public async cargarModelo(
    urlModelo = '/modelo_tfjs/model.json',
    urlLabels = '/modelo_tfjs/labels.json'
  ): Promise<boolean> {
    if (this.isLoaded && this.model) {
      return true;
    }

    if (this.isLoading) {
      return false;
    }

    this.isLoading = true;
    this.errorCarga = null;

    try {
      // 1. Cargar etiquetas de clases desde labels.json (si existe)
      try {
        const respuestaLabels = await fetch(urlLabels);
        if (respuestaLabels.ok) {
          const labelsData = await respuestaLabels.json();
          if (Array.isArray(labelsData) && labelsData.length > 0) {
            this.labels = labelsData;
          }
        }
      } catch (errLabels) {
        console.warn(
          'No se pudo cargar labels.json personalizado. Utilizando etiquetas predeterminadas.',
          errLabels
        );
        this.labels = [...TODAS_LAS_LABELS];
      }

      // 2. Inicializar backend de TensorFlow.js (WebGL preferido, CPU fallback)
      await tf.ready();

      // 3. Cargar capas de la red neuronal convolucional/densa
      this.model = await tf.loadLayersModel(urlModelo);

      this.isLoaded = true;
      this.isLoading = false;
      this.errorCarga = null;
      console.info('Modelo de IA TensorFlow.js cargado exitosamente en el cliente.');
      return true;
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'Error desconocido al cargar el modelo de IA.';
      this.errorCarga = mensaje;
      this.isLoaded = false;
      this.isLoading = false;
      this.model = null;

      console.warn(
        'Aviso: Modelo de IA aún no disponible en /modelo_tfjs/. El simulador operará con validación por Reglas Clínicas.',
        mensaje
      );
      return false;
    }
  }

  /**
   * Ejecuta la inferencia en tiempo real para un vector de 79 características.
   * Utiliza tf.tidy() para evitar fugas de memoria en la GPU WebGL durante el bucle de video.
   *
   * @param features Vector de 79 valores extraído de los landmarks de la mano
   * @returns Predicción estructurada con etiqueta, confianza y probabilidades, o null si no está listo
   */
  public predecir(features: number[]): PrediccionIA | null {
    if (!this.isLoaded || !this.model) {
      return null;
    }

    if (!features || features.length !== 79) {
      console.warn(`Vector de features con tamaño inválido: ${features?.length ?? 0}. Se esperan 79.`);
      return null;
    }

    try {
      // tf.tidy ejecuta la predicción y limpia automáticamente todos los tensores intermedios
      const resultado = tf.tidy(() => {
        // Formato tensor de entrada: [batch_size: 1, num_features: 79]
        const inputTensor = tf.tensor2d([features], [1, 79], 'float32');

        // Inferencia
        const salida = this.model!.predict(inputTensor) as tf.Tensor;

        // Vector de probabilidades softmax (1D de longitud N clases)
        const probabilidadesArray = Array.from(salida.dataSync());
        return probabilidadesArray;
      });

      if (!resultado || resultado.length === 0) {
        return null;
      }

      // Encontrar la clase con mayor probabilidad (ArgMax)
      let indiceMaximo = 0;
      let maxProbabilidad = -1;
      const probabilidades: Record<string, number> = {};

      for (let i = 0; i < resultado.length; i++) {
        const prob = resultado[i];
        const labelNombre = this.labels[i] || `clase_${i}`;
        probabilidades[labelNombre] = Number(prob.toFixed(4));

        if (prob > maxProbabilidad) {
          maxProbabilidad = prob;
          indiceMaximo = i;
        }
      }

      const labelPredicha = (this.labels[indiceMaximo] as LabelTecnica) || 'INCORRECTO_contaminacion';

      return {
        label: labelPredicha,
        confianza: Number(maxProbabilidad.toFixed(4)),
        probabilidades,
      };
    } catch (predErr) {
      console.error('Error durante la inferencia de TensorFlow.js:', predErr);
      return null;
    }
  }

  /**
   * Indica si el modelo está completamente listo para inferencias en tiempo real.
   */
  public isReady(): boolean {
    return this.isLoaded && this.model !== null;
  }

  /**
   * Indica si el modelo se encuentra en proceso de carga.
   */
  public getIsLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Obtiene la lista actual de etiquetas de clasificación.
   */
  public getLabels(): string[] {
    return [...this.labels];
  }

  /**
   * Retorna el último mensaje de error de carga si existió.
   */
  public getError(): string | null {
    return this.errorCarga;
  }

  /**
   * Libera los recursos de GPU y memoria asignados al modelo de TensorFlow.js.
   */
  public dispose(): void {
    if (this.model) {
      try {
        this.model.dispose();
      } catch (err) {
        console.warn('Error al liberar modelo TF.js:', err);
      }
      this.model = null;
    }
    this.isLoaded = false;
    this.isLoading = false;
  }
}

/**
 * Instancia singleton exportada para consumo directo en hooks y componentes.
 */
export const iaService = IAService.getInstance();
export default iaService;
