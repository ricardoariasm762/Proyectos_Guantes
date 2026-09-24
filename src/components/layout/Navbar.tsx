// Barra de navegación superior con información del estudiante, indicador de estado y logout
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { usuario, estaAutenticado, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        {estaAutenticado && (
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Abrir o cerrar menú lateral"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        <div className="navbar-brand-group" onClick={() => estaAutenticado && navigate('/dashboard')}>
          <div className="brand-logo-icon">🧤</div>
          <div className="brand-text-container">
            <span className="brand-app-name">Técnica Estéril</span>
            <span className="brand-tagline">UCC Pasto • Enfermería</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {estaAutenticado && usuario ? (
          <>
            <div className="user-profile-badge" onClick={() => navigate('/perfil')} title="Ver Perfil">
              <div className="avatar-circle">
                <User size={16} />
              </div>
              <div className="user-details-mini">
                <span className="user-name-short">{usuario.nombre}</span>
                <span className="user-sem-group">
                  Semestre {usuario.semestre}° • Gpo {usuario.grupo}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="navbar-logout-btn"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
              <span className="logout-text">Salir</span>
            </button>
          </>
        ) : (
          <NavLink to="/login" className="navbar-login-link">
            Iniciar Sesión
          </NavLink>
        )}
      </div>
    </header>
  );
};

export default Navbar;
