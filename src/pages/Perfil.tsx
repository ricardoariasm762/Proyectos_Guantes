const Perfil: React.FC = () => {
  return (
    <div className="page">
      <h1>Perfil del Estudiante</h1>
      <div className="stats-grid">
        <div className="stat-card">Nombre: Estudiante</div>
        <div className="stat-card">Semestre: 5°</div>
        <div className="stat-card">Grupo: B</div>
        <div className="stat-card">Progreso global: 75%</div>
      </div>
      <div className="chart-placeholder">
        [Historial de intentos]
      </div>
    </div>
  );
};

export default Perfil;