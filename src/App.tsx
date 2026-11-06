// Configuración central de rutas y protección de navegación
// Universidad Cooperativa de Colombia - Campus Pasto

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute, RutaProtegida } from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import { useVersionModelo } from './hooks/useVersionModelo';
import { useAuthStore } from './store/useAuthStore';
import { useProgresoStore } from './store/useProgresoStore';

// Carga diferida: TF.js, MediaPipe, GSAP, recharts y dnd-kit solo se descargan
// cuando el estudiante entra al módulo que los necesita.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PracticaGuiada = lazy(() => import('./pages/PracticaGuiada'));
const SimulacionInteractiva = lazy(() => import('./pages/SimulacionInteractiva'));
const SimulacionCamaraPage = lazy(() => import('./pages/SimulacionCamaraPage'));
const ModoDesafio = lazy(() => import('./pages/ModoDesafio'));
const Perfil = lazy(() => import('./pages/Perfil'));
const RecolectorDatos = lazy(() => import('./pages/RecolectorDatos'));
const AdminModelosIA = lazy(() => import('./pages/AdminModelosIA'));
const AdminUsuarios = lazy(() => import('./pages/AdminUsuarios'));
const PanelDocente = lazy(() => import('./pages/PanelDocente'));

function SincronizadorVersionModelo() {
  // Consulta y almacena la versión activa del modelo IA en localStorage al iniciar la app
  useVersionModelo();
  return null;
}

function SincronizadorProgreso() {
  // Cada vez que cambia la cuenta activa se descarta la caché ajena y se carga
  // el historial del usuario desde el backend (mismo historial en PC y celular).
  const usuarioId = useAuthStore((s) => s.usuario?.id ?? null);
  useEffect(() => {
    if (usuarioId == null) {
      useProgresoStore.getState().limpiarCache();
      return;
    }
    void useProgresoStore.getState().sincronizarConServidor(usuarioId);
    const alVolverEnLinea = () => void useProgresoStore.getState().sincronizarConServidor(usuarioId);
    window.addEventListener('online', alVolverEnLinea);
    return () => window.removeEventListener('online', alVolverEnLinea);
  }, [usuarioId]);
  return null;
}

function CargandoModulo() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading-spinner" aria-hidden="true" />
      <span>Cargando módulo…</span>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SincronizadorVersionModelo />
      <SincronizadorProgreso />
      <Suspense fallback={<CargandoModulo />}>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Ruta pública de acceso */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Rutas protegidas para estudiantes autenticados */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tutorial3d" element={<Navigate to="/practica-guiada" replace />} />
            <Route path="/practica-guiada" element={<ProtectedRoute><PracticaGuiada /></ProtectedRoute>} />
            <Route path="/simulacion" element={<ProtectedRoute><SimulacionInteractiva /></ProtectedRoute>} />
            <Route path="/simulacion-camara" element={<ProtectedRoute><SimulacionCamaraPage /></ProtectedRoute>} />
            <Route path="/desafio" element={<ProtectedRoute><ModoDesafio /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />

            {/* Ruta protegida de seguimiento académico para DOCENTE y ADMIN */}
            <Route
              path="/docente"
              element={
                <ProtectedRoute rolRequerido={['DOCENTE', 'ADMIN']}>
                  <PanelDocente />
                </ProtectedRoute>
              }
            />

            {/* Rutas con acceso exclusivo para usuarios con rol ADMIN */}
            <Route
              path="/admin/usuarios"
              element={<RutaProtegida rolRequerido="ADMIN"><AdminUsuarios /></RutaProtegida>}
            />
            <Route
              path="/recolector"
              element={<ProtectedRoute rolRequerido="ADMIN"><RecolectorDatos /></ProtectedRoute>}
            />
            <Route
              path="/admin/modelos-ia"
              element={<ProtectedRoute rolRequerido="ADMIN"><AdminModelosIA /></ProtectedRoute>}
            />

            {/* Redirección por defecto para rutas no encontradas */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;