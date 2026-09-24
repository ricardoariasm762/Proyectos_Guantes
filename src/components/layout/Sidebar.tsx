// Menú lateral de navegación con enlaces a todos los módulos y diseño responsivo
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  ClipboardCheck,
  HandMetal,
  Trophy,
  User,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/tutorial3d',
      label: 'Tutorial 3D',
      icon: Box,
      badge: '3D',
    },
    {
      to: '/practica-guiada',
      label: 'Práctica Guiada',
      icon: ClipboardCheck,
      badge: null,
    },
    {
      to: '/simulacion',
      label: 'Simulación Drag & Drop',
      icon: HandMetal,
      badge: 'Interactivo',
    },
    {
      to: '/desafio',
      label: 'Modo Desafío',
      icon: Trophy,
      badge: 'Timer',
    },
    {
      to: '/perfil',
      label: 'Mi Perfil',
      icon: User,
      badge: null,
    },
  ];

  return (
    <>
      {/* Backdrop para cerrar en móvil */}
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-section-title">MÓDULOS DE APRENDIZAJE</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <div className="sidebar-link-content">
                  <Icon size={20} className="sidebar-link-icon" />
                  <span className="sidebar-link-text">{item.label}</span>
                </div>
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-info-card">
          <div className="info-card-header">
            <Sparkles size={16} className="text-secondary" />
            <span>Objetivo Clínico</span>
          </div>
          <p className="info-card-body">
            Dominar la técnica aséptica abierta de postura de guantes previene infecciones en el sitio quirúrgico (ISQ).
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
