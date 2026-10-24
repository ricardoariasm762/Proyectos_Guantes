// Guardia de rutas protegidas con control opcional de rol
// Redirige al login si no hay sesión activa y al dashboard si el rol no coincide
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { Usuario } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  rolRequerido?: Usuario['rol'];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, rolRequerido }) => {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const rol = useAuthStore((state) => state.usuario?.rol);
  const location = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (rolRequerido && rol !== rolRequerido) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
