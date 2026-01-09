import React from 'react';
import { CheckCircle, UtensilsCrossed } from 'lucide-react';

const SplitStatusModal = ({ status, responderName, onCancel, onContinueAlone }) => {
    if (status === 'idle') return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
            <div className="card" style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
                {status === 'waiting' && (
                    <>
                        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                        <h3>Aguardando confirmação...</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Esperando os outros aceitarem.</p>
                        <button
                            onClick={onCancel}
                            className="btn btn-secondary"
                            style={{ marginTop: '1rem', width: '100%' }}
                        >
                            Cancelar
                        </button>
                    </>
                )}
                {status === 'accepted' && (
                    <>
                        <CheckCircle size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
                        <h3>Confirmado!</h3>
                        <p>{responderName} aceitou dividir.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Enviando pedido...</p>
                    </>
                )}
                {status === 'rejected' && (
                    <>
                        <UtensilsCrossed size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
                        <h3>Recusado</h3>
                        <p>{responderName} preferiu não dividir.</p>
                        <p style={{ margin: '1rem 0', fontWeight: 'bold' }}>Deseja continuar sozinho?</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={onCancel}
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onContinueAlone}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                Continuar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SplitStatusModal;
