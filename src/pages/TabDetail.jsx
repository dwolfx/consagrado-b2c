import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertCircle, CreditCard, Bell } from 'lucide-react';
import { currentTab } from '../data/mockData';

const TabDetail = () => {
    const navigate = useNavigate();
    const { items, establishmentName, table } = currentTab;

    // Calculate my part
    const myTotal = items.reduce((acc, item) => {
        // If Item has sharedWith, total price is divided by (sharedWith.length + 1)
        return acc + (item.price * item.quantity);
    }, 0);

    // Helper to get formatted price
    const formatPrice = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>{establishmentName}</h2>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mesa {table}</span>
                </div>
                <button className="btn-ghost" style={{ marginLeft: 'auto', color: 'var(--warning)' }}>
                    <Bell />
                </button>
            </header>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary)', color: 'white' }}>
                <div>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total da sua parte</span>
                    <h1 style={{ fontSize: '2rem' }}>{formatPrice(myTotal)}</h1>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Consumo</h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {items.map(item => {
                    // Basic logic for split display
                    const peopleCount = item.sharedWith.length + 1;
                    const isShared = item.sharedWith.length > 0;

                    return (
                        <div key={item.id} className="card" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{item.quantity}x {item.name}</span>
                                <span style={{ fontWeight: '700' }}>{formatPrice(item.price * item.quantity)}</span>
                            </div>

                            {isShared && (
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={16} />
                                    <span style={{ fontSize: '0.85rem' }}>
                                        Dividido com {item.sharedWith.map(p => p.name).join(', ')} e Você
                                    </span>
                                </div>
                            )}

                            {isShared && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Eu`}
                                        style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid white' }}
                                        title="Você"
                                    />
                                    {item.sharedWith.map(person => (
                                        <img
                                            key={person.name}
                                            src={person.avatar}
                                            style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--bg-secondary)' }}
                                            title={person.name}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <footer style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--bg-tertiary)',
                display: 'flex', gap: '1rem', justifyContent: 'center'
            }}>
                <button
                    onClick={() => alert("Garçom chamado!")}
                    className="btn btn-secondary"
                    style={{ width: 'auto', flex: 1 }}
                >
                    <Bell size={20} />
                    Garçom
                </button>
                <button
                    onClick={() => navigate('/payment')}
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                >
                    <CreditCard size={20} />
                    Pagar Conta
                </button>
            </footer>
        </div>
    );
};

export default TabDetail;
