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
                // FORCE DEMO USER TO TABLE 1 IMPLICITLY
                if (user?.email === 'demo@demo' || user?.email === 'demo@demo.com') {
                    localStorage.setItem('my_table_id', '1');
                }

                // Check Tab
                const storedTableId = localStorage.getItem('my_table_id');

                if (storedTableId) {
                    setTableId(storedTableId);
                    setHasTab(true);

                    // Fetch Establishment Context
                    const tableData = await api.getTable(storedTableId);
                    if (tableData && tableData.establishment) {
                        setEstablishment(tableData.establishment);
                        // Inject Brand Color if available, else default Gold
                        const brandColor = tableData.establishment.theme_color || '#f59e0b';
                        document.documentElement.style.setProperty('--brand-color', brandColor);
                    }
                    // Check for active orders (Simulated)
                    setActiveOrders(true);
                } else {
                    // DEMO FALLBACK: Fetch Default Establishment (ID 1)
                    const estabData = await api.getEstablishment(1);
                    if (estabData) {
                        setEstablishment(estabData);
                        const brandColor = estabData.theme_color || '#f59e0b';
                        document.documentElement.style.setProperty('--brand-color', brandColor);
                    }

                    // FORCE DEMO USER TO TABLE 1
                    if (user?.email === 'demo@demo') {
                        setTableId('1');
                        setHasTab(true);
                        setActiveOrders(true);
                        localStorage.setItem('my_table_id', '1');
                    }
                }
            } catch (e) {
                console.error("Init Error", e);
            } finally {
                setLoading(false);
            }
        };

        if (user !== undefined) init();
    }, [user]);

    const userFirstName = user?.name?.split(' ')[0] || 'Visitante';

    if (loading) return (
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--bg-tertiary)', borderTopColor: 'var(--brand-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="container fade-in">
            {/* Header: User & Logout */}
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '0.5rem', paddingTop: '1rem'
            }}>
                <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {user?.avatar ? (
                        <img
                            src={user?.avatar}
                            alt="Avatar"
                            style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                border: '2px solid var(--bg-tertiary)',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{userFirstName}</span>
                </div>

                <button
                    onClick={logout}
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%', background: 'transparent',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-secondary)'
                    }}
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Main Actions */}
            <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

                {hasTab ? (
                    <>
                        {/* HERO: Establishment Context */}
                        <div style={{ padding: '0.5rem 0 1.5rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}>
                                Seja bem-vindo ao
                            </h3>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                                {establishment?.name || 'Consagrado'}
                            </h2>
                            <span style={{
                                background: 'var(--bg-tertiary)', padding: '6px 16px', borderRadius: '100px',
                                fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500
                            }}>
                                <MapPin size={16} /> Mesa {tableId}
                            </span>

                            {/* Avatar Stack */}
                            {onlineUsers.length > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex' }}>
                                        {onlineUsers.slice(0, 5).map((u, i) => (
                                            <img
                                                key={u.id}
                                                src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`}
                                                alt={u.name}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    border: '2px solid var(--bg-primary)',
                                                    marginLeft: i > 0 ? '-10px' : '0',
                                                    zIndex: 10 - i
                                                }}
                                                title={u.name}
                                            />
                                        ))}
                                        {onlineUsers.length > 5 && (
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                                                border: '2px solid var(--bg-primary)',
                                                marginLeft: '-10px', zIndex: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.75rem', fontWeight: 'bold'
                                            }}>
                                                {onlineUsers.length - 5 > 9 ? '9+' : `+${onlineUsers.length - 5}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 1. CARDÁPIO (Fazer Pedido) */}
                        <button
                            onClick={() => navigate('/menu')}
                            className="btn btn-primary"
                            style={{
                                padding: '1.5rem', justifyContent: 'center',
                                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.3)',
                                fontSize: '1.4rem', fontWeight: 800, gap: '12px',
                                textTransform: 'uppercase', letterSpacing: '1px'
                            }}
                        >
                            <Utensils size={28} strokeWidth={2.5} />
                            Fazer Pedido
                        </button>

                        {/* 2. CHAMAR GARÇOM (Warning/Red) */}
                        <button
                            onClick={async () => {
                                if (window.confirm('Chamar atendimento na mesa?')) {
                                    await api.callWaiter(tableId, user?.id);
                                    alert('Chamado enviado!');
                                }
                            }}
                            className="btn"
                            style={{
                                background: '#ef4444', color: 'white', border: 'none',
                                padding: '1.25rem', justifyContent: 'center',
                                fontSize: '1.2rem', fontWeight: 700, gap: '10px',
                                textTransform: 'uppercase'
                            }}
                        >
                            <Bell size={24} />
                            Chamar Garçom
                        </button>

                        {/* 3. Comanda & Pagamento */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => navigate('/tab')}
                                className="card"
                                style={{
                                    flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
                                    padding: '1.25rem', marginBottom: 0, gap: '4px', borderLeft: '4px solid var(--brand-color)',
                                    position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Minha Comanda</span>
                                    <Receipt size={20} style={{ opacity: 0.3 }} />
                                </div>

                                {activeOrders && (
                                    <span style={{
                                        fontSize: '0.65rem', background: '#dcfce7', color: '#166534',
                                        padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
                                        textTransform: 'uppercase', marginTop: '4px'
                                    }}>
                                        Em Preparo
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => navigate('/payment')}
                                className="card"
                                style={{
                                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '1.25rem', marginBottom: 0, background: 'var(--bg-tertiary)'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>💸</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Pagar</span>
                            </button>
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

                            {/* DEMO RESET BUTTON (Visible to Demo Only) */}
                            {(user?.email === 'demo@demo' || user?.email === 'demo@demo.com') && (
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Reiniciar cenário de DEMO? Isso restaurará, Água, Vinho e Pizza.")) {
                                            setLoading(true);
                                            await api.resetDemoData(1);
                                            window.location.reload();
                                        }
                                    }}
                                    style={{
                                        marginTop: '1rem', width: '100%', padding: '0.8rem',
                                        background: 'transparent', border: '1px dashed var(--text-muted)',
                                        color: 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    🔄 Reiniciar Cenário Demo
                                </button>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Home;
