import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, CheckCircle, Beer, Wine, UtensilsCrossed, Coffee, Pizza, IceCream, Sandwich, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTablePresence } from '../hooks/useTablePresence';
import SplitItemModal from '../components/SplitItemModal';

const CATEGORY_ICONS = {
    'Cervejas': Beer,
    'Drinks': Wine,
    'Petiscos': Pizza,
    'Lanches': Sandwich,
    'Sem Álcool': Coffee,
    'Sobremesas': IceCream,
    'Pratos': UtensilsCrossed
};

const CATEGORY_ORDER = [
    'Cervejas', 'Drinks', 'Petiscos', 'Lanches', 'Pratos', 'Sem Álcool', 'Sobremesas'
];

const Menu = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { onlineUsers } = useTablePresence();

    const [cart, setCart] = useState({});
    const [sending, setSending] = useState(false);
    const [establishmentName, setEstablishmentName] = useState('');

    // Split Modal State
    const [splittingItem, setSplittingItem] = useState(null);

    useEffect(() => {
        const load = async () => {
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

            try {
                const data = await api.getProducts();
                setProducts(data);

                const uniqueCats = [...new Set(data.map(p => p.category))].filter(Boolean);
                const sortedCats = uniqueCats.sort((a, b) => {
                    const idxA = CATEGORY_ORDER.indexOf(a);
                    const idxB = CATEGORY_ORDER.indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return a.localeCompare(b);
                });

                setCategories(sortedCats);
                if (sortedCats.length > 0) setSelectedCategory(sortedCats[0]);

            } catch (error) {
                console.error("Failed to load menu", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredItems = products.filter(item => {
        // Filter out synthetic split items from the main list display
        if (item.isSplit) return false;

        if (searchTerm.trim()) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return item.category === selectedCategory;
    });

    // Helper to update cart for a specific user
    const updateCartDirect = (userId, item, delta) => {
        setCart(prev => {
            const userCart = prev[userId] || {};
            const currentQty = userCart[item.id] || 0;
            const newQty = Math.max(0, currentQty + delta);

            const newUserCart = { ...userCart };
            if (newQty === 0) {
                delete newUserCart[item.id];
            } else {
                newUserCart[item.id] = newQty;
            }

            const newPrev = { ...prev, [userId]: newUserCart };
            if (Object.keys(newUserCart).length === 0) {
                delete newPrev[userId];
            }
            return newPrev;
        });
    };

    const handleItemClick = (item) => {
        // If there are multiple users, open split modal
        if (onlineUsers.length > 1) {
            setSplittingItem(item);
        } else {
            // Single user, just add to self
            updateCartDirect(user?.id || 'guest', item, 1);
        }
    };

    const handleSplitConfirm = (item, selectedUserIds) => {
        if (!selectedUserIds || selectedUserIds.length === 0) return;

        // 1. Single User Select (Normal Add)
        if (selectedUserIds.length === 1) {
            updateCartDirect(selectedUserIds[0], item, 1);
        }
        // 2. Multi User Select (Split logic)
        else {
            const count = selectedUserIds.length;
            const splitPrice = item.price / count;
            // E.g. "1/2 Pizza" or "1/3 Batata"
            const splitName = `1/${count} ${item.name}`;

            // Create a synthetic product for this split instance
            const syntheticProduct = {
                ...item,
                id: `${item.id}-split-${Date.now()}`, // Unique ID for this specific split adding
                name: splitName,
                price: splitPrice,
                isSplit: true
            };

            // Add synthetic product to state so it can be referenced in Cart/API
            setProducts(prev => [...prev, syntheticProduct]);

            // Add 1 qty to each selected user
            selectedUserIds.forEach(uid => {
                updateCartDirect(uid, syntheticProduct, 1);
            });
        }
        setSplittingItem(null);
    };

    // Calculate total
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
            const orderPromises = [];

            Object.entries(cart).forEach(([userId, userCart]) => {
                // Determine Name for this User ID
                let ordererName = 'Cliente';
                if (userId === user?.id) ordererName = user?.name || 'Eu';
                else {
                    const found = onlineUsers.find(u => u.id === userId);
                    if (found) ordererName = found.name;
                }

                Object.entries(userCart).forEach(([productId, qty]) => {
                    const product = products.find(p => String(p.id) === String(productId));
                    if (product) {
                        // Pass correctly to API
                        orderPromises.push(api.addOrder(tableId, {
                            productId: product.isSplit ? null : product.id, // If split, maybe null to treat as ad-hoc? Or pass synthetic ID? 
                            // API uses productId for referencing. If I pass a random string it might fail FK constraints if API enforces it.
                            // Checking API: `product_id: orderItem.productId`. DB `product_id` is uuid/int? 
                            // Seed uses INT 101, 102. DB Schema usually allows NULL product_id for custom items.
                            // Let's pass NULL for splits to avoid FK error, since synthetic ID doesn't exist in 'products' table.
                            name: product.name,
                            price: product.price,
                            quantity: qty,
                            orderedBy: userId
                        }));
                    }
                });
            });

            await Promise.all(orderPromises);
            alert('Pedido enviado para a cozinha! 👨‍🍳');
            setCart({});
            navigate('/');
        } catch (error) {
            console.error("Error sending order", error);
            alert('Erro ao enviar pedido :(');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="container center-content">Carregando...</div>;

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            {/* Header */}
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

                {/* User Count Indicator */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--bg-tertiary)', padding: '0.6rem', borderRadius: '12px',
                    border: onlineUsers.length > 1 ? '1px solid var(--primary)' : '1px solid transparent'
                }}>
                    <Users size={20} color={onlineUsers.length > 1 ? 'var(--primary)' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: onlineUsers.length > 1 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {onlineUsers.length}
                    </span>
                </div>
            </header>

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

            {/* Product List */}
            <div>
                <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                    {searchTerm ? `Resultados` : selectedCategory}
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredItems.map(item => {
                        // Calculate total in cart for this item (across everyone)
                        let totalInCart = 0;
                        Object.values(cart).forEach(uCart => totalInCart += (uCart[item.id] || 0));

                        return (
                            <div
                                key={item.id}
                                className="card"
                                onClick={() => handleItemClick(item)}
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

                                {totalInCart === 0 ? (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateCartDirect(user?.id || 'guest', item, 1);
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
                                                updateCartDirect(user?.id || 'guest', item, -1);
                                            }}
                                            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{totalInCart}</span>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateCartDirect(user?.id || 'guest', item, 1);
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

            {/* SPLIT MODAL */}
            {splittingItem && (
                <SplitItemModal
                    item={splittingItem}
                    currentUser={user || { id: 'guest', name: 'Você' }}
                    onlineUsers={onlineUsers.length > 0 ? onlineUsers : [user || { id: 'guest', name: 'Você' }]}
                    onClose={() => setSplittingItem(null)}
                    onConfirm={handleSplitConfirm}
                />
            )}
        </div>
    );
};

export default Menu;
