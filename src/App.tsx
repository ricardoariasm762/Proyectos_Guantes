import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tutorial3D from './pages/Tutorial3D';
import PracticaGuiada from './pages/PracticaGuiada';
import SimulacionInteractiva from './pages/SimulacionInteractiva';
import ModoDesafio from './pages/ModoDesafio';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <div className="main-layout">
          <Sidebar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tutorial3d" element={<Tutorial3D />} />
              <Route path="/practica-guiada" element={<PracticaGuiada />} />
              <Route path="/simulacion" element={<SimulacionInteractiva />} />
              <Route path="/desafio" element={<ModoDesafio />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;