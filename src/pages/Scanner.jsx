import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

const Scanner = () => {
    const navigate = useNavigate();

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
                <div style={{
                    width: '280px', height: '280px',
                    border: '4px solid var(--primary)', borderRadius: '24px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                }} />
                <p style={{ marginTop: '2rem', color: 'white', fontSize: '1.25rem' }}>
                    Aponte para o QR Code da mesa
                </p>
            </div>
        </div>
    );
};

export default Scanner;
