import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Beer, ArrowLeft } from 'lucide-react';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Masks
    const maskCPF = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const maskPhone = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cpf') formattedValue = maskCPF(value);
        if (name === 'phone') formattedValue = maskPhone(value);

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(formData.email)) {
            setError('E-mail inválido.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Senhas não conferem.');
            return;
        }

        if (formData.cpf.length < 14) {
            setError('CPF incompleto.');
            return;
        }

        setLoading(true);
        // Call register from AuthContext
        const { success, error } = await register(
            formData.name,
            formData.email,
            formData.password,
            formData.phone,
            formData.cpf
        );

        if (success) {
            alert('Conta criada com sucesso! 📧\n\nPor favor, verifique seu e-mail para confirmar o cadastro antes de fazer login.');
            navigate('/login');
        } else {
            setError(error || 'Erro ao cadastrar.');
        }
        setLoading(false);
    };

    return (
        <div className="container fade-in" style={{ justifyContent: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            <button onClick={() => navigate(-1)} className="btn-ghost" style={{ position: 'absolute', top: '1rem', left: '1rem', width: 'auto' }}>
                <ArrowLeft />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '60px', height: '60px', background: 'var(--primary)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                }}>
                    <Beer size={30} color="white" />
                </div>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Criar Conta</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Junte-se ao rolê!</p>
            </div>

            <form onSubmit={handleRegister} style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <input
                        name="name"
                        placeholder="Nome Completo"
                        className="input-field"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <input
                        name="cpf"
                        placeholder="CPF"
                        className="input-field"
                        value={formData.cpf}
                        onChange={handleChange}
                        required
                        maxLength={14}
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <input
                        name="email"
                        type="email"
                        placeholder="E-mail"
                        className="input-field"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        name="phone"
                        type="tel"
                        placeholder="Celular (WhatsApp)"
                        className="input-field"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        maxLength={15}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        name="password"
                        type="password"
                        placeholder="Senha"
                        className="input-field"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirmar Senha"
                        className="input-field"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Ao se cadastrar, você concorda com nossos termos.
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem' }}>
                    {loading ? 'Criando...' : 'Cadastrar'}
                </button>
            </form>

            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Entrar</Link>
            </div>
        </div>
    );
};

export default Register;
