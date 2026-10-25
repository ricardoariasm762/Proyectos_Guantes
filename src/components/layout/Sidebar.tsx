// Menú lateral de navegación con enlaces a todos los módulos y diseño responsivo
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  HandMetal,
  Camera,
  Trophy,
  User,
  Sparkles,
  Database,
  Bot,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const usuario = useAuthStore((s) => s.usuario);

  const baseNavItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/practica-guiada',
      label: 'Práctica Guiada',
      icon: ClipboardCheck,
      badge: 'Secuencia',
    },
    {
      to: '/simulacion-camara',
      label: 'Simulación Cámara IA',
      icon: Camera,
      badge: 'MediaPipe',
    },
    {
      to: '/simulacion',
      label: 'Simulación Drag & Drop',
      icon: HandMetal,
      badge: '2D',
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

  const adminNavItems = [
    {
      to: '/admin/usuarios',
      label: 'Gestión de Usuarios',
      icon: Users,
      badge: 'Admin',
    },
    {
      to: '/recolector',
      label: 'Recolector de datos',
      icon: Database,
      badge: 'Admin',
    },
    {
      to: '/admin/modelos-ia',
      label: 'Modelos IA',
      icon: Bot,
      badge: 'Admin',
    },
  ];

  const navItems = usuario?.rol === 'ADMIN' ? [...baseNavItems, ...adminNavItems] : baseNavItems;

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
