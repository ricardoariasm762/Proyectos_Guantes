import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simulación de ingreso: redirige al dashboard
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <h1>Bienvenido al Simulador de Guantes Quirúrgicos</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <input type="text" placeholder="Usuario" required />
        <input type="password" placeholder="Contraseña" required />
        <button className="btn" type="submit">Ingresar</button>
      </form>
      <p>Acceso para estudiantes de enfermería</p>
    </div>
  );
};

export default Login;