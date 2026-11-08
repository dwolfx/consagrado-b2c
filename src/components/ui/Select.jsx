import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

const Select = forwardRef(({
    label,
    error,
    helperText,
    options = [],
    placeholder = 'Selecione uma opção',
    disabled = false,
    className = '',
    containerClassName = '',
    id,
    value,
    onChange,
    ...rest
}, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
        <div className={`ui-select-container ${containerClassName}`}>
            {label && (
                <label htmlFor={selectId} className="ui-select-label">
                    {label}
                </label>
            )}
            <div
                className={`ui-select-wrapper ${error ? 'ui-select-has-error' : ''} ${className}`}
            >
                <select
                    ref={ref}
                    id={selectId}
                    disabled={disabled}
                    className="ui-select-field"
                    value={value}
                    onChange={onChange}
                    {...rest}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}
                    {options.map((opt) => {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        return (
                            <option key={optValue} value={optValue}>
                                {optLabel}
                            </option>
                        );
                    })}
                </select>
                <span className="ui-select-chevron">
                    <ChevronDown size={18} />
                </span>
            </div>
            {error ? (
                <span className="ui-input-error-text" role="alert">{error}</span>
            ) : helperText ? (
                <span className="ui-input-helper-text">{helperText}</span>
            ) : null}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
