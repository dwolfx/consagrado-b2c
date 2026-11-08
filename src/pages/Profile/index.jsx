import React from 'react';
import { Edit, Save as SaveIcon, X, History, ChevronRight, Phone, Shield, Mail, LogOut, Trash2 } from 'lucide-react';
import { maskCPF } from '../../utils/masks';
import 'react-phone-number-input/style.css';
import '../../styles/phone-input-overrides.css';

import FieldEditor from './components/FieldEditor';
import ConnectedAccounts from './components/ConnectedAccounts';
import { useProfileLogic } from './hooks/useProfileLogic';
import AppHeader from '../../components/ui/AppHeader';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import Avatar from '../../components/ui/Avatar';

const Profile = () => {
    const {
        user, navigate,
        editing, tempValue, setTempValue, saving,
        localCountry, setLocalCountry,
        hidePhone, togglePrivacyPhone,
        startEdit, cancelEdit, saveField,
        handleLogout, handleDelete
    } = useProfileLogic();

    const editorProps = {
        editing, startEdit, cancelEdit, saveField, setTempValue, tempValue, saving,
        user, localCountry, setLocalCountry
    };

    return (
        <div className="container">
            <AppHeader title="Meu Perfil" />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div
                    onClick={() => navigate('/avatar-editor')}
                    role="button"
                    tabIndex={0}
                    style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                >
                    <Avatar
                        src={user?.avatar}
                        name={user?.name}
                        size={100}
                        border="4px solid var(--bg-secondary)"
                    />
                    <button
                        type="button"
                        aria-label="Editar Avatar"
                        style={{
                            position: 'absolute', bottom: 0, right: 0,
                            backgroundColor: 'var(--primary)', borderRadius: '50%', width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            border: 'none', cursor: 'pointer'
                        }}
                    >
                        <Edit size={16} />
                    </button>
                </div>

                {/* Name Edit */}
                {editing === 'name' ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="input-field"
                            style={{ margin: 0, width: '200px', textAlign: 'center' }}
                            autoFocus
                        />
                        <button type="button" onClick={saveField} className="btn-ghost" aria-label="Salvar nome" style={{ color: 'var(--success)' }}>
                            <SaveIcon size={18} />
                        </button>
                        <button type="button" onClick={cancelEdit} className="btn-ghost" aria-label="Cancelar edição de nome" style={{ color: 'var(--danger)' }}>
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <h3
                        onClick={() => startEdit('name', user?.name)}
                        style={{ marginTop: '1rem', cursor: 'pointer', borderBottom: '1px dashed var(--bg-tertiary)', display: 'inline-block' }}
                    >
                        {user?.name || 'Visitante'}
                    </h3>
                )}
                <p style={{ color: 'var(--text-secondary)' }}>Cliente Consagrado</p>
            </div>

            {/* 1. Meu Histórico */}
            <div style={{ marginBottom: '1rem' }}>
                <button
                    type="button"
                    onClick={() => navigate('/history')}
                    className="card"
                    style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: 0, padding: '1rem', cursor: 'pointer' }}
                >
                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}>
                        <History size={20} color="var(--primary)" />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>Meu Histórico</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ver pedidos anteriores</div>
                    </div>
                    <ChevronRight size={20} color="var(--text-muted)" />
                </button>
            </div>

            {/* 2. Dados Pessoais */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    Dados Pessoais
                </h4>

                <FieldEditor
                    {...editorProps}
                    label="Celular"
                    field="phone"
                    icon={Phone}
                    value={user?.phone}
                    isPhone={true}
                />

                {(() => {
                    const effectiveCountry = editing === 'phone' ? localCountry : (user?.country || 'BR');

                    if (effectiveCountry === 'BR') {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <Shield size={20} color="var(--primary)" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>CPF</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0 }}>{maskCPF(user?.cpf) || 'Não informado'}</p>
                                        <button
                                            type="button"
                                            onClick={() => startEdit('cpf', user?.cpf)}
                                            className="btn-ghost"
                                            style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}
                                        >
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
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    Privacidade
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Shield size={20} color="var(--text-secondary)" />
                        <span>Ocultar meu telefone</span>
                    </div>
                    <ToggleSwitch
                        checked={hidePhone}
                        onChange={togglePrivacyPhone}
                        label="Ocultar meu telefone"
                    />
                </div>
            </div>

            {/* 4. Contas Conectadas */}
            <ConnectedAccounts />

            <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={handleLogout} className="btn btn-secondary">
                    <LogOut size={20} />
                    Sair da Conta
                </button>

                <button type="button" onClick={handleDelete} className="btn btn-ghost" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={20} />
                    Excluir minha conta
                </button>
            </div>
        </div>
    );
};

export default Profile;
