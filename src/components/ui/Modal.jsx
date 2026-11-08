import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
    isOpen = true,
    onClose,
    title,
    children,
    maxWidth = '420px',
    showCloseButton = true,
    animation = 'scaleUp'
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                animation: 'modalFadeIn 0.2s ease-out'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    position: 'relative',
                    animation: animation === 'scaleUp' ? 'modalScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {(title || showCloseButton) && (
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {title}
                        </h3>
                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Fechar"
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </div>
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleUp {
                    from { transform: scale(0.95) translateY(8px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Modal;
