// Modal reutilizable de confirmación de acciones destructivas (ej. eliminar usuario)
// Universidad Cooperativa de Colombia - Campus Pasto

import React from 'react';
import Modal from '../ui/Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo?: string;
  mensaje?: string;
  textoBotonConfirmar?: string;
  cargando?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = 'Confirmar Eliminación',
  mensaje = '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
  textoBotonConfirmar = 'Eliminar',
  cargando = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-contaminated-bg)',
              color: 'var(--color-contaminated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {mensaje}
            </p>
          </div>
        </div>

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
            disabled={cargando}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: '#ffffff',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: cargando ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={cargando}
            style={{
              padding: '0.6rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-contaminated)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: cargando ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
              opacity: cargando ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            <Trash2 size={16} />
            <span>{cargando ? 'Eliminando...' : textoBotonConfirmar}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
