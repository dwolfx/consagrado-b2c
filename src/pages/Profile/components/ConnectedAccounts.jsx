import React from 'react';
import { Mail, Facebook, Shield } from 'lucide-react';

const ConnectedAccounts = () => {
    const providers = [
        { name: 'Google', bg: '#DB4437', icon: <Mail size={16} /> },
        { name: 'Facebook', bg: '#4267B2', icon: <Facebook size={16} /> },
        { name: 'Apple', bg: '#000', icon: <Shield size={16} /> }
    ];

    return (
        <div className="card" style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Contas Conectadas
            </h4>

            {providers.map((p, idx) => (
                <div
                    key={p.name}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: idx < providers.length - 1 ? '1rem' : 0
                    }}
                >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: p.bg,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                            {p.icon}
                        </div>
                        <div>
                            <p style={{ fontWeight: 500, margin: 0 }}>{p.name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Não conectado</p>
                        </div>
                    </div>
                    <button type="button" className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        Conectar
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ConnectedAccounts;
