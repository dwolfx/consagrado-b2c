import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const SplitItemModal = ({
    item,
    currentUser,
    onlineUsers,
    onClose,
    onConfirm,
    initialSelectedUsers = [],
    disabledUsers = [],
    confirmLabel = 'Dividir Item'
}) => {
    const safeUser = currentUser || { id: 'guest', name: 'Você' };

    // Initial selection logic (default to self if empty)
    const [selectedUsers, setSelectedUsers] = useState(
        (initialSelectedUsers && initialSelectedUsers.length > 0)
            ? initialSelectedUsers
            : [safeUser.id]
    );

    if (!item) return null;

    const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [safeUser];
    const cleanName = item.name ? item.name.replace(/^[\d.]+\/[\d.]+\s/, '') : 'Item';
    const totalDisplayPrice = item.price || 0;

    const toggleUser = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) return prev.filter(id => id !== userId);
            return [...prev, userId];
        });
    };

    const selectAll = () => {
        const allIds = safeOnlineUsers.map(u => u?.id).filter(Boolean);
        setSelectedUsers(allIds);
    };

    const handleConfirm = () => {
        if (selectedUsers.length === 0) return;
        onConfirm(item, selectedUsers);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s'
        }}>
            <div className="card" style={{
                width: '100%', maxWidth: '350px', background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-tertiary)', padding: '1.5rem',
                flexDirection: 'column', gap: '1rem',
                animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                margin: 0
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Dividir com quem?</h3>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '8px' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{cleanName}</span>
                    <span style={{ color: 'var(--primary)' }}>
                        {totalDisplayPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Usuarios na mesa</p>
                        <button onClick={selectAll} style={{
                            background: 'none', border: 'none', color: 'var(--primary)',
                            fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer'
                        }}>
                            Todos
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '0.75rem' }}>
                        {safeOnlineUsers.map(u => {
                            if (!u) return null;
                            const isSelected = selectedUsers.includes(u.id);
                            const isSelf = u.id === safeUser.id;
                            const isDisabled = disabledUsers.includes(u.id);
                            const splitPrice = totalDisplayPrice / (selectedUsers.length || 1);

                            return (
                                <div
                                    key={u.id || Math.random()}
                                    onClick={() => !isDisabled && u.id && toggleUser(u.id)}
                                    style={{
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative',
                                        opacity: isDisabled ? 0.4 : 1,
                                        pointerEvents: isDisabled ? 'none' : 'auto'
                                    }}
                                >
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden',
                                        border: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                                        opacity: isSelected ? 1 : 0.5,
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'none',
                                        filter: isDisabled ? 'grayscale(100%)' : 'none'
                                    }}>
                                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name || 'User'}&background=random`} alt={u.name} style={{ width: '100%', height: '100%' }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 'bold' : 'normal', textAlign: 'center', color: isSelected ? 'white' : 'var(--text-secondary)' }}>
                                        {isSelf ? 'Eu' : (u.name || 'User').split(' ')[0]}
                                    </span>
                                    {isSelected && !isDisabled && (
                                        <div style={{
                                            position: 'absolute', top: '-6px', right: '-6px',
                                            background: '#22c55e', color: 'white',
                                            fontSize: '0.65rem', fontWeight: 'bold',
                                            padding: '2px 6px', borderRadius: '10px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}>
                                            {splitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={selectedUsers.length === 0}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
                >
                    {confirmLabel} <Check size={20} style={{ marginLeft: '8px' }} />
                </button>

            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default SplitItemModal;
