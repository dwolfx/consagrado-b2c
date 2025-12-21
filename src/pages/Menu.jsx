import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, CheckCircle, Beer, Wine, UtensilsCrossed, Coffee, Pizza, IceCream, Sandwich, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTablePresence } from '../hooks/useTablePresence';
import { useToast } from '../context/ToastContext';
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
    const { addToast } = useToast();
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

    // Wait Logic State
    const [waitStatus, setWaitStatus] = useState('idle'); // idle, waiting, accepted, rejected
    const [pendingSplitData, setPendingSplitData] = useState(null); // Stores { item, cart, selectedUserIds }
    const [responderName, setResponderName] = useState('');

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

    // Split Response Listener
    // Split Response Listener
    useEffect(() => {
        let channel;
        // Listen on MY user channel for responses directed to ME
        if (user?.id) {
            console.log(`📡 Listening for Split Responses on user_notifications:${user.id}`);
            channel = supabase.channel(`user_notifications:${user.id}`)
                .on('broadcast', { event: 'split_response' }, (payload) => {
                    console.log("🔥 Received Split Response", payload);

                    if (payload.payload.status === 'accepted') {
                        setWaitStatus('accepted');
                        setResponderName(payload.payload.responderName);
                    } else if (payload.payload.status === 'rejected') {
                        setWaitStatus('rejected');
                        setResponderName(payload.payload.responderName);
                    }
                })
                .subscribe();
        }
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [user?.id]);

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
        // Just add to self (cart)
        updateCartDirect(user?.id || 'guest', item, 1);
        addToast(`${item.name} adicionado!`, 'success');
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

    const onlineUsersSafe = onlineUsers && onlineUsers.length > 0 ? onlineUsers : [user || { id: 'guest', name: 'Você' }];

    const handleSplitConfirm = async (item, selectedUserIds) => {
        // item here is actually the "Virtual Cart Item" representing total
        if (!selectedUserIds || selectedUserIds.length === 0) return;

        setSplittingItem(null);
        // Save state for finalization waiting for approval
        setPendingSplitData({ selectedUserIds });
        setWaitStatus('waiting');

        try {
            const tableId = localStorage.getItem('my_table_id');
            // Send requests to OTHERS only
            const others = selectedUserIds.filter(uid => uid !== user.id);

            // SPECIAL CASE: If user selected ONLY themselves (or nobody else online)
            // Immediately finalize as a normal order (isSplit=false)
            if (others.length === 0) {
                console.log("No other users selected. Finalizing immediately.");
                // Pass data directly to avoid async state race condition
                await finalizeSplitOrder(false, { selectedUserIds });
                return;
            }

            for (const uid of others) {
                console.log(`📤 Sending Split Request for item: ${item.name}`, { price: item.price, type: typeof item.price });

                // Fix: Send ACTUAL product details so Receiver can create valid order
                await api.requestOrderShare({
                    name: item.name,
                    price: item.price, // Send full unit price (visual reference only, receiver will validate)
                    quantity: 1,
                    productId: item.id, // 'cart-total' or specific ID
                    items: item.items, // <--- DETAILED LIST FOR SECURITY
                    totalParts: selectedUserIds.length, // <--- CRITICAL: Send split count (e.g. 2, 3)
                    tableId: tableId,
                    requesterId: user.id
                }, uid, user.name || 'Alguém', user.id);
            }

        } catch (error) {
            console.error("Error sending split requests", error);
            setWaitStatus('idle');
            addToast('Erro ao solicitar divisão.', 'error');
        }
    };

    const finalizeSplitOrder = async (isSplit, overrideData = null) => {
        setSending(true);
        setWaitStatus('idle'); // Close modal

        const splitData = overrideData || pendingSplitData;

        if (!splitData) {
            console.error("No pending split data found!");
            setSending(false);
            addToast('Erro: Dados da divisão perdidos.', 'error');
            return;
        }

        const { selectedUserIds } = splitData;
        // If rejected and alone (isSplit=false), it's just me. 
        // If accepted (isSplit=true), it's everyone selected.
        const finalUserIds = isSplit ? selectedUserIds : [user.id];

        try {
            const tableId = localStorage.getItem('my_table_id');
            const orderPromises = [];

            // Calculate Split Ratio
            // If isSplit=true, ratio = 1/N. If false, ratio = 1 (Full Price).
            const splitRatio = isSplit ? (1 / finalUserIds.length) : 1;
            console.log("🚩 [Menu] Finalizing Order. Ratio:", splitRatio, "Users:", finalUserIds);

            const myCart = cart[user?.id];
            if (myCart) {
                for (const [productId, qty] of Object.entries(myCart)) {
                    const product = products.find(p => String(p.id) === String(productId));
                    if (product) {
                        const splitName = finalUserIds.length > 1 ? `1/${finalUserIds.length} ${product.name}` : product.name;

                        // Explicit check for requester
                        if (finalUserIds.includes(user.id)) {
                            console.log(`🚩 [Menu] Creating SELF order for ${product.name} @ ${product.price * splitRatio}`);
                            orderPromises.push(api.addOrder(tableId, {
                                productId: isSplit ? null : product.id,
                                name: splitName,
                                price: product.price * splitRatio,
                                quantity: qty,
                                orderedBy: user.id
                            }));
                        } else {
                            console.warn("🚩 [Menu] User ID not in finalUserIds?", { uid: user.id, finalUserIds });
                        }
                    } else {
                        console.error("🚩 [Menu] Product not found in list:", productId);
                    }
                }
            } else {
                console.error("🚩 [Menu] No cart found for user:", user?.id, cart);
            }
            await Promise.all(orderPromises);
            addToast('Pedido enviado com sucesso! 👨‍🍳', 'success');
            setCart({});
            navigate('/');
        } catch (e) {
            console.error(e);
            addToast('Erro ao finalizar pedido.', 'error');
        } finally {
            setSending(false);
            setPendingSplitData(null);
        }
    };

    // Handle Auto-Proceed on Accept
    useEffect(() => {
        if (waitStatus === 'accepted') {
            const timer = setTimeout(() => {
                finalizeSplitOrder(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [waitStatus]); // Implicitly closes over fresh finalizeSplitOrder state

    const handleSendOrder = async () => {
        const tableId = localStorage.getItem('my_table_id');
        if (!tableId) {
            addToast('Você precisa escanear uma mesa primeiro!', 'error');
            navigate('/scanner');
            return;
        }

        // If multiple users -> Confirm Split
        if (onlineUsers.length > 1) {
            // Create a virtual item for the modal to display TOTAL
            // But include the ACTUAL ITEMS for the secure backend/receiver process
            const myCart = cart[user?.id] || {};
            const cartItems = Object.entries(myCart).map(([pid, qty]) => ({ productId: pid, quantity: qty }));

            const virtualItem = {
                name: 'Total do Pedido',
                price: cartTotal,
                id: 'cart-total',
                items: cartItems // <--- Payload for receiver
            };
            setSplittingItem(virtualItem);
            return;
        }

        // Single User Direct Send
        console.log("📤 handleSendOrder: cartTotal =", cartTotal); // DEBUG TOTAL
        setSending(true);
        try {
            const orderPromises = [];

            const myCart = cart[user?.id];

            if (myCart) {
                Object.entries(myCart).forEach(([productId, qty]) => {
                    const product = products.find(p => String(p.id) === String(productId));
                    if (product) {
                        orderPromises.push(api.addOrder(tableId, {
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: qty,
                            orderedBy: user.id
                        }));
                    }
                });
            }

            await Promise.all(orderPromises);
            addToast('Pedido enviado para a cozinha! 👨‍🍳', 'success');
            setCart({});
            navigate('/');
        } catch (error) {
            console.error("Error sending order", error);
            addToast('Erro ao enviar pedido :(', 'error');
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
                    onlineUsers={onlineUsersSafe}
                    onClose={() => setSplittingItem(null)}
                    onConfirm={handleSplitConfirm}
                    confirmLabel="Confirmar Pedido"
                />
            )}

            {/* WAITING MODAL */}
            {waitStatus !== 'idle' && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                }}>
                    <div className="card" style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
                        {waitStatus === 'waiting' && (
                            <>
                                <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                                <h3>Aguardando confirmação...</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Esperando os outros aceitarem.</p>
                                <button
                                    onClick={() => {
                                        setWaitStatus('idle');
                                        setPendingSplitData(null);
                                        // Optional: Send "Cancel" broadcast if we want to be fancy later
                                    }}
                                    className="btn btn-secondary"
                                    style={{ marginTop: '1rem', width: '100%' }}
                                >
                                    Cancelar
                                </button>
                            </>
                        )}
                        {waitStatus === 'accepted' && (
                            <>
                                <CheckCircle size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
                                <h3>Confirmado!</h3>
                                <p>{responderName} aceitou dividir.</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Enviando pedido...</p>
                            </>
                        )}
                        {waitStatus === 'rejected' && (
                            <>
                                <UtensilsCrossed size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
                                <h3>Recusado</h3>
                                <p>{responderName} preferiu não dividir.</p>
                                <p style={{ margin: '1rem 0', fontWeight: 'bold' }}>Deseja continuar sozinho?</p>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={() => { setWaitStatus('idle'); setPendingSplitData(null); }}
                                        className="btn btn-secondary"
                                        style={{ flex: 1 }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => finalizeSplitOrder(false)} // False = Not Split (Alone)
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
