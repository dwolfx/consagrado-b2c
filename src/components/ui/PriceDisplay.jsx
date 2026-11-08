import React from 'react';
import './PriceDisplay.css';

const formatCurrency = (val, currency = 'BRL', locale = 'pt-BR') => {
    const num = Number(val) || 0;
    return num.toLocaleString(locale, { style: 'currency', currency });
};

const PriceDisplay = ({
    value,
    originalValue,
    currency = 'BRL',
    locale = 'pt-BR',
    size = 'md',
    color = 'default',
    splitParts,
    className = ''
}) => {
    const formatted = formatCurrency(value, currency, locale);
    const formattedOriginal = originalValue ? formatCurrency(originalValue, currency, locale) : null;

    return (
        <span className={`ui-price-display ${className}`}>
            {formattedOriginal && (
                <span className="ui-price-original">{formattedOriginal}</span>
            )}
            <span className={`ui-price-value ui-price-value-${size} ui-price-color-${color}`}>
                {formatted}
            </span>
            {splitParts && splitParts > 1 && (
                <span className="ui-price-split">/ {splitParts} pessoas</span>
            )}
        </span>
    );
};

export default PriceDisplay;
