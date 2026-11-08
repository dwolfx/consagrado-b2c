import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppHeader = ({
    title,
    subtitle,
    onBack,
    rightContent,
    style = {}
}) => {
    const navigate = useNavigate();
    const handleBack = onBack || (() => navigate(-1));

    return (
        <header
            style={{
                padding: '1rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                ...style
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    type="button"
                    onClick={handleBack}
                    className="btn-ghost"
                    aria-label="Voltar"
                    style={{ width: 'auto', padding: 0 }}
                >
                    <ArrowLeft />
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
                    {subtitle && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>
            {rightContent && <div>{rightContent}</div>}
        </header>
    );
};

export default AppHeader;
