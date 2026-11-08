import React from 'react';
import { Utensils, Bell, Receipt } from 'lucide-react';
import EstablishmentHero from './EstablishmentHero';
import Badge from '../../../components/ui/Badge';

const ActiveTableSection = ({
    establishment,
    tableId,
    onlineUsers,
    statusBadge,
    onOpenUsersModal,
    onNavigateMenu,
    onNavigateTab,
    onNavigatePayment,
    onCallWaiter
}) => {
    return (
        <>
            <EstablishmentHero
                establishment={establishment}
                tableId={tableId}
                onlineUsers={onlineUsers}
                onOpenUsersModal={onOpenUsersModal}
            />

            {/* 1. CARDÁPIO */}
            <button
                type="button"
                onClick={onNavigateMenu}
                className="btn btn-primary"
                style={{
                    padding: '1.5rem',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px -4px rgba(0,0,0,0.3)',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    gap: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}
            >
                <Utensils size={28} strokeWidth={2.5} />
                Fazer Pedido
            </button>

            {/* 2. CHAMAR GARÇOM */}
            <button
                type="button"
                onClick={onCallWaiter}
                className="btn"
                style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1.25rem',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    gap: '10px',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }}
            >
                <Bell size={24} />
                Chamar Garçom
            </button>

            {/* 3. Comanda & Pagamento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                    type="button"
                    onClick={onNavigateTab}
                    className="card"
                    style={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        padding: '1.25rem',
                        marginBottom: 0,
                        gap: '4px',
                        borderLeft: '4px solid var(--brand-color)',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Minha Comanda</span>
                        <Receipt size={20} style={{ opacity: 0.3 }} />
                    </div>

                    {statusBadge && (
                        <Badge bg={statusBadge.bg} color={statusBadge.color} size="xs" style={{ marginTop: '4px' }}>
                            {statusBadge.label}
                        </Badge>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onNavigatePayment}
                    className="card"
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '1.25rem',
                        marginBottom: 0,
                        background: 'var(--bg-tertiary)',
                        cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>💸</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pagar</span>
                </button>
            </div>
        </>
    );
};

export default ActiveTableSection;
