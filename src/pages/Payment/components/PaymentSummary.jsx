import React from 'react';
import TipSelector from './TipSelector';

const PaymentSummary = ({
    subtotal,
    operationalFeeValue,
    tipValue,
    total,
    serviceFeePercent,
    setServiceFeePercent,
    feeRemoved,
    onShowItemsInfo,
    onShowFeeInfo,
    onShowRemoveModal,
    onPayment
}) => {
    return (
        <>
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Resumo</h3>

                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Subtotal (Sua parte)</span>
                        <button
                            type="button"
                            onClick={onShowItemsInfo}
                            aria-label="Ver detalhes dos itens"
                            style={infoButtonStyle}
                        >
                            ?
                        </button>
                    </div>
                    <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {/* Service Fee */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Taxa de Serviço</span>
                        <button
                            type="button"
                            onClick={onShowFeeInfo}
                            aria-label="Ver detalhes das taxas"
                            style={infoButtonStyle}
                        >
                            ?
                        </button>
                    </div>
                    <span>{operationalFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>

                {/* Tip */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span>Gratificação da Equipe ({feeRemoved ? 'removida' : `${serviceFeePercent}%`})</span>
                        <span>
                            {feeRemoved ? 'R$ 0,00' : tipValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>

                    {!feeRemoved && (
                        <TipSelector
                            serviceFeePercent={serviceFeePercent}
                            onSelectPercent={setServiceFeePercent}
                        />
                    )}

                    {!feeRemoved && (
                        <button
                            type="button"
                            onClick={onShowRemoveModal}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                fontSize: '0.8rem',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            Não quero pagar a gratificação
                        </button>
                    )}
                </div>

                {/* Total */}
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total a Pagar</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Forma de Pagamento</h3>

            <div style={{ display: 'grid', gap: '1rem', paddingBottom: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onPayment}>PIX</button>
                <button type="button" className="btn btn-secondary" onClick={onPayment}>Cartão de Crédito</button>
                <button type="button" className="btn btn-secondary" onClick={onPayment}>Apple Pay</button>
            </div>
        </>
    );
};

const infoButtonStyle = {
    background: 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: 'var(--text-secondary)',
    cursor: 'pointer'
};

export default PaymentSummary;
