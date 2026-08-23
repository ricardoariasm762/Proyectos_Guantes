import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h3>Menú</h3>
      <ul>
        <li><Link to="/dashboard">📊 Dashboard</Link></li>
        <li><Link to="/tutorial3d">🧊 Tutorial 3D</Link></li>
        <li><Link to="/practica-guiada">📋 Paso a Paso</Link></li>
        <li><Link to="/simulacion">🖐️ Simulación</Link></li>
        <li><Link to="/desafio">🏆 Desafío</Link></li>
      </ul>
    </aside>
  );
};

export default Sidebar;