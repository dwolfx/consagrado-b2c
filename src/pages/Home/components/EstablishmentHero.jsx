import React from 'react';
import { MapPin } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';

const EstablishmentHero = ({ establishment, tableId, onlineUsers, onOpenUsersModal }) => {
    return (
        <div style={{ padding: '0.5rem 0 1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                {establishment?.name || 'Consagrado'}
            </h2>
            <span
                onClick={onOpenUsersModal}
                role="button"
                tabIndex={0}
                style={{
                    background: 'var(--bg-tertiary)',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500,
                    cursor: 'pointer'
                }}
            >
                <MapPin size={16} /> Mesa {tableId}
            </span>

            {onlineUsers && onlineUsers.length > 1 && (
                <div
                    onClick={onOpenUsersModal}
                    role="button"
                    tabIndex={0}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex' }}>
                        {onlineUsers.slice(0, 5).map((u, i) => (
                            <div
                                key={u.id}
                                style={{
                                    marginLeft: i > 0 ? '-10px' : '0',
                                    zIndex: 10 - i
                                }}
                            >
                                <Avatar
                                    src={u.avatar_url}
                                    name={u.name}
                                    size={32}
                                    border="2px solid var(--bg-primary)"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstablishmentHero;
