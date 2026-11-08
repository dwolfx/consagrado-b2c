import React from 'react';

const ScannerManualInput = ({
    manualCode,
    setManualCode,
    onSubmit,
    onBackToCamera,
    error
}) => {
    return (
        <div style={{ width: '100%', maxWidth: '320px', padding: '2rem', animation: 'fadeIn 0.3s' }}>
            <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>Código da Mesa</h2>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Ex: AA0001"
                    autoFocus
                    style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: '#000000',
                        color: 'white',
                        fontSize: '1.2rem',
                        textTransform: 'uppercase',
                        outline: 'none',
                        textAlign: 'center',
                        letterSpacing: '2px'
                    }}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    }}
                >
                    Entrar na Mesa
                </button>

                <button
                    type="button"
                    onClick={onBackToCamera}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        padding: '1rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    Voltar para Camera
                </button>
            </form>

            {error && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default ScannerManualInput;
