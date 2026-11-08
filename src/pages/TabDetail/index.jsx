import BrandLogo from '../../components/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTablePresence } from '../../hooks/useTablePresence';
import { useToast } from '../../context/ToastContext';
import SplitItemModal from '../../components/SplitItemModal';
import PendingSplitsBanner from './components/PendingSplitsBanner';

// Components
import TabOrderList from './components/TabOrderList';
import TabFooter from './components/TabFooter';

// Hooks
import { useSplitLogic } from './hooks/useSplitLogic';

const TabDetail = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { onlineUsers, knownTableUsers = [] } = useTablePresence();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [establishment, setEstablishment] = useState(null);
    const [tableNumber, setTableNumber] = useState(null);
    const [showAll, setShowAll] = useState(false);

    // --- DATA LOADING ---
    const loadTab = useCallback(async () => {
        const tableId = localStorage.getItem('my_table_id');
        if (!tableId) {
            navigate('/scanner');
            return;
        }
        try {
            const tableData = await api.getTable(tableId);
            if (tableData) {
                setOrders(tableData.orders || []);
                setTableNumber(tableData.number);
                if (tableData.establishment) {
                    setEstablishment(tableData.establishment);
                }
            }
        } catch (error) {
            console.error("Error loading tab", error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadTab();
        const handleCustomReload = () => loadTab();
        window.addEventListener('tab:reload', handleCustomReload);

        const tableId = localStorage.getItem('my_table_id');
        let channel = null;
        if (tableId) {
            channel = supabase.channel(`tab_detail:${tableId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, () => {
                    loadTab();
                })
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
            window.removeEventListener('tab:reload', handleCustomReload);
        };
    }, [loadTab]);

    // --- LOGIC HELPERS ---
    /* resolveName removed - unused */

    const getDisplayPrice = (item) => {
        if (!item) return 0;
        if (item.metadata?.my_parts && item.split_parts > 1 && item.original_price > 0) {
            return (Number(item.original_price) / item.split_parts) * Number(item.metadata.my_parts);
        }
        const match = (item.name || '').match(/^(\d+)\s*\/\s*(\d+)/);
        if (match && item.original_price > 0) {
            const num = parseInt(match[1], 10);
            const den = parseInt(match[2], 10);
            if (den > 0) return (Number(item.original_price) / den) * num;
        }
        if (item.price != null && !isNaN(item.price)) {
            return Number(item.price);
        }
        if (item.is_split && item.split_parts > 1 && item.original_price > 0) {
            return Number(item.original_price) / item.split_parts;
        }
        return Number(item.price || 0);
    };

    const visibleOrders = orders.filter(o => {
        const realPrice = getDisplayPrice(o);
        const name = o.name || 'Unnamed';
        const isInternal = name === '🔔 CHAMAR GARÇOM' || o.status === 'service_call';
        const isPaid = o.status === 'paid';
        const isPricePositive = realPrice > 0;
        return !isInternal && !isPaid && isPricePositive;
    });

    // --- SPLIT LOGIC HOOK ---
    const {
        splitItem, selectedUsersToSplit, isEditingSplit,
        handleItemClick, handleModalConfirm, closeSplitModal
    } = useSplitLogic(visibleOrders);

    // Derived Lists
    const myOrdersList = visibleOrders.filter(o => o.ordered_by === user?.id);
    const othersOrdersList = visibleOrders.filter(o => {
        if (o.ordered_by === user?.id) return false;
        // Se eu sou participante desse item dividido, já aparece nos meus pedidos — não duplicar
        const participants = Array.isArray(o.split_participants) ? o.split_participants : [];
        if (participants.some(p => String(p) === String(user?.id))) return false;
        return true;
    });
    const mySubtotal = myOrdersList.reduce((acc, item) => acc + (getDisplayPrice(item) * item.quantity), 0);

    // Recebe o grupo e divide APENAS os itens daquele pedido específico
    // (a menos que venha de "Dividir comanda inteira")
    const handleGroupClick = (group) => {
        if (!group) return;

        const itemsToDivide = group.isWholeTab
            ? myOrdersList
            : (group.items && group.items.length > 0 ? group.items : (group.id ? [group] : []));

        if (!itemsToDivide || itemsToDivide.length === 0) return;
        const representative = itemsToDivide.find(i => i.is_split) || itemsToDivide[0];
        handleItemClick({
            ...representative,
            _groupItems: itemsToDivide
        });
    };

    // Permite ao solicitante cancelar a solicitação de divisão pendente
    const handleCancelPendingSplit = async (group) => {
        try {
            const items = group.items || (group.id ? [group] : []);
            const pendingData = items[0]?.metadata?.split_pending;

            for (const item of items) {
                await supabase
                    .from('orders')
                    .update({
                        metadata: {
                            ...(item.metadata || {}),
                            split_pending: null
                        }
                    })
                    .eq('id', item.id);
            }

            if (pendingData?.targetUserIds) {
                for (const uid of pendingData.targetUserIds) {
                    await api.notifySplitRemoval(uid, {
                        itemName: items.length > 1 ? `${items.length} itens do pedido` : items[0]?.name,
                        requesterName: user?.name || 'Alguém',
                        tableId: items[0]?.table_id
                    });
                }
            }

            addToast("Divisão pendente cancelada.", "info");
            await loadTab();
            window.dispatchEvent(new CustomEvent('tab:reload'));
        } catch (err) {
            console.error("Erro ao cancelar divisão pendente:", err);
            addToast("Erro ao cancelar a divisão.", "error");
        }
    };

    // Solicitações de divisão pendentes aguardando aprovação deste usuário (User B)
    const pendingForMe = visibleOrders.filter(o => {
        const sp = o.metadata?.split_pending;
        return sp && Array.isArray(sp.targetUserIds) && sp.targetUserIds.some(uid => String(uid).toLowerCase() === String(user?.id).toLowerCase()) && o.ordered_by !== user?.id;
    });

    const pendingGroups = useMemo(() => {
        const map = new Map();
        pendingForMe.forEach(o => {
            const key = o.order_batch_id || o.id;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    pendingData: o.metadata?.split_pending,
                    items: []
                });
            }
            map.get(key).items.push(o);
        });
        return Array.from(map.values());
    }, [pendingForMe]);

    const handleAcceptPendingGroup = async (group) => {
        try {
            const { pendingData, items } = group;
            const totalParts = pendingData?.totalParts || 2;
            const tableId = localStorage.getItem('my_table_id');

            for (const item of items) {
                const basePrice = item.original_price ? Number(item.original_price) : Number(item.price);
                const splitPrice = basePrice / totalParts;
                const cleanName = item.name.replace(/^[\d.]+\/[\d.]+\s/, '');

                await api.addSplitOrder(tableId, {
                    productId: item.product_id,
                    name: cleanName,
                    price: splitPrice,
                    quantity: item.quantity || 1,
                    orderedBy: user.id,
                    splitParts: totalParts,
                    originalPrice: basePrice,
                    splitRequester: pendingData.requesterId,
                    splitParticipants: [pendingData.requesterId, user.id],
                    metadata: item.metadata || {},
                    batchId: item.order_batch_id || null
                });

                await supabase
                    .from('orders')
                    .update({
                        name: `1/${totalParts} ${cleanName}`,
                        price: splitPrice,
                        is_split: true,
                        split_parts: totalParts,
                        original_price: basePrice,
                        split_requester: pendingData.requesterId,
                        split_participants: [pendingData.requesterId, user.id],
                        metadata: {
                            ...(item.metadata || {}),
                            split_pending: null
                        }
                    })
                    .eq('id', item.id);
            }

            await api.sendSplitResponse(pendingData.requesterId, 'accepted', user.name || 'Alguém');
            addToast("Divisão aceita com sucesso! 🎉", "success");
            await loadTab();
            window.dispatchEvent(new CustomEvent('tab:reload'));
        } catch (err) {
            console.error("Erro ao aceitar divisão pendente:", err);
            addToast("Erro ao aceitar a divisão.", "error");
        }
    };

    const handleDeclinePendingGroup = async (group) => {
        try {
            const { pendingData, items } = group;
            for (const item of items) {
                await supabase
                    .from('orders')
                    .update({
                        metadata: {
                            ...(item.metadata || {}),
                            split_pending: null
                        }
                    })
                    .eq('id', item.id);
            }
            await api.sendSplitResponse(pendingData.requesterId, 'rejected', user.name || 'Alguém');
            addToast("Divisão recusada.", "info");
            await loadTab();
            window.dispatchEvent(new CustomEvent('tab:reload'));
        } catch (err) {
            console.error("Erro ao recusar divisão pendente:", err);
            addToast("Erro ao recusar a divisão.", "error");
        }
    };

    const handleAcceptAllPendingGroups = async () => {
        for (const group of pendingGroups) {
            await handleAcceptPendingGroup(group);
        }
    };

    if (loading) return <TabDetailSkeleton />;

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <header className="glass-header" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: '6px', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <BrandLogo variant="horizontal" size="xs" glow={false} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                    }}>
                        Mesa {tableNumber || '?'}
                    </span>
                    {establishment?.name && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {establishment.name}
                        </span>
                    )}
                </div>
            </header>

            {pendingGroups.length > 0 && (
                <PendingSplitsBanner
                    pendingGroups={pendingGroups}
                    onAccept={handleAcceptPendingGroup}
                    onDecline={handleDeclinePendingGroup}
                    onAcceptAll={handleAcceptAllPendingGroups}
                />
            )}

            <TabOrderList
                myOrders={myOrdersList}
                othersOrders={othersOrdersList}
                allOrders={orders}
                currentUserId={user?.id}
                showAll={showAll}
                setShowAll={setShowAll}
                onSplitGroup={handleGroupClick}
                onCancelPendingGroup={handleCancelPendingSplit}
                onlineUsers={onlineUsers}
                knownUsers={knownTableUsers}
            />

            {splitItem && (
                <SplitItemModal
                    item={splitItem}
                    currentUser={user}
                    onlineUsers={onlineUsers}
                    initialSelectedUsers={selectedUsersToSplit}
                    disabledUsers={[]}
                    onClose={closeSplitModal}
                    onConfirm={handleModalConfirm}
                    confirmLabel={isEditingSplit ? 'Atualizar Divisão' : 'Confirmar Divisão'}
                />
            )}

            <TabFooter
                mySubtotal={mySubtotal}
                onCallWaiter={() => addToast("Garçom chamado!", "success")}
            />
        </div>
    );
};

const TabDetailSkeleton = () => (
    <div className="container" style={{ paddingBottom: '100px' }}>
        <style>{`
            @keyframes skeleton-pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
            .skeleton { background: var(--bg-tertiary); border-radius: 4px; animation: skeleton-pulse 1.5s ease-in-out infinite; }
        `}</style>

        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div>
                <div className="skeleton" style={{ width: '150px', height: '20px', marginBottom: '4px' }} />
                <div className="skeleton" style={{ width: '80px', height: '14px' }} />
            </div>
        </div>

        <div style={{ marginBottom: '0.5rem', width: '200px', height: '16px' }} className="skeleton" />
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2].map(i => (
                <div key={i} className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--bg-tertiary)' }}>
                    <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ width: '40%', height: '16px' }} />
                </div>
            ))}
        </div>
    </div>
);

export default TabDetail;
