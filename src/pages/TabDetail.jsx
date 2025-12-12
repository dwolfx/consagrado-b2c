import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertCircle, CreditCard, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTablePresence } from '../hooks/useTablePresence';

const TabDetail = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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

    // Filter out internal notification items AND paid items (as requested only unpaid active items)
    // Also filtering out faulty zero-price items from demo data
    const visibleOrders = orders.filter(o =>
        o.name !== '🔔 CHAMAR GARÇOM' &&
        o.status !== 'paid' &&
        o.price > 0
    );

    const myOrders = visibleOrders.filter(o => o.ordered_by === user?.id);

    // Calculate My Share
    const mySubtotal = myOrders.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const myServiceFee = mySubtotal > 0 ? mySubtotal * 0.10 : 0; // Explicit check for clarity
    const myTotal = mySubtotal + myServiceFee;

    // Calculate Table Total (Active)
    const totalTabSub = visibleOrders.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalTabFee = totalTabSub * 0.10;
    const totalTab = totalTabSub + totalTabFee;

    const formatPrice = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) return <div className="container" style={{ justifyContent: 'center', textAlign: 'center' }}>Carregando conta...</div>;

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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1rem', marginTop: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>Consumo da Mesa</h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Total: <strong>{formatPrice(totalTab)}</strong>
                </span>
            </div>

            {/* Items List */}
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '6rem' }}>
                {visibleOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        Nenhum pedido ainda.
                    </div>
                ) : (
                    visibleOrders.map(item => {
                        const isMine = item.ordered_by === user?.id;
                        const displayName = isMine ? 'Você' : resolveName(item.ordered_by);

                        const getStatusConfig = (s) => {
                            switch (s) {
                                case 'pending': return { label: 'Aguardando', color: '#b45309', bg: '#fef3c7' }; // Yellow-700/100
                                case 'preparing': return { label: 'Preparando', color: '#1d4ed8', bg: '#dbeafe' }; // Blue-700/100
                                case 'ready':
                                case 'delivered':
                                case 'completed': return { label: 'Entregando', color: '#15803d', bg: '#dcfce7' }; // Green-700/100
                                case 'paid': return { label: 'Pago', color: '#15803d', bg: '#dcfce7' };
                                default: return { label: s, color: '#374151', bg: '#f3f4f6' };
                            }
                        };
                        const statusConfig = getStatusConfig(item.status);

                        return (
                            <div key={item.id} className="card" style={{ marginBottom: 0, borderLeft: isMine ? '4px solid var(--primary)' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>{item.quantity}x {item.name}</span>
                                    <span style={{ fontWeight: '700' }}>{formatPrice(item.price * item.quantity)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: isMine ? 'var(--primary)' : 'var(--text-secondary)',
                                        fontWeight: isMine ? 'bold' : 'normal'
                                    }}>
                                        {displayName}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px',
                                        backgroundColor: statusConfig.bg,
                                        color: statusConfig.color,
                                        fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Card Removed as requested */}


            <footer style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--bg-tertiary)',
                display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center'
            }}>
                <button
                    onClick={() => alert("Garçom chamado!")}
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

export default TabDetail;
