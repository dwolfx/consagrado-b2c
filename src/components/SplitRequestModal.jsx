import { Info, CheckCheck, Check } from 'lucide-react';
import './SplitRequestModal.css';

const SplitRequestModal = ({ request, onAccept, onDecline, onAcceptAll }) => {
    if (!request) return null;

    const firstName = (request.requesterName || 'Alguém').split(' ')[0];

    return (
        <div className="split-request-overlay">
            <div className="split-request-sheet">
                {/* Ícone */}
                <div className="split-request-icon-wrap">
                    <CheckCheck size={26} strokeWidth={2.5} />
                </div>

                <h3 className="split-request-title">Dividir pedido?</h3>
                <p className="split-request-body-text">
                    <strong className="split-request-requester">{firstName}</strong> quer dividir<br />
                    <strong className="split-request-item-name">
                        {request.itemName}
                    </strong><br />
                    com você.
                </p>

                <div className="split-request-actions-col">
                    {/* Aceitar este */}
                    <button
                        type="button"
                        onClick={onAccept}
                        className="split-request-btn-accept"
                    >
                        <Check size={18} strokeWidth={2.5} />
                        <span>Aceitar este pedido</span>
                    </button>

                    {/* Aceitar todos de [nome] */}
                    <button
                        type="button"
                        onClick={onAcceptAll}
                        className="split-request-btn-accept-all"
                    >
                        <CheckCheck size={16} strokeWidth={2.2} />
                        <span>Aceitar todos de {firstName} nessa comanda</span>
                    </button>

                    {/* Aviso sutil com ícone limpo (sem emojis) */}
                    <div className="split-request-note-row">
                        <Info size={13} strokeWidth={2.2} />
                        <span>A opção de aceitar todos vale apenas para esta comanda</span>
                    </div>

                    {/* Recusar */}
                    <button
                        type="button"
                        onClick={onDecline}
                        className="split-request-btn-decline"
                    >
                        Recusar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitRequestModal;
