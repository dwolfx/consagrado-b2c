import React from 'react';
import { Facebook } from 'lucide-react';

const SocialAuthButtons = ({ onGoogleClick }) => {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', maxWidth: '320px', margin: '0 auto 2rem auto', width: '100%' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>OU</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                    type="button"
                    onClick={onGoogleClick}
                    className="btn btn-secondary"
                    style={{ backgroundColor: 'white', color: 'black', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Demo Login Shortcut (Google)"
                    aria-label="Entrar com Google"
                >
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="24" alt="Google" />
                </button>

                <button
                    type="button"
                    className="btn btn-secondary"
                    disabled
                    aria-label="Entrar com Facebook"
                    style={{ backgroundColor: '#1877F2', color: 'white', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}
                >
                    <Facebook size={24} />
                </button>
            </div>
        </>
    );
};

export default SocialAuthButtons;
