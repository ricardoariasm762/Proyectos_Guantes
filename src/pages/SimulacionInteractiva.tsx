const SimulacionInteractiva: React.FC = () => {
  return (
    <div className="page">
      <h1>Simulación Interactiva</h1>
      <div className="simulacion-area">
        <div className="zona-estéril">Zona Estéril</div>
        <div className="zona-contaminada">Zona Contaminada</div>
        <div className="mano-placeholder">🖐️ Mano del estudiante</div>
        <div className="guante-placeholder">🧤 Guante quirúrgico</div>
      </div>
      <div className="alert-placeholder">
        [Alertas visuales y sonoras]
      </div>
    </div>
  );
};

export default SimulacionInteractiva;