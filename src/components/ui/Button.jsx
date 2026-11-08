import React, { forwardRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './Button.css';

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    type = 'button',
    className = '',
    ...rest
}, ref) => {
    const isActuallyDisabled = disabled || loading;

    return (
        <button
            ref={ref}
            type={type}
            disabled={isActuallyDisabled}
            className={`ui-button ui-button-${variant} ui-button-${size} ${fullWidth ? 'ui-button-full' : ''} ${className}`}
            {...rest}
        >
            {loading ? (
                <span className="ui-button-spinner">
                    <LoadingSpinner size={size === 'sm' ? 14 : 18} />
                </span>
            ) : leftIcon ? (
                <span>{leftIcon}</span>
            ) : null}

            <span>{children}</span>

            {!loading && rightIcon && <span>{rightIcon}</span>}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
