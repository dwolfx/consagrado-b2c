import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Shield, LogOut, Trash2, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [hidePhone, setHidePhone] = useState(false);

    // Mock edit states
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');

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

    return (
        <div className="container">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <h2>Meu Perfil</h2>
            </header>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                        src={user?.avatar}
                        style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--bg-secondary)' }}
                    />
                    <button style={{
                        position: 'absolute', bottom: 0, right: 0,
                        backgroundColor: 'var(--primary)', borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <Camera size={16} />
                    </button>
                </div>
                {isEditing ? (
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                        style={{ marginTop: '1rem', textAlign: 'center' }}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                    />
                ) : (
                    <h3 onClick={() => setIsEditing(true)} style={{ marginTop: '1rem', cursor: 'pointer', borderBottom: '1px dashed var(--text-secondary)' }}>
                        {name}
                    </h3>
                )}
                <p style={{ color: 'var(--text-secondary)' }}>Cliente Consagrado</p>
            </div>

            <div className="card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Dados Pessoais</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Phone size={20} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Celular</p>
                        <p>{user?.phone}</p>
                    </div>
                    <button className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>Alterar</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Mail size={20} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>E-mail</p>
                        <p>{user?.email}</p>
                    </div>
                    <button className="btn-ghost" style={{ width: 'auto', fontSize: '0.9rem', color: 'var(--primary)' }}>Alterar</button>
                </div>
            </div>

            <div className="card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Privacidade</h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Shield size={20} />
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
                <button onClick={handleLogout} className="btn btn-outline">
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
