import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

const Toast = ({ id, message, type, onClose }) => {
    const icons = {
        success: <CheckCircle size={20} color="#22c55e" />,
        error: <AlertCircle size={20} color="#ef4444" />,
        info: <Info size={20} color="#3b82f6" />
    };

    const bgColors = {
        success: '#f0fdf4',
        error: '#fef2f2',
        info: '#eff6ff'
    };

    const borderColors = {
        success: '#bbf7d0',
        error: '#fecaca',
        info: '#bfdbfe'
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px', borderRadius: '12px',
            background: bgColors[type] || 'white',
            border: `1px solid ${borderColors[type] || '#e5e7eb'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '10px',
            animation: 'slideInTop 0.3s ease-out',
            minWidth: '300px', maxWidth: '90vw'
        }}>
            {icons[type]}
            <p style={{ margin: 0, flex: 1, fontSize: '0.95rem', color: '#1f2937', fontWeight: 500 }}>
                {message}
            </p>
            <button onClick={() => onClose(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} color="#9ca3af" />
            </button>
            <style>{`
                @keyframes slideInTop {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{
                position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
