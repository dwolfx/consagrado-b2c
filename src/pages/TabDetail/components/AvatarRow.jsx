import React from 'react';
import { resolveParticipantInfo, checkParticipantPaid } from '../utils/participantStatus';

const AvatarRow = ({
    requesterId,
    participants = [],
    userIds,
    onlineUsers = [],
    knownUsers = [],
    allOrders = [],
    groupItems = [],
    currentUserId
}) => {
    const rawList = userIds && userIds.length > 0
        ? userIds
        : [
            requesterId,
            ...participants.filter(id => String(id) !== String(requesterId))
        ].filter(Boolean);

    const ordered = rawList.length > 0 ? rawList : (currentUserId ? [currentUserId] : []);

    const abbrev = (name = '') => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].slice(0, 8);
        return `${parts[0]} ${parts[1][0]}.`;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            {ordered.map((id) => {
                const u = resolveParticipantInfo(id, onlineUsers, allOrders, knownUsers);
                const isPaid = checkParticipantPaid(id, groupItems, allOrders);
                const isMe = currentUserId && String(id) === String(currentUserId);

                return (
                    <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            overflow: 'hidden', flexShrink: 0,
                            border: `2px solid ${isPaid ? '#10b981' : 'var(--primary, #818cf8)'}`,
                            position: 'relative',
                            boxShadow: isPaid ? '0 0 8px rgba(16, 185, 129, 0.4)' : undefined
                        }}>
                            <img
                                src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random&size=72`}
                                alt={u.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Nome do Participante */}
                        <span style={{
                            fontSize: '0.65rem', fontWeight: '600',
                            color: isPaid ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #a1a1aa)',
                            maxWidth: '52px', textAlign: 'center',
                            lineHeight: 1.1, wordBreak: 'break-word'
                        }}>
                            {isMe ? 'Você' : abbrev(u.name)}
                        </span>

                        {/* Status: Pago se já quitou */}
                        {isPaid && (
                            <span style={{
                                fontSize: '0.6rem', fontWeight: '700',
                                backgroundColor: '#10b981', color: '#ffffff',
                                padding: '1px 5px', borderRadius: '6px',
                                lineHeight: 1.2
                            }}>
                                Pago ✓
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AvatarRow;
