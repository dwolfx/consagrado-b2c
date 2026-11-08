import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '../../../components/ui';

const ManualCodeInput = ({
    showManualInput,
    setShowManualInput,
    manualCode,
    setManualCode,
    onSubmit
}) => {
    if (!showManualInput) {
        return (
            <Button
                variant="outline"
                fullWidth
                leftIcon={<Keyboard size={20} />}
                onClick={() => setShowManualInput(true)}
                style={{ padding: '1rem', justifyContent: 'center' }}
            >
                Digitar Código
            </Button>
        );
    }

    return (
        <div style={{ animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Cód. Mesa (Ex: IM0001)"
                    autoFocus
                    style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                />
                <button
                    type="button"
                    onClick={() => {
                        setShowManualInput(false);
                        setManualCode('');
                    }}
                    className="btn"
                    aria-label="Cancelar código manual"
                    style={{
                        padding: '0 1rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        width: '50px',
                        color: '#ef4444',
                        border: 'none'
                    }}
                >
                    <X size={20} />
                </button>
            </div>
            <Button
                variant={manualCode ? 'primary' : 'secondary'}
                fullWidth
                disabled={!manualCode}
                onClick={onSubmit}
                style={{
                    padding: '1rem',
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                }}
            >
                Entrar na Mesa
            </Button>
        </div>
    );
};

export default ManualCodeInput;
