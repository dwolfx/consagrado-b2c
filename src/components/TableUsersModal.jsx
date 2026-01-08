import React, { useState } from 'react';
import { X, Users, ArrowLeft, Phone, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPhoneNumber } from 'react-phone-number-input';

const TableUsersModal = ({ users, onClose }) => {
    const { user: currentUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState(null);

    const handleUserClick = (u) => {
        setSelectedUser(u);
    };

    const handleBack = () => {
        setSelectedUser(null);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#18181b', // Zinc-900 Hardcoded for premium feel
                borderRadius: '24px',
                width: '100%',
                maxWidth: '380px',
                height: 'auto',
                minHeight: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
                animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }} onClick={e => e.stopPropagation()}>

                {/* Decorative Background Glow */}
                <div style={{
                    position: 'absolute', top: '-50%', left: '50%', transform: 'translate(-50%, 0)',
                    width: '300px', height: '300px', background: 'var(--brand-color)', opacity: 0.15,
                    filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0
                }} />

                {/* Header */}
                <div style={{
                    padding: '1.5rem 1.5rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {selectedUser ? (
                            <button
                                onClick={handleBack}
                                style={{
                                    background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                                    border: 'none', color: '#fff', padding: '10px',
                                    display: 'flex', cursor: 'pointer'
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <div style={{
                                padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Users size={20} color="var(--brand-color)" />
                            </div>
                        )}

                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                                {selectedUser ? 'Detalhes' : 'A Mesa'}
                            </h3>
                            {!selectedUser && (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                    {users.length} {users.length === 1 ? 'pessoa' : 'pessoas'} conectad{users.length === 1 ? 'a' : 'as'}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            width: '32px', height: '32px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'background 0.2s',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div style={{
                    padding: '0 1rem 1.5rem',
                    flex: 1,
                    overflowY: 'auto',
                    position: 'relative', zIndex: 1
                }}>
                    {!selectedUser ? (
                        /* LIST VIEW */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {users.map((u, i) => {
                                const isMe = u.id === currentUser?.id;

                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => handleUserClick(u)}
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
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`}
                                                alt={u.name}
                                                style={{
                                                    width: '44px', height: '44px',
                                                    borderRadius: '50%', objectFit: 'cover',
                                                    border: isMe ? '2px solid var(--brand-color)' : '2px solid rgba(255,255,255,0.1)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}
                                            />
                                            {/* Online Indicator */}
                                            <div style={{
                                                position: 'absolute', bottom: '0', right: '0',
                                                width: '12px', height: '12px', borderRadius: '50%',
                                                background: '#10b981', border: '2px solid #18181b',
                                                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                                            }}></div>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 700, fontSize: '1rem', color: '#fff',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}>
                                                {u.name}
                                                {isMe && <span style={{
                                                    fontSize: '0.65rem', background: 'var(--brand-color)', color: '#000',
                                                    padding: '2px 8px', borderRadius: '100px', fontWeight: 800
                                                }}>VOCÊ</span>}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                                Ver perfil
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* DETAIL VIEW */
                        <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem' }}>
                            <img
                                src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`}
                                alt={selectedUser.name}
                                style={{
                                    width: '100px', height: '100px',
                                    borderRadius: '50%', objectFit: 'cover',
                                    border: '4px solid rgba(255,255,255,0.1)',
                                    marginBottom: '1rem',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                }}
                            />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                {selectedUser.name}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
                                {selectedUser.email || 'Cliente Consagrado'}
                            </p>

                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Phone Logic */}
                                {(() => {
                                    const isMe = selectedUser.id === currentUser?.id;
                                    const isPrivate = selectedUser.settings?.privacy_phone;
                                    const showPhone = isMe || !isPrivate;

                                    if (showPhone && selectedUser.phone) {
                                        return (
                                            <div style={{
                                                background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px',
                                                display: 'flex', alignItems: 'center', gap: '1rem'
                                            }}>
                                                <Phone size={20} color="var(--brand-color)" />
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Celular</div>
                                                    <div style={{ fontSize: '1rem', color: 'white' }}>{formatPhoneNumber(selectedUser.phone)}</div>
                                                </div>
                                            </div>
                                        );
                                    } else if (isPrivate && !isMe) {
                                        return (
                                            <div style={{
                                                background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px',
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                border: '1px dashed rgba(255,255,255,0.1)'
                                            }}>
                                                <Shield size={20} color="rgba(255,255,255,0.3)" />
                                                <div>
                                                    <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Contato Privado</div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null; // Phone hidden or not present
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateX(-10px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div >
    );
};

export default TableUsersModal;
