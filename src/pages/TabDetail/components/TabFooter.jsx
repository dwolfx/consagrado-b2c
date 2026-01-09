import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TabFooter = ({ mySubtotal, onCallWaiter }) => {
    const navigate = useNavigate();
    const formatPrice = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <footer style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--bg-tertiary)',
            display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
            <button
                onClick={onCallWaiter}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0.75rem', fontSize: '0.8rem' }}
            >
                <Bell size={18} />
                Ajuda
            </button>
            <button
                onClick={() => navigate('/payment')}
                className="btn btn-primary"
                style={{ flex: 1, flexDirection: 'column', gap: '0', alignItems: 'center', padding: '0.5rem' }}
            >
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.9 }}>Pagar sua parte</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{formatPrice(mySubtotal)} + taxas</span>
            </button>
        </footer>
    );
};

export default TabFooter;
