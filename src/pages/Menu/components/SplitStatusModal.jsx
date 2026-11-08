import React from 'react';
import { CheckCircle, UtensilsCrossed } from 'lucide-react';

const SplitStatusModal = ({ status, responderName, onCancel, onContinueAlone }) => {
    if (status === 'idle') return null;

    return (
        <div className="menu-modal-overlay">
            <div className="menu-status-modal-card">
                {status === 'waiting' && (
                    <>
                        <div className="spinner menu-status-icon" />
                        <h3>Aguardando confirmação...</h3>
                        <p className="menu-status-subtext">Esperando os outros aceitarem.</p>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary menu-status-btn-full"
                        >
                            Cancelar
                        </button>
                    </>
                )}
                {status === 'accepted' && (
                    <>
                        <CheckCircle size={48} className="menu-status-icon menu-status-Icon--success" />
                        <h3>Confirmado!</h3>
                        <p>{responderName} aceitou dividir.</p>
                        <p className="menu-status-micro">Enviando pedido...</p>
                    </>
                )}
                {status === 'rejected' && (
                    <>
                        <UtensilsCrossed size={48} className="menu-status-icon menu-status-Icon--danger" />
                        <h3>Recusado</h3>
                        <p>{responderName} preferiu não dividir.</p>
                        <p className="menu-status-question">Deseja continuar sozinho?</p>
                        <div className="menu-status-actions">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="btn btn-secondary menu-status-btn"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={onContinueAlone}
                                className="btn btn-primary menu-status-btn"
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
