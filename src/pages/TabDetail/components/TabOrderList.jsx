import React from 'react';
import { Users } from 'lucide-react';

const TabOrderList = ({ myOrders, othersOrders, showAll, setShowAll, resolveName, onSplitItem }) => {

    const formatPrice = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Helper for Status
    const getStatusConfig = (s) => {
        switch (s) {
            case 'pending': return { label: 'Aguardando', color: '#b45309', bg: '#fef3c7' };
            case 'preparing': return { label: 'Preparando', color: '#1d4ed8', bg: '#dbeafe' };
            case 'ready':
            case 'delivered':
            case 'completed': return { label: 'Entregando', color: '#15803d', bg: '#dcfce7' };
            case 'paid': return { label: 'Pago', color: '#15803d', bg: '#dcfce7' };
            default: return { label: s, color: '#374151', bg: '#f3f4f6' };
        }
    };

    // Helper to calculate Display Price honoring Metadata
    const getDisplayPrice = (item) => {
        if (item.is_split && item.split_parts > 1 && item.original_price > 0) {
            return Number(item.original_price) / item.split_parts;
        }
        return Number(item.price);
    };

    // Calculate Others Total
    const othersSubtotal = othersOrders.reduce((acc, item) => acc + (getDisplayPrice(item) * item.quantity), 0);

    return (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '6rem' }}>
            {/* Meus Pedidos */}
            <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.9 }}>Seus Pedidos (Toque para dividir)</h4>
            {myOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                    Você ainda não pediu nada.
                </div>
            ) : (
                myOrders.map(item => {
                    const statusConfig = getStatusConfig(item.status);
                    return (
                        <div
                            key={item.id}
                            onClick={() => onSplitItem(item)}
                            className="card"
                            style={{
                                marginBottom: 0, borderLeft: '4px solid var(--primary)', cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: '600', fontSize: '1rem' }}>{item.quantity}x {item.name}</span>
                                <span style={{ fontWeight: '700' }}>{formatPrice(getDisplayPrice(item) * item.quantity)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--primary)',
                                    fontWeight: 'bold'
                                }}>
                                    Você
                                </span>
                                <span style={{
                                    fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px',
                                    backgroundColor: statusConfig.bg,
                                    color: statusConfig.color,
                                    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'
                                }}>
                                    {statusConfig.label}
                                </span>
                                <span style={{
                                    marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)',
                                    border: '1px solid var(--text-secondary)', padding: '2px 6px', borderRadius: '4px'
                                }}>
                                    DIVIDIR
                                </span>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Pedidos da Mesa (Toggle) */}
            {othersOrders.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        marginBottom: '1rem', opacity: 0.8
                    }}>
                        <div style={{ height: '1px', flex: 1, background: 'var(--bg-tertiary)' }}></div>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            style={{
                                background: 'var(--bg-tertiary)', border: 'none', borderRadius: '20px',
                                padding: '0.5rem 1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                            }}
                        >
                            <Users size={16} />
                            {showAll ? 'Ocultar Mesa' : `Ver Mesa (+${othersOrders.length})`}
                        </button>
                        <div style={{ height: '1px', flex: 1, background: 'var(--bg-tertiary)' }}></div>
                    </div>

                    {showAll && (
                        <div style={{ display: 'grid', gap: '1rem', animation: 'fadeIn 0.3s' }}>
                            {othersOrders.map(item => {
                                const displayName = resolveName(item.ordered_by);
                                const statusConfig = getStatusConfig(item.status);

                                return (
                                    <div key={item.id} className="card" style={{ marginBottom: 0, opacity: 0.85, background: 'var(--bg-tertiary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: '600', fontSize: '1rem' }}>{item.quantity}x {item.name}</span>
                                            <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{formatPrice(getDisplayPrice(item) * item.quantity)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 'normal'
                                            }}>
                                                {displayName}
                                            </span>
                                            <span style={{
                                                fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px',
                                                backgroundColor: 'var(--bg-secondary)', // Neutral for others
                                                color: statusConfig.color,
                                                fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                                                border: '1px solid rgba(0,0,0,0.05)'
                                            }}>
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{
                                borderTop: '1px dashed var(--bg-tertiary)', margin: '1rem 0 0 0', padding: '1rem 0 0 0',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)'
                            }}>
                                <span>Total dos itens da mesa</span>
                                <span><strong>{formatPrice(othersSubtotal)} + taxas</strong></span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default TabOrderList;
