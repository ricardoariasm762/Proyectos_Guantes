// Componente visual de telemetría para mostrar el nivel de confianza y la fuente de decisión híbrida
// Proyecto: Simulador de Técnica Estéril - Universidad Cooperativa de Colombia, Campus Pasto

import React from 'react';
import { Bot, Compass, CheckCircle2, AlertCircle } from 'lucide-react';

export interface IndicadorConfianzaProps {
  confianza: number; // Valor normalizado [0.0 - 1.0]
  fuente?: 'ia' | 'reglas' | 'consenso';
  isIALoading?: boolean;
  isIAReady?: boolean;
  mostrarDetalle?: boolean;
}

/**
 * Indicador visual que ilustra el porcentaje de certeza de la postura evaluada
 * y la fuente metodológica de la decisión (IA neuronal, Reglas clínicas o Consenso).
 */
export const IndicadorConfianza: React.FC<IndicadorConfianzaProps> = ({
  confianza,
  fuente = 'reglas',
  isIALoading = false,
  isIAReady = true,
  mostrarDetalle = true,
}) => {
  const porcentaje = Math.max(0, Math.min(100, Math.round(confianza * 100)));

  // Clase de color según rango de confianza
  // Verde (>80%), Amarillo (60-80%), Rojo (<60%)
  const nivelConfianzaClass =
    porcentaje >= 80 ? 'confianza-alta' : porcentaje >= 60 ? 'confianza-media' : 'confianza-baja';

  // Configuración de la fuente de decisión
  const infoFuente = {
    ia: {
      nombre: 'Modelo Red Neuronal (TF.js)',
      etiqueta: 'IA Neural',
      icono: <Bot size={14} className="flex-shrink-0" />,
      claseFuente: 'fuente-ia',
    },
    reglas: {
      nombre: 'Sistema Experto Biomecánico',
      etiqueta: 'Reglas Clínicas',
      icono: <Compass size={14} className="flex-shrink-0" />,
      claseFuente: 'fuente-reglas',
    },
    consenso: {
      nombre: 'Consenso Híbrido (IA + Reglas)',
      etiqueta: 'Consenso Híbrido',
      icono: <CheckCircle2 size={14} className="flex-shrink-0" />,
      claseFuente: 'fuente-consenso',
    },
  }[fuente] || {
    nombre: 'Evaluación Biomecánica',
    etiqueta: 'Reglas',
    icono: <Compass size={14} className="flex-shrink-0" />,
    claseFuente: 'fuente-reglas',
  };

  return (
    <div className="indicador-confianza-card">
      {/* CABECERA: FUENTE Y PORCENTAJE */}
      <div className="indicador-confianza-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className={`indicador-confianza-badge ${infoFuente.claseFuente}`}
            title={infoFuente.nombre}
          >
            {infoFuente.icono}
            {infoFuente.etiqueta}
          </span>

          {isIALoading && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Cargando TF.js...)</span>
          )}
          {!isIAReady && !isIALoading && (
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="El simulador opera con el sistema experto de reglas geométricas"
            >
              <AlertCircle size={11} style={{ color: 'var(--color-warning)' }} />
              (Modo reglas)
            </span>
          )}
        </div>

        <div className="indicador-confianza-val-group">
          <span className={`indicador-confianza-val ${nivelConfianzaClass}`}>
            {porcentaje}%
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>confianza</span>
        </div>
      </div>

      {/* BARRA DE PROGRESO DE CONFIANZA */}
      <div className={`indicador-confianza-track ${nivelConfianzaClass}`}>
        <div
          className={`indicador-confianza-fill ${nivelConfianzaClass}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {/* EXPLICACIÓN BREVE */}
      {mostrarDetalle && (
        <div className="indicador-confianza-footer">
          <span>
            {porcentaje >= 80
              ? 'Alta fidelidad diagnóstica'
              : porcentaje >= 60
              ? 'Certeza moderada'
              : 'Postura ambigua o inestable'}
          </span>
          <span>Umbral avance: ≥ 80%</span>
        </div>
      )}
    </div>
  );
};

export default IndicadorConfianza;
