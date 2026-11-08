import React, { useState } from 'react';
import { X, Users, ArrowLeft, Phone, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPhoneNumber } from 'react-phone-number-input';
import './TableUsersModal.css';

export const isGuestUser = (u) => {
    if (!u) return false;
    return Boolean(
        u.is_guest ||
        (typeof u.id === 'string' && u.id.startsWith('guest')) ||
        (typeof u.email === 'string' && u.email.toLowerCase().includes('convidado'))
    );
};

const TableUsersModal = ({ users = [], onClose }) => {
    const { user: currentUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState(null);

    const handleUserClick = (u) => {
        setSelectedUser(u);
    };

    const handleBack = () => {
        setSelectedUser(null);
    };

    return (
        <div className="table-users-overlay" onClick={onClose}>
            <div className="table-users-modal" onClick={(e) => e.stopPropagation()}>
                {/* Decorative Background Glow */}
                <div className="table-users-glow" />

                {/* Header */}
                <div className="table-users-header">
                    <div className="table-users-header-info">
                        {selectedUser ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="table-users-back-btn"
                                aria-label="Voltar para a lista da mesa"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <div className="table-users-icon-wrap">
                                <Users size={20} />
                            </div>
                        )}

                        <div>
                            <h3 className="table-users-title">
                                {selectedUser ? 'Detalhes' : 'A Mesa'}
                            </h3>
                            {!selectedUser && (
                                <p className="table-users-subtitle">
                                    {users.length} {users.length === 1 ? 'pessoa' : 'pessoas'} conectad{users.length === 1 ? 'a' : 'as'}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="table-users-close-btn"
                        aria-label="Fechar modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="table-users-content">
                    {!selectedUser ? (
                        /* LIST VIEW */
                        <div className="table-users-list">
                            {users.map((u, i) => {
                                const isMe = u.id === currentUser?.id;
                                const isGuest = isGuestUser(u);
                                const rowClass = `table-user-row ${isMe ? 'table-user-row--me' : ''}`;
                                const avatarImgClass = `table-user-avatar-img ${
                                    isMe
                                        ? 'table-user-avatar-img--me'
                                        : isGuest
                                          ? 'table-user-avatar-img--guest'
                                          : ''
                                }`;

                                return (
                                    <div
                                        key={u.id || i}
                                        onClick={() => handleUserClick(u)}
                                        className={rowClass}
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') handleUserClick(u);
                                        }}
                                    >
                                        <div className="table-user-avatar-wrap">
                                            <img
                                                src={
                                                    u.avatar_url ||
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        u.name || 'U'
                                                    )}&background=random`
                                                }
                                                alt={u.name || 'Usuário'}
                                                className={avatarImgClass}
                                            />
                                            <div className="table-user-online-dot" />
                                        </div>

                                        <div className="table-user-meta">
                                            <div className="table-user-name-line">
                                                <span className="table-user-name-text">
                                                    {u.name || 'Convidado'}
                                                </span>
                                                {isMe && (
                                                    <span className="table-user-badge-me">VOCÊ</span>
                                                )}
                                                {isGuest && (
                                                    <span className="table-user-badge-guest">
                                                        ⚡ Convidado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="table-user-sub-action">
                                                {isGuest ? 'Entrou como convidado' : 'Ver perfil'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* DETAIL VIEW */
                        <div className="table-user-detail-view">
                            {(() => {
                                const isMe = selectedUser.id === currentUser?.id;
                                const isGuest = isGuestUser(selectedUser);
                                const effectivePhone = isMe
                                    ? currentUser?.phone || selectedUser.phone
                                    : selectedUser.phone;
                                const effectiveSettings = isMe
                                    ? currentUser?.settings || selectedUser.settings
                                    : selectedUser.settings;
                                const isPrivate = Boolean(effectiveSettings?.privacy_phone);
                                const canShowPhone = isMe || !isPrivate;

                                const detailAvatarClass = `table-user-detail-avatar ${
                                    isGuest ? 'table-user-detail-avatar--guest' : ''
                                }`;

                                return (
                                    <>
                                        <img
                                            src={
                                                selectedUser.avatar_url ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                    selectedUser.name || 'U'
                                                )}&background=random`
                                            }
                                            alt={selectedUser.name || 'Perfil'}
                                            className={detailAvatarClass}
                                        />

                                        <h2 className="table-user-detail-name">
                                            {selectedUser.name || 'Convidado'}
                                        </h2>

                                        <p className="table-user-detail-sub">
                                            {isGuest
                                                ? 'Acesso Convidado na Mesa'
                                                : selectedUser.email || 'Cliente Consagrado'}
                                        </p>

                                        <div className="table-user-detail-cards">
                                            {isGuest ? (
                                                <div className="table-user-card table-user-card--guest">
                                                    <Sparkles size={20} className="table-user-card-icon" />
                                                    <div>
                                                        <div className="table-user-card-label">Modo Convidado</div>
                                                        <div className="table-user-card-value">
                                                            Entrou via QR Code sem cadastro de telefone
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : canShowPhone && effectivePhone ? (
                                                <div className="table-user-card">
                                                    <Phone size={20} className="table-user-card-icon" />
                                                    <div>
                                                        <div className="table-user-card-label">Celular</div>
                                                        <div className="table-user-card-value">
                                                            {formatPhoneNumber(effectivePhone) || effectivePhone}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : isPrivate && !isMe ? (
                                                <div className="table-user-card table-user-card--private">
                                                    <Shield size={20} className="table-user-card-icon--muted" />
                                                    <div>
                                                        <div className="table-user-card-label">Privacidade</div>
                                                        <div className="table-user-card-value--muted">
                                                            Contato Privado
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="table-user-card table-user-card--private">
                                                    <Phone size={20} className="table-user-card-icon--muted" />
                                                    <div>
                                                        <div className="table-user-card-label">Celular</div>
                                                        <div className="table-user-card-value--muted">
                                                            Telefone não informado
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TableUsersModal;
