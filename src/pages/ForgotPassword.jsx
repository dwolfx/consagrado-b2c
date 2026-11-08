import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import { Input, Button } from '../components/ui';
import { maskCPF } from '../utils/masks';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [method, setMethod] = useState('email'); // email or cpf
    const [emailValue, setEmailValue] = useState('');
    const [cpfValue, setCpfValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Link de recuperação enviado para seu ${method === 'email' ? 'E-mail' : 'SMS'}!`);
        navigate('/login');
    };

    return (
        <div className="container">
            <AppHeader title="Recuperar Senha" />

            <div style={{ marginTop: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Escolha como deseja recuperar sua senha:
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <Button
                        type="button"
                        variant={method === 'email' ? 'primary' : 'outline'}
                        fullWidth
                        onClick={() => setMethod('email')}
                    >
                        E-mail
                    </Button>
                    <Button
                        type="button"
                        variant={method === 'cpf' ? 'primary' : 'outline'}
                        fullWidth
                        onClick={() => setMethod('cpf')}
                    >
                        CPF
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    {method === 'email' ? (
                        <Input
                            id="recover-email"
                            label="E-mail cadastrado"
                            type="email"
                            placeholder="seu@email.com"
                            value={emailValue}
                            onChange={(e) => setEmailValue(e.target.value)}
                            required
                        />
                    ) : (
                        <Input
                            id="recover-cpf"
                            label="CPF cadastrado"
                            type="text"
                            placeholder="000.000.000-00"
                            value={cpfValue}
                            onChange={(e) => setCpfValue(maskCPF(e.target.value))}
                            maxLength={14}
                            required
                        />
                    )}

                    <Button type="submit" variant="primary" fullWidth style={{ marginTop: '1rem' }}>
                        Enviar Link
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
