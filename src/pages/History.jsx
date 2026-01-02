import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const History = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [historyGroups, setHistoryGroups] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.id) return;
            const orders = await api.getUserHistory(user.id);

            // Group by "Visit" (Simple heuristic: Date + Establishment + Table)
            // Or simpler: Date + Establishment
            const groups = {};

            orders.forEach(order => {
                // specific date string DD/MM/YYYY
                const dateObj = new Date(order.created_at);
                const dateKey = dateObj.toLocaleDateString('pt-BR');
                const estabName = order.table?.establishment?.name || order.establishment?.name || 'Local Desconhecido';

                // Composite Key
                const key = `${dateKey}-${estabName}`;

                if (!groups[key]) {
                    groups[key] = {
                        id: key,
                        place: estabName,
                        date: dateKey,
                        timestamp: dateObj.getTime(), // for sorting
                        items: [],
                        total: 0
                    };
                }

                groups[key].items.push(order);
            });

            // Convert to array and sort by latest
            const sortedGroups = Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
            setHistoryGroups(sortedGroups);
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    const openReceipt = (order) => setSelectedOrder(order);
    const closeReceipt = () => setSelectedOrder(null);

    return (
        <div className="container fade-in">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft color="white" />
                </button>
                <h2 style={{ margin: 0 }}>Histórico</h2>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? <div style={{ textAlign: 'center', opacity: 0.7 }}>Carregando histórico...</div> :
                    historyGroups.length === 0 ? <div style={{ textAlign: 'center', opacity: 0.7 }}>Nenhum pedido anterior.</div> :
                        historyGroups.map(group => {
                            const getHistoryItemPrice = (i) => {
                                // Robustness: reuse split logic if recorded
                                if (i.is_split && i.split_parts > 1 && i.original_price > 0) {
                                    return Number(i.original_price) / i.split_parts;
                                }
                                return Number(i.price);
                            };

                            const itemSubtotal = group.items.reduce((acc, i) => acc + (getHistoryItemPrice(i) * i.quantity), 0);

                            // Use stored metadata if checking specific receipt logic, but here generalized:
                            const itemTotal = itemSubtotal * 1.04 + 1.99; // Approx (Taxa Serviço agrupa 4% + 1.99)

                            return (
                                <div key={group.id} className="card" onClick={() => openReceipt(group)} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{group.place}</h3>
                                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                            {itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <Calendar size={16} />
                                        {group.date} • {group.items.length} itens
                                    </div>
                                </div>
                            );
                        })}
            </div>

            {/* Receipt Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
                    display: 'flex', alignItems: 'end', justifyContent: 'center',
                    backdropFilter: 'blur(5px)',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={closeReceipt}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        width: '100%', maxWidth: '480px',
                        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                        padding: '2rem', maxHeight: '85vh', overflowY: 'auto',
                        position: 'relative', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', margin: '0 auto 2rem auto' }}></div>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                <CheckCircle size={32} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pagamento Confirmado</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>{selectedOrder.date} • {selectedOrder.place}</p>
                        </div>

                        <div style={{ borderTop: '1px dashed var(--bg-tertiary)', borderBottom: '1px dashed var(--bg-tertiary)', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
                            {selectedOrder.items.map((item, idx) => {
                                const realPrice = (item.is_split && item.split_parts > 1 && item.original_price > 0)
                                    ? (Number(item.original_price) / item.split_parts)
                                    : Number(item.price);
                                return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.name}</span>
                                        <span>{(realPrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                );
                            })}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <span>Taxa do App</span>
                                <span>R$ 1,99</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <span>Taxas de Serviço e Maquininha</span>
                                <span>
                                    {/* Calculated as Total - Subtotal - AppFee to be exact or approx */}
                                    {(() => {
                                        const getP = (i) => (i.is_split && i.split_parts > 1 && i.original_price > 0) ? (Number(i.original_price) / i.split_parts) : Number(i.price);
                                        const sub = selectedOrder.items.reduce((acc, i) => acc + (getP(i) * i.quantity), 0);
                                        const fees = (sub * 0.04);
                                        return fees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Total Pago</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
                                    {(() => {
                                        // Helper defined here for scope access
                                        const getP = (i) => (i.is_split && i.split_parts > 1 && i.original_price > 0) ? (Number(i.original_price) / i.split_parts) : Number(i.price);
                                        const sub = selectedOrder.items.reduce((acc, i) => acc + (getP(i) * i.quantity), 0);
                                        const final = sub * 1.04 + 1.99; // Updated logic: 4% + 1.99
                                        return final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    })()}
                                </span>
                            </span>
                        </div>

                        <button className="btn btn-secondary" onClick={closeReceipt}>
                            Fechar Recibo
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default History;
