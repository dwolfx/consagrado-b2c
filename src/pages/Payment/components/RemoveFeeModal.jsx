import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const RemoveFeeModal = ({
    removeFeeReason,
    setRemoveFeeReason,
    onConfirm,
    onClose
}) => {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Remover Gratificação"
            style={modalOverlayStyle}
            onClick={onClose}
        >
            <div className="card" style={{ width: '100%', maxWidth: '360px', margin: 0 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Remover Gratificação</h3>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                        <X />
                    </button>
                </div>
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'start'
                }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>A gratificação vai integralmente para a equipe de atendimento.</p>
                </div>
                <label htmlFor="remove-fee-reason" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Por que deseja remover?
                </label>
                <textarea
                    id="remove-fee-reason"
                    className="input-field"
                    rows="3"
                    placeholder="Mal atendimento, demora, etc..."
                    value={removeFeeReason}
                    onChange={(e) => setRemoveFeeReason(e.target.value)}
                    style={{ width: '100%', resize: 'none' }}
                />
                <button
                    type="button"
                    onClick={onConfirm}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem', background: 'var(--danger)', width: '100%', justifyContent: 'center' }}
                >
                    Confirmar Remoção
                </button>
            </div>
        </div>
    );
};

const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem'
};

export default RemoveFeeModal;
