import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, CheckCircle, Beer, Wine, UtensilsCrossed, Coffee, Pizza, IceCream, Sandwich } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTablePresence } from '../hooks/useTablePresence';

const CATEGORY_ICONS = {
    'Cervejas': Beer,
    'Drinks': Wine,
    'Petiscos': Pizza, // Using Pizza as generic food icon if needed, or Utensils
    'Lanches': Sandwich,
    'Sem Álcool': Coffee,
    'Sobremesas': IceCream,
    'Pratos': UtensilsCrossed
};

// Fixed categories list to ensure order and presence
const FIXED_CATEGORIES = [
    'Cervejas',
    'Drinks',
    'Petiscos',
    'Lanches',
    'Pratos',
    'Sem Álcool',
    'Sobremesas'
];

const Menu = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [targetUser, setTargetUser] = useState(user || { id: 'guest', name: 'Você' }); // Default to current user
    const { onlineUsers } = useTablePresence();

    // Cart structure: { userId: { productId: quantity } }
    const [cart, setCart] = useState({});
    const [sending, setSending] = useState(false);
    const [establishmentName, setEstablishmentName] = useState('');

    // Sync user when auth loads
    useEffect(() => {
        if (user) setTargetUser(user);
    }, [user]);

    useEffect(() => {
        const load = async () => {
            // ... existing logic ...
            const tableId = localStorage.getItem('my_table_id');

            if (!tableId) {
                try {
                    const estab = await api.getEstablishment(1);
                    if (estab) setEstablishmentName(estab.name);
                } catch (e) { console.error(e); }
            } else {
                try {
                    const tableData = await api.getTable(tableId);
                    if (tableData && tableData.establishment) {
                        setEstablishmentName(tableData.establishment.name);
                    }
                } catch (e) {
                    console.error("Error fetching table info", e);
                }
            }

            // Loading Products (Shared)
            try {
                const data = await api.getProducts();
                setProducts(data);

                setCategories(FIXED_CATEGORIES);
                setSelectedCategory(FIXED_CATEGORIES[0]);

            } catch (error) {
                console.error("Failed to load menu", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredItems = products.filter(item => {
        if (searchTerm.trim()) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return item.category === selectedCategory;
    });

    const updateCart = (item, delta) => {
        setCart(prev => {
            const userId = targetUser.id || 'guest';
            const userCart = prev[userId] || {};
            const currentQty = userCart[item.id] || 0;
            const newQty = Math.max(0, currentQty + delta);

            const newUserCart = { ...userCart };
            if (newQty === 0) {
                delete newUserCart[item.id];
            } else {
                newUserCart[item.id] = newQty;
            }

            // If user cart is empty, remove user key? Optional, but cleaner.
            const newPrev = { ...prev, [userId]: newUserCart };
            if (Object.keys(newUserCart).length === 0) {
                delete newPrev[userId];
            }
            return newPrev;
        });
    };

    // Calculate total across ALL users
    const cartTotal = products.reduce((acc, item) => {
        let itemTotalQty = 0;
        Object.values(cart).forEach(userCart => {
            itemTotalQty += (userCart[item.id] || 0);
        });
        return acc + (item.price * itemTotalQty);
    }, 0);

    const cartCount = Object.values(cart).reduce((total, userCart) => {
        return total + Object.values(userCart).reduce((a, b) => a + b, 0);
    }, 0);

    const handleSendOrder = async () => {
        const tableId = localStorage.getItem('my_table_id');
        if (!tableId) {
            alert('Você precisa escanear uma mesa primeiro!');
            navigate('/scanner');
            return;
        }

        setSending(true);
        try {
            // Process all items for all users
            const orderPromises = [];

            Object.entries(cart).forEach(([userId, userCart]) => {
                // Find the user name for this ID
                // If it's me, use my name. If it's an online user, find them.
                let ordererName = 'Cliente';
                if (userId === user?.id) ordererName = user?.name || 'Eu';
                else {
                    const found = onlineUsers.find(u => u.id === userId);
                    if (found) ordererName = found.name;
                }

                Object.entries(userCart).forEach(([productId, qty]) => {
                    const product = products.find(p => String(p.id) === String(productId));
                    if (product) {
                        orderPromises.push(api.addOrder(tableId, {
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: qty,
                            orderedBy: ordererName // Use the specific user's name
                        }));
                    }
                });
            });

            await Promise.all(orderPromises.filter(p => p !== null));

            alert('Pedido enviado para a cozinha! 👨‍🍳');
            setCart({});
            navigate('/'); // Back to Home
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>
            </header>

            {/* User Switcher (Target Order) */}
            {onlineUsers.length > 1 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>
                        Pedindo para:
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                        {/* Me */}
                        <div
                            onClick={() => setTargetUser(user || { id: 'guest', name: 'Você' })}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                                opacity: targetUser.id === user?.id ? 1 : 0.5, transition: 'opacity 0.2s'
                            }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden',
                                border: targetUser.id === user?.id ? '2px solid var(--success)' : '2px solid transparent',
                                boxShadow: targetUser.id === user?.id ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                            }}>
                                <img
                                    src={`https://ui-avatars.com/api/?name=${user?.name || 'Eu'}&background=random`}
                                    alt="Eu" style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: targetUser.id === user?.id ? 'bold' : 'normal' }}>Eu</span>
                        </div>

                        {/* Mates */}
                        {onlineUsers.filter(u => u.id !== user?.id).map(mate => {
                            const isSelected = targetUser.id === mate.id;
                            const mateQty = Object.values(cart[mate.id] || {}).reduce((a, b) => a + b, 0); // Items associated with this user

                            return (
                                <div
                                    key={mate.id}
                                    onClick={() => setTargetUser(mate)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                                        opacity: isSelected ? 1 : 0.5, transition: 'opacity 0.2s', position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden',
                                        border: isSelected ? '2px solid var(--primary)' : '2px solid transparent', // Blue for friends
                                        boxShadow: isSelected ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                                    }}>
                                        <img src={mate.avatar_url || 'https://via.placeholder.com/56'} alt={mate.name} style={{ width: '100%', height: '100%' }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 'bold' : 'normal', maxWidth: '60px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {mate.name.split(' ')[0]}
                                    </span>

                                    {/* Badge for items in cart for this user */}
                                    {mateQty > 0 && (
                                        <div style={{
                                            position: 'absolute', top: 0, right: 0,
                                            background: 'var(--primary)', color: 'white', fontSize: '0.7rem',
                                            width: '18px', height: '18px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {mateQty}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Categories */}
            {!searchTerm && (
                <div style={{
                    display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem',
                    marginBottom: '1rem', scrollbarWidth: 'none'
                }}>
                    {categories.map(cat => {
                        const Icon = CATEGORY_ICONS[cat] || ShoppingBag;
                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                    minWidth: '80px', opacity: isSelected ? 1 : 0.6,
                                    background: 'none', border: 'none', cursor: 'pointer', outline: 'none'
                                }}
                            >
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '16px', overflow: 'hidden',
                                    border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <Icon size={24} color={isSelected ? 'var(--primary)' : 'var(--text-secondary)'} />
                                </div>
                                <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: isSelected ? 'white' : 'var(--text-secondary)' }}>
                                    {cat}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Items */}
            <div>
                <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                    {searchTerm ? `Resultados para "${searchTerm}"` : selectedCategory}
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredItems.map(item => {
                        const userId = targetUser.id || 'guest';
                        const userCart = cart[userId] || {};
                        const qty = userCart[item.id] || 0;
                        return (
                            <div
                                key={item.id}
                                className="card"
                                onClick={() => updateCart(item, 1)}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, cursor: 'pointer' }}
                            >
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateCart(item, 1);
                                        }}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                                    >
                                        +
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '20px', padding: '4px' }}>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateCart(item, -1);
                                            }}
                                            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateCart(item, 1);
                                            }}
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
