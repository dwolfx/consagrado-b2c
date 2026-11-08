import React, { useState } from 'react';
import { X, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TableUsersList from './TableUsers/TableUsersList';
import TableUserDetail from './TableUsers/TableUserDetail';

const TableUsersModal = ({ users = [], onClose }) => {
    const { user: currentUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState(null);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="A Mesa"
            style={{
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
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#18181b',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '380px',
                    minHeight: '400px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden',
                    animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
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
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                aria-label="Voltar para lista de usuários"
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
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar modal"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            width: '32px', height: '32px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
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
                    position: 'relative',
                    zIndex: 1
                }}>
                    {!selectedUser ? (
                        <TableUsersList
                            users={users}
                            currentUser={currentUser}
                            onSelectUser={(u) => setSelectedUser(u)}
                        />
                    ) : (
                        <TableUserDetail
                            user={selectedUser}
                            currentUser={currentUser}
                        />
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
        </div>
    );
};

export default TableUsersModal;
