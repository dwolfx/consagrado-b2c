import { useNavigate, useLocation } from 'react-router-dom';
import { X, Martini, Keyboard } from 'lucide-react';
import { api } from '../services/api';
import { useState } from 'react';
import { useTableContext } from '../context/TableContext';

const Scanner = () => {
    const navigate = useNavigate();
    const { setTableId } = useTableContext();
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState('');
    const [showInput, setShowInput] = useState(false);

    // Check if navigated with manual mode request
    const location = useLocation();
    useEffect(() => {
        if (location.state?.mode === 'manual') {
            setShowInput(true);
        }
    }, [location]);

    const handleSimulation = async () => {
        try {
            // Fetch real tables to get a valid ID
            const tables = await api.getTables();
            if (tables.length > 0) {
                const validTableId = tables[0].id;

                // Force theme cleanup before entering (optional safe guard)
                document.documentElement.style.setProperty('--brand-color', '#f59e0b');

                setTableId(validTableId); // Context handles localstorage
                navigate('/');
            } else {
                alert('Nenhuma mesa encontrada no sistema para simular.');
            }
        } catch (error) {
            console.error("Simulation error", error);
            setTableId('123');
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
                setTableId(table.id);
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
        <div style={{
            position: 'fixed', inset: 0,
            background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
            zIndex: 999
        }}>
            <button
                onClick={() => navigate(-1)}
                style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'white', zIndex: 10, background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <X size={32} />
            </button>

            <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
            }}>
                {/* QR Scanner Mock */}
                {!showInput ? (
                    <>
                        <div
                            onClick={handleSimulation}
                            style={{
                                width: '280px', height: '280px',
                                border: '4px solid var(--primary)', borderRadius: '24px',
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)', // Darker overlay
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.4), transparent)',
                                animation: 'scan 2s linear infinite',
                                pointerEvents: 'none'
                            }} />

                            {/* Drink Icon in middle as requested */}
                            <Martini size={48} color="white" style={{ opacity: 0.5 }} />
                        </div>

                        <p style={{ marginTop: '2rem', color: 'white', fontSize: '1.25rem', fontWeight: 600 }}>
                            Aponte para o QR Code
                        </p>
                        <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '3rem' }}>
                            (Toque no quadrado para simular)
                        </p>

                        <button
                            onClick={() => setShowInput(true)}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white', padding: '1rem 2rem', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <Keyboard size={20} />
                            Inserir código da mesa
                        </button>
                    </>
                ) : (
                    /* Manual Input View */
                    <div style={{ width: '100%', maxWidth: '320px', padding: '2rem', animation: 'fadeIn 0.3s' }}>
                        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>Código da Mesa</h2>

                        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                placeholder="Ex: AA0001"
                                autoFocus
                                style={{
                                    padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)',
                                    background: '#000000', color: 'white',
                                    fontSize: '1.2rem', textTransform: 'uppercase', outline: 'none',
                                    textAlign: 'center', letterSpacing: '2px'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                    padding: '1rem', borderRadius: '12px', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 'bold'
                                }}
                            >
                                Entrar na Mesa
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowInput(false)}
                                style={{
                                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                                    padding: '1rem', cursor: 'pointer', textDecoration: 'underline'
                                }}
                            >
                                Voltar para Camera
                            </button>
                        </form>
                        {error && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Scanner;
