import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableContext } from '../context/TableContext';
import { useToast } from '../context/ToastContext';
import { Receipt, MapPin, LogOut, Camera, History, Utensils, Bell, ChevronRight, Keyboard, Beer, X } from 'lucide-react';
import { api, supabase } from '../services/api';

const Home = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { tableId, establishment, onlineUsers, setTableId } = useTableContext();
    const [statusBadge, setStatusBadge] = useState(null); // { label, color, bg }
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState('');

    const handleManualSubmit = async () => {
        if (!manualCode) return;
        try {
            const table = await api.getTableByCode(manualCode);
            if (table && table.id) {
                setTableId(table.id);
                // No need to navigate, just state update re-renders Home with table view
            } else {
                addToast('Mesa não encontrada!', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Erro ao buscar mesa.', 'error');
        }
    };

    // Fetch active orders count for status tag
    useEffect(() => {
        if (!tableId || !user) return;

        const fetchStatus = async () => {
            // Check for 'preparing' first (priority)
            const { count: prepCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('table_id', tableId)
                .eq('ordered_by', user.id)
                .eq('status', 'preparing');

            if (prepCount > 0) {
                setStatusBadge({ label: 'Em Preparo', color: '#1d4ed8', bg: '#dbeafe' }); // Blue
                return;
            }

            // Check for 'pending' (excluding service calls)
            const { count: pendCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('table_id', tableId)
                .eq('ordered_by', user.id)
                .eq('status', 'pending')
                .neq('name', '🔔 CHAMAR GARÇOM'); // Extra safety for legacy

            if (pendCount > 0) {
                setStatusBadge({ label: 'Aguardando', color: '#b45309', bg: '#fef3c7' }); // Yellow
                return;
            }

            setStatusBadge(null);
        };

        fetchStatus();

        // Subscribe to changes
        const channel = supabase.channel(`home_status:${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, fetchStatus)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableId, user]);


    const userFirstName = user?.name?.split(' ')[0] || 'Visitante';

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

            {/* ... rest of component ... */}
            {/* Note: Skipped irrelevant parts for brevity in this replacement block, but need to reach the badge render area */}

            <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {tableId ? (
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

                            {/* Avatar Stack logic remains same but checking if previous tool context needs it... we can rely on existing code if we don't touch it. 
                                Wait, I am using replace_file_content with a range. I should overlap correctly.
                            */}
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
                                    addToast('Chamado enviado!', 'success');
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
                                    position: 'relative', overflow: 'hidden', cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Minha Comanda</span>
                                    <Receipt size={20} style={{ opacity: 0.3 }} />
                                </div>

                                {statusBadge && (
                                    <span style={{
                                        fontSize: '0.65rem', background: statusBadge.bg, color: statusBadge.color,
                                        padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
                                        textTransform: 'uppercase', marginTop: '4px'
                                    }}>
                                        {statusBadge.label}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => navigate('/payment')}
                                className="card"
                                style={{
                                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '1.25rem', marginBottom: 0, background: 'var(--bg-tertiary)',
                                    cursor: 'pointer'
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
                                <Beer size={32} style={{ color: 'var(--brand-color)' }} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Você não está em uma mesa</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '300px' }}>
                                Para fazer pedidos, escaneie o QR Code ou digite o código da mesa.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                <button
                                    onClick={() => navigate('/scanner')}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '1rem', justifyContent: 'center' }}
                                >
                                    <Camera size={20} /> Ler QR Code
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', opacity: 0.5 }}>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--text-secondary)' }}></div>
                                    <span style={{ padding: '0 10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OU</span>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--text-secondary)' }}></div>
                                </div>

                                {/* Manual Code Section */}
                                <div style={{ width: '100%' }}>
                                    {!showManualInput ? (
                                        <button
                                            onClick={() => setShowManualInput(true)}
                                            className="btn"
                                            style={{
                                                width: '100%', padding: '1rem', justifyContent: 'center',
                                                background: 'transparent', border: '1px solid var(--bg-tertiary)', color: 'var(--text-primary)'
                                            }}
                                        >
                                            <Keyboard size={20} /> Digitar Código
                                        </button>
                                    ) : (
                                        <div style={{ animation: 'slideDown 0.3s ease-out' }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={manualCode}
                                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                                    placeholder="Cód. Mesa (Ex: A1)"
                                                    autoFocus
                                                    style={{
                                                        flex: 1, padding: '1rem', borderRadius: '12px',
                                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                                        color: 'var(--text-primary)', textTransform: 'uppercase',
                                                        fontWeight: 'bold', fontSize: '1rem'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        setShowManualInput(false);
                                                        setManualCode('');
                                                    }}
                                                    className="btn"
                                                    style={{
                                                        padding: '0 1rem', background: '#ff0000',
                                                        width: '50px', color: '#ffffff'
                                                    }}
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleManualSubmit}
                                                className="btn btn-tertiary"
                                                disabled={!manualCode}
                                                style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                                            >
                                                Entrar na Mesa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
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

const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
