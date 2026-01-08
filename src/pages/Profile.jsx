import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Shield, LogOut, Trash2, Edit, Save as SaveIcon, X, History, ChevronRight, Facebook } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { supabase } from '../services/api';
import { maskCPF } from '../utils/masks';
import PhoneInput, { formatPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/phone-input-overrides.css'; // We will create this for dark mode support

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

const Profile = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [hidePhone, setHidePhone] = useState(user?.settings?.privacy_phone || false);

    const [editing, setEditing] = useState(null);
    const [tempValue, setTempValue] = useState('');
    const [saving, setSaving] = useState(false);
    // Local state for country to drive UI before saving. Init from user or default 'BR'
    const [localCountry, setLocalCountry] = useState(user?.country || 'BR');

    const startEdit = (field, currentVal) => {
        setEditing(field);
        setTempValue(currentVal || '');
        if (field === 'phone') {
            // Ensure localCountry is synced when starting edit
            setLocalCountry(user?.country || 'BR');
        }
    };

    const cancelEdit = () => {
        setEditing(null);
        setTempValue('');
    };

    const saveField = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            let updateData = { [editing]: tempValue };

            // If updating phone, we should also update the country if it changed
            if (editing === 'phone') {
                updateData.country = localCountry;
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            login();
            window.location.reload();

        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar: ' + err.message);
        } finally {
            setSaving(false);
            setEditing(null);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleDelete = () => { if (confirm("Tem certeza?")) { alert("Conta agendada."); handleLogout(); } };

    // Common props for FieldEditor to reduce clutter
    const editorProps = {
        editing, startEdit, cancelEdit, saveField, setTempValue, tempValue, saving,
        user, localCountry, setLocalCountry
    };

    return (
        <div className="container">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <h2>Meu Perfil</h2>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div
                    onClick={() => navigate('/avatar-editor')}
                    style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                >
                    <img
                        src={user?.avatar}
                        alt="Avatar"
                        style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--bg-secondary)', objectFit: 'cover' }}
                    />
                    <button style={{
                        position: 'absolute', bottom: 0, right: 0,
                        backgroundColor: 'var(--primary)', borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        border: 'none'
                    }}>
                        <Edit size={16} />
                    </button>
                </div>

                {/* Name Edit */}
                {editing === 'name' ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <input value={tempValue} onChange={e => setTempValue(e.target.value)} className="input-field" style={{ margin: 0, width: '200px', textAlign: 'center' }} autoFocus />
                        <button onClick={saveField} className="btn-ghost" style={{ color: 'var(--success)' }}><SaveIcon size={18} /></button>
                        <button onClick={cancelEdit} className="btn-ghost" style={{ color: 'var(--danger)' }}><X size={18} /></button>
                    </div>
                ) : (
                    <h3 onClick={() => startEdit('name', user?.name)} style={{ marginTop: '1rem', cursor: 'pointer', borderBottom: '1px dashed var(--bg-tertiary)', display: 'inline-block' }}>
                        {user?.name || 'Visitante'}
                    </h3>
                )}
                <p style={{ color: 'var(--text-secondary)' }}>Cliente Consagrado</p>
            </div>

            {/* 1. Meu Histórico */}
            <div style={{ marginBottom: '1rem' }}>
                <button onClick={() => navigate('/history')} className="card" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: 0, padding: '1rem', cursor: 'pointer' }}>
                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}><History size={20} color="var(--primary)" /></div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>Meu Histórico</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ver pedidos anteriores</div>
                    </div>
                    <ChevronRight size={20} color="var(--text-muted)" />
                </button>
            </div>

            {/* 2. Dados Pessoais */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Dados Pessoais</h4>

                {/* Phone uses PhoneInput inside FieldEditor */}
                <FieldEditor
                    {...editorProps}
                    label="Celular"
                    field="phone"
                    icon={Phone}
                    value={user?.phone}
                    isPhone={true}
                />

                {/* Identification Document (Depends on localCountry state while editing, or user.country otherwise) */}
                {(() => {
                    // Use localCountry if we are editing phone (to show dynamic toggle), otherwise user.country
                    const effectiveCountry = editing === 'phone' ? localCountry : (user?.country || 'BR');

                    if (effectiveCountry === 'BR') {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <Shield size={20} color="var(--primary)" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CPF</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p>{maskCPF(user?.cpf) || 'Não informado'}</p>
                                        <button onClick={() => startEdit('cpf', user?.cpf)} className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                            Alterar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <FieldEditor {...editorProps} label="Passaporte / ID" field="passport" icon={Shield} value={user?.passport} />
                        );
                    }
                })()}

                <FieldEditor {...editorProps} label="E-mail" field="email" icon={Mail} value={user?.email} />
            </div>

            {/* 3. Privacidade */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Privacidade</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Shield size={20} color="var(--text-secondary)" />
                        <span>Ocultar meu telefone</span>
                    </div>
                    <div onClick={async () => { const newValue = !hidePhone; setHidePhone(newValue); const newSettings = { ...(user?.settings || {}), privacy_phone: newValue }; await supabase.from('users').update({ settings: newSettings }).eq('id', user.id); window.location.reload(); }} style={{ width: '48px', height: '24px', backgroundColor: hidePhone ? 'var(--primary)' : 'var(--bg-tertiary)', borderRadius: '12px', padding: '2px', cursor: 'pointer', transition: '0.3s' }}>
                        <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', transform: hidePhone ? 'translateX(24px)' : 'translateX(0)', transition: '0.3s' }} />
                    </div>
                </div>
            </div>

            {/* 4. Contas Conectadas */}
            <div className="card" style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Contas Conectadas</h4>

                {/* Mock Data for now - waiting for backend implementation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', background: '#DB4437', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Mail size={16} /> {/* Google fallback */}
                        </div>
                        <div>
                            <p style={{ fontWeight: 500 }}>Google</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Não conectado</p>
                        </div>
                    </div>
                    <button className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>Conectar</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', background: '#4267B2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Facebook size={16} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 500 }}>Facebook</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Não conectado</p>
                        </div>
                    </div>
                    <button className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>Conectar</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', background: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Shield size={16} /> {/* Apple fallback */}
                        </div>
                        <div>
                            <p style={{ fontWeight: 500 }}>Apple</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Não conectado</p>
                        </div>
                    </div>
                    <button className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>Conectar</button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={handleLogout} className="btn btn-secondary">
                    <LogOut size={20} />
                    Sair da Conta
                </button>

                <button onClick={handleDelete} className="btn btn-ghost" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={20} />
                    Excluir minha conta
                </button>
            </div>

        </div>
    );
};

export default Profile;
