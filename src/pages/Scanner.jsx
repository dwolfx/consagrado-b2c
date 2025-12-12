import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { api } from '../services/api';
import { useState } from 'react';

const Scanner = () => {
    const navigate = useNavigate();
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState('');

    const handleSimulation = async () => {
        try {
            // Fetch real tables to get a valid ID
            const tables = await api.getTables();
            if (tables.length > 0) {
                const validTableId = tables[0].id; // Use the first available table
                localStorage.setItem('my_table_id', validTableId);
                navigate('/');
            } else {
                alert('Nenhuma mesa encontrada no sistema para simular.');
            }
        } catch (error) {
            console.error("Simulation error", error);
            // Fallback for demo if offline/error
            localStorage.setItem('my_table_id', '123');
            navigate('/');
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!manualCode || manualCode.length < 3) return;

        try {
            const table = await api.getTableByCode(manualCode);
            if (table && table.id) {
                localStorage.setItem('my_table_id', table.id);
                navigate('/');
            } else {
                setError('Mesa não encontrada. Verifique o código.');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao buscar mesa.');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'black', zIndex: 999 }}>
            <button
                onClick={() => navigate(-1)}
                style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'white', zIndex: 10 }}
            >
                <X size={32} />
            </button>

            <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <div
                    onClick={handleSimulation}
                    style={{
                        width: '280px', height: '280px',
                        border: '4px solid var(--primary)', borderRadius: '24px',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.4), transparent)',
                        animation: 'scan 2s linear infinite'
                    }} />
                </div>
                <p style={{ marginTop: '2rem', color: 'white', fontSize: '1.25rem' }}>
                    Aponte para o QR Code da mesa
                </p>
                <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    (Toque no quadrado para simular)
                </p>

                <div style={{ width: '100%', maxWidth: '300px', padding: '0 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                    <p style={{ color: 'white', textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold' }}>OU</p>

                    <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Insira o código da mesa</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                placeholder="Ex: AA0001"
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                    background: 'rgba(255,255,255,0.1)', color: 'white',
                                    fontSize: '1rem', textTransform: 'uppercase', outline: 'none', border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '0 20px', borderRadius: '8px', border: 'none',
                                    background: 'var(--primary)', color: 'white', fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                IR
                            </button>
                        </div>
                        {error && (
                            <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>{error}</span>
                        )}
                    </form>
                </div>
            </div>
            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
            `}</style>
        </div>
    );
};

export default Scanner;
