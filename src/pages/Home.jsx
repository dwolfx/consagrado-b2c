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
    const [establishmentName, setEstablishmentName] = useState('');

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

        const checkTab = async () => {
            // Check for active tab safely
            try {
                const tableId = localStorage.getItem('my_table_id');
                setHasTab(!!tableId);

                if (tableId) {
                    // Fetch table name if possible
                    try {
                        const tableData = await api.getTable(tableId);
                        if (tableData && tableData.establishment) {
                            setEstablishmentName(tableData.establishment.name);
                        }
                    } catch (e) {
                        console.error("Error fetching establishment name for home", e);
                    }
                }

            } catch (e) {
                console.error("Storage access error", e);
            }
        };
        checkTab();

    }, []);

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
                                Curtindo em {establishmentName || 'Restaurante'}
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

            <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

                {/* --- CONTEXT: WITH TABLE (DINING) --- */}
                {hasTab ? (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Primary: Order */}
                            <button
                                onClick={() => navigate('/menu')}
                                className="btn btn-primary"
                                style={{
                                    height: '160px', flexDirection: 'column', fontSize: '1.5rem', gap: '16px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber/Orange for appetite
                                    border: 'none', boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.5)',
                                    margin: '1rem 0'
                                }}
                            >
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
                                    <ShoppingBag size={40} color="white" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span>Fazer Pedido</span>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 'normal' }}>Ver cardápio digital</span>
                                </div>
                            </button>

                            {/* Secondary Action Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {/* Bill */}
                                <button
                                    onClick={() => navigate('/tab')}
                                    className="card"
                                    style={{
                                        margin: 0, padding: '1.5rem', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        border: '1px solid var(--bg-tertiary)', gap: '0.5rem',
                                        backgroundColor: 'var(--bg-secondary)'
                                    }}
                                >
                                    <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
                                        <Receipt size={28} color="#6366f1" />
                                    </div>
                                    <span style={{ fontWeight: '600' }}>Minha Comanda</span>
                                </button>

                                {/* History */}
                                <button
                                    onClick={() => navigate('/history')}
                                    className="card"
                                    style={{
                                        margin: 0, padding: '1.5rem', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        border: '1px solid var(--bg-tertiary)', gap: '0.5rem',
                                        backgroundColor: 'var(--bg-secondary)'
                                    }}
                                >
                                    <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px' }}>
                                        <HistoryIcon size={28} color="#eab308" />
                                    </div>
                                    <span style={{ fontWeight: '600' }}>Histórico</span>
                                </button>
                            </div>
                        </div>

                        {/* Tertiary: Promos (Separate since it's less critical) */}
                        <div>
                            <div className="card" style={{
                                padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                                cursor: 'default', opacity: 0.8
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>🎁</span>
                                <div>
                                    <h4 style={{ margin: 0 }}>Promoções</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Em breve cupons exclusivos</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* --- CONTEXT: NO TABLE (DISCOVERY) --- */
                    <>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Primary: Scan */}
                            <button
                                onClick={() => navigate('/scanner')}
                                className="btn btn-primary"
                                style={{
                                    height: '160px', flexDirection: 'column', fontSize: '1.5rem', gap: '16px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', // Green/Blue
                                    border: 'none', boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.5)'
                                }}
                            >
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
                                    <Camera size={40} color="white" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span>Ler QR Code</span>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 'normal' }}>Entrar em uma mesa</span>
                                </div>
                            </button>

                            {/* Secondary: History */}
                            <button
                                onClick={() => navigate('/history')}
                                className="card"
                                style={{
                                    margin: 0, padding: '1.5rem', flexDirection: 'row', justifyContent: 'space-between',
                                    alignItems: 'center', cursor: 'pointer', border: '1px solid var(--bg-tertiary)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px' }}>
                                        <HistoryIcon size={24} color="#eab308" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Últimos Pedidos</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ver histórico</span>
                                    </div>
                                </div>
                                <div className="btn-ghost" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}>
                                    ➜
                                </div>
                            </button>
                        </div>

                        {/* Tertiary: Nearby */}
                        <section style={{ marginTop: '0.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Restaurantes Próximos</h3>
                            {establishments.map(est => (
                                <div key={est.id} className="card" style={{ marginBottom: '0.75rem', cursor: 'default' }}>
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
                    </>
                )}
            </main>
        </div>
    );
};

export default Home;
