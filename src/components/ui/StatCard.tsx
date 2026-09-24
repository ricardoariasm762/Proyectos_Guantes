// Tarjeta de estadísticas para dashboards y métricas de desempeño
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icono: LucideIcon;
  colorIcono?: 'primary' | 'secondary' | 'success' | 'warning' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  titulo,
  valor,
  subtitulo,
  icono: Icon,
  colorIcono = 'primary',
  onClick,
}) => {
  return (
    <div
      className={`stat-card-modern ${onClick ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-content">
        <div className="stat-card-header">
          <span className="stat-card-title">{titulo}</span>
          <div className={`stat-icon-wrapper stat-icon-${colorIcono}`}>
            <Icon size={22} />
          </div>
        </div>
        <div className="stat-card-value">{valor}</div>
        {subtitulo && <div className="stat-card-subtitle">{subtitulo}</div>}
      </div>
    </div>
  );
};

export default StatCard;
