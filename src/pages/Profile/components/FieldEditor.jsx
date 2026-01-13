import { Save as SaveIcon, X } from 'lucide-react';
import PhoneInput, { formatPhoneNumber } from 'react-phone-number-input';
import { maskCPF } from '../../../utils/masks'; // Ensure this path is correct relative to this file: pages/Profile/components/FieldEditor
// Wait, path is ../../../utils/masks 
// pages/Profile/components -> ../../../ -> src/utils OK.

const FieldEditor = ({
    label, field, icon: Icon, value, isSelect, options, isPhone,
    editing, startEdit, cancelEdit, saveField, setTempValue, tempValue, saving,
    user, localCountry, setLocalCountry
}) => {
    const isEditingThis = editing === field;

    // DISPLAY LOGIC
    let displayValue = value;
    if (field === 'phone' && value) displayValue = formatPhoneNumber(value);
    if (field === 'cpf') displayValue = maskCPF(value);
    if (field === 'country') {
        const opt = options?.find(o => o.value === value);
        displayValue = opt ? opt.label : value;
    }

    const handlePhoneChange = (val) => {
        setTempValue(val);
    };

    const handleCountryChange = (countryCode) => {
        if (countryCode) {
            setLocalCountry(countryCode);
        }
    };

    // Helper for non-phone inputs
    const extractValue = (field, val) => {
        if (field === 'cpf') return maskCPF(val);
        return val;
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Icon size={20} color="var(--primary)" />
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</p>

                {isEditingThis ? (
                    isPhone ? (
                        <div className="phone-input-container">
                            <PhoneInput
                                international
                                defaultCountry={localCountry}
                                value={tempValue}
                                onChange={handlePhoneChange}
                                onCountryChange={handleCountryChange}
                                className="input-field"
                                style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '0' }}
                                autoFocus
                            />
                        </div>
                    ) : isSelect ? (
                        <select
                            value={tempValue}
                            onChange={e => setTempValue(e.target.value)}
                            className="input-field"
                            style={{ margin: 0, padding: '0.5rem', width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--bg-tertiary)' }}
                        >
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            value={tempValue}
                            onChange={e => setTempValue(extractValue(field, e.target.value))}
                            className="input-field"
                            style={{ margin: 0, padding: '0.5rem', flex: 1 }}
                            autoFocus
                        />
                    )
                ) : (
                    <p>{displayValue || 'Não informado'}</p>
                )}
            </div>

            {field !== 'cpf' && (
                isEditingThis ? (
                    <div style={{ display: 'flex', gap: '0.5rem', height: '60px', alignItems: 'flex-end' }}>
                        <button onClick={saveField} disabled={saving} className="btn-ghost" style={{ color: 'var(--success)' }}>
                            <SaveIcon size={18} />
                        </button>
                        <button onClick={cancelEdit} disabled={saving} className="btn-ghost" style={{ color: 'var(--danger)' }}>
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => startEdit(field, value)} className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        Alterar
                    </button>
                )
            )}
        </div>
    );
};

export default FieldEditor;
