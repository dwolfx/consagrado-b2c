import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Lock } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Ensure the user actually has a valid session from the recovery link
    useEffect(() => {
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // We are ready to update password
            }
        });
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            addToast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            addToast(`Erro: ${error.message}`, 'error');
        } else {
            addToast('Senha atualizada com sucesso!', 'success');
            navigate('/');
        }
    };

    return (
        <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--primary)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <Lock size={32} color="white" />
                    </div>
                    <h2>Criar Nova Senha</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Digite sua nova senha abaixo
                    </p>
                </div>

                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <input
                            type="password"
                            placeholder="Nova Senha"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1rem', justifyContent: 'center' }}>
                        {loading ? 'Salvando...' : 'Salvar e Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
