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
    const [myOrders, setMyOrders] = useState([]); // Store items for review

    // Logic State
    const [serviceFeePercent, setServiceFeePercent] = useState(10); // 8, 10, 13
    const [removeFeeReason, setRemoveFeeReason] = useState('');
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [feeRemoved, setFeeRemoved] = useState(false);

    // const appFee = 1.99; // Moved to conditional logic

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
                // Filter my orders: UUID match AND NOT PAID
                const myId = user?.id;
                const myOrders = orders.filter(o =>
                    (o.ordered_by === myId) &&
                    (o.status !== 'paid') && // CRITICAL: Exclude previously paid items
                    (o.status !== 'service_call') // Exclude service calls from payment
                );

                // Helper to ensure split price correctness
                const getDisplayPrice = (item) => {
                    if (item.is_split && item.split_parts > 1 && item.original_price > 0) {
                        return Number(item.original_price) / item.split_parts;
                    }
                    return Number(item.price);
                };

                const myTotal = myOrders.reduce((acc, item) => acc + (getDisplayPrice(item) * item.quantity), 0);
                setSubtotal(myTotal);

                // Store items with corrected price for display
                const ordersWithCorrectedPrice = myOrders.map(o => ({
                    ...o,
                    price: getDisplayPrice(o) // Override price with calculated one for UI
                }));
                setMyOrders(ordersWithCorrectedPrice);
            } catch (error) {
                console.error("Error loading payment info", error);
            } finally {
                setLoading(false);
            }
        };
        loadPaymentData();
    }, [user]); // user dependency to ensure name is ready

    // Fees Logic
    const [showFeeInfo, setShowFeeInfo] = useState(false);
    const [showItemsInfo, setShowItemsInfo] = useState(false);
    const applicableAppFee = subtotal > 0 ? 1.99 : 0;

    // "Gorjeta" (Waitstaff Tip) - formerly serviceFee
    const tipValue = subtotal * (serviceFeePercent / 100);
    const displayedTip = feeRemoved ? 0 : tipValue;

    // "Taxa de Serviço" (Operational = Machine 4% + App 1.99)
    // Machine Fee applies to everything paid
    const machineFeeValue = (subtotal + displayedTip) * 0.04;
    const operationalFeeValue = machineFeeValue + applicableAppFee;

    const total = subtotal + displayedTip + operationalFeeValue;

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

        // Create History Record (Mark as Paid)
        const tableId = localStorage.getItem('my_table_id');
        if (tableId && user?.id) {
            await api.payUserOrders(tableId, user.id);
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

    if (loading) return <PaymentSkeleton />;

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

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Subtotal (Sua parte)</span>
                        <button
                            onClick={() => setShowItemsInfo(true)}
                            style={{
                                background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%',
                                width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer'
                            }}>
                            ?
                        </button>
                    </div>
                    <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {/* Taxa de Serviço (Operational) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Taxa de Serviço</span>
                        <button
                            onClick={() => setShowFeeInfo(true)}
                            style={{
                                background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%',
                                width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer'
                            }}>
                            ?
                        </button>
                    </div>
                    <span>{operationalFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {/* Gratificação Selection (Formerly Gorjeta) */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span>Gratificação da Equipe ({feeRemoved ? 'removida' : `${serviceFeePercent}%`})</span>
                        <span>
                            {feeRemoved
                                ? 'R$ 0,00'
                                : tipValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
                                    style={{ padding: '0.5rem 0.25rem', fontSize: '0.8rem', width: 'auto', flex: 1, minHeight: '32px' }}
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
                                Não pagar gratificação
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
                            <h3>Remover Gratificação</h3>
                            <button onClick={() => setShowRemoveModal(false)} className="btn-ghost" style={{ width: 'auto' }}><X /></button>
                        </div>

                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: '0.9rem' }}>A gratificação vai integralmente para a equipe de atendimento.</p>
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

            {/* TAX INFO MODAL */}
            {showFeeInfo && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'end', justifyContent: 'center', zIndex: 110, padding: 0
                }} onClick={() => setShowFeeInfo(false)}>
                    <div style={{
                        width: '100%', maxWidth: '480px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                        padding: '2rem', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', margin: '0 auto 2rem auto' }}></div>

                        <h3 style={{ marginBottom: '1.5rem' }}>Entenda as Taxas</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                            <span>Taxa Maquininha (4%)</span>
                            <span>{machineFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                            <span>Taxa do App (Fixo)</span>
                            <span>{applicableAppFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold' }}>
                            <span>Total Taxa de Serviço</span>
                            <span>{operationalFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>

                        <button
                            onClick={() => setShowFeeInfo(false)}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem' }}>
                            Entendi
                        </button>
                    </div>
                </div>
            )}

            {/* ITEMS INFO MODAL */}
            {showItemsInfo && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'end', justifyContent: 'center', zIndex: 110, padding: 0
                }} onClick={() => setShowItemsInfo(false)}>
                    <div style={{
                        width: '100%', maxWidth: '480px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                        padding: '2rem', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', margin: '0 auto 1.5rem auto', flexShrink: 0 }}></div>

                        <h3 style={{ marginBottom: '1rem', flexShrink: 0 }}>Seu Consumo</h3>

                        <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1rem' }}>
                            {myOrders.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Nenhum item encontrado.</p>
                            ) : (
                                myOrders.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--bg-tertiary)' }}>
                                        <div>
                                            <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{item.quantity}x</span>
                                            <span>{item.name}</span>
                                        </div>
                                        <span>{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold', borderTop: '2px solid var(--bg-tertiary)', flexShrink: 0 }}>
                            <span>Total Itens</span>
                            <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>

                        <button
                            onClick={() => setShowItemsInfo(false)}
                            className="btn btn-primary"
                            style={{ marginTop: '0.5rem', flexShrink: 0 }}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

const PaymentSkeleton = () => (
    <div className="container fade-in">
        <style>{`
            @keyframes skeleton-pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
            }
            .skeleton {
                background: var(--bg-tertiary);
                border-radius: 4px;
                animation: skeleton-pulse 1.5s ease-in-out infinite;
            }
        `}</style>

        {/* Header Skeleton */}
        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '150px', height: '32px' }} />
        </div>

        {/* Bill Card Skeleton */}
        <div className="card">
            <div className="skeleton" style={{ width: '100px', height: '24px', marginBottom: '1.5rem' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '120px', height: '20px' }} />
                <div className="skeleton" style={{ width: '80px', height: '20px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '140px', height: '20px' }} />
                <div className="skeleton" style={{ width: '60px', height: '20px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '100px', height: '20px' }} />
                <div className="skeleton" style={{ width: '90px', height: '20px' }} />
            </div>

            <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ width: '60px', height: '28px' }} />
                <div className="skeleton" style={{ width: '100px', height: '28px' }} />
            </div>
        </div>

        {/* Payment Buttons Skeleton */}
        <div className="skeleton" style={{ width: '200px', height: '24px', marginBottom: '1rem', marginTop: '1rem' }} />
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
        </div>
    </div>
);

export default Payment;
