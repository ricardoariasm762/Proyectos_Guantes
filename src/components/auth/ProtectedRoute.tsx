// Guardia de rutas protegidas
// Redirige al login si no hay sesión activa en useAuthStore
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const location = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
