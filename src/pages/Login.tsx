// Página de autenticación con validación reactiva mediante React Hook Form y Zod
// Conectada a la API REST de Spring Boot con autenticación JWT
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { loginBackend, registerBackend } from '../services/authService';
import {
  ShieldCheck,
  User,
  Mail,
  BookOpen,
  Users,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

const loginSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(60, 'El nombre no debe superar 60 caracteres'),
  email: z
    .string()
    .email('Ingresa un correo institucional válido')
    .min(5, 'El correo es obligatorio'),
  semestre: z
    .number({ invalid_type_error: 'Selecciona un semestre válido' })
    .min(1, 'El semestre mínimo es 1')
    .max(10, 'El semestre máximo es 10'),
  grupo: z
    .string()
    .min(1, 'Ingresa el grupo o sección')
    .max(20, 'Máximo 20 caracteres'),
  password: z
    .string()
    .min(4, 'La contraseña debe tener mínimo 4 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { estaAutenticado, login, loginConJwt } = useAuthStore();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nombre: '',
      email: '',
      semestre: 5,
      grupo: 'A',
      password: '',
    },
  });

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (estaAutenticado) {
      const destino = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(destino, { replace: true });
    }
  }, [estaAutenticado, navigate, location]);

  const onSubmit = async (data: LoginFormData) => {
    setErrorServidor(null);
    const emailNormalizado = data.email.trim().toLowerCase();

    try {
      // 1. Intentar iniciar sesión contra el backend Spring Boot con JWT
      const authResp = await loginBackend({
        email: emailNormalizado,
        password: data.password,
      });

      loginConJwt(authResp, {
        semestre: data.semestre,
        grupo: data.grupo,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const errorAxios = err as {
        response?: { status?: number; data?: { mensaje?: string; error?: string } };
        code?: string;
        message?: string;
      };

      const status = errorAxios.response?.status;

      // 2. Si el usuario no existe en la base de datos (401/404/400) y es estudiante, auto-registrarlo
      if (status === 401 || status === 404 || status === 400) {
        if (!emailNormalizado.includes('admin')) {
          try {
            const partesNombre = data.nombre.trim().split(' ');
            const primerNombre = partesNombre[0] || 'Estudiante';
            const apellido = partesNombre.slice(1).join(' ') || 'UCC';

            const regResp = await registerBackend({
              nombre: primerNombre,
              apellido: apellido,
              email: emailNormalizado,
              password: data.password,
              rol: 'ESTUDIANTE',
            });

            loginConJwt(regResp, {
              semestre: data.semestre,
              grupo: data.grupo,
            });

            navigate('/dashboard', { replace: true });
            return;
          } catch (regErr: unknown) {
            const regErrorAxios = regErr as {
              response?: { data?: { mensaje?: string; error?: string } };
            };
            const detalle =
              regErrorAxios.response?.data?.mensaje ||
              regErrorAxios.response?.data?.error ||
              'Credenciales inválidas en el servidor central.';
            setErrorServidor(detalle);
            return;
          }
        } else {
          setErrorServidor('Credenciales de administrador incorrectas. Verifica usuario y contraseña.');
          return;
        }
      }

      // 3. Fallback de resiliencia: si el backend no está disponible (ej. offline o desarrollo sin Spring Boot activo)
      console.warn('Backend Spring Boot no disponible en :8080. Iniciando en modo local para no interrumpir práctica:', errorAxios.message);

      const esAdmin = emailNormalizado.includes('admin');
      login({
        nombre: data.nombre,
        email: emailNormalizado,
        semestre: data.semestre,
        grupo: data.grupo,
        rol: esAdmin ? 'ADMIN' : 'ESTUDIANTE',
      });

      navigate('/dashboard', { replace: true });
    }
  };

  const rellenarEstudiantePrueba = () => {
    setValue('nombre', 'María Camila Narváez');
    setValue('email', 'estudiante@ucc.edu.co');
    setValue('semestre', 5);
    setValue('grupo', 'B-Pasto');
    setValue('password', 'estudiante123');
    setErrorServidor(null);
  };

  const rellenarAdminPrueba = () => {
    setValue('nombre', 'Administrador Sistema');
    setValue('email', 'admin@ucc.edu.co');
    setValue('semestre', 10);
    setValue('grupo', 'FAC-SALUD');
    setValue('password', 'admin123456');
    setErrorServidor(null);
  };

  return (
    <div className="login-container">
      <div className="login-backdrop-decorations">
        <div className="circle-decor circle-1" />
        <div className="circle-decor circle-2" />
      </div>

      <div className="login-card-wrapper">
        <div className="login-header-section">
          <div className="brand-badge">
            <span className="ucc-pill">UCC Campus Pasto</span>
            <span className="research-pill">Proyecto de Grado - Enfermería</span>
          </div>

          <div className="brand-icon-box">
            <ShieldCheck className="brand-main-icon" size={38} />
          </div>

          <h1 className="login-title">Simulador de Técnica Estéril</h1>
          <p className="login-subtitle">
            Herramienta interactiva para el fortalecimiento de competencias en postura de guantes quirúrgicos
          </p>
        </div>

        {errorServidor && (
          <div className="login-alert-box login-alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorServidor}</span>
          </div>
        )}

        <form className="login-form-modern" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="nombre">
              <User size={16} /> Nombre Completo del Usuario
            </label>
            <input
              id="nombre"
              type="text"
              placeholder="Ej. Juan Pérez Delgado"
              className={errors.nombre ? 'input-error' : ''}
              {...register('nombre')}
            />
            {errors.nombre && <span className="field-error-msg">{errors.nombre.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} /> Correo Electrónico Institucional
            </label>
            <input
              id="email"
              type="email"
              placeholder="Ej. maria.narvaez@campusucc.edu.co"
              className={errors.email ? 'input-error' : ''}
              {...register('email')}
            />
            {errors.email && <span className="field-error-msg">{errors.email.message}</span>}
          </div>

          <div className="form-row-two-col">
            <div className="form-group">
              <label htmlFor="semestre">
                <BookOpen size={16} /> Semestre
              </label>
              <select
                id="semestre"
                className={errors.semestre ? 'input-error' : ''}
                {...register('semestre', { valueAsNumber: true })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num}° Semestre
                  </option>
                ))}
              </select>
              {errors.semestre && <span className="field-error-msg">{errors.semestre.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="grupo">
                <Users size={16} /> Grupo / Sección
              </label>
              <input
                id="grupo"
                type="text"
                placeholder="Ej. A o B-Pasto"
                className={errors.grupo ? 'input-error' : ''}
                {...register('grupo')}
              />
              {errors.grupo && <span className="field-error-msg">{errors.grupo.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} /> Contraseña de Acceso
            </label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 4 caracteres (backend JWT)"
              className={errors.password ? 'input-error' : ''}
              {...register('password')}
            />
            {errors.password && <span className="field-error-msg">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
            <CheckCircle2 size={18} />
            <span>{isSubmitting ? 'Autenticando con JWT...' : 'Ingresar al Simulador'}</span>
          </button>

          <div className="quick-fill-group">
            <button
              type="button"
              className="btn-quick-fill"
              onClick={rellenarEstudiantePrueba}
              title="Autocompletar estudiante de prueba"
            >
              <Sparkles size={14} />
              <span>Estudiante Demo</span>
            </button>

            <button
              type="button"
              className="btn-quick-fill-admin"
              onClick={rellenarAdminPrueba}
              title="Autocompletar credenciales de Administrador"
            >
              <ShieldAlert size={14} />
              <span>Admin Demo</span>
            </button>
          </div>
        </form>

        <div className="login-footer-info">
          <p>Facultad de Ciencias de la Salud • Programa de Enfermería</p>
          <small>Universidad Cooperativa de Colombia • Pasto, Nariño</small>
        </div>
      </div>
    </div>
  );
};

export default Login;