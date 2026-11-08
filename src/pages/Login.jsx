import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Facebook, Mail, Lock, Sparkles } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import './Login.css';

const GoogleIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
);

const AppleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.71-.93 2.73 1 .08 2.02-.48 2.64-1.23z"/>
    </svg>
);

const Login = () => {
    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Guest modal state
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const success = await login(email, password);
        setLoading(false);
        if (success) {
            navigate('/scanner');
        } else {
            setError('E-mail ou senha incorretos.');
        }
    };

    const handleDemoShortcut = async () => {
        setLoading(true);
        await login('demo@demo', 'demo');
        navigate('/scanner');
    };

    const handleGuestSubmit = (e) => {
        e.preventDefault();
        if (loginAsGuest) {
            loginAsGuest(guestName);
        }
        setShowGuestModal(false);
        navigate('/scanner');
    };

    return (
        <main className="login-viewport">
            {/* Ambient Backlight Orbs */}
            <div className="login-glow-orb-top" aria-hidden="true" />
            <div className="login-glow-orb-bottom" aria-hidden="true" />

            <div className="login-content">
                {/* Hero / Branding */}
                <header className="login-hero">
                    <BrandLogo
                        size={72}
                        tagline="O seu parceiro de rolê"
                        glow={true}
                    />
                </header>

                {/* Glassmorphic Form Card */}
                <section className="login-card">
                    {error && (
                        <div className="login-error-banner" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="login-input-group">
                            <span className="login-input-icon">
                                <Mail size={18} />
                            </span>
                            <input
                                type="email"
                                placeholder="E-mail ou telefone"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="login-input-field"
                                required
                            />
                        </div>

                        <div className="login-input-group">
                            <span className="login-input-icon">
                                <Lock size={18} />
                            </span>
                            <input
                                type="password"
                                placeholder="Sua senha de acesso"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input-field"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-btn-primary"
                        >
                            {loading ? 'Entrando...' : 'Login'}
                        </button>
                    </form>

                    <div className="login-forgot-wrap">
                        <Link to="/forgot-password" className="login-forgot-link">
                            Esqueceu a senha?
                        </Link>
                    </div>

                    {/* Botão de Convidado / Nightlife Fast Track */}
                    <button
                        type="button"
                        onClick={() => setShowGuestModal(true)}
                        className="login-btn-guest"
                    >
                        <span>⚡</span>
                        <span>Entrar como Convidado</span>
                    </button>

                    {/* Divisor "OU" */}
                    <div className="login-divider">
                        <div className="login-divider-line" />
                        <span className="login-divider-text">OU</span>
                        <div className="login-divider-line" />
                    </div>

                    {/* 3 Botões Sociais: Google, Facebook, Apple */}
                    <div className="login-social-row">
                        <button
                            type="button"
                            onClick={handleDemoShortcut}
                            title="Entrar com Google (ou Demo)"
                            className="login-social-btn google"
                        >
                            <GoogleIcon />
                        </button>

                        <button
                            type="button"
                            disabled
                            title="Login com Facebook (Em breve)"
                            className="login-social-btn facebook"
                        >
                            <Facebook size={22} color="white" />
                        </button>

                        <button
                            type="button"
                            disabled
                            title="Login com Apple (Em breve)"
                            className="login-social-btn apple"
                        >
                            <AppleIcon />
                        </button>
                    </div>
                </section>
            </div>

            {/* Rodapé */}
            <footer className="login-footer">
                <span>Ainda não tem conta?</span>
                <Link to="/register" className="login-register-link">
                    Cadastre-se
                </Link>
            </footer>

            {/* Modal Glassmorphic de Convidado */}
            {showGuestModal && (
                <div
                    className="guest-modal-backdrop"
                    onClick={() => setShowGuestModal(false)}
                >
                    <div
                        className="guest-modal-box"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="guest-modal-header">
                            <span className="guest-modal-badge">
                                <Sparkles size={14} />
                                Acesso Sem Cadastro
                            </span>
                            <h3 className="guest-modal-title">Entrar como Convidado</h3>
                            <p className="guest-modal-subtitle">
                                Como o garçom pode te chamar? Coloque seu nome para abrir o scanner e ler o QR Code da mesa.
                            </p>
                        </div>

                        <form onSubmit={handleGuestSubmit}>
                            <div className="login-input-group">
                                <input
                                    type="text"
                                    placeholder="Ex: Victor Hugo"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="login-input-field"
                                    style={{ paddingLeft: '1.25rem' }}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="guest-modal-actions">
                                <button type="submit" className="guest-modal-btn-submit">
                                    Ler QR Code da Mesa ➔
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowGuestModal(false)}
                                    className="guest-modal-btn-cancel"
                                >
                                    Voltar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Login;
