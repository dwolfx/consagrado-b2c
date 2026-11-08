import React, { useMemo, useState } from 'react';
import { Users, Scissors } from 'lucide-react';
import OrderGroupCard from './OrderGroupCard';
import OrderGroupModal from './OrderGroupModal';

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'delivered', 'completed'];

const TabOrderList = ({
    myOrders = [],
    othersOrders = [],
    allOrders = [],
    currentUserId,
    showAll,
    setShowAll,
    onSplitGroup,
    onCancelPendingGroup,
    onlineUsers = [],
    knownUsers = []
}) => {
    const [openGroup, setOpenGroup] = useState(null);

    // Agrupa por order_batch_id. Fallback legado: split + janela 5 min.
    const groupOrders = (orders) => {
        const map = {};
        orders.forEach(order => {
            let key;
            if (order.order_batch_id) {
                key = order.order_batch_id;
            } else if (order.split_requester || order.is_split) {
                const requester = order.split_requester || order.ordered_by;
                const timeWindow = Math.floor(new Date(order.created_at).getTime() / (5 * 60 * 1000));
                key = `legacy_${requester}_${timeWindow}`;
            } else {
                key = order.id;
            }

            if (!map[key]) {
                map[key] = { key, createdAt: order.created_at, status: order.status, items: [] };
            }
            map[key].items.push(order);

            const current = STATUS_ORDER.indexOf(map[key].status);
            const incoming = STATUS_ORDER.indexOf(order.status);
            if (incoming !== -1 && (current === -1 || incoming < current)) {
                map[key].status = order.status;
            }
        });
        return Object.values(map).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    };

    const myGroups     = useMemo(() => groupOrders(myOrders),     [myOrders]);
    const othersGroups = useMemo(() => groupOrders(othersOrders), [othersOrders]);

    return (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                <h4 style={{ margin: 0, opacity: 0.9 }}>Seus Pedidos</h4>
                {myOrders.length > 1 && onSplitGroup && (
                    <button
                        onClick={() => onSplitGroup({ isWholeTab: true, items: myOrders })}
                        className="btn-ghost"
                        style={{
                            fontSize: '0.8rem',
                            color: 'var(--primary)',
                            fontWeight: '600',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Scissors size={14} />
                        Dividir comanda inteira
                    </button>
                )}
            </div>

            {myGroups.length === 0 ? (
                <div style={{
                    textAlign: 'center', color: 'var(--text-secondary)',
                    padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px'
                }}>
                    Você ainda não pediu nada.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {myGroups.map(group => (
                        <OrderGroupCard
                            key={group.key}
                            group={group}
                            onSelect={setOpenGroup}
                            onCancelPending={onCancelPendingGroup}
                            onlineUsers={onlineUsers}
                            knownUsers={knownUsers}
                            allOrders={allOrders}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}

            {othersGroups.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', opacity: 0.8 }}>
                        <div style={{ height: '1px', flex: 1, background: 'var(--bg-tertiary)' }} />
                        <button
                            onClick={() => setShowAll(!showAll)}
                            style={{
                                background: 'var(--bg-tertiary)', border: 'none', borderRadius: '20px',
                                padding: '0.5rem 1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                            }}
                        >
                            <Users size={16} />
                            {showAll ? 'Ocultar Mesa' : `Ver Mesa (+${othersGroups.length})`}
                        </button>
                        <div style={{ height: '1px', flex: 1, background: 'var(--bg-tertiary)' }} />
                    </div>

                    {showAll && (
                        <div style={{ display: 'grid', gap: '1rem', animation: 'fadeIn 0.3s' }}>
                            {othersGroups.map(group => (
                                <OrderGroupCard
                                    key={group.key}
                                    group={group}
                                    dimmed={true}
                                    onSelect={setOpenGroup}
                                    onlineUsers={onlineUsers}
                                    knownUsers={knownUsers}
                                    allOrders={allOrders}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {openGroup && (
                <OrderGroupModal
                    group={openGroup}
                    isMine={myGroups.some(g => g.key === openGroup.key)}
                    onClose={() => setOpenGroup(null)}
                    onSplit={onSplitGroup}
                    onlineUsers={onlineUsers}
                    knownUsers={knownUsers}
                    allOrders={allOrders}
                    currentUserId={currentUserId}
                />
            )}

            <style>{`
                @keyframes fadeIn  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default TabOrderList;
