import { ChevronRight, Receipt } from 'lucide-react';

const OrderStatusDock = ({ statusBadge, onNavigateTab }) => {
    const statusText = statusBadge?.label || 'Em preparo';
    const variant = statusBadge?.variant || 'preparing';

    const dotClass =
        variant === 'ready'
            ? 'home-dock-dot home-dock-dot--ready'
            : variant === 'delivered'
              ? 'home-dock-dot home-dock-dot--delivered'
              : 'home-dock-dot';

    const textClass =
        variant === 'ready'
            ? 'home-dock-status-text home-dock-status-text--ready'
            : variant === 'delivered'
              ? 'home-dock-status-text home-dock-status-text--delivered'
              : 'home-dock-status-text';

    return (
        <div className="home-bottom-dock-fixed">
            <footer className="home-bottom-dock" aria-label="Status do pedido e minha comanda">
                <div
                    className="home-dock-status"
                    role="button"
                    tabIndex={0}
                    onClick={onNavigateTab}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onNavigateTab?.();
                    }}
                >
                    <span className="home-dock-label">Cadê meu pedido?</span>

                    <div className="home-dock-status-row">
                        <span className={dotClass} aria-hidden="true" />
                        <span className={textClass}>{statusText}</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="home-btn-close-bill"
                    onClick={onNavigateTab}
                    aria-label="Ir para minha comanda"
                >
                    <Receipt size={16} strokeWidth={2.2} />
                    <span>Minha comanda</span>
                    <ChevronRight size={15} strokeWidth={2.5} />
                </button>
            </footer>
        </div>
    );
};

export default OrderStatusDock;
