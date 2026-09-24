// Catálogo de errores comunes en la postura de guantes quirúrgicos
// Universidad Cooperativa de Colombia - Campus Pasto

import type { ErrorComun } from '../types';

export const ERRORES_COMUNES: ErrorComun[] = [
  {
    id: 'err-1',
    pasoId: 1,
    titulo: 'Descenso de manos por debajo de la cintura',
    descripcion: 'Bajar las manos tras el lavado rompe la cadena de esterilidad por flujo retrógrado de agua contaminada.',
    gravedad: 'critica',
    penalizacionPuntaje: 20,
  },
  {
    id: 'err-2',
    pasoId: 2,
    titulo: 'Frotado de piel con compresa',
    descripcion: 'Frotar la piel en lugar de dar toques suaves desprende escamas cutáneas y bacterias de capas profundas.',
    gravedad: 'moderada',
    penalizacionPuntaje: 10,
  },
  {
    id: 'err-3',
    pasoId: 2,
    titulo: 'Retroceso con toalla hacia la mano',
    descripcion: 'Pasar la toalla del codo de regreso a la mano arrastra microorganismos hacia la zona más limpia.',
    gravedad: 'critica',
    penalizacionPuntaje: 20,
  },
  {
    id: 'err-4',
    pasoId: 3,
    titulo: 'Contacto mano desnuda con exterior del guante',
    descripcion: 'Tocar la parte externa del guante con piel sin enguantar contamina inmediatamente el campo quirúrgico.',
    gravedad: 'critica',
    penalizacionPuntaje: 25,
  },
  {
    id: 'err-5',
    pasoId: 4,
    titulo: 'Intento prematuro de ajuste de dedos',
    descripcion: 'Intentar acomodar dedos con la mano desnuda antes de tener el segundo guante calzado contamina el látex.',
    gravedad: 'critica',
    penalizacionPuntaje: 20,
  },
  {
    id: 'err-6',
    pasoId: 5,
    titulo: 'Pulgar dominante roza piel contralateral',
    descripcion: 'No mantener el pulgar de la mano derecha en abducción provoca roce involuntario con la muñeca desenguantada.',
    gravedad: 'critica',
    penalizacionPuntaje: 20,
  },
  {
    id: 'err-7',
    pasoId: 6,
    titulo: 'Contacto de guante con piel de antebrazo al desdoblar',
    descripcion: 'Tocar piel desprotegida mientras se despliega el puño hacia el antebrazo contamina la cara externa del guante.',
    gravedad: 'critica',
    penalizacionPuntaje: 25,
  },
];
