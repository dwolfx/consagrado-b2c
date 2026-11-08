import React from 'react';

const Badge = ({
    children,
    bg = 'var(--bg-tertiary)',
    color = 'var(--text-secondary)',
    size = 'sm',
    style = {},
    className = ''
}) => {
    const fontSizes = {
        xs: '0.65rem',
        sm: '0.75rem',
        md: '0.85rem'
    };

    return (
        <span
            className={className}
            style={{
                fontSize: fontSizes[size] || fontSizes.sm,
                backgroundColor: bg,
                color,
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                ...style
            }}
        >
            {children}
        </span>
    );
};

export default Badge;
