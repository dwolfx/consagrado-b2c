import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTablePresence } from '../../hooks/useTablePresence';
import { useToast } from '../../context/ToastContext';
import SplitItemModal from '../../components/SplitItemModal';

// Components
import TabOrderList from './components/TabOrderList';
import TabFooter from './components/TabFooter';

// Hooks
import { useSplitLogic } from './hooks/useSplitLogic';

const TabDetail = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { onlineUsers } = useTablePresence();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [establishment, setEstablishment] = useState(null);
    const [tableNumber, setTableNumber] = useState(null);
    const [showAll, setShowAll] = useState(false);

    // --- DATA LOADING ---
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

    useEffect(() => {
        loadTab();
        const tableId = localStorage.getItem('my_table_id');
        if (tableId) {
            const channel = supabase.channel(`tab_detail:${tableId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, () => {
                    loadTab();
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [navigate]);

    // --- LOGIC HELPERS ---
    const resolveName = (id) => {
        if (!id) return 'Desconhecido';
        if (id === user?.id) return 'Você';
        const found = onlineUsers.find(u => u.id === id);
        if (found) return found.name;
        if (id === '22222222-2222-2222-2222-222222222222') return 'Amiga da Demo';
        if (id === '00000000-0000-0000-0000-000000000000') return 'Demo User';
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}/.test(id)) return id;
        return 'Cliente';
    };

    const getDisplayPrice = (item) => {
        if (item.is_split && item.split_parts > 1 && item.original_price > 0) {
            return Number(item.original_price) / item.split_parts;
        }
        return Number(item.price);
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
        splitItem, selectedUsersToSplit, isEditingSplit, existingParticipants,
        handleItemClick, handleModalConfirm, closeSplitModal
    } = useSplitLogic(visibleOrders);

    // Derived Lists
    const myOrdersList = visibleOrders.filter(o => o.ordered_by === user?.id);
    const othersOrdersList = visibleOrders.filter(o => o.ordered_by !== user?.id);
    const mySubtotal = myOrdersList.reduce((acc, item) => acc + (getDisplayPrice(item) * item.quantity), 0);

    if (loading) return <TabDetailSkeleton />;

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>{establishment?.name || 'Restaurante'}</h2>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mesa {tableNumber || '?'}</span>
                </div>
            </header>

            <TabOrderList
                myOrders={myOrdersList}
                othersOrders={othersOrdersList}
                showAll={showAll}
                setShowAll={setShowAll}
                resolveName={resolveName}
                onSplitItem={handleItemClick}
                onlineUsers={onlineUsers}
            />

            {splitItem && (
                <SplitItemModal
                    item={splitItem}
                    currentUser={user}
                    onlineUsers={onlineUsers}
                    initialSelectedUsers={selectedUsersToSplit}
                    disabledUsers={existingParticipants}
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
