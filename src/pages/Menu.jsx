import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Menu = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({}); // { productId: quantity }
    const [sending, setSending] = useState(false);
    const [establishmentName, setEstablishmentName] = useState('');

    useEffect(() => {
        const load = async () => {
            const tableId = localStorage.getItem('my_table_id');

            if (!tableId) {
                // If no table, stop loading and we will render the blocked state
                setLoading(false);
                return;
            }

            try {
                // Fetch Table Details to get Establishment Name
                // We handle the case where api.getTable might fail or return null
                try {
                    const tableData = await api.getTable(tableId);
                    if (tableData && tableData.establishment) {
                        setEstablishmentName(tableData.establishment.name);
                    }
                } catch (e) {
                    console.error("Error fetching table info", e);
                }

                const data = await api.getProducts();
                setProducts(data);

                // Derive categories
                const cats = [...new Set(data.map(p => p.category))];
                setCategories(cats);
                if (cats.length > 0) setSelectedCategory(cats[0]);
            } catch (error) {
                console.error("Failed to load menu", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const tableId = localStorage.getItem('my_table_id');

    if (!tableId) {
        return (
            <div className="container" style={{ justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'
                }}>
                    <Search size={40} color="var(--text-secondary)" />
                </div>
                <h2>Ops! Sem mesa.</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Para ver o cardápio e fazer pedidos, você precisa ler o QR Code da mesa primeiro.
                </p>
                <button onClick={() => navigate('/scanner')} className="btn btn-primary" style={{ width: '100%' }}>
                    Ler QR Code Agora
                </button>
                <button onClick={() => navigate('/')} className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Voltar
                </button>
            </div>
        );
    }

    const filteredItems = products.filter(item => item.category === selectedCategory);

    const updateCart = (item, delta) => {
        setCart(prev => {
            const currentQty = prev[item.id] || 0;
            const newQty = Math.max(0, currentQty + delta);

            const newCart = { ...prev };
            if (newQty === 0) {
                delete newCart[item.id];
            } else {
                newCart[item.id] = newQty;
            }
            return newCart;
        });
    };

    const cartTotal = products.reduce((acc, item) => {
        return acc + (item.price * (cart[item.id] || 0));
    }, 0);

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

    const handleSendOrder = async () => {
        const tableId = localStorage.getItem('my_table_id');
        if (!tableId) {
            alert('Você precisa escanear uma mesa primeiro!');
            navigate('/scanner');
            return;
        }

        setSending(true);
        try {
            // Process all items
            const orderPromises = Object.entries(cart).map(async ([productId, qty]) => {
                // Fix: Ensure we compare strings as Object.keys are always strings
                const product = products.find(p => String(p.id) === String(productId));

                if (!product) {
                    console.error(`Product not found for ID: ${productId}`);
                    return null;
                }

                return api.addOrder(tableId, {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: qty,
                    orderedBy: user?.name || 'Cliente'
                });
            });

            await Promise.all(orderPromises.filter(p => p !== null));

            alert('Pedido enviado para a cozinha! 👨‍🍳');
            setCart({});
            navigate('/tab'); // Go to My Tab
        } catch (error) {
            console.error("Error sending order", error);
            alert('Erro ao enviar pedido :(');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="container" style={{ justifyContent: 'center', textAlign: 'center' }}>Carregando cardápio...</div>;

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={establishmentName ? `Buscar em ${establishmentName}...` : "Buscar..."}
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', marginBottom: 0, height: '40px' }}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>
            </header>

            {/* Categories */}
            <div style={{
                display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem',
                marginBottom: '1rem', scrollbarWidth: 'none'
            }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            minWidth: '80px', opacity: selectedCategory === cat ? 1 : 0.6
                        }}
                    >
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden',
                            border: selectedCategory === cat ? '2px solid var(--primary)' : '2px solid transparent',
                            backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {/* Placeholder Icon since we don't have cat images in simple product list usually */}
                            <ShoppingBag size={24} color={selectedCategory === cat ? 'var(--primary)' : 'white'} />
                        </div>
                        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{cat}</span>
                    </button>
                ))}
            </div>

            {/* Items */}
            <div>
                <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                    {selectedCategory}
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredItems.map(item => {
                        const qty = cart[item.id] || 0;
                        return (
                            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                                    {item.description && (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                            {item.description}
                                        </p>
                                    )}
                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>

                                {qty === 0 ? (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => updateCart(item, 1)}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                                    >
                                        +
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '20px', padding: '4px' }}>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => updateCart(item, -1)}
                                            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => updateCart(item, 1)}
                                            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cart Footer */}
            {cartCount > 0 && (
                <div style={{
                    position: 'fixed', bottom: '1rem', left: '1rem', right: '1rem',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <button
                        onClick={handleSendOrder}
                        disabled={sending}
                        className="btn btn-primary"
                        style={{
                            borderRadius: '16px', padding: '1rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 10px 25px -5px var(--primary-glow)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.2)', width: '28px', height: '28px',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.9rem', fontWeight: 'bold'
                            }}>
                                {cartCount}
                            </div>
                            <span>Fazer pedido</span>
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {sending ? 'Enviando...' : cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Menu;
