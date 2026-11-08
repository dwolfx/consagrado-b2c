import { LogOut } from 'lucide-react';

const LogoutConfirmModal = ({ onCancel, onConfirm }) => {
    return (
        <div className="home-overlay-center" onClick={onCancel}>
            <div className="home-logout-modal" onClick={(e) => e.stopPropagation()}>
                <div className="home-logout-icon-circle">
                    <LogOut size={28} />
                </div>

                <div>
                    <h3 className="home-logout-title">Sair da sua conta?</h3>
                    <p className="home-logout-desc">
                        Sua comanda e pedidos continuarão seguros na mesa.
                    </p>
                </div>

                <div className="home-logout-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-primary home-btn-stay"
                    >
                        Continuar no Rolê 🎉
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="home-btn-confirm-logout"
                    >
                        Sim, desconectar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmModal;
