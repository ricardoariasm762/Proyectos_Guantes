const Tutorial3D: React.FC = () => {
  return (
    <div className="page">
      <h1>Tutorial Interactivo 3D</h1>
      <div className="visor-placeholder">
        <p>[Aquí se cargará el modelo 3D con Three.js]</p>
        <p>Rotación, zoom y hotspots informativos</p>
      </div>
      <div className="controls-placeholder">
        [Controles de reproducción: play, pausa, velocidad]
      </div>
    </div>
  );
};

export default Tutorial3D;