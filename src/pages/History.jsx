import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';

const History = () => {
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState(null);

    const historyData = [
        {
            id: 1, place: "Bar do Zé", date: "27/10/2023", total: 148.50,
            items: [
                { name: "Cerveja Heineken 600ml", quantity: 3, price: 18.00 },
                { name: "Batata Frita c/ Cheddar", quantity: 1, price: 32.00 },
                { name: "Água sem Gás", quantity: 2, price: 5.00 },
                { name: "Caipirinha Limão", quantity: 1, price: 25.00 }
            ]
        },
        {
            id: 2, place: "Pub O'Malleys", date: "20/10/2023", total: 98.89,
            items: [
                { name: "Pint Guinness", quantity: 2, price: 32.00 },
                { name: "Fish and Chips", quantity: 1, price: 45.00 }
            ]
        },
    ];

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
                {historyData.map(item => (
                    <div key={item.id} className="card" onClick={() => openReceipt(item)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{item.place}</h3>
                            <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <Calendar size={16} />
                            {item.date}
                        </div>
                    </div>
                ))}
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
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.name}</span>
                                    <span>{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            ))}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <span>Taxa de Serviço (10%)</span>
                                <span>R$ {(selectedOrder.total * 0.1).toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Total Pago</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
                                {(selectedOrder.total * 1.1).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
