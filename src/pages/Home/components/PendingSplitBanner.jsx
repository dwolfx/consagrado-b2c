import { Users, ChevronRight } from 'lucide-react';
import './PendingSplitBanner.css';

const PendingSplitBanner = ({ requests = [], onReviewRequest }) => {
    if (!requests || requests.length === 0) return null;

    const first = requests[0];
    const requester = (first?.requesterName || 'Alguém').split(' ')[0];
    const count = requests.length;

    return (
        <section
            className="home-pending-split-banner"
            onClick={() => onReviewRequest?.(first)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onReviewRequest?.(first);
            }}
            aria-label="Pedidos pendentes de aceitação"
        >
            <div className="home-pending-split-icon-wrap">
                <Users size={18} strokeWidth={2.2} />
            </div>

            <div className="home-pending-split-text-wrap">
                <span className="home-pending-split-title">
                    {count === 1 ? 'Pedido pendente de aceite' : `${count} pedidos pendentes de aceite`}
                </span>
                <span className="home-pending-split-desc">
                    {count === 1
                        ? `${requester} convidou você para dividir ${first?.itemName || 'um item'}`
                        : `${requester} e outros convidaram você para dividir pedidos`}
                </span>
            </div>

            <button type="button" className="home-pending-split-action-btn">
                <span>Ver convite</span>
                <ChevronRight size={15} strokeWidth={2.5} />
            </button>
        </section>
    );
};

export default PendingSplitBanner;
