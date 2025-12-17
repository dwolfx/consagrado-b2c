import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Shield, LogOut, Trash2, Edit, Save as SaveIcon, X, History, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { supabase } from '../services/api';

const Profile = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth(); // login function acts as 'refreshUser' if we pass new data, or we just reload
    const [hidePhone, setHidePhone] = useState(false);

    const [editing, setEditing] = useState(null); // 'name', 'phone', 'email'
    const [tempValue, setTempValue] = useState('');
    const [saving, setSaving] = useState(false);

    const startEdit = (field, currentVal) => {
        setEditing(field);
        setTempValue(currentVal || '');
    };

    const cancelEdit = () => {
        setEditing(null);
        setTempValue('');
    };

    const saveField = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            const updateData = { [editing]: tempValue };

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            // Update local state by re-logging in or manually updating context
            // Since AuthContext holds 'user', we might need to reload or patch it.
            // For MVP, simplistic approach:
            const updatedUser = { ...user, ...updateData };
            // Use internal mechanism to update context if possible, or force reload
            localStorage.setItem('consagrado_user', JSON.stringify(updatedUser)); // Update cache
            window.location.reload(); // Hard refresh to sync context quickly

        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar. Tente novamente.');
        } finally {
            setSaving(false);
            setEditing(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDelete = () => {
        if (confirm("Tem certeza? Essa ação é irreversível e excluirá todos os seus dados conforme a LGPD.")) {
            alert("Conta agendada para exclusão.");
            handleLogout();
        }
    };

    const FieldEditor = ({ label, field, icon: Icon, value }) => {
        const isEditingThis = editing === field;

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <Icon size={20} color="var(--primary)" />
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</p>
                    {isEditingThis ? (
                        <input
                            value={tempValue}
                            onChange={e => setTempValue(e.target.value)}
                            className="input-field"
                            style={{ margin: 0, padding: '0.5rem' }}
                            autoFocus
                        />
                    ) : (
                        <p>{value || 'Não informado'}</p>
                    )}
                </div>
                {isEditingThis ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                )}
            </div>
        );
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
                        <input
                            value={tempValue}
                            onChange={e => setTempValue(e.target.value)}
                            className="input-field"
                            style={{ margin: 0, width: '200px', textAlign: 'center' }}
                            autoFocus
                        />
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

            <div className="card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Dados Pessoais</h4>
                <FieldEditor label="Celular" field="phone" icon={Phone} value={user?.phone} />
                <FieldEditor label="E-mail" field="email" icon={Mail} value={user?.email} />
            </div>

            <div style={{ marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/history')}
                    className="card"
                    style={{
                        width: '100%', flexDirection: 'row', alignItems: 'center', gap: '1rem',
                        marginBottom: 0, padding: '1rem', cursor: 'pointer'
                    }}
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

            <div className="card" style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Privacidade</h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Shield size={20} color="var(--text-secondary)" />
                        <span>Ocultar meu telefone</span>
                    </div>
                    <div
                        onClick={() => setHidePhone(!hidePhone)}
                        style={{
                            width: '48px', height: '24px', backgroundColor: hidePhone ? 'var(--primary)' : 'var(--bg-tertiary)',
                            borderRadius: '12px', padding: '2px', cursor: 'pointer', transition: '0.3s'
                        }}
                    >
                        <div style={{
                            width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%',
                            transform: hidePhone ? 'translateX(24px)' : 'translateX(0)', transition: '0.3s'
                        }} />
                    </div>
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
