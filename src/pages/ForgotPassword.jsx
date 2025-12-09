import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [method, setMethod] = useState('email'); // email or cpf

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Link de recuperação enviado para seu ${method === 'email' ? 'E-mail' : 'SMS'}!`);
        navigate('/login');
    };

    return (
        <div className="container">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <h2>Recuperar Senha</h2>
            </header>

            <div style={{ marginTop: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Escolha como deseja recuperar sua senha:
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        className={`btn ${method === 'email' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setMethod('email')}
                    >
                        E-mail
                    </button>
                    <button
                        className={`btn ${method === 'cpf' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setMethod('cpf')}
                    >
                        CPF
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {method === 'email' ? (
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>E-mail cadastrado</label>
                            <input type="email" className="input-field" placeholder="seu@email.com" required />
                        </div>
                    ) : (
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>CPF cadastrado</label>
                            <input type="text" className="input-field" placeholder="000.000.000-00" required />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary">
                        Enviar Link
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
