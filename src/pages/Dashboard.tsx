const Dashboard: React.FC = () => {
  return (
    <div className="page">
      <h1>Dashboard de Progreso</h1>
      <div className="stats-grid">
        <div className="stat-card">Intentos: 12</div>
        <div className="stat-card">Precisión: 85%</div>
        <div className="stat-card">Tiempo promedio: 3:20 min</div>
        <div className="stat-card">Racha: 5 sin errores</div>
      </div>
      <div className="chart-placeholder">
        [Gráfico de barras simulado]
      </div>
    </div>
  );
};

export default Dashboard;