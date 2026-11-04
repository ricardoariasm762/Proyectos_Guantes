import { describe, expect, it } from 'vitest';
import {
  agruparResumenEstudiantes,
  calcularErroresPorPaso,
  type IntentoBackendDTO,
} from '../docenteService';

describe('docenteService - agregación de estudiantes y errores por paso', () => {
  it('agrupa intentos por estudiante con número de intentos, mejor puntaje y último intento', () => {
    const muestra: IntentoBackendDTO[] = [
      {
        id: 1,
        usuarioId: 10,
        usuarioNombre: 'Ana Pérez',
        usuarioEmail: 'ana@ucc.edu.co',
        modoPractica: 'GUIADO',
        fechaFin: '2026-10-20T10:00:00',
        puntaje: 75,
      },
      {
        id: 2,
        usuarioId: 10,
        usuarioNombre: 'Ana Pérez',
        usuarioEmail: 'ana@ucc.edu.co',
        modoPractica: 'SIMULACION',
        fechaFin: '2026-10-22T14:30:00',
        puntaje: 92,
      },
      {
        id: 3,
        usuarioId: 20,
        usuarioNombre: 'Carlos Gómez',
        usuarioEmail: 'carlos@ucc.edu.co',
        modoPractica: 'DESAFIO',
        fechaFin: '2026-10-21T09:15:00',
        puntaje: 84,
      },
    ];

    const resumen = agruparResumenEstudiantes(muestra);
    expect(resumen).toHaveLength(2);
    expect(resumen[0].usuarioId).toBe(10);
    expect(resumen[0].numeroIntentos).toBe(2);
    expect(resumen[0].mejorPuntaje).toBe(92);
    expect(resumen[0].ultimoIntentoModo).toBe('SIMULACION');
    expect(resumen[0].ultimoIntentoPuntaje).toBe(92);
  });

  it('consolida errores por paso (1 a 6) desde pasos de entidad y ráfagas de detalleIA', () => {
    const intentosEst: IntentoBackendDTO[] = [
      {
        id: 101,
        usuarioId: 10,
        usuarioNombre: 'Ana Pérez',
        usuarioEmail: 'ana@ucc.edu.co',
        modoPractica: 'SIMULACION',
        pasos: [
          {
            id: 1,
            numeroPaso: 3,
            exitoso: false,
            observacionesError: 'Pinza demasiado abierta sobre el doblez',
          },
        ],
        detalleIA: JSON.stringify({
          pasos: [
            { numero: 5, correcto: false, confianza: 0.8, fuente: 'REGLAS', mensaje: 'Fallo 1' },
            { numero: 5, correcto: false, confianza: 0.8, fuente: 'REGLAS', mensaje: 'Fallo 1 cont.' },
            { numero: 5, correcto: true, confianza: 0.9, fuente: 'REGLAS', mensaje: 'OK' },
            { numero: 5, correcto: false, confianza: 0.8, fuente: 'REGLAS', mensaje: 'Fallo 2' },
          ],
        }),
      },
    ];

    const desglose = calcularErroresPorPaso(intentosEst);
    expect(desglose).toHaveLength(6);
    expect(desglose.find((p) => p.numeroPaso === 3)?.errores).toBe(1);
    expect(desglose.find((p) => p.numeroPaso === 5)?.errores).toBe(2);
    expect(desglose.find((p) => p.numeroPaso === 1)?.errores).toBe(0);
  });
});
