import React from 'react';

const ToggleSwitch = ({
    checked,
    onChange,
    label,
    activeColor = 'var(--primary)',
    inactiveColor = 'var(--bg-tertiary)',
    disabled = false
}) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => !disabled && onChange && onChange(!checked)}
            style={{
                width: '48px',
                height: '24px',
                backgroundColor: checked ? activeColor : inactiveColor,
                borderRadius: '12px',
                padding: '2px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                opacity: disabled ? 0.6 : 1
            }}
        >
            <span
                style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transform: checked ? 'translateX(24px)' : 'translateX(0)',
                    transition: 'transform 0.3s ease',
                    display: 'block',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            />
        </button>
    );
};

export default ToggleSwitch;
