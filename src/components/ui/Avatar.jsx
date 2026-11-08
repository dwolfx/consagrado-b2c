import React from 'react';

const Avatar = ({
    src,
    name = '',
    size = 40,
    isOnline = false,
    border = '2px solid var(--bg-tertiary)',
    onClick,
    style = {},
    title
}) => {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
    const avatarSrc = src || fallbackUrl;

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                width: `${size}px`,
                height: `${size}px`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: onClick ? 'pointer' : 'default',
                flexShrink: 0,
                ...style
            }}
            title={title || name}
        >
            <img
                src={avatarSrc}
                alt={name || 'Avatar'}
                onError={(e) => {
                    if (e.target.src !== fallbackUrl) {
                        e.target.src = fallbackUrl;
                    }
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border
                }}
            />
            {isOnline && (
                <div
                    data-testid="online-indicator"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: `${Math.max(8, Math.round(size * 0.28))}px`,
                        height: `${Math.max(8, Math.round(size * 0.28))}px`,
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid var(--bg-primary, #18181b)',
                        boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                    }}
                />
            )}
        </div>
    );
};

export default Avatar;
