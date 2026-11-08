import { MapPin } from 'lucide-react';

const TableHeroCard = ({ establishment, table, onlineUsers = [], onOpenUsersModal }) => {
    const tableLabel = table?.number
        ? `Mesa ${table.number}`
        : (table?.name || 'Mesa 1');

    return (
        <section className="home-table-hero" aria-label="Informações da mesa ativa">
            <div className="home-hero-accent" />

            <h1 className="home-establishment-title">
                {establishment?.name || 'Consagrado'}
            </h1>

            <div className="home-table-badge-wrap">
                <button
                    type="button"
                    className="home-table-badge"
                    onClick={onOpenUsersModal}
                >
                    <MapPin size={16} className="home-table-pin-icon" strokeWidth={2.5} />
                    <span>{tableLabel}</span>
                    {onlineUsers.length > 1 && (
                        <span className="home-table-users-count">
                            👥 {onlineUsers.length} na mesa
                        </span>
                    )}
                </button>
            </div>
        </section>
    );
};

export default TableHeroCard;
