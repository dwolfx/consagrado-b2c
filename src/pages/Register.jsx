import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AuthHeader from '../components/auth/AuthHeader';
import { maskCPF } from '../utils/masks';
import { Input, PhoneInput, Button } from '../components/ui';

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
    const [selectedCountry, setSelectedCountry] = useState({ code: 'BR', ddi: '+55' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cpf') formattedValue = maskCPF(value);

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
        const fullPhone = formData.phone
            ? (selectedCountry.code === 'BR' ? formData.phone : `${selectedCountry.ddi} ${formData.phone}`)
            : '';
        const { success, error: regError } = await register(
            formData.name,
            formData.email,
            formData.password,
            fullPhone,
            formData.cpf
        );

        if (success) {
            navigate('/login');
        } else {
            setError(regError?.message || 'Erro ao criar conta.');
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
            <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-ghost"
                aria-label="Voltar"
                style={{ position: 'absolute', top: '1rem', left: '1rem', width: 'auto', padding: 0 }}
            >
                <ArrowLeft />
            </button>

            <AuthHeader title="Criar Conta" subtitle="Junte-se ao rolê!" />

            <form onSubmit={handleRegister} style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <Input
                    name="name"
                    placeholder="Nome Completo"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <Input
                    name="cpf"
                    placeholder="CPF"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                    maxLength={14}
                />

                <Input
                    name="email"
                    type="email"
                    placeholder="E-mail"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <PhoneInput
                    name="phone"
                    placeholder="Celular (WhatsApp)"
                    defaultCountry="BR"
                    value={formData.phone}
                    onChange={handleChange}
                    onCountryChange={setSelectedCountry}
                    required
                />

                <Input
                    name="password"
                    type="password"
                    placeholder="Senha"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirmar Senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />

                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Ao se cadastrar, você concorda com nossos termos.
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    style={{ marginBottom: '1.5rem', padding: '1rem' }}
                >
                    {loading ? 'Criando...' : 'Cadastrar'}
                </Button>
            </form>

            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Já tem uma conta? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Entrar</Link>
            </div>
        </div>
    );
};

export default Register;
