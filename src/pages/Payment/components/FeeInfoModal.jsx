import React from 'react';

const FeeInfoModal = ({
    machineFeeValue = 0,
    applicableAppFee = 0,
    operationalFeeValue = 0,
    onClose
}) => {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Entenda as Taxas"
            style={bottomSheetOverlayStyle}
            onClick={onClose}
        >
            <div style={bottomSheetStyle} onClick={(e) => e.stopPropagation()}>
                <div style={handleStyle} />
                <h3 style={{ marginBottom: '1.5rem' }}>Entenda as Taxas</h3>
                <div style={rowStyle}>
                    <span>Taxa Maquininha (4%)</span>
                    <span>{machineFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div style={rowStyle}>
                    <span>Taxa do App (Fixo)</span>
                    <span>{applicableAppFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold' }}>
                    <span>Total Taxa de Serviço</span>
                    <span>{operationalFeeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <button type="button" onClick={onClose} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Entendi
                </button>
            </div>
        </div>
    );
};

const bottomSheetOverlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'center',
    zIndex: 110,
    padding: 0
};

const bottomSheetStyle = {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'var(--bg-secondary)',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '2rem',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative'
};

const handleStyle = {
    width: '40px',
    height: '4px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '2px',
    margin: '0 auto 1.5rem auto',
    flexShrink: 0
};

const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--bg-tertiary)'
};

export default FeeInfoModal;
