import React from 'react';
import Avatar from '../ui/Avatar';

const TableUsersList = ({ users = [], currentUser, onSelectUser }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((u, i) => {
                const isMe = u.id === currentUser?.id;

                return (
                    <div
                        key={u.id}
                        onClick={() => onSelectUser(u)}
                        role="button"
                        tabIndex={0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '1rem',
                            borderRadius: '16px',
                            background: isMe ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)' : 'rgba(255,255,255,0.02)',
                            border: isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                            transition: 'transform 0.2s',
                            cursor: 'pointer',
                            animation: `slideIn 0.3s ease-out forwards ${i * 0.05}s`,
                            opacity: 0
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <Avatar
                            src={u.avatar_url}
                            name={u.name}
                            size={44}
                            isOnline={true}
                            border={isMe ? '2px solid var(--brand-color)' : '2px solid rgba(255,255,255,0.1)'}
                        />

                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                {u.name}
                                {isMe && (
                                    <span style={{
                                        fontSize: '0.65rem',
                                        background: 'var(--brand-color)',
                                        color: '#000',
                                        padding: '2px 8px',
                                        borderRadius: '100px',
                                        fontWeight: 800
                                    }}>
                                        VOCÊ
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                Ver perfil
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TableUsersList;
