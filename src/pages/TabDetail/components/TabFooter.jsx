import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TabFooter = ({ mySubtotal, onCallWaiter }) => {
    const navigate = useNavigate();
    const formatPrice = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <footer style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '0.85rem 1rem',
            paddingBottom: 'calc(0.85rem + env(safe-area-inset-bottom))',
            backgroundColor: 'rgba(9, 10, 13, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', gap: '0.75rem', alignItems: 'stretch', zIndex: 100,
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.45)'
        }}>
            {/* Chamar garçom */}
            <button
                onClick={onCallWaiter}
                className="btn btn-secondary"
                style={{
                    width: '64px', minHeight: '62px', flexShrink: 0,
                    flexDirection: 'column', gap: '4px',
                    padding: '0.5rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.2s ease'
                }}
            >
                <Bell size={20} />
                <span style={{ fontSize: '0.68rem', fontWeight: '600' }}>Ajuda</span>
            </button>

            {/* Pagar */}
            <button
                onClick={() => navigate('/payment')}
                className="btn btn-primary"
                style={{
                    flex: 1, minHeight: '62px',
                    flexDirection: 'column', gap: '2px',
                    padding: '0.6rem 1rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--brand-color, var(--primary)) 0%, color-mix(in srgb, var(--brand-color, var(--primary)) 82%, black) 100%)',
                    boxShadow: '0 8px 24px -4px color-mix(in srgb, var(--brand-color, var(--primary)) 45%, transparent)',
                    transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: '0.78rem', fontWeight: '600', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pagar minha parte
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                    {formatPrice(mySubtotal)}
                </span>
            </button>
        </footer>
    );
};

export default TabFooter;
