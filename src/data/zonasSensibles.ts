// Definición de zonas estériles y contaminadas en el entorno quirúrgico simulado
// Universidad Cooperativa de Colombia - Campus Pasto

import type { ZonaSensible } from '../types';

export const ZONAS_SENSIBLES: ZonaSensible[] = [
  {
    id: 'zona-campo-esteril',
    nombre: 'Campo Quirúrgico Estéril',
    tipo: 'esteril',
    x: 10,
    y: 10,
    ancho: 80,
    alto: 65,
    descripcion: 'Área estéril delimitada por el paño quirúrgico estéril. Solo se deben colocar materiales y guantes estériles.',
  },
  {
    id: 'zona-mesa-contaminada',
    nombre: 'Borde / Mesa Contaminada',
    tipo: 'contaminada',
    x: 0,
    y: 75,
    ancho: 100,
    alto: 25,
    descripcion: 'Área perimetral considerada no estéril (por debajo de la altura de la mesa o fuera del campo pañado).',
  },
  {
    id: 'zona-aire-bajo',
    nombre: 'Zona Bajo Cintura',
    tipo: 'contaminada',
    x: 0,
    y: 85,
    ancho: 100,
    alto: 15,
    descripcion: 'Cualquier área por debajo del plano de la cintura se considera automáticamente contaminada.',
  },
];
