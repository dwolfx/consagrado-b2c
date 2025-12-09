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
        // Simple logic for demo: always go to Tab if clicked
        navigate('/tab');
    };

    if (loading) return <div className="container" style={{ paddingTop: '3rem', color: 'white' }}><h5>Carregando...</h5></div>;

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
