import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTablePresence } from '../hooks/useTablePresence';
import { Receipt, MapPin, LogOut, Camera, History, Utensils, Bell, ChevronRight, Clock } from 'lucide-react';
import { api } from '../services/api';

const Home = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [hasTab, setHasTab] = useState(false);
    const [establishment, setEstablishment] = useState(null);
    const [tableId, setTableId] = useState(null);
    const [activeOrders, setActiveOrders] = useState(false); // Mock for "Preparo" badge

    // Track presence
    const { onlineUsers } = useTablePresence();

    useEffect(() => {
        const init = async () => {
            try {
                // Check Tab
                const storedTableId = localStorage.getItem('my_table_id');
                setTableId(storedTableId);
                setHasTab(!!storedTableId);

                // Fetch Establishment Context
                // Fetch Establishment Context
                if (storedTableId) {
                    const tableData = await api.getTable(storedTableId);
                    if (tableData && tableData.establishment) {
                        setEstablishment(tableData.establishment);
                        // Inject Brand Color if available, else default Gold
                        const brandColor = tableData.establishment.theme_color || '#f59e0b';
                        document.documentElement.style.setProperty('--brand-color', brandColor);
                    }
                    // Check for active orders (Simulated)
                    // In real app, check api.getOrders status
                    setActiveOrders(true);
                } else {
                    // DEMO FALLBACK: Fetch Default Establishment (ID 1)
                    // Check if user is logged in (even demo user) and apply basic branding
                    const estabData = await api.getEstablishment(1);
                    if (estabData) {
                        setEstablishment(estabData);
                        const brandColor = estabData.theme_color || '#f59e0b';
                        document.documentElement.style.setProperty('--brand-color', brandColor);
                    }
                }
            } catch (e) {
                console.error("Init Error", e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const userFirstName = user?.name?.split(' ')[0] || 'Visitante';

    if (loading) return (
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--bg-tertiary)', borderTopColor: 'var(--brand-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="container fade-in">
            {/* Header: User & Context */}
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'start',
                marginBottom: '2rem', paddingTop: '1rem'
            }}>
                <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {user?.avatar && (
                        <img
                            src={user?.avatar}
                            alt="Avatar"
                            style={{
                                width: '50px', height: '50px', borderRadius: '50%',
                                border: '2px solid var(--brand-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                objectFit: 'cover'
                            }}
                        />
                    )}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{ fontSize: '1.4rem', margin: 0, lineHeight: '1.2' }}>Olá, {userFirstName}</h1>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </div>
                        {hasTab && establishment ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                                <MapPin size={12} />
                                <span>Mesa {tableId} · <strong>{establishment.name}</strong></span>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                                Bem-vindo ao Consagrado
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={logout}
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)',
                        border: '1px solid var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-primary)' /* White text for contrast */
                    }}
                >
                    <LogOut size={18} />
                </button>
            </header>

            {/* Main Actions */}
            <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

                {hasTab ? (
                    <>
                        {/* 1. FAZER PEDIDO - CTA Priority */}
                        <button
                            onClick={() => navigate('/menu')}
                            className="btn btn-primary"
                            style={{
                                padding: '1.5rem', justifyContent: 'space-between',
                                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.3)',
                                position: 'relative', overflow: 'hidden'
                            }}
                        >
                            <div style={{ textAlign: 'left', zIndex: 1 }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>Fazer Pedido</div>
                                <div style={{ fontSize: '0.95rem', opacity: 0.9, fontWeight: 400 }}>Sem esperar o garçom</div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Utensils size={24} />
                            </div>
                        </button>

                        {/* 2. MINHA COMANDA - Anxiety Reduction */}
                        <button
                            onClick={() => navigate('/tab')}
                            className="card"
                            style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                cursor: 'pointer', borderLeft: '4px solid var(--brand-color)', padding: '1.25rem'
                            }}
                        >
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Minha Comanda
                                    {activeOrders && (
                                        <span className="status-badge" style={{ fontSize: '0.7rem', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={10} /> Em preparo
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ver itens e valor parcial</div>
                            </div>
                            <Receipt size={22} style={{ color: 'var(--text-secondary)' }} />
                        </button>

                        {/* 3. CHAMAR GARÇOM - Support */}
                        <button
                            onClick={async () => {
                                if (window.confirm('Chamar atendimento na mesa?')) {
                                    await api.callWaiter(tableId, user?.id);
                                    alert('Chamado enviado!');
                                }
                            }}
                            className="card"
                            style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                cursor: 'pointer', background: 'transparent', border: '1px solid var(--bg-tertiary)',
                                color: 'var(--text-secondary)', padding: '1rem'
                            }}
                        >
                            <Bell size={18} />
                            <span style={{ fontWeight: 500 }}>Chamar Garçom</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 400 }}>• Atendimento mais rápido</span>
                        </button>

                        {/* Extras: History & Promos */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                            <button onClick={() => navigate('/history')} className="card" style={{
                                alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '1rem'
                            }}>
                                <History size={20} style={{ color: 'var(--text-secondary)' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Histórico de Consumo</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>O que você já consumiu</span>
                                </div>
                            </button>
                            <div className="card" style={{
                                alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.5, padding: '1rem'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>💎</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Fidelidade</span>
                            </div>
                        </div>

                    </>
                ) : (
                    <>
                        {/* NO TABLE STATE */}
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                            textAlign: 'center', padding: '2rem 0'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', background: 'var(--bg-secondary)', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                                border: '1px solid var(--bg-tertiary)'
                            }}>
                                <Camera size={32} style={{ color: 'var(--brand-color)' }} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Você não está em uma mesa</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '300px' }}>
                                Para fazer pedidos, escaneie o QR Code que está sobre a mesa.
                            </p>
                            <button
                                onClick={() => navigate('/scanner')}
                                className="btn btn-primary"
                                style={{ width: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}
                            >
                                <Camera size={20} /> Ler QR Code
                            </button>
                        </div>

                        {/* Footer Action: History */}
                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--bg-tertiary)' }}>
                            <button
                                onClick={() => navigate('/history')}
                                className="card"
                                style={{
                                    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 0, padding: '1rem', cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}>
                                        <History size={20} color="var(--text-muted)" />
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>Histórico de Consumo</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>O que você já consumiu</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} color="var(--text-muted)" />
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Home;
