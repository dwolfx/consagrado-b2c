import React from 'react';

const LoadingSpinner = ({ size = 32, color = 'var(--brand-color)' }) => {
    return (
        <div
            role="status"
            aria-label="Carregando"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                border: `3px solid var(--bg-tertiary)`,
                borderTopColor: color,
                borderRadius: '50%',
                animation: 'spinner-rotate 1s linear infinite'
            }}
        >
            <style>{`
                @keyframes spinner-rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
