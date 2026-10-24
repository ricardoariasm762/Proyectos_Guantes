// Contenedor principal de la aplicación con estructura de Layout responsivo
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuthStore } from '../../store/useAuthStore';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const location = useLocation();

  const esLogin = location.pathname === '/login' || location.pathname === '/';

  if (esLogin && !estaAutenticado) {
    return (
      <div className="login-wrapper-root">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Botón Flotante Estilo Hamburguesa para Ocultar/Mostrar el Sidebar */}
      {estaAutenticado && (
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={`floating-sidebar-toggle ${sidebarOpen ? 'is-open' : 'is-closed'}`}
          aria-label={sidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
          title={sidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
        >
          <span className="toggle-icon-wrap">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </span>
          <span className="toggle-label">{sidebarOpen ? 'Cerrar' : 'Menú'}</span>
        </button>
      )}

      <div className="app-body-container">
        {estaAutenticado && (
          <Sidebar
            isOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        )}
        <main className={`app-main-content ${!estaAutenticado ? 'full-width' : ''}`}>
          <div className={(location.pathname === '/practica-guiada' || location.pathname === '/tutorial3d') ? 'content-container-full' : 'content-container-max'}>
            <Outlet />
          </div>
          {location.pathname !== '/practica-guiada' && location.pathname !== '/tutorial3d' && <Footer />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
