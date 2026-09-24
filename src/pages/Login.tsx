// Página de autenticación con validación reactiva mediante React Hook Form y Zod
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldCheck, User, BookOpen, Users, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(60, 'El nombre no debe superar 60 caracteres'),
  semestre: z
    .number({ invalid_type_error: 'Selecciona un semestre válido' })
    .min(1, 'El semestre mínimo es 1')
    .max(10, 'El semestre máximo es 10'),
  grupo: z
    .string()
    .min(1, 'Ingresa el grupo o sección')
    .max(10, 'Máximo 10 caracteres'),
  password: z
    .string()
    .min(4, 'La contraseña debe tener mínimo 4 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { estaAutenticado, login } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nombre: '',
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

  const onSubmit = (data: LoginFormData) => {
    login({
      nombre: data.nombre,
      semestre: data.semestre,
      grupo: data.grupo,
    });
    navigate('/dashboard', { replace: true });
  };

  const rellenarEstudiantePrueba = () => {
    setValue('nombre', 'María Camila Narváez');
    setValue('semestre', 5);
    setValue('grupo', 'B-Pasto');
    setValue('password', '1234');
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

        <form className="login-form-modern" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="nombre">
              <User size={16} /> Nombre Completo del Estudiante
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
                placeholder="Ej. A o B1"
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
              placeholder="Mínimo 4 caracteres (simulada)"
              className={errors.password ? 'input-error' : ''}
              {...register('password')}
            />
            {errors.password && <span className="field-error-msg">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
            <CheckCircle2 size={18} />
            <span>Ingresar al Simulador</span>
          </button>

          <button
            type="button"
            className="btn-quick-fill"
            onClick={rellenarEstudiantePrueba}
            title="Autocompletar datos de prueba"
          >
            <Sparkles size={15} />
            <span>Rellenar con estudiante de demostración</span>
          </button>
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