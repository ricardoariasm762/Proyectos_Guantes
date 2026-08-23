import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <header className="navbar">
      <div className="logo">🧤 Simulador de Técnica Estéril</div>
      <nav className="nav-links">
        <Link to="/dashboard">Inicio</Link>
        <Link to="/tutorial3d">Tutorial 3D</Link>
        <Link to="/practica-guiada">Práctica Guiada</Link>
        <Link to="/simulacion">Simulación</Link>
        <Link to="/desafio">Modo Desafío</Link>
      </nav>
    </header>
  );
};

export default Navbar;