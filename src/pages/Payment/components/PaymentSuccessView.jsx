import React from 'react';
import { CheckCircle } from 'lucide-react';

const PaymentSuccessView = ({ onBackToHome, receiptHash = 'A1B2C3D4' }) => {
    return (
        <div className="container" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
            <div style={{
                background: 'var(--bg-secondary)',
                padding: '2rem',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
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
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    margin: '1rem 0',
                    width: '200px',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=IMP-${receiptHash}`}
                        alt="QR Code de Saída"
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Código de Saída</span>
                    <div style={{
                        background: 'var(--bg-tertiary)',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '1.4rem',
                        letterSpacing: '2px',
                        fontWeight: 'bold',
                        color: 'var(--primary)'
                    }}>
                        #{receiptHash}
                    </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Mesa encerrada. Obrigado pela preferência!
                </p>

                <button
                    type="button"
                    onClick={onBackToHome}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem', width: '100%' }}
                >
                    Voltar ao Início
                </button>
            </div>
            <style>{`
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default PaymentSuccessView;
