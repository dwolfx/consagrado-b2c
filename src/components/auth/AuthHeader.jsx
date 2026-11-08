import React from 'react';
import { Beer } from 'lucide-react';

const AuthHeader = ({ title = 'Consagrado', subtitle = 'O seu parceiro de rolê' }) => {
    return (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
                width: '80px', height: '80px', background: 'var(--primary)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem auto', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
            }}>
                <Beer size={40} color="white" />
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
    );
};

export default AuthHeader;
