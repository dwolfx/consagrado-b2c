import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { api } from '../services/api';

const Scanner = () => {
    const navigate = useNavigate();

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
                <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                    (Toque no quadrado para simular)
                </p>
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
