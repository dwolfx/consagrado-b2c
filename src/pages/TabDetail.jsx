import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertCircle, CreditCard, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TabDetail = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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

    // Filter my orders
    // Logic: If user is logged in, match by name. If 'guest', match by 'Eu' maybe? 
    // For now, simpler: verify if orderedBy contains name or is 'Eu' (if guest ordered as Eu)
    // Actually, Menu sends: user?.name || 'Eu' (if explicit guest) or 'Cliente'.
    const myName = user?.name || 'Eu';

    // Filter out internal notification items (e.g. Call Waiter)
    const visibleOrders = orders.filter(o => o.name !== '🔔 CHAMAR GARÇOM');

    const myOrders = visibleOrders.filter(o => o.ordered_by === myName);
    const myTotal = myOrders.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const totalTab = visibleOrders.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const formatPrice = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) return <div className="container" style={{ justifyContent: 'center', textAlign: 'center' }}>Carregando conta...</div>;

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
                <button className="btn-ghost" style={{ marginLeft: 'auto', color: 'var(--warning)' }}>
                    <Bell />
                </button>
            </header>

            {/* My Summary */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary)', color: 'white' }}>
                <div>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Sua parte</span>
                    <h1 style={{ fontSize: '2rem' }}>{formatPrice(myTotal)}</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Mesa</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatPrice(totalTab)}</div>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Consumo da Mesa</h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {visibleOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        Nenhum pedido ainda.
                    </div>
                ) : (
                    visibleOrders.map(item => {
                        const isMine = item.ordered_by === myName;
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
                                        {isMine ? 'Você' : item.ordered_by}
                                    </span>
                                    {item.status !== 'pending' && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }}>{item.status}</span>}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <footer style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--bg-tertiary)',
                display: 'flex', gap: '1rem', justifyContent: 'center'
            }}>
                <button
                    onClick={() => alert("Garçom chamado!")}
                    className="btn btn-secondary"
                    style={{ width: 'auto', flex: 1 }}
                >
                    <Bell size={20} />
                    Garçom
                </button>
                <button
                    onClick={() => navigate('/payment')}
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                >
                    <CreditCard size={20} />
                    Pagar Conta
                </button>
            </footer>
        </div>
    );
};

export default TabDetail;
