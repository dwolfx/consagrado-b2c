import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, MapPin, LogOut, Camera, History as HistoryIcon, ShoppingBag, User } from 'lucide-react';
import { api } from '../services/api';

const Home = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasTab, setHasTab] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getEstablishments();
                setEstablishments(data || []);
            } catch (error) {
                console.error("Failed to load establishments", error);
            } finally {
                setLoading(false);
            }
        };
        load();

        // Check for active tab safely
        try {
            const tableId = localStorage.getItem('my_table_id');
            setHasTab(!!tableId);
        } catch (e) {
            console.error("Storage access error", e);
        }
    }, []);

    const handleMainAction = () => {
        if (hasTab) {
            navigate('/tab');
        } else {
            navigate('/scanner');
        }
    };

    // Safe user access helpers
    const userName = user?.name || 'Visitante';
    const userInitial = userName.charAt(0) || 'U';
    const firstName = userName.split(' ')[0] || 'Visitante';

    if (loading) return (
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="container fade-in">
            <header className="glass-header">
                <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #ab47bc 100%)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(171, 71, 188, 0.4)'
                    }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                            {userInitial}
                        </span>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Olá, {firstName}</h2>
                        {hasTab ? (
                            <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
                                Curtindo no Bar
                            </span>
                        ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Pronto para sair?
                            </span>
                        )}
                    </div>
                </div>
                <button onClick={logout} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    <LogOut size={20} />
                </button>
            </header>

            <main style={{ display: 'grid', gap: '1rem', flex: 1 }}>
                <button
                    onClick={handleMainAction}
                    className="btn btn-primary"
                    style={{
                        height: '140px',
                        flexDirection: 'column',
                        fontSize: '1.4rem',
                        gap: '12px',
                        background: hasTab
                            ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' // Tab Color (Indigo/Purple)
                            : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', // Scan Color (Green/Blue)
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                        {hasTab ? <Receipt size={32} color="white" /> : <Camera size={32} color="white" />}
                    </div>
                    {hasTab ? 'Minha Comanda' : 'Ler QR Code'}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => navigate('/menu')} className="card" style={{
                        flexDirection: 'column', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: 0, gap: '10px', cursor: 'pointer'
                    }}>
                        <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px' }}>
                            <ShoppingBag size={28} color="#38bdf8" />
                        </div>
                        <span style={{ fontWeight: '600' }}>Cardápio</span>
                    </button>

                    <button onClick={() => navigate('/history')} className="card" style={{
                        flexDirection: 'column', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: 0, gap: '10px', cursor: 'pointer'
                    }}>
                        <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px' }}>
                            <HistoryIcon size={28} color="#eab308" />
                        </div>
                        <span style={{ fontWeight: '600' }}>Histórico</span>
                    </button>
                </div>

                <section style={{ marginTop: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Próximos a você</h3>
                    {establishments.map(est => (
                        <div key={est.id} className="card" onClick={() => navigate('/tab')} style={{ marginBottom: '0.75rem', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ marginBottom: '0.25rem' }}>{est.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <MapPin size={12} />
                                        <span>Aberto agora</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </main>

            {/* Floating Action Button for Scanner */}
            <div style={{
                position: 'fixed', bottom: '2rem', right: '2rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', zIndex: 50
            }}>
                <button className="fab" onClick={() => navigate('/scanner')} style={{ position: 'relative', bottom: 0, right: 0 }}>
                    <Camera size={28} />
                </button>
            </div>
        </div>
    );
};

export default Home;
