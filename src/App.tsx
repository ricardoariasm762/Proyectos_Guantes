// Configuración central de rutas y protección de navegación
// Universidad Cooperativa de Colombia - Campus Pasto

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tutorial3D from './pages/Tutorial3D';
import PracticaGuiada from './pages/PracticaGuiada';
import SimulacionInteractiva from './pages/SimulacionInteractiva';
import ModoDesafio from './pages/ModoDesafio';
import Perfil from './pages/Perfil';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Ruta pública de acceso */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Rutas protegidas para estudiantes autenticados */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutorial3d"
            element={
              <ProtectedRoute>
                <Tutorial3D />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practica-guiada"
            element={
              <ProtectedRoute>
                <PracticaGuiada />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulacion"
            element={
              <ProtectedRoute>
                <SimulacionInteractiva />
              </ProtectedRoute>
            }
          />
          <Route
            path="/desafio"
            element={
              <ProtectedRoute>
                <ModoDesafio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />

          {/* Redirección por defecto para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;