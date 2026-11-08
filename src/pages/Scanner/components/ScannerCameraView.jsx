import React from 'react';
import { Martini, Keyboard } from 'lucide-react';

const ScannerCameraView = ({ onSimulateScan, onOpenManualInput }) => {
    return (
        <>
            <div
                onClick={onSimulateScan}
                role="button"
                tabIndex={0}
                aria-label="Simular leitura de QR Code"
                style={{
                    width: '280px',
                    height: '280px',
                    border: '4px solid var(--primary)',
                    borderRadius: '24px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.4), transparent)',
                    animation: 'scan 2s linear infinite',
                    pointerEvents: 'none'
                }} />

                <Martini size={48} color="white" style={{ opacity: 0.5 }} />
            </div>

            <p style={{ marginTop: '2rem', color: 'white', fontSize: '1.25rem', fontWeight: 600 }}>
                Aponte para o QR Code
            </p>
            <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '3rem' }}>
                (Toque no quadrado para simular)
            </p>

            <button
                type="button"
                onClick={onOpenManualInput}
                className="btn"
                style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <Keyboard size={20} />
                Inserir código da mesa
            </button>
        </>
    );
};

export default ScannerCameraView;
