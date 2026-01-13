import { X, AlertCircle } from 'lucide-react';

const SplitRequestModal = ({ request, onAccept, onDecline }) => {
    if (!request) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2147483647,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: 'var(--bg-secondary)', width: '100%', maxWidth: '320px',
                borderRadius: '24px', padding: '1.5rem', textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{
                    width: '50px', height: '50px', background: 'var(--primary)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <AlertCircle color="white" size={28} />
                </div>

                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Dividir Conta?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    <strong>{request.requesterName}</strong> quer dividir<br />
                    <strong style={{ color: 'var(--text-primary)' }}>{request.itemName}</strong><br />
                    com você.
                </p>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <button
                        onClick={onAccept}
                        className="btn btn-primary"
                        style={{ justifyContent: 'center', padding: '0.9rem' }}
                    >
                        Aceitar Divisão
                    </button>
                    <button
                        onClick={onDecline}
                        className="btn btn-ghost"
                        style={{ color: 'var(--danger)', justifyContent: 'center' }}
                    >
                        Recusar
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

export default SplitRequestModal;
