// Pie de página institucional del simulador
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>
          <strong>Simulador de Técnica Estéril</strong> • Proyecto de Investigación en Enfermería
        </p>
        <p className="footer-credits">
          Universidad Cooperativa de Colombia • Campus Pasto • © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
