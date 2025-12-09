import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, MapPin, LogOut, Camera, History as HistoryIcon, ShoppingBag, User } from 'lucide-react';
import { currentTab } from '../data/mockData';
import { useState } from 'react';

const Home = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);

    // Mock logic: randomly decide if user has a tab open
    // For demo: Let's assume they DO if we imported currentTab
    const hasTab = Boolean(currentTab);

    const handleAccessTab = () => {
        if (hasTab) {
            navigate('/tab');
        } else {
            setShowPopup(true);
        }
    };

    return (
        <div className="container" style={{ position: 'relative' }}>
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '2rem', paddingTop: '1rem'
            }}>
                <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ backgroundColor: 'var(--primary)', borderRadius: '50%', padding: '0.5rem' }}>
                        <User size={20} color="white" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem' }}>Olá, {user?.name.split(' ')[0]}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vamos curtir a noite?</p>
                    </div>
                </div>
                <button onClick={logout} className="btn-ghost" style={{ width: 'auto', padding: '0.5rem' }}>
                    <LogOut size={24} />
                </button>
            </header>

            <main style={{ display: 'grid', gap: '1.5rem', flex: 1 }}>
                <button
                    onClick={handleAccessTab}
                    className="btn btn-primary"
                    style={{
                        height: '160px',
                        flexDirection: 'column',
                        fontSize: '1.5rem',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)'
                    }}
                >
                    <Receipt size={48} style={{ marginBottom: '0.5rem' }} />
                    Acessar Comanda
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => navigate('/menu')} className="btn btn-secondary" style={{ flexDirection: 'column', height: '120px' }}>
                        <ShoppingBag size={32} style={{ marginBottom: '0.5rem' }} />
                        Cardápio
                    </button>

                    <button onClick={() => navigate('/history')} className="btn btn-secondary" style={{ flexDirection: 'column', height: '120px' }}>
                        <HistoryIcon size={32} style={{ marginBottom: '0.5rem' }} />
                        Histórico
                    </button>
                </div>
            </main>

            {/* Floating Action Button for Scanner */}
            <div style={{
                position: 'fixed', bottom: '2rem', right: '2rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', zIndex: 50
            }}>
                <button className="fab" onClick={() => navigate('/scanner')} style={{ position: 'relative', bottom: 0, right: 0 }}>
                    <Camera size={28} />
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--bg-tertiary)' }}>Ler QR</span>
            </div>

            {/* Popup */}
            {showPopup && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }} onClick={() => setShowPopup(false)}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', padding: '2rem',
                        borderRadius: 'var(--radius-lg)', maxWidth: '300px', textAlign: 'center'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem' }}>Ops!</h3>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            Você não possui nenhuma comanda aberta no momento.
                        </p>
                        <button onClick={() => setShowPopup(false)} className="btn btn-primary">
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
