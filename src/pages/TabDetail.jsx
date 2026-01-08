import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertCircle, CreditCard, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTablePresence } from '../hooks/useTablePresence';
import { useToast } from '../context/ToastContext';
import SplitItemModal from '../components/SplitItemModal';

const TabDetail = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { onlineUsers } = useTablePresence();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [establishment, setEstablishment] = useState(null);
    const [tableNumber, setTableNumber] = useState(null);

    useEffect(() => {
        const loadTab = async () => {
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
        };
        loadTab();

        // Realtime Subscription
        const tableId = localStorage.getItem('my_table_id');
        if (tableId) {
            const channel = supabase.channel(`tab_detail:${tableId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, () => {
                    loadTab();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [navigate]);

    // Name Resolution Helper
    const resolveName = (id) => {
        if (!id) return 'Desconhecido';
        if (id === user?.id) return 'Você';

        // Check online users list (which caches DB users too)
        const found = onlineUsers.find(u => u.id === id);
        if (found) return found.name;

        // Fallback for Demo IDs (if not in online list for some reason)
        if (id === '22222222-2222-2222-2222-222222222222') return 'Amiga da Demo';
        if (id === '00000000-0000-0000-0000-000000000000') return 'Demo User';

        // Check if ID looks like UUID, if not, it might be a name (legacy/guest)
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}/.test(id)) return id;

        return 'Cliente';
    };

    const [showAll, setShowAll] = useState(false);

    // Split Logic
    const [splitItem, setSplitItem] = useState(null);
    const [selectedUsersToSplit, setSelectedUsersToSplit] = useState([]);

    const [isEditingSplit, setIsEditingSplit] = useState(false);
    const [relatedSplitOrders, setRelatedSplitOrders] = useState([]);

    const handleItemClick = (item) => {
        console.log("🖱️ Item Clicked:", item);
        // Only allow splitting unpaid active items
        if (item.status === 'paid') {
            console.warn("🚫 Item is paid, blocking split.");
            return;
        }

        // Check if this item is ALREADY part of a split
        // Heuristic: Name starts with digit + "/" + digit => "1/2 Pizza"
        const isSplit = /^\d+\/\d+\s/.test(item.name);

        if (isSplit) {
            // Find ALL related orders for this split group
            // Match by product_id AND Clean Name AND Price (approx) OR just items that look like siblings
            // Robust: Same product_id, same created_at (± seconds), same name pattern
            // For MVP: Filter visibleOrders by same product_id and same Name
            const siblings = visibleOrders.filter(o =>
                o.product_id === item.product_id &&
                o.name === item.name &&
                Math.abs(o.price - item.price) < 0.01 // float Safe
            );

            // If we found the family
            if (siblings.length > 0) {
                const siblingUserIds = siblings.map(s => s.ordered_by);
                setSelectedUsersToSplit(siblingUserIds);
                setRelatedSplitOrders(siblings);
                setIsEditingSplit(true);
                setSplitItem(item); // One of them serves as proxy
                return;
            }
        }

        // Normal New Split
        console.log("✨ Opening NEW split modal for:", item);
        setSplitItem(item);
        setSelectedUsersToSplit([user?.id]); // Default to self for new split
        setIsEditingSplit(false);
        setRelatedSplitOrders([]);
    };

    const toggleUserSelection = (uid) => {
        if (selectedUsersToSplit.includes(uid)) {
            // Prevent removing ONLY user? No, if 0 users, button disabled.
            setSelectedUsersToSplit(prev => prev.filter(id => id !== uid));
        } else {
            setSelectedUsersToSplit(prev => [...prev, uid]);
        }
    };

    const handleModalConfirm = async (itemFromModal, finalSelectedUsers) => {
        if (!itemFromModal || finalSelectedUsers.length === 0) return;

        console.log("🚩 [TabDetail] Confirming Split:", { itemFromModal, finalSelectedUsers, isEditingSplit });

        if (isEditingSplit) {
            // REDISTRIBUTE
            await api.redistributeOrder(relatedSplitOrders, finalSelectedUsers);
            addToast("Divisão atualizada!", "success");
        } else {
            // NEW SPLIT REQUEST
            await api.requestSplit(itemFromModal, finalSelectedUsers, user.name || 'Alguém', user.id);
            addToast("Solicitação enviada!", "success");
        }

        setSplitItem(null);
        setIsEditingSplit(false);
        setRelatedSplitOrders([]);
    };

    // Filter out internal notification items AND paid items (as requested only unpaid active items)
    // Also filtering out faulty zero-price items from demo data
    // DEBUG: Log all orders to see if split item is present but filtered
    console.log("📊 TabDetail Raw Orders:", orders);

    // Helper to calculate Display Price honoring Metadata
    const getDisplayPrice = (item) => {
        // Resilience: If it is a split item AND has metadata, reconstruct the price
        // This fixes the DB overriding price issue
        if (item.is_split && item.split_parts > 1 && item.original_price > 0) {
            const mathPrice = Number(item.original_price) / item.split_parts;
            // Use math price if DB price is suspiciously close to original (full price bug)
            // OR just always trust metadata for splits. Let's trust metadata as it is strict logic.
            return mathPrice;
        }
        return Number(item.price);
    };

    const visibleOrders = orders.filter(o => {
        // Use corrected price for logic
        const realPrice = getDisplayPrice(o);
        const name = o.name || 'Unnamed';

        const isInternal = name === '🔔 CHAMAR GARÇOM' || o.status === 'service_call';
        const isPaid = o.status === 'paid';
        const isPricePositive = realPrice > 0; // Check corrected price

        const isVisible = !isInternal && !isPaid && isPricePositive;
        return isVisible;
    });

    // Split Lists
    const myOrdersList = visibleOrders.filter(o => o.ordered_by === user?.id);
    const othersOrdersList = visibleOrders.filter(o => o.ordered_by !== user?.id);

    // Calculate My Share using Corrected Prices
    const mySubtotal = myOrdersList.reduce((acc, item) => acc + (getDisplayPrice(item) * item.quantity), 0);

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

    // Calculate Table Total (Active) with ALL Fees
    const totalTabSub = visibleOrders.reduce((acc, item) => acc + (getDisplayPrice(item) * item.quantity), 0);
    const totalTabService = totalTabSub * 0.10;

    // Machine Fee (4% on subtotal + service)
    const totalTabMachine = (totalTabSub + totalTabService) * 0.04;

    // App Fee (Estimate: 1.99 * Unique Active Users)
    // Filter distinct non-guest IDs to estimate app fees
    // FIXED: Only count fee if there are actual orders. Remove "|| 1" fallback.
    const uniqueUsersCount = visibleOrders.length > 0
        ? (new Set(visibleOrders.map(o => o.ordered_by).filter(id => id && id.length > 20)).size || 1)
        : 0;

    const totalTabApp = uniqueUsersCount * 1.99;

    const totalTab = totalTabSub + totalTabService + totalTabMachine + totalTabApp;

    const formatPrice = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) return <TabDetailSkeleton />;

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            {/* Header Updated */}
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>{establishment?.name || 'Restaurante'}</h2>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mesa {tableNumber || '?'}</span>
                </div>
            </header>



            {/* Items List */}
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '6rem' }}>

                {/* Meus Pedidos */}
                <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.9 }}>Seus Pedidos (Toque para dividir)</h4>
                {myOrdersList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                        Você ainda não pediu nada.
                    </div>
                ) : (
                    myOrdersList.map(item => {
                        const statusConfig = getStatusConfig(item.status);
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
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

                {/* SPLIT MODAL */}
                {splitItem && (
                    <SplitItemModal
                        item={splitItem}
                        currentUser={user}
                        onlineUsers={onlineUsers}
                        initialSelectedUsers={selectedUsersToSplit}
                        onClose={() => {
                            setSplitItem(null);
                            setIsEditingSplit(false);
                        }}
                        onConfirm={handleModalConfirm}
                        confirmLabel={isEditingSplit ? 'Atualizar Divisão' : 'Confirmar Divisão'}
                    />
                )}

                {/* Pedidos da Mesa (Toggle) */}
                {othersOrdersList.length > 0 && (
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
                                {showAll ? 'Ocultar Mesa' : `Ver Mesa (+${othersOrdersList.length})`}
                            </button>
                            <div style={{ height: '1px', flex: 1, background: 'var(--bg-tertiary)' }}></div>
                        </div>

                        {showAll && (
                            <div style={{ display: 'grid', gap: '1rem', animation: 'fadeIn 0.3s' }}>
                                {othersOrdersList.map(item => {
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
                                    <span><strong>{formatPrice(totalTabSub)} + taxas</strong></span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* Card Removed as requested */}


            <footer style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--bg-tertiary)',
                display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center'
            }}>
                <button
                    onClick={() => addToast("Garçom chamado!", "success")}
                    className="btn btn-secondary"
                    style={{ width: 'auto', padding: '0.75rem', fontSize: '0.8rem' }}
                >
                    <Bell size={18} />
                    Ajuda
                </button>
                <button
                    onClick={() => navigate('/payment')}
                    className="btn btn-primary"
                    style={{ flex: 1, flexDirection: 'column', gap: '0', alignItems: 'center', padding: '0.5rem' }}
                >
                    <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.9 }}>Pagar sua parte</span>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{formatPrice(mySubtotal)} + taxas</span>
                </button>
            </footer>
        </div>
    );
};

const TabDetailSkeleton = () => (
    <div className="container" style={{ paddingBottom: '100px' }}>
        <style>{`
            @keyframes skeleton-pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
            .skeleton { background: var(--bg-tertiary); border-radius: 4px; animation: skeleton-pulse 1.5s ease-in-out infinite; }
        `}</style>

        {/* Header */}
        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div>
                <div className="skeleton" style={{ width: '150px', height: '20px', marginBottom: '4px' }} />
                <div className="skeleton" style={{ width: '80px', height: '14px' }} />
            </div>
        </div>

        {/* My Orders Section */}
        <div style={{ marginBottom: '0.5rem', width: '200px', height: '16px' }} className="skeleton" />
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2].map(i => (
                <div key={i} className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div className="skeleton" style={{ width: '60%', height: '20px' }} />
                        <div className="skeleton" style={{ width: '20%', height: '20px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="skeleton" style={{ width: '40px', height: '16px' }} />
                        <div className="skeleton" style={{ width: '80px', height: '16px' }} />
                    </div>
                </div>
            ))}
        </div>

        {/* Others Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ height: '1px', flex: 1, background: 'var(--bg-tertiary)' }}></div>
            <div className="skeleton" style={{ width: '120px', height: '32px', borderRadius: '20px' }} />
            <div style={{ height: '1px', flex: 1, background: 'var(--bg-tertiary)' }}></div>
        </div>

        {/* Footer */}
        <footer style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--bg-tertiary)',
            display: 'flex', gap: '1rem', justifyContent: 'center'
        }}>
            <div className="skeleton" style={{ width: '80px', height: '48px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ flex: 1, height: '48px', borderRadius: '8px' }} />
        </footer>
    </div>
);

export default TabDetail;
