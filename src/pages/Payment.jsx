import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTableContext } from '../context/TableContext';

const Payment = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setTableId } = useTableContext();
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subtotal, setSubtotal] = useState(0);

    // Logic State
    const [serviceFeePercent, setServiceFeePercent] = useState(10); // 8, 10, 13
    const [removeFeeReason, setRemoveFeeReason] = useState('');
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [feeRemoved, setFeeRemoved] = useState(false);

    const appFee = 1.99;

    useEffect(() => {
        const loadPaymentData = async () => {
            const tableId = localStorage.getItem('my_table_id');
            if (!tableId) {
                // If no table, maybe just showing 0 or redirect
                setLoading(false);
                return;
            }

            try {
                const tableData = await api.getTable(tableId);
                const orders = tableData?.orders || [];

                // Filter my orders (Using UUID now!)
                const myId = user?.id;
                const myOrders = orders.filter(o =>
                    o.ordered_by === myId ||                // Match UUID
                    o.ordered_by === myId // Redundant check removed, strict UUID match
                );

                // Fallback for demo specific names if UUID fails or old data
                // const myOrders = orders.filter(o => o.ordered_by === myId); 

                const myTotal = myOrders.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setSubtotal(myTotal);
            } catch (error) {
                console.error("Error loading payment info", error);
            } finally {
                setLoading(false);
            }
        };
        loadPaymentData();
    }, [user]); // user dependency to ensure name is ready

    const calculateTotal = () => {
        let fee = 0;
        if (!feeRemoved) {
            fee = subtotal * (serviceFeePercent / 100);
        }
        return subtotal + fee + appFee;
    };

    const serviceFeeValue = subtotal * (serviceFeePercent / 100);
    const total = calculateTotal();

    const handleRemoveFee = () => {
        if (removeFeeReason.trim().length < 5) {
            alert("Por favor, explique o motivo.");
            return;
        }
        setFeeRemoved(true);
        setShowRemoveModal(false);
    };

    const handlePayment = async () => {
        setLoading(true);
        // Simulate payment delay
        await new Promise(r => setTimeout(r, 1500));

        // Clear from Database (User Req: "Limpe tudo da mesa")
        /* 
           NOTE: In a real app, we wouldn't delete orders, just mark as 'paid'. 
           But for this Demo flow, user asked to "Close/Clear" the table.
           However, if we clear BEFORE showing Receipt, it's fine.
        */
        const tableId = localStorage.getItem('my_table_id');
        if (tableId) {
            await api.clearTableOrders(tableId);
        }

        setSuccess(true);
        setLoading(false);
        // We do NOT clear localStorage here yet, to keep the receipt "branded"
        // We will clear it when they click "Back to Home"
    };

    if (success) {
        // Generate a random hash for the receipt
        const receiptHash = Math.random().toString(36).substring(2, 10).toUpperCase();

        return (
            <div className="container" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                <div style={{
                    background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px',
                    width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <CheckCircle size={48} color="#22c55e" />
                    </div>

                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Pagamento Confirmado!</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Apresente este código na saída se solicitado.
                    </p>

                    {/* FAKE QR CODE FOR DEMO */}
                    <div style={{
                        background: 'white', padding: '1rem', borderRadius: '12px',
                        margin: '1rem 0', width: '200px', height: '200px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=IMP-${receiptHash}`}
                            alt="QR Code"
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Código de Saída</span>
                        <div style={{
                            background: 'var(--bg-tertiary)', padding: '0.5rem 1.5rem',
                            borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.4rem',
                            letterSpacing: '2px', fontWeight: 'bold', color: 'var(--primary)'
                        }}>
                            #{receiptHash}
                        </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Mesa encerrada. Obrigado pela preferência!
                    </p>

                    <button onClick={() => {
                        setTableId(null);
                        navigate('/');
                    }} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                        Voltar ao Início
                    </button>
                </div>
                <style>{`
                    @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                `}</style>
            </div>
        );
    }

    if (loading) return <div className="container" style={{ justifyContent: 'center', textAlign: 'center' }}>Carregando pagamento...</div>;

    return (
        <div className="container fade-in">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <h2 style={{ margin: 0 }}>Pagamento</h2>
            </header>

            {/* Bill Breakdown */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Resumo</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal (Sua parte)</span>
                    <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {/* App Fee */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    <span>Taxa do App (Fixo)</span>
                    <span>{appFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {/* Service Fee Selection */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span>Taxa de Serviço ({feeRemoved ? 'removida' : `${serviceFeePercent}%`})</span>
                        <span>
                            {feeRemoved
                                ? 'R$ 0,00'
                                : serviceFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            }
                        </span>
                    </div>

                    {!feeRemoved && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {[8, 10, 13].map((pct) => (
                                <button
                                    key={pct}
                                    onClick={() => setServiceFeePercent(pct)}
                                    className={`btn ${serviceFeePercent === pct ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.5rem', fontSize: '0.9rem', width: 'auto', flex: 1, minHeight: 'unset' }}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    )}

                    {!feeRemoved ? (
                        <div style={{ textAlign: 'right' }}>
                            <button
                                onClick={() => setShowRemoveModal(true)}
                                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                Não pagar taxa de serviço
                            </button>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--warning)', textAlign: 'right' }}>
                            Motivo: {removeFeeReason}
                        </div>
                    )}
                </div>

                {/* Total */}
                <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Total</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Forma de Pagamento</h3>

            <div style={{ display: 'grid', gap: '1rem', paddingBottom: '2rem' }}>
                <button className="btn btn-secondary" onClick={handlePayment}>
                    PIX
                </button>
                <button className="btn btn-secondary" onClick={handlePayment}>
                    Cartão de Crédito
                </button>
                <button className="btn btn-secondary" onClick={handlePayment}>
                    Apple Pay
                </button>
            </div>

            {/* Remove Fee Modal */}
            {showRemoveModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '360px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Remover Taxa</h3>
                            <button onClick={() => setShowRemoveModal(false)} className="btn-ghost" style={{ width: 'auto' }}><X /></button>
                        </div>

                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: '0.9rem' }}>A taxa de serviço vai integralmente para a equipe de atendimento.</p>
                        </div>

                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Por que deseja remover?</label>
                        <textarea
                            className="input-field"
                            rows="3"
                            placeholder="Mal atendimento, demora, etc..."
                            value={removeFeeReason}
                            onChange={(e) => setRemoveFeeReason(e.target.value)}
                        />

                        <button
                            onClick={handleRemoveFee}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem', background: 'var(--danger)' }}
                        >
                            Confirmar Remoção
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Payment;
