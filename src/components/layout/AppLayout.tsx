// Contenedor principal de la aplicación con estructura de Layout responsivo
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
      <div className="app-body-container">
        {estaAutenticado && (
          <Sidebar
            isOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        )}
        <main className={`app-main-content ${!estaAutenticado ? 'full-width' : ''}`}>
          <div className="content-container-max">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
