import { Utensils, Bell } from 'lucide-react';

const PrimaryActionsRow = ({
    onNavigateMenu,
    onCallWaiter,
    waiterCooldown = 0,
    cartCount = 0
}) => {
    const isCooldown = waiterCooldown > 0;

    return (
        <div className="home-actions-row">
            <button
                type="button"
                className="home-btn-order"
                onClick={onNavigateMenu}
            >
                <Utensils size={18} strokeWidth={2.25} />
                <span className="home-btn-order-text">
                    {cartCount > 0 ? 'Ver Cardápio' : 'Fazer Pedido'}
                </span>
                {cartCount > 0 && (
                    <span className="home-btn-order-badge" aria-label={`${cartCount} itens no carrinho`}>
                        {cartCount}
                    </span>
                )}
            </button>

            <button
                type="button"
                className={`home-btn-waiter ${isCooldown ? 'home-btn-waiter--cooldown' : ''}`}
                onClick={onCallWaiter}
                disabled={isCooldown}
                title="Chamar Garçom na Mesa"
            >
                <Bell size={17} strokeWidth={2.25} />
                <span>{isCooldown ? `${waiterCooldown}s` : 'Garçom'}</span>
            </button>
        </div>
    );
};

export default PrimaryActionsRow;
