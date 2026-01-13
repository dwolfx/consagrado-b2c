import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, X } from 'lucide-react';
import PaymentSkeleton from '../../components/PaymentSkeleton';
import { usePaymentLogic } from './hooks/usePaymentLogic';

const Payment = () => {
    const navigate = useNavigate();
    const {
        success, loading,
        subtotal, myOrders, total,
        serviceFeePercent, setServiceFeePercent,
        removeFeeReason, setRemoveFeeReason,
        feeRemoved,
        showFeeInfo, setShowFeeInfo,
        showItemsInfo, setShowItemsInfo,
        showRemoveModal, setShowRemoveModal,
        tipValue, displayedTip, machineFeeValue, operationalFeeValue, applicableAppFee,
        handleRemoveFee, handlePayment, setTableId
    } = usePaymentLogic();

    if (success) {
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

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span>Gratificação da Equipe ({feeRemoved ? 'removida' : `${serviceFeePercent}%`})</span>
                        <span>
                            {feeRemoved ? 'R$ 0,00' : tipValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

                <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Total</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Forma de Pagamento</h3>

            <div style={{ display: 'grid', gap: '1rem', paddingBottom: '2rem' }}>
                <button className="btn btn-secondary" onClick={handlePayment}>PIX</button>
                <button className="btn btn-secondary" onClick={handlePayment}>Cartão de Crédito</button>
                <button className="btn btn-secondary" onClick={handlePayment}>Apple Pay</button>
            </div>

            {showRemoveModal && (
                <div style={modalOverlayStyle}>
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
                        <button onClick={handleRemoveFee} className="btn btn-primary" style={{ marginTop: '1rem', background: 'var(--danger)' }}>
                            Confirmar Remoção
                        </button>
                    </div>
                </div>
            )}

            {showFeeInfo && (
                <div style={bottomSheetOverlayStyle} onClick={() => setShowFeeInfo(false)}>
                    <div style={bottomSheetStyle} onClick={e => e.stopPropagation()}>
                        <div style={handleStyle}></div>
                        <h3 style={{ marginBottom: '1.5rem' }}>Entenda as Taxas</h3>
                        <div style={rowStyle}><span>Taxa Maquininha (4%)</span><span>{machineFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                        <div style={rowStyle}><span>Taxa do App (Fixo)</span><span>{applicableAppFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold' }}><span>Total Taxa de Serviço</span><span>{operationalFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                        <button onClick={() => setShowFeeInfo(false)} className="btn btn-primary" style={{ marginTop: '1rem' }}>Entendi</button>
                    </div>
                </div>
            )}

            {showItemsInfo && (
                <div style={bottomSheetOverlayStyle} onClick={() => setShowItemsInfo(false)}>
                    <div style={{ ...bottomSheetStyle, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={handleStyle}></div>
                        <h3 style={{ marginBottom: '1rem', flexShrink: 0 }}>Seu Consumo</h3>
                        <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1rem' }}>
                            {myOrders.length === 0 ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Nenhum item encontrado.</p> :
                                myOrders.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px dashed var(--bg-tertiary)' }}>
                                        <div><span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{item.quantity}x</span><span>{item.name}</span></div>
                                        <span>{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                ))
                            }
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold', borderTop: '2px solid var(--bg-tertiary)', flexShrink: 0 }}>
                            <span>Total Itens</span>
                            <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <button onClick={() => setShowItemsInfo(false)} className="btn btn-primary" style={{ marginTop: '0.5rem', flexShrink: 0 }}>Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const modalOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' };
const bottomSheetOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'end', justifyContent: 'center', zIndex: 110, padding: 0 };
const bottomSheetStyle = { width: '100%', maxWidth: '480px', backgroundColor: 'var(--bg-secondary)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '2rem', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' };
const handleStyle = { width: '40px', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', margin: '0 auto 1.5rem auto', flexShrink: 0 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--bg-tertiary)' };

export default Payment;
