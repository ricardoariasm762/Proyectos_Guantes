// Guardia de rutas protegidas con control opcional de uno o varios roles
// Redirige al login si no hay sesión activa y a la vista principal si el rol no está autorizado
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { Rol } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  rolRequerido?: Rol | ReadonlyArray<Rol>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, rolRequerido }) => {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const token = useAuthStore((state) => state.usuario?.token);
  const rol = useAuthStore((state) => state.usuario?.rol);
  const location = useLocation();

  if (!estaAutenticado || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (rolRequerido) {
    const rolesPermitidos: ReadonlyArray<Rol> = Array.isArray(rolRequerido)
      ? rolRequerido
      : [rolRequerido as Rol];

    if (!rol || !rolesPermitidos.includes(rol)) {
      const rutaInicio = rol === 'DOCENTE' ? '/docente' : '/dashboard';
      return <Navigate to={rutaInicio} replace />;
    }
  }

  return <>{children}</>;
};

export const RutaProtegida = ProtectedRoute;

export default ProtectedRoute;
