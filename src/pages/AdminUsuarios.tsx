// Vista de Gestión de Usuarios exclusiva para el rol ADMIN
// Permite listar, crear, editar y eliminar usuarios con roles ESTUDIANTE, DOCENTE y ADMIN
// Universidad Cooperativa de Colombia - Campus Pasto

import React, { useEffect, useState, useMemo } from 'react';
import { listarUsuarios, eliminarUsuario } from '../services/usuarioService';
import type { Usuario, Rol } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import UsuarioFormModal from '../components/admin/UsuarioFormModal';
import ConfirmModal from '../components/admin/ConfirmModal';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  GraduationCap,
  Award,
} from 'lucide-react';

export const AdminUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');

  // Notificaciones y alertas
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estados para modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  const [modalConfirmAbierto, setModalConfirmAbierto] = useState<boolean>(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  const cargarUsuarios = async () => {
    setCargando(true);
    setMensajeError(null);
    try {
      const data = await listarUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Error al cargar usuarios:', err);
      setMensajeError('No se pudieron obtener los usuarios del servidor. Verifica tu conexión y sesión.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Filtrado reactivo en cliente por búsqueda y rol
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideTexto =
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.grupo && u.grupo.toLowerCase().includes(busqueda.toLowerCase()));

      const coincideRol = filtroRol === 'TODOS' || u.rol === filtroRol;

      return coincideTexto && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  // Contadores para métricas rápidas
  const conteoRoles = useMemo(() => {
    return {
      total: usuarios.length,
      estudiantes: usuarios.filter((u) => u.rol === 'ESTUDIANTE').length,
      docentes: usuarios.filter((u) => u.rol === 'DOCENTE').length,
      admins: usuarios.filter((u) => u.rol === 'ADMIN').length,
    };
  }, [usuarios]);

  // Handlers de creación y edición
  const handleAbrirCrear = () => {
    setUsuarioSeleccionado(null);
    setModalFormAbierto(true);
  };

  const handleAbrirEditar = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalFormAbierto(true);
  };

  // Handlers de eliminación
  const handleAbrirEliminar = (usuario: Usuario) => {
    setUsuarioAEliminar(usuario);
    setModalConfirmAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!usuarioAEliminar) return;

    setEliminando(true);
    setMensajeError(null);
    try {
      await eliminarUsuario(usuarioAEliminar.id);
      setMensajeExito(`Usuario ${usuarioAEliminar.nombre} eliminado exitosamente.`);
      setModalConfirmAbierto(false);
      setUsuarioAEliminar(null);
      await cargarUsuarios();
    } catch (err: unknown) {
      console.error('Error al eliminar usuario:', err);
      setMensajeError('Error al eliminar el usuario. Verifica los permisos del backend.');
    } finally {
      setEliminando(false);
    }
  };

  const getRolBadgeVariant = (
    rol: Rol
  ): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (rol) {
      case 'ADMIN':
        return 'danger';
      case 'DOCENTE':
        return 'primary';
      case 'ESTUDIANTE':
      default:
        return 'success';
    }
  };

  return (
    <div className="admin-usuarios-page" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                background: 'var(--color-primary-ice)',
                color: 'var(--color-primary-dark)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={26} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              Gestión de Usuarios
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
            Administración centralizada de cuentas, roles y credenciales para el Simulador Quirúrgico UCC.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={cargarUsuarios}
            disabled={cargando}
            title="Refrescar lista"
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: '#ffffff',
              color: 'var(--text-secondary)',
              cursor: cargando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.88rem',
            }}
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleAbrirCrear}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'opacity 0.15s ease',
            }}
          >
            <UserPlus size={18} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Banner de Éxito */}
      {mensajeExito && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--color-sterile-bg)',
            color: 'var(--color-sterile-dark)',
            border: '1px solid var(--color-sterile-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
          role="status"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Banner de Error */}
      {mensajeError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--color-contaminated-bg)',
            color: 'var(--color-contaminated-dark)',
            border: '1px solid var(--color-contaminated-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{mensajeError}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Rápidas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.75rem', borderRadius: '50%' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Registrados</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{conteoRoles.total}</div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ background: '#ECFDF5', color: '#059669', padding: '0.75rem', borderRadius: '50%' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Estudiantes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{conteoRoles.estudiantes}</div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ background: '#F0F9FF', color: '#0284C7', padding: '0.75rem', borderRadius: '50%' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Docentes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{conteoRoles.docentes}</div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.75rem', borderRadius: '50%' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Administradores</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{conteoRoles.admins}</div>
          </div>
        </div>
      </div>

      {/* Contenedor Principal: Filtros y Tabla */}
      <Card>
        {/* Barra de Filtros */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          {/* Buscador */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-muted, #f8fafc)',
              padding: '0.55rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              minWidth: '280px',
              flex: '1',
              maxWidth: '450px',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o grupo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.88rem',
                width: '100%',
                color: 'var(--text-main)',
              }}
            />
          </div>

          {/* Filtro por Rol */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filtrar por:</span>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                backgroundColor: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                outline: 'none',
              }}
            >
              <option value="TODOS">Todos los Roles ({usuarios.length})</option>
              <option value="ESTUDIANTE">Estudiantes ({conteoRoles.estudiantes})</option>
              <option value="DOCENTE">Docentes ({conteoRoles.docentes})</option>
              <option value="ADMIN">Administradores ({conteoRoles.admins})</option>
            </select>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        {cargando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div
              className="route-loading-spinner"
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid var(--border-light)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ margin: 0, fontWeight: 600 }}>Cargando usuarios desde el backend Spring Boot...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', display: 'block' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)' }}>No se encontraron usuarios</h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1rem' }}>
              {busqueda
                ? `No hay coincidencias para el criterio "${busqueda}". Intenta con otro término.`
                : 'No existen usuarios registrados con el filtro actual.'}
            </p>
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Limpiar Búsqueda
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-muted, #f8fafc)',
                  }}
                >
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Nombre</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Rol</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Semestre</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Grupo</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u, idx) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : 'rgba(248, 250, 252, 0.6)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Nombre */}
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-ice)',
                            color: 'var(--color-primary-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}
                        >
                          {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span>{u.nombre}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>

                    {/* Rol */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={getRolBadgeVariant(u.rol)} size="sm">
                        {u.rol}
                      </Badge>
                    </td>

                    {/* Semestre */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {u.semestre ? `${u.semestre}° Semestre` : '-'}
                    </td>

                    {/* Grupo */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {u.grupo ? u.grupo : '-'}
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleAbrirEditar(u)}
                          title="Editar usuario"
                          style={{
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            backgroundColor: '#ffffff',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAbrirEliminar(u)}
                          title="Eliminar usuario"
                          style={{
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-contaminated-border)',
                            backgroundColor: 'var(--color-contaminated-bg)',
                            color: 'var(--color-contaminated)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Creación / Edición */}
      <UsuarioFormModal
        isOpen={modalFormAbierto}
        onClose={() => setModalFormAbierto(false)}
        onSuccess={() => {
          setMensajeExito(
            usuarioSeleccionado
              ? 'Usuario actualizado correctamente.'
              : 'Nuevo usuario registrado exitosamente con su progreso inicial.'
          );
          cargarUsuarios();
        }}
        usuarioParaEditar={usuarioSeleccionado}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={modalConfirmAbierto}
        onClose={() => {
          setModalConfirmAbierto(false);
          setUsuarioAEliminar(null);
        }}
        onConfirm={handleConfirmarEliminar}
        titulo="Eliminar Usuario"
        mensaje={`¿Estás seguro de que deseas eliminar permanentemente al usuario "${usuarioAEliminar?.nombre}" (${usuarioAEliminar?.email})? Se eliminará en cascada todo su progreso e intentos.`}
        cargando={eliminando}
      />
    </div>
  );
};

export default AdminUsuarios;
