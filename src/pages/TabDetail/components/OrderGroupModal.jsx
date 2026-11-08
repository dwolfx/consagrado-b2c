import React from 'react';
import { X } from 'lucide-react';
import ItemRow, { getDisplayPrice } from './ItemRow';
import AvatarRow from './AvatarRow';
import { getStatusConfig } from './OrderGroupCard';

const formatPrice = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const OrderGroupModal = ({
    group,
    isMine,
    onClose,
    onSplitItem,
    onSplit,
    onlineUsers = [],
    knownUsers = [],
    allOrders = [],
    currentUserId
}) => {
    if (!group) return null;

    const statusConfig = getStatusConfig(group.status);
    const batchTotal = group.items.reduce((acc, i) => acc + getDisplayPrice(i) * i.quantity, 0);

    const firstSplit = group.items.find(i => i.split_requester || i.split_participants?.length > 0);
    const requesterId = firstSplit?.split_requester || null;
    const participants = firstSplit?.split_participants
        ? (Array.isArray(firstSplit.split_participants) ? firstSplit.split_participants : [])
        : [];

    // Participantes unificados do pedido (individual ou dividido)
    const participantIds = React.useMemo(() => {
        const ids = new Set();
        if (requesterId) ids.add(requesterId);
        if (Array.isArray(participants) && participants.length > 0) {
            participants.forEach(p => ids.add(p));
        }
        group.items.forEach(item => {
            if (item.split_requester) ids.add(item.split_requester);
            if (Array.isArray(item.split_participants)) {
                item.split_participants.forEach(p => ids.add(p));
            }
            if (item.ordered_by) ids.add(item.ordered_by);
        });
        if (ids.size === 0 && currentUserId) ids.add(currentUserId);
        return Array.from(ids);
    }, [requesterId, participants, group.items, currentUserId]);

    const canSplit = isMine && group.status !== 'paid';

    const handleSplitSingleItem = (itemToSplit) => {
        onClose();
        if (onSplitItem) onSplitItem(itemToSplit);
        else if (onSplit) onSplit(itemToSplit);
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'flex-end',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxHeight: '85vh',
                    background: 'var(--bg-secondary)',
                    borderRadius: '20px 20px 0 0',
                    display: 'flex', flexDirection: 'column',
                    animation: 'slideUp 0.25s ease',
                }}
            >
                {/* Handle */}
                <div style={{ padding: '1rem 1.5rem 0', flexShrink: 0 }}>
                    <div style={{
                        width: '40px', height: '4px', borderRadius: '2px',
                        background: 'var(--bg-tertiary)', margin: '0 auto 1.2rem'
                    }} />

                    {/* Título + fechar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>
                                {isMine ? 'Seu Pedido' : 'Pedido da Mesa'}
                            </h3>

                            {/* Header Unificado: Linha 1 = "Pedidos" | Linha 2 = Fotinhas */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary, #a1a1aa)',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}>
                                    Pedidos
                                </span>
                                <AvatarRow
                                    userIds={participantIds}
                                    onlineUsers={onlineUsers}
                                    knownUsers={knownUsers}
                                    allOrders={allOrders}
                                    groupItems={group.items}
                                    currentUserId={currentUserId}
                                />
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <span style={{
                            fontSize: '0.72rem', padding: '3px 10px', borderRadius: '6px',
                            backgroundColor: statusConfig.bg, color: statusConfig.color,
                            fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                            {statusConfig.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                        </span>
                    </div>
                </div>

                {/* Lista completa de itens */}
                <div style={{ padding: '0 1.5rem', overflowY: 'auto', flex: 1 }}>
                    <div style={{ borderTop: '1px solid var(--bg-tertiary)', borderBottom: '1px solid var(--bg-tertiary)' }}>
                        {group.items.map(item => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                canSplit={canSplit}
                                onSplit={handleSplitSingleItem}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer do Modal: Total */}
                <div style={{ padding: '1.2rem 1.5rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Total do Pedido
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {formatPrice(batchTotal)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderGroupModal;
