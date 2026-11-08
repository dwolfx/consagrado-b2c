import React from 'react';
import { Phone, Shield } from 'lucide-react';
import { formatPhoneNumber } from 'react-phone-number-input';
import Avatar from '../ui/Avatar';

const TableUserDetail = ({ user, currentUser }) => {
    if (!user) return null;

    const isMe = user.id === currentUser?.id;
    const isPrivate = user.settings?.privacy_phone;
    const showPhone = isMe || !isPrivate;

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem' }}>
            <Avatar
                src={user.avatar_url}
                name={user.name}
                size={100}
                border="4px solid rgba(255,255,255,0.1)"
                style={{ marginBottom: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                {user.name}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
                {user.email || 'Cliente Consagrado'}
            </p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {showPhone && user.phone ? (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '1rem',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <Phone size={20} color="var(--brand-color)" />
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Celular</div>
                            <div style={{ fontSize: '1rem', color: 'white' }}>{formatPhoneNumber(user.phone)}</div>
                        </div>
                    </div>
                ) : isPrivate && !isMe ? (
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '1rem',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        border: '1px dashed rgba(255,255,255,0.1)'
                    }}>
                        <Shield size={20} color="rgba(255,255,255,0.3)" />
                        <div>
                            <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Contato Privado</div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default TableUserDetail;
