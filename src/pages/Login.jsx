import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Beer, Facebook } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        login(email, password);
        navigate('/');
    };

    const handleGoogleLogin = () => {
        login('google@test.com', 'mock');
        navigate('/');
    };

    return (
        <div className="container" style={{ justifyContent: 'top', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Beer size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
                <h1>Consagrado</h1>
                <p style={{ color: 'var(--text-secondary)' }}>O seu parceiro de rolê</p>
            </div>

            {/* Form login */}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="E-mail"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Senha"
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                    <Link to="/recover" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                        Esqueceu a senha?
                    </Link>
                </div>

                <button type="submit" className="btn btn-primary">
                    Entrar
                </button>
            </form>

            {/* Divider */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '1rem',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--bg-tertiary)' }} />
                ou
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--bg-tertiary)' }} />
            </div>

            {/* Social Login */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                    onClick={handleGoogleLogin}
                    className="btn btn-secondary"
                    style={{ backgroundColor: 'white', color: 'black' }}
                >
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="24" alt="G" />
                </button>

                <button className="btn btn-secondary" style={{ backgroundColor: '#1877F2', color: 'white' }}>
                    <Facebook size={24} />
                </button>

                <button className="btn btn-secondary" style={{ backgroundColor: 'black', color: 'white' }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" width="20" style={{ filter: 'invert(1)' }} alt="A" />
                </button>
            </div>

            {/* Create account */}
            <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Ainda não tem conta? <Link to="/register" style={{ color: 'var(--primary)' }}>Cadastre-se</Link>
            </div>
        </div>
    );
};

export default Login;
