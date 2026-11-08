import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    disabled = false,
    className = '',
    containerClassName = '',
    id,
    ...rest
}, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <div className={`ui-input-container ${containerClassName}`}>
            {label && (
                <label htmlFor={inputId} className="ui-input-label">
                    {label}
                </label>
            )}
            <div
                className={`ui-input-wrapper ${error ? 'ui-input-has-error' : ''} ${disabled ? 'ui-input-disabled' : ''} ${className}`}
            >
                {leftIcon && <span className="ui-input-icon-left">{leftIcon}</span>}
                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    className="ui-input-field"
                    {...rest}
                />
                {rightIcon && <span className="ui-input-icon-right">{rightIcon}</span>}
            </div>
            {error ? (
                <span className="ui-input-error-text" role="alert">{error}</span>
            ) : helperText ? (
                <span className="ui-input-helper-text">{helperText}</span>
            ) : null}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
