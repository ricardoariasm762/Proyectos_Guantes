// Modal de creación y edición de usuarios para el rol ADMIN
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { crearUsuario, actualizarUsuario } from '../../services/usuarioService';
import type { Usuario, UsuarioRequest, Rol } from '../../types';
import { User, Mail, Lock, BookOpen, Users, Shield, AlertCircle, Save } from 'lucide-react';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioParaEditar: Usuario | null;
}

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuarioParaEditar,
}) => {
  const esEdicion = Boolean(usuarioParaEditar);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [semestre, setSemestre] = useState<number>(5);
  const [grupo, setGrupo] = useState('A');
  const [rol, setRol] = useState<Rol>('ESTUDIANTE');

  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuarioParaEditar) {
      setNombre(usuarioParaEditar.nombre || '');
      setEmail(usuarioParaEditar.email || '');
      setPassword('');
      setSemestre(usuarioParaEditar.semestre ?? 5);
      setGrupo(usuarioParaEditar.grupo || 'A');
      setRol(usuarioParaEditar.rol || 'ESTUDIANTE');
    } else {
      setNombre('');
      setEmail('');
      setPassword('');
      setSemestre(5);
      setGrupo('A');
      setRol('ESTUDIANTE');
    }
    setErrorValidacion(null);
    setErrorServidor(null);
  }, [usuarioParaEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);
    setErrorServidor(null);

    // 1. Validaciones del lado del cliente
    if (!nombre.trim() || nombre.trim().length < 2) {
      setErrorValidacion('El nombre completo debe tener al menos 2 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorValidacion('Ingresa un correo electrónico válido (ej. usuario@ucc.edu.co).');
      return;
    }

    if (!esEdicion) {
      if (!password || password.length < 6) {
        setErrorValidacion('La contraseña es obligatoria y debe tener al menos 6 caracteres.');
        return;
      }
    } else {
      if (password && password.length < 6) {
        setErrorValidacion('Si deseas cambiar la contraseña, debe tener al menos 6 caracteres.');
        return;
      }
    }

    // 2. Construcción del payload
    const partesNombre = nombre.trim().split(/\s+/);
    const apellidoExtraido = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : '';

    const payload: UsuarioRequest & { apellido?: string } = {
      nombre: nombre.trim(),
      apellido: apellidoExtraido,
      email: email.trim().toLowerCase(),
      semestre: Number(semestre),
      grupo: grupo.trim().toUpperCase() || 'A',
      rol: rol,
    };

    if (password && password.trim().length >= 6) {
      payload.password = password.trim();
    }

    setGuardando(true);
    try {
      if (esEdicion && usuarioParaEditar) {
        await actualizarUsuario(usuarioParaEditar.id, payload);
      } else {
        await crearUsuario(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorAxios = err as {
        response?: { data?: { mensaje?: string; message?: string; error?: string } };
      };
      const detalle =
        errorAxios.response?.data?.mensaje ||
        errorAxios.response?.data?.message ||
        errorAxios.response?.data?.error ||
        'Error al procesar la solicitud en el servidor. Verifica que el correo no esté duplicado.';
      setErrorServidor(detalle);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {errorValidacion && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--color-contaminated-bg)',
              color: 'var(--color-contaminated-dark)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              border: '1px solid var(--color-contaminated-border)',
            }}
            role="alert"
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorValidacion}</span>
          </div>
        )}

        {errorServidor && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--color-warning-bg)',
              color: '#92400e',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              border: '1px solid var(--color-warning-border)',
            }}
            role="alert"
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorServidor}</span>
          </div>
        )}

        {/* Nombre */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            <User size={15} style={{ color: 'var(--color-primary)' }} />
            <span>Nombre Completo *</span>
          </label>
          <input
            type="text"
            placeholder="Ej. Carlos Andrés Gómez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            <Mail size={15} style={{ color: 'var(--color-primary)' }} />
            <span>Correo Electrónico *</span>
          </label>
          <input
            type="email"
            placeholder="Ej. carlos.gomez@campusucc.edu.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Contraseña */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            <Lock size={15} style={{ color: 'var(--color-primary)' }} />
            <span>
              Contraseña {esEdicion ? '(Opcional: dejar en blanco para conservar actual)' : '* (Mínimo 6 caracteres)'}
            </span>
          </label>
          <input
            type="password"
            placeholder={esEdicion ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Semestre y Grupo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              <BookOpen size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Semestre</span>
            </label>
            <select
              value={semestre}
              onChange={(e) => setSemestre(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium, #cbd5e1)',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                <option key={s} value={s}>
                  {s}° Semestre
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              <Users size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Grupo / Sección</span>
            </label>
            <input
              type="text"
              placeholder="Ej. A, B-Pasto"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium, #cbd5e1)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Rol */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            <Shield size={15} style={{ color: 'var(--color-primary)' }} />
            <span>Rol en el Sistema *</span>
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              fontSize: '0.9rem',
              backgroundColor: '#ffffff',
              outline: 'none',
            }}
          >
            <option value="ESTUDIANTE">ESTUDIANTE (Acceso a simulaciones y prácticas)</option>
            <option value="DOCENTE">DOCENTE (Monitoreo académico y métricas)</option>
            <option value="ADMIN">ADMIN (Control total de usuarios y modelos IA)</option>
          </select>
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: '#ffffff',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: guardando ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: guardando ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
              opacity: guardando ? 0.7 : 1,
            }}
          >
            <Save size={16} />
            <span>{guardando ? 'Guardando...' : esEdicion ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UsuarioFormModal;
