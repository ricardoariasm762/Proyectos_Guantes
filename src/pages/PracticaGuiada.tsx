interface Paso {
  id: number;
  descripcion: string;
}

const pasos: Paso[] = [
  { id: 1, descripcion: 'Realizar lavado quirúrgico de manos' },
  { id: 2, descripcion: 'Secar con compresa estéril' },
  { id: 3, descripcion: 'Tomar guante derecho por el borde doblado' },
  { id: 4, descripcion: 'Introducir mano derecha sin tocar exterior' },
  { id: 5, descripcion: 'Repetir con mano izquierda' },
  { id: 6, descripcion: 'Ajustar puños manteniendo esterilidad' },
];

const PracticaGuiada: React.FC = () => {
  return (
    <div className="page">
      <h1>Práctica Guiada Paso a Paso</h1>
      <ol className="pasos-lista">
        {pasos.map((paso) => (
          <li key={paso.id} className={paso.id === 1 ? 'paso-activo' : ''}>
            {paso.descripcion}
            {paso.id === 1 && <span className="badge">Actual</span>}
          </li>
        ))}
      </ol>
      <button className="btn" disabled>Paso Completado</button>
    </div>
  );
};

export default PracticaGuiada;