import { MapPin } from 'lucide-react';

const TableHeroCard = ({
    establishment,
    table,
    currentUser,
    onlineUsers = [],
    onOpenUsersModal
}) => {
    const tableLabel = table?.number
        ? `Mesa ${table.number}`
        : table?.name || 'Mesa 1';

    const safeUsers =
        onlineUsers && onlineUsers.length > 0
            ? onlineUsers
            : currentUser
              ? [currentUser]
              : [{ id: 'me', name: 'Você' }];

    return (
        <section className="home-table-hero" aria-label="Informações da mesa ativa">
            <div className="home-hero-accent" />

            {/* Linha 1: Nome do Bar */}
            <h1 className="home-establishment-title">
                {establishment?.name || 'Consagrado'}
            </h1>

            {/* Linha 2: Mesa */}
            <div className="home-table-badge-wrap">
                <button
                    type="button"
                    className="home-table-badge"
                    onClick={onOpenUsersModal}
                    aria-label={`Mesa atual: ${tableLabel}. Clique para ver a mesa`}
                >
                    <MapPin size={16} className="home-table-pin-icon" strokeWidth={2.5} />
                    <span>{tableLabel}</span>
                </button>
            </div>

            {/* Linha 3: Pessoas na Mesa (bolinhas sem borda de fundo) */}
            <div
                className="home-table-avatars-row"
                role="button"
                tabIndex={0}
                onClick={onOpenUsersModal}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onOpenUsersModal?.();
                }}
                aria-label="Ver pessoas conectadas na mesa"
            >
                {safeUsers.slice(0, 6).map((u, idx) => (
                    <img
                        key={u.id || idx}
                        src={
                            u.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                u.name || 'C'
                            )}&background=random`
                        }
                        alt={u.name || 'Pessoa na mesa'}
                        className="home-table-avatar-bubble"
                    />
                ))}
            </div>
        </section>
    );
};

export default TableHeroCard;
