import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();
        alert("Cadastro realizado! Faça login.");
        navigate('/login');
    };

    return (
        <div className="container">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <h2>Criar Conta</h2>
            </header>

            <form onSubmit={handleRegister} style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nome Completo</label>
                    <input type="text" className="input-field" placeholder="Seu nome" required />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>CPF</label>
                    <input type="text" className="input-field" placeholder="000.000.000-00" required />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Celular</label>
                    <input type="tel" className="input-field" placeholder="(00) 00000-0000" required />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>E-mail</label>
                    <input type="email" className="input-field" placeholder="seu@email.com" required />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Senha</label>
                    <input type="password" className="input-field" placeholder="******" required />
                </div>

                <button type="submit" className="btn btn-primary">
                    Cadastrar
                </button>
            </form>
        </div>
    );
};

export default Register;
