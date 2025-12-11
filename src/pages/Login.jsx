import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Beer, Facebook } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(email, password);
        if (success) {
            navigate('/');
        } else {
            setError('Credenciais inválidas.');
        }
    };

    const handleDemoShortcut = async () => {
        await login('demo@demo', 'demo');
        navigate('/');
    };

    return (
        <div className="container fade-in" style={{ justifyContent: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{
                    width: '80px', height: '80px', background: 'var(--primary)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                }}>
                    <Beer size={40} color="white" />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Consagrado</h1>
                <p style={{ color: 'var(--text-secondary)' }}>O seu parceiro de rolê</p>
            </div>

            <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="email"
                        placeholder="E-mail"
                        className="input-field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="password"
                        placeholder="Senha"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem' }}>
                    Entrar
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Link to="/recover" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
                        Esqueceu a senha?
                    </Link>
                </div>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', maxWidth: '320px', margin: '0 auto 2rem auto', width: '100%' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>OU</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                    onClick={handleDemoShortcut}
                    className="btn btn-secondary"
                    style={{ backgroundColor: 'white', color: 'black', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Demo Login Shortcut (Google)"
                >
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="24" alt="G" />
                </button>

                <button className="btn btn-secondary" disabled style={{ backgroundColor: '#1877F2', color: 'white', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>
                    <Facebook size={24} />
                </button>

                <button className="btn btn-secondary" disabled style={{ backgroundColor: 'black', color: 'white', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" width="20" style={{ filter: 'invert(1)' }} alt="A" />
                </button>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Ainda não tem conta? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Cadastre-se</Link>
            </div>
        </div>
    );
};

export default Login;
