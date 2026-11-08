import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Check, Users, UserCheck } from 'lucide-react';
import { isGuestUser } from './TableUsersModal';
import './SplitItemModal.css';

const SplitItemModal = ({
    item,
    currentUser,
    onlineUsers = [],
    onClose,
    onConfirm,
    initialSelectedUsers,
    disabledUsers = [],
    confirmLabel = 'Dividir Item'
}) => {
    const safeUser = currentUser || { id: 'guest', name: 'Você' };
    const normalize = (id) => String(id || '').toLowerCase();

    // Ensure safeUser is present so there is never an empty user list
    const safeOnlineUsers = useMemo(() => {
        const list = Array.isArray(onlineUsers) ? [...onlineUsers] : [];
        const hasSelf = list.some((u) => normalize(u?.id) === normalize(safeUser?.id));
        if (!hasSelf && safeUser?.id) {
            list.unshift(safeUser);
        }
        return list.length > 0 ? list : [safeUser];
    }, [onlineUsers, safeUser]);

    // Initial selection logic (default to self if empty)
    const [selectedUsers, setSelectedUsers] = useState(() => {
        if (Array.isArray(initialSelectedUsers) && initialSelectedUsers.length > 0) {
            return initialSelectedUsers.map(normalize);
        }
        return [normalize(safeUser.id)];
    });

    // Guard against re-renders resetting user's manual selection unless item ID actually changes
    const prevItemIdRef = useRef(item?.id);
    useEffect(() => {
        if (item?.id !== prevItemIdRef.current) {
            prevItemIdRef.current = item?.id;
            if (Array.isArray(initialSelectedUsers) && initialSelectedUsers.length > 0) {
                setSelectedUsers(initialSelectedUsers.map(normalize));
            } else {
                setSelectedUsers([normalize(safeUser.id)]);
            }
        }
    }, [item?.id, initialSelectedUsers, safeUser.id]);

    if (!item) return null;

    const isGroup = Array.isArray(item._groupItems) && item._groupItems.length > 1;
    const cleanName = isGroup
        ? `${item._groupItems.length} itens do pedido`
        : item.name
          ? item.name.replace(/^[\d.]+\/[\d.]+\s/, '')
          : 'Item';

    const totalDisplayPrice = isGroup
        ? item._groupItems.reduce(
              (acc, it) =>
                  acc +
                  (it.original_price ? Number(it.original_price) : Number(it.price) || 0) *
                      (it.quantity || 1),
              0
          )
        : item.original_price
          ? Number(item.original_price)
          : Number(item.price) || 0;

    const toggleUser = (userId) => {
        const uid = normalize(userId);
        setSelectedUsers((prev) => {
            if (prev.includes(uid)) {
                return prev.filter((id) => id !== uid);
            }
            return [...prev, uid];
        });
    };

    const selectAll = () => {
        const allIds = safeOnlineUsers.map((u) => normalize(u?.id)).filter(Boolean);
        setSelectedUsers(allIds);
    };

    const handleConfirm = () => {
        if (selectedUsers.length === 0) return;
        onConfirm(item, selectedUsers);
    };

    const splitPrice = totalDisplayPrice / (selectedUsers.length || 1);

    return (
        <div className="split-item-overlay" onClick={onClose}>
            <div className="split-item-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="split-item-header">
                    <div className="split-item-title-group">
                        <span className="split-item-badge-pill">
                            <Users size={12} />
                            <span>Dividir com a mesa</span>
                        </span>
                        <h3 className="split-item-title">{cleanName}</h3>
                        <div className="split-item-total-note">
                            Total:{' '}
                            {totalDisplayPrice.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            })}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="split-item-close-btn"
                        aria-label="Fechar"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Seleção de pessoas */}
                <div className="split-item-select-all-row">
                    <span className="split-item-select-all-label">Quem vai rachar?</span>
                    <button
                        type="button"
                        onClick={selectAll}
                        className="split-item-select-all-btn"
                    >
                        Selecionar Todos
                    </button>
                </div>

                {/* Lista de usuários */}
                <div className="split-item-users-list">
                    {safeOnlineUsers.map((u) => {
                        const uid = normalize(u.id);
                        const isSelected = selectedUsers.includes(uid);
                        const isMe = uid === normalize(safeUser.id);
                        const isDisabled = disabledUsers.map(normalize).includes(uid);
                        const isGuest = isGuestUser(u);

                        const rowClass = `split-user-row ${
                            isSelected ? 'split-user-row--selected' : ''
                        } ${isDisabled ? 'split-user-row--disabled' : ''}`;

                        const avatarClass = `split-user-avatar ${
                            isSelected ? 'split-user-avatar--selected' : ''
                        }`;

                        const checkboxClass = `split-checkbox-box ${
                            isSelected ? 'split-checkbox-box--selected' : ''
                        }`;

                        return (
                            <div
                                key={u.id}
                                className={rowClass}
                                onClick={() => !isDisabled && toggleUser(u.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                                        toggleUser(u.id);
                                    }
                                }}
                            >
                                <div className="split-user-info">
                                    <img
                                        src={
                                            u.avatar_url ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                u.name || 'U'
                                            )}&background=random`
                                        }
                                        alt={u.name || 'Usuário'}
                                        className={avatarClass}
                                    />
                                    <div className="split-user-name-line">
                                        <span className="split-user-name">
                                            {u.name || 'Convidado'}
                                        </span>
                                        {isMe && <span className="split-user-tag-me">VOCÊ</span>}
                                        {isGuest && (
                                            <span className="split-user-tag-guest">
                                                <UserCheck size={10} strokeWidth={2.4} />
                                                <span>Convidado</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={checkboxClass}>
                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Resumo da conta */}
                <div className="split-summary-box">
                    <div className="split-summary-left">
                        <span className="split-summary-label">Sua parte</span>
                        <span className="split-summary-count">
                            dividido em {selectedUsers.length}{' '}
                            {selectedUsers.length === 1 ? 'pessoa' : 'pessoas'}
                        </span>
                    </div>
                    <div className="split-summary-right">
                        <span className="split-summary-price">
                            {splitPrice.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            })}
                        </span>
                    </div>
                </div>

                {/* Ação de confirmação */}
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selectedUsers.length === 0}
                    className="split-confirm-btn"
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    );
};

export default SplitItemModal;
