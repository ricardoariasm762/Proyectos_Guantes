// Datos clínicos estandarizados: Técnica de postura de guantes quirúrgicos (Técnica Abierta)
// Basado en protocolos de la OMS y Guías de Enfermería Quirúrgica
// Universidad Cooperativa de Colombia - Campus Pasto

import type { Paso } from '../types';

export const PASOS_TECNICA: Paso[] = [
  {
    id: 1,
    titulo: 'Lavado quirúrgico de manos',
    descripcion:
      'Realizar higiene quirúrgica de manos con solución antiséptica (clorhexidina al 4% o povidona yodada). Frotar palmas, dorsos, espacios interdigitales y antebrazos durante el tiempo normado (3 a 5 minutos), manteniendo siempre las manos elevadas por encima del nivel de los codos.',
    puntosCriticos: [
      'Mantener las manos por encima del nivel de los codos en todo momento.',
      'No tocar el grifo ni superficies no estériles tras el enjuague.',
      'El agua debe escurrir desde las puntas de los dedos hacia los codos, nunca en sentido inverso.',
    ],
    tiempoEstimadoSegundos: 45,
    consejoAsepsia: 'Si en algún momento los dedos tocan el lavabo o bajan del nivel de la cintura, debe reiniciarse todo el lavado.',
  },
  {
    id: 2,
    titulo: 'Secado con compresa estéril',
    descripcion:
      'Tomar la toalla o compresa estéril por una esquina evitando que gotee agua sobre el paquete. Secar primero una mano desde los dedos hacia el codo con toques suaves (sin frotar). Luego, utilizar el extremo opuesto no usado de la toalla para secar la otra mano y antebrazo de igual forma.',
    puntosCriticos: [
      'Secar siempre en sentido distal a proximal (dedos → mano → muñeca → antebrazo).',
      'Nunca regresar a una zona ya secada con la misma porción de la toalla.',
      'Desechar la compresa en el contenedor adecuado manteniéndola alejada del cuerpo.',
    ],
    tiempoEstimadoSegundos: 30,
    consejoAsepsia: 'Inclinar el torso ligeramente hacia adelante para evitar que la compresa roce la pijama quirúrgica.',
  },
  {
    id: 3,
    titulo: 'Tomar guante derecho por el borde doblado',
    descripcion:
      'Abrir la envoltura estéril de los guantes tocando únicamente las pestañas exteriores. Con la mano izquierda (no enguantada), tomar el guante derecho haciendo pinza únicamente sobre la cara interna del puño doblado (zona que quedará en contacto con la piel).',
    puntosCriticos: [
      'Tocar exclusivamente la cara interna del doblez del guante.',
      'Bajo ninguna circunstancia tocar la cara externa (estéril) del guante con la mano desnuda.',
      'Mantener el guante levantado a la altura del pecho, alejado del campo no estéril.',
    ],
    tiempoEstimadoSegundos: 25,
    consejoAsepsia: 'La parte doblada del puño se considera NO estéril una vez tocada por la piel.',
  },
  {
    id: 4,
    titulo: 'Introducir mano derecha sin tocar exterior',
    descripcion:
      'Introducir con suavidad la mano derecha en el guante haciendo coincidir los dedos con sus respectivos compartimentos. Traccionar del puño doblado hacia abajo con la mano izquierda sin desdoblar el puño por completo y sin rozar la superficie externa estéril.',
    puntosCriticos: [
      'No intentar ajustar dedos ni acomodar el puño si quedan mal posicionados en este momento.',
      'La mano izquierda desenguantada no debe rozar la superficie estéril externa de la mano derecha.',
      'Dejar el puño doblado hasta que la otra mano esté enguantada.',
    ],
    tiempoEstimadoSegundos: 35,
    consejoAsepsia: 'Si un dedo no entra en su compartimento, continúe sin corregir; lo ajustará cuando ambas manos estén enguantadas.',
  },
  {
    id: 5,
    titulo: 'Repetir con mano izquierda (Bolsillo estéril)',
    descripcion:
      'Con la mano derecha ya enguantada (estéril), introducir los cuatro dedos enguantados por debajo del doblez del puño del guante izquierdo (zona externa estéril). Introducir la mano izquierda en el guante manteniendo el pulgar derecho abducido para no tocar la piel de la muñeca.',
    puntosCriticos: [
      'Estéril con estéril: la mano enguantada derecha solo toca la cara exterior estéril del guante izquierdo.',
      'Mantener el pulgar de la mano derecha en abducción (separado) para evitar el contacto involuntario con la piel izquierda.',
      'Levantar el guante del envoltorio antes de calzarlo para evitar rozar la envoltura.',
    ],
    tiempoEstimadoSegundos: 40,
    consejoAsepsia: 'La regla de oro: superficie estéril solo toca superficie estéril; piel solo toca cara interna.',
  },
  {
    id: 6,
    titulo: 'Ajustar puños manteniendo esterilidad',
    descripcion:
      'Con ambas manos ya calzadas, desdoblar los puños deslizando los dedos de una mano enguantada por la cara externa del puño de la otra, cubriendo las muñecas o mangas. Acomodar la tensión en los dedos y verificar que no existan pliegues ni perforaciones.',
    puntosCriticos: [
      'Al desdoblar puños, no tocar la piel del antebrazo ni la cara interna del puño con los dedos enguantados.',
      'Mantener ambas manos enguantadas por encima del nivel de la cintura y a la vista.',
      'No juntar las manos por debajo de la cintura ni colocarlas en axilas.',
    ],
    tiempoEstimadoSegundos: 30,
    consejoAsepsia: 'Mantener las manos entre la cintura y el pecho con los codos pegados al tórax en posición de descanso estéril.',
  },
];
