// Página de autenticación con validación reactiva mediante React Hook Form y Zod
// Conectada a la API REST de Spring Boot con autenticación JWT (/api/auth/login)
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { loginBackend } from '../services/authService';
import {
  ShieldCheck,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .email('Ingresa un correo institucional válido')
    .min(5, 'El correo es obligatorio'),
  password: z
    .string()
    .min(4, 'La contraseña debe tener mínimo 4 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { estaAutenticado, loginConJwt } = useAuthStore();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
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
      // 1. Iniciar sesión exclusivamente contra el backend Spring Boot con JWT (/api/auth/login)
      const authResp = await loginBackend({
        email: emailNormalizado,
        password: data.password,
      });

      // 2. Guardar token en localStorage y usuario con rol verificado en useAuthStore
      loginConJwt(authResp);

      // 3. Redirigir al dashboard
      const destino = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(destino, { replace: true });
    } catch (err: unknown) {
      const errorAxios = err as {
        response?: { status?: number; data?: { mensaje?: string; error?: string; message?: string } };
        message?: string;
      };

      const status = errorAxios.response?.status;

      if (status === 401 || status === 403 || status === 400) {
        const mensajeBackend =
          errorAxios.response?.data?.mensaje ||
          errorAxios.response?.data?.message ||
          'Credenciales incorrectas. Verifica tu correo y contraseña.';
        setErrorServidor(mensajeBackend);
        return;
      }

      setErrorServidor(
        errorAxios.response?.data?.mensaje ||
        errorAxios.response?.data?.message ||
        'No se pudo conectar con el servidor central. Verifica tu conexión a la red.'
      );
    }
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
            <label htmlFor="email">
              <Mail size={16} /> Correo Electrónico Institucional
            </label>
            <input
              id="email"
              type="email"
              placeholder="Ej. usuario@campusucc.edu.co"
              className={errors.email ? 'input-error' : ''}
              {...register('email')}
            />
            {errors.email && <span className="field-error-msg">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} /> Contraseña de Acceso
            </label>
            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              className={errors.password ? 'input-error' : ''}
              {...register('password')}
            />
            {errors.password && <span className="field-error-msg">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
            <CheckCircle2 size={18} />
            <span>{isSubmitting ? 'Autenticando...' : 'Ingresar al Simulador'}</span>
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