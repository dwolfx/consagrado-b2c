import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

const Payment = () => {
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);

    // Logic State
    const [serviceFeePercent, setServiceFeePercent] = useState(10); // 8, 10, 13
    const [removeFeeReason, setRemoveFeeReason] = useState('');
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [feeRemoved, setFeeRemoved] = useState(false);

    const subtotal = 135.00;
    const appFee = 1.99;

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

    const handlePayment = () => {
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="container" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <CheckCircle size={80} color="var(--success)" style={{ marginBottom: '1rem' }} />
                <h1>Pago com Sucesso!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Você já pode sair. A comanda foi encerrada.
                </p>
                <button onClick={() => navigate('/')} className="btn btn-secondary">
                    Voltar ao Início
                </button>
            </div>
        );
    }

    return (
        <div className="container" style={{ position: 'relative' }}>
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <h2>Pagamento</h2>
            </header>

            {/* Bill Breakdown */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Resumo</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                                    className={`btn ${serviceFeePercent === pct ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.5rem', fontSize: '0.9rem', width: 'auto', flex: 1 }}
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
                                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}
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

                {/* App Fee */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    <span>Taxa do App (Fixo)</span>
                    <span>{appFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Total</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Forma de Pagamento</h3>

            <div style={{ display: 'grid', gap: '1rem', paddingBottom: '2rem' }}>
                <button className="btn btn-outline" onClick={handlePayment}>
                    PIX
                </button>
                <button className="btn btn-outline" onClick={handlePayment}>
                    Cartão de Crédito
                </button>
                <button className="btn btn-outline" onClick={handlePayment}>
                    Apple Pay
                </button>
            </div>

            {/* Remove Fee Modal */}
            {showRemoveModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '360px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Remover Taxa</h3>
                            <button onClick={() => setShowRemoveModal(false)}><X /></button>
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
                            style={{ marginTop: '1rem', backgroundColor: 'var(--danger)' }}
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
