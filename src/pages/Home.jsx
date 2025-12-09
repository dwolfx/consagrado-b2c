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

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getEstablishments();
                setEstablishments(data);
            } catch (error) {
                console.error("Failed to load establishments", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleAccessTab = () => {
        navigate('/tab');
    };

    if (loading) return (
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--bg-tertiary)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
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
                            {user?.name.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Olá, {user?.name.split(' ')[0]}</h2>
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
                            Online e curtindo
                        </span>
                    </div>
                </div>
                <button onClick={logout} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    <LogOut size={20} />
                </button>
            </header>

            <main style={{ display: 'grid', gap: '1rem', flex: 1 }}>
                <button
                    onClick={handleAccessTab}
                    className="btn btn-primary"
                    style={{
                        height: '140px',
                        flexDirection: 'column',
                        fontSize: '1.4rem',
                        gap: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                        <Receipt size={32} color="white" />
                    </div>
                    Minha Comanda
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
                        <div key={est.id} className="card" onClick={() => navigate('/tab')} style={{ marginBottom: '0.75rem' }}>
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
