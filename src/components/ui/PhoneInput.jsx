import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, getCountry } from '../../utils/countries';
import { maskPhoneByCountry, normalizeClean } from '../../utils/masks';
import './PhoneInput.css';

const PhoneInput = ({
    value = '',
    onChange,
    defaultCountry = 'BR',
    onCountryChange,
    label,
    error,
    helperText,
    disabled = false,
    placeholder,
    className = '',
    containerClassName = '',
    id = 'phone-input',
    ...rest
}) => {
    const [selectedCountry, setSelectedCountry] = useState(() => getCountry(defaultCountry) || COUNTRIES[0]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);

    // Handle outside click to close country dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCountry = (country) => {
        setSelectedCountry(country);
        setDropdownOpen(false);
        setSearchQuery('');
        if (onCountryChange) {
            onCountryChange(country);
        }
        // Re-mask existing value under the new country format
        if (onChange && value) {
            const raw = normalizeClean(value);
            const remasked = maskPhoneByCountry(raw, country.code);
            onChange({ target: { name: rest.name || 'phone', value: remasked } });
        }
    };

    const handleInputChange = (e) => {
        const raw = e.target.value;
        const formatted = maskPhoneByCountry(raw, selectedCountry.code);
        if (onChange) {
            onChange({
                ...e,
                target: {
                    ...e.target,
                    name: rest.name || 'phone',
                    value: formatted
                }
            });
        }
    };

    const filteredCountries = COUNTRIES.filter(c =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ddi.includes(searchQuery) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getDynamicPlaceholder = () => {
        if (placeholder) return placeholder;
        if (selectedCountry.code === 'BR') return '(11) 99999-9999';
        if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') return '(555) 123-4567';
        if (selectedCountry.code === 'PT') return '912 345 678';
        return 'Número de telefone';
    };

    return (
        <div ref={containerRef} className={`ui-phone-input-container ${containerClassName}`}>
            {label && (
                <label htmlFor={id} className="ui-phone-input-label">
                    {label}
                </label>
            )}

            <div
                className={`ui-phone-input-wrapper ${error ? 'ui-phone-has-error' : ''} ${className}`}
            >
                <button
                    type="button"
                    className="ui-phone-country-btn"
                    onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
                    disabled={disabled}
                    aria-label={`País selecionado: ${selectedCountry.label} (${selectedCountry.ddi})`}
                    aria-expanded={dropdownOpen}
                >
                    <span className="ui-phone-flag">{selectedCountry.flag}</span>
                    <span className="ui-phone-ddi">{selectedCountry.ddi}</span>
                    <ChevronDown size={14} style={{ opacity: 0.7 }} />
                </button>

                <input
                    id={id}
                    type="tel"
                    disabled={disabled}
                    className="ui-phone-input-field"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={getDynamicPlaceholder()}
                    {...rest}
                />
            </div>

            {error ? (
                <span className="ui-input-error-text" role="alert">{error}</span>
            ) : helperText ? (
                <span className="ui-input-helper-text">{helperText}</span>
            ) : null}

            {dropdownOpen && (
                <div className="ui-phone-dropdown" role="listbox">
                    <div className="ui-phone-search-box">
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={14} style={{ position: 'absolute', left: 8, color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="ui-phone-search-input"
                                style={{ paddingLeft: '28px' }}
                                placeholder="Buscar país ou DDI..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {filteredCountries.map(c => (
                        <button
                            key={c.code}
                            type="button"
                            role="option"
                            aria-selected={c.code === selectedCountry.code}
                            className={`ui-phone-country-option ${c.code === selectedCountry.code ? 'ui-selected' : ''}`}
                            onClick={() => handleSelectCountry(c)}
                        >
                            <span className="ui-phone-country-option-left">
                                <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                                <span>{c.label}</span>
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem' }}>
                                {c.ddi}
                            </span>
                        </button>
                    ))}

                    {filteredCountries.length === 0 && (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Nenhum país encontrado
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PhoneInput;
