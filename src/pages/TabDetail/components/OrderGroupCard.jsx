import React from 'react';
import ItemRow, { getDisplayPrice } from './ItemRow';
import AvatarRow from './AvatarRow';

const ITEMS_PREVIEW_LIMIT = 3;
const formatPrice = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const getStatusConfig = (s) => {
    switch (s) {
        case 'pending':   return { label: 'Aguardando', color: '#b45309', bg: '#fef3c7' };
        case 'preparing': return { label: 'Preparando', color: '#1d4ed8', bg: '#dbeafe' };
        case 'ready':     return { label: 'A Caminho 🛵', color: '#7c3aed', bg: '#ede9fe' };
        case 'delivered':
        case 'completed': return { label: 'Entregue',  color: '#15803d', bg: '#dcfce7' };
        case 'paid':      return { label: 'Pago',      color: '#15803d', bg: '#dcfce7' };
        default:          return { label: s,           color: '#374151', bg: '#f3f4f6' };
    }
};

const OrderGroupCard = ({
    group,
    dimmed = false,
    onSelect,
    onCancelPending,
    onlineUsers = [],
    knownUsers = [],
    allOrders = [],
    currentUserId
}) => {
    const statusConfig  = getStatusConfig(group.status);
    const batchTotal    = group.items.reduce((acc, i) => acc + getDisplayPrice(i) * i.quantity, 0);
    const totalCount    = group.items.length;
    const previewItems  = group.items.slice(0, ITEMS_PREVIEW_LIMIT);
    const hiddenCount   = totalCount - previewItems.length;

    const firstSplit   = group.items.find(i => i.split_requester || i.split_participants?.length > 0);
    const requesterId  = firstSplit?.split_requester || null;
    const participants = firstSplit?.split_participants
        ? (Array.isArray(firstSplit.split_participants) ? firstSplit.split_participants : [])
        : [];

    // Participantes unificados do pedido (seja individual ou dividido)
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

    // Pending Split check
    const pendingItem = group.items.find(i => i.metadata?.split_pending);
    const pendingData = pendingItem?.metadata?.split_pending;
    const isPendingApproval = Boolean(pendingData);

    const pendingTargetNames = React.useMemo(() => {
        if (!pendingData || !pendingData.targetUserIds) return 'amigo(a)';
        const names = pendingData.targetUserIds.map(uid => {
            const found = (onlineUsers || []).find(u => String(u.id).toLowerCase() === String(uid).toLowerCase())
                || (knownUsers || []).find(u => String(u.id).toLowerCase() === String(uid).toLowerCase());
            return found?.name ? found.name.split(' ')[0] : 'amigo(a)';
        });
        return names.join(', ');
    }, [pendingData, onlineUsers, knownUsers]);

    return (
        <div
            onClick={() => onSelect(group)}
            className="card"
            style={{
                marginBottom: 0, cursor: 'pointer',
                border: isPendingApproval ? '1.5px dashed rgba(245, 158, 11, 0.7)' : undefined,
                borderLeft: isPendingApproval ? '4px solid #f59e0b' : `4px solid ${dimmed ? 'var(--bg-tertiary)' : 'var(--primary)'}`,
                opacity: dimmed ? 0.85 : 1,
                background: isPendingApproval ? 'rgba(245, 158, 11, 0.05)' : (dimmed ? 'var(--bg-tertiary)' : undefined),
                transition: 'all 0.15s',
            }}
        >
            {/* Aviso visual de divisão pendente */}
            {isPendingApproval && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '0.75rem', padding: '6px 10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    color: '#f59e0b', fontSize: '0.82rem', fontWeight: 600
                }}>
                    <span>⏳ Falta {pendingTargetNames} aceitar a divisão</span>
                    {onCancelPending && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelPending(group);
                            }}
                            style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#ef4444',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 700
                            }}
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            )}

            {/* Header Unificado: Linha 1 = "Pedidos" | Linha 2 = Fotinhas (1 ou várias lado a lado) */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '8px',
                marginBottom: '0.85rem', paddingBottom: '0.65rem',
                borderBottom: '1px solid var(--bg-tertiary, rgba(255, 255, 255, 0.08))',
            }}>
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

            {/* Preview: até 3 itens */}
            <div>
                {previewItems.map(item => <ItemRow key={item.id} item={item} />)}
            </div>

            {/* Indicador de mais itens */}
            {hiddenCount > 0 && (
                <div style={{
                    textAlign: 'center', padding: '0.3rem 0',
                    color: 'var(--primary)', fontSize: '0.78rem', letterSpacing: '3px', fontWeight: '600'
                }}>
                    ••• +{hiddenCount} {hiddenCount === 1 ? 'item' : 'itens'}
                </div>
            )}

            {/* Footer: contagem · total · status */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: '0.5rem', marginTop: '0.25rem',
            }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {totalCount} {totalCount === 1 ? 'item' : 'itens'} · {formatPrice(batchTotal)}
                </span>
                <span style={{
                    fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px',
                    backgroundColor: statusConfig.bg, color: statusConfig.color,
                    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                    animation: group.status === 'ready' ? 'statusPulse 1.5s ease-in-out infinite' : undefined,
                }}>
                    {statusConfig.label}
                </span>
            </div>
        </div>
    );
};

export default OrderGroupCard;
