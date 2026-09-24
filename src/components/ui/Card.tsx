// Componente Card con estética médica y opciones de cabecera y pie
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  titulo?: string;
  subtitulo?: string;
  icono?: React.ReactNode;
  acciones?: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  titulo,
  subtitulo,
  icono,
  acciones,
  className = '',
  hoverEffect = false,
}) => {
  return (
    <div className={`card-container ${hoverEffect ? 'card-hover-effect' : ''} ${className}`}>
      {(titulo || icono || acciones) && (
        <div className="card-header-bar">
          <div className="card-header-left">
            {icono && <div className="card-header-icon">{icono}</div>}
            <div>
              {titulo && <h3 className="card-title-text">{titulo}</h3>}
              {subtitulo && <p className="card-subtitle-text">{subtitulo}</p>}
            </div>
          </div>
          {acciones && <div className="card-header-actions">{acciones}</div>}
        </div>
      )}
      <div className="card-body-content">{children}</div>
    </div>
  );
};

export default Card;
