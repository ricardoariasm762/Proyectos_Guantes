// Barra de progreso con porcentaje animado y colores del sistema de diseño salud
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';

interface ProgressBarProps {
  valor: number; // 0 a 100
  etiqueta?: string;
  mostrarPorcentaje?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  valor,
  etiqueta,
  mostrarPorcentaje = true,
  color = 'primary',
}) => {
  const porcentaje = Math.min(100, Math.max(0, valor));

  return (
    <div className="progress-bar-container">
      {(etiqueta || mostrarPorcentaje) && (
        <div className="progress-bar-header">
          {etiqueta && <span className="progress-bar-label">{etiqueta}</span>}
          {mostrarPorcentaje && <span className="progress-bar-pct">{porcentaje}%</span>}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill progress-fill-${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
