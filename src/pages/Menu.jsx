import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Star,
    ShoppingBag, CheckCircle, Beer, Wine, UtensilsCrossed, Coffee, Pizza, IceCream, Sandwich, Users
} from 'lucide-react';
import SkeletonProductCard from '../components/SkeletonProductCard';
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

const DEFAULT_CATEGORY_ORDER = [
    'Cervejas', 'Drinks', 'Petiscos', 'Lanches', 'Pratos', 'Sem Álcool', 'Sobremesas'
];

// Favorites Component
const FavoritesSection = ({ userId, onItemClick }) => {
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        if (!userId) return;
        const loadFavorites = async () => {
            // Fetch last 20 orders to find frequency
            const { data } = await supabase
                .from('orders')
                .select('*, product:products(*)') // Join products to get image/details
                .eq('ordered_by', userId)
                .neq('status', 'service_call') // Ignore waiter calls
                .neq('product_id', null)
                .order('created_at', { ascending: false })
                // Use product data if available (better for images), else order fallback
                .limit(40);

            if (data && data.length > 0) {
                // Deduplicate by Product ID
                const uniqueMap = new Map();
                data.forEach(order => {
                    // Use product data if available (better for images), else order fallback
                    const prod = order.product || {
                        id: order.product_id,
                        name: order.name,
                        price: order.price, // Might be split price, careful
                        image: null // fallback
                    };

                    // Skip if it looks like a split fragment (name starts with "1/")
                    if (order.name.match(/^\d+\//)) return;

                    if (!uniqueMap.has(prod.id)) {
                        uniqueMap.set(prod.id, prod);
                    }
                });
                setFavorites(Array.from(uniqueMap.values()).slice(0, 5)); // Top 5 recent
            }
        };
        loadFavorites();
    }, [userId]);

    if (favorites.length === 0) return null;

    return (
        <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
                <Star size={18} fill="var(--brand-color)" color="var(--brand-color)" />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Pedir Novamente</h3>
            </div>
            <div style={{
                display: 'flex', gap: '0.75rem', overflowX: 'auto',
                paddingBottom: '0.5rem', scrollbarWidth: 'none', margin: '0 -1rem', padding: '0 1rem'
            }}>
                {favorites.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        style={{
                            minWidth: '140px', maxWidth: '140px',
                            background: 'var(--bg-secondary)',
                            padding: '0.75rem', borderRadius: '12px',
                            border: '1px solid var(--bg-tertiary)',
                            cursor: 'pointer', flexShrink: 0
                        }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <img
                                src={item.image_url || item.image}
                                alt={item.name}
                                style={{
                                    width: '100%', height: '80px', objectFit: 'cover',
                                    borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)'
                                }}
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                        <h4 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                            R$ {Number(item.price).toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

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
    const [customItems, setCustomItems] = useState({}); // Stores metadata for custom IDs: {'half-123': {name, price...}}
    const [sending, setSending] = useState(false);
    const [establishmentName, setEstablishmentName] = useState('');

    // Split Modal State
    const [splittingItem, setSplittingItem] = useState(null);

    // Wait Logic State
    const [waitStatus, setWaitStatus] = useState('idle'); // idle, waiting, accepted, rejected
    const [pendingSplitData, setPendingSplitData] = useState(null); // Stores { item, cart, selectedUserIds }
    const [responderName, setResponderName] = useState('');

    // Half-Pizza Logic
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);
    const [pizzaFlavor1, setPizzaFlavor1] = useState(null);
    const [pizzaFlavor2, setPizzaFlavor2] = useState(null);

    // Dynamic Category Order
    const [sortOrder, setSortOrder] = useState(DEFAULT_CATEGORY_ORDER);

    const handleOpenPizzaBuilder = () => {
        setShowPizzaBuilder(true);
        setPizzaFlavor1(null);
        setPizzaFlavor2(null);
    };

    const handleConfirmPizza = () => {
        if (!pizzaFlavor1 || !pizzaFlavor2) return;

        // Rule: Price is the MAX of the two
        const finalPrice = Math.max(pizzaFlavor1.price, pizzaFlavor2.price);

        // Composite Item
        const compositeItem = {
            id: `half-${Date.now()}`, // Temporary ID for cart
            name: `½ ${pizzaFlavor1.name} + ½ ${pizzaFlavor2.name}`,
            price: finalPrice, // Visual only, DB will recalculate
            image: pizzaFlavor1.image_url || pizzaFlavor1.image,
            category: 'Pizzas',
            isComposite: true,
            // Secure Metadata Payload
            metadata: {
                type: 'half_half',
                parts: [pizzaFlavor1.id, pizzaFlavor2.id]
            }
        };

        // Persist Metadata locally
        setCustomItems(prev => ({ ...prev, [compositeItem.id]: compositeItem }));

        // Add to Cart
        updateCartDirect(user?.id || 'guest', compositeItem, 1);

        // AUTO CHECKOUT: Create a temporary cart with current items + new item
        // This avoids waiting for the async 'cart' state update
        const currentCart = cart[user?.id || 'guest'] || {};
        const newCartForCheckout = {
            ...currentCart,
            [compositeItem.id]: (currentCart[compositeItem.id] || 0) + 1
        };

        setShowPizzaBuilder(false);

        // Trigger Checkout immediately with explicit overrides to avoid async state race
        processOrder(newCartForCheckout, { ...customItems, [compositeItem.id]: compositeItem });
    };

    useEffect(() => {
        const load = async () => {
            let hiddenCats = [];
            // Check if we loaded settings in the previous block
            if (!tableId) {
                // We might need to refetch or pass data down, but currently currentSortOrder set above
                // Actually we need to check the 'hidden_categories' from the SAME place we got 'category_order'
                // Since we didn't store it in a variable, let's just rely on filtering logic BELOW
                // Wait, we need to access the Establishment Settings object we fetched earlier.
            }

            // Since we didn't save the full "settings" object in a variable above, let's just re-fetch or improve the code structure.
            // Better approach: Let's adjust the logic to capture 'settings' properly.

            let settings = {};
            if (!tableId) {
                try {
                    const estab = await api.getEstablishment(1);
                    if (estab) {
                        setEstablishmentName(estab.name);
                        settings = estab.settings || {};
                    }
                } catch (e) { console.error(e) }
            } else {
                try {
                    const tableData = await api.getTable(tableId);
                    if (tableData && tableData.establishment) {
                        setEstablishmentName(tableData.establishment.name);
                        settings = tableData.establishment.settings || {};
                    }
                } catch (e) { }
            }

            const currentSortOrder = settings.category_order || DEFAULT_CATEGORY_ORDER;
            const hiddenCategories = settings.hidden_categories || [];

            setSortOrder(currentSortOrder);

            try {
                const data = await api.getProducts();
                setProducts(data);

                const uniqueCats = [...new Set(data.map(p => p.category))].filter(Boolean);

                // FILTER HIDDEN CATEGORIES
                const visibleCats = uniqueCats.filter(c => !hiddenCategories.includes(c));

                const sortedCats = visibleCats.sort((a, b) => {
                    // Use local currentSortOrder variable for immediate consistency
                    const idxA = currentSortOrder.indexOf(a);
                    const idxB = currentSortOrder.indexOf(b);
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
            console.log(`📡 Listening for Split Responses on user_notifications:${user.id} `);
            channel = supabase.channel(`user_notifications:${user.id} `)
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
        // Standard items
        let itemTotalQty = 0;
        Object.values(cart).forEach(userCart => {
            itemTotalQty += (userCart[item.id] || 0);
        });
        return acc + (item.price * itemTotalQty);
    }, 0) + Object.values(customItems).reduce((acc, item) => {
        // Custom items
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
        console.log("🟢 [Menu] handleSplitConfirm START", { item, selectedUserIds });

        // item here is actually the "Virtual Cart Item" representing total
        if (!selectedUserIds || selectedUserIds.length === 0) {
            console.warn("⚠️ [Menu] No users selected!");
            return;
        }

        setSplittingItem(null);
        // Save state for finalization waiting for approval
        setPendingSplitData({ selectedUserIds });
        setWaitStatus('waiting');

        try {
            const tableId = localStorage.getItem('my_table_id');
            // Send requests to OTHERS only
            const others = selectedUserIds.filter(uid => uid !== user.id);
            const totalParts = selectedUserIds.length;

            console.log(`📤[Menu] Preparing to send to ${others.length} others.Total Parts: ${totalParts} `);

            // SPECIAL CASE: If user selected ONLY themselves (or nobody else online)
            // Immediately finalize as a normal order (isSplit=false)
            if (others.length === 0) {
                console.log("No other users selected. Finalizing immediately.");
                // Pass data directly to avoid async state race condition
                await finalizeSplitOrder(false, { selectedUserIds });
                return;
            }

            for (const uid of others) {
                console.log(`📤 Sending Split Request for item: ${item.name} to ${uid} `, {
                    price: item.price,
                    totalParts: totalParts,
                    items: item.items
                });

                // Fix: Send ACTUAL product details so Receiver can create valid order
                await api.requestOrderShare({
                    name: item.name,
                    price: item.price, // Send full unit price (visual reference only, receiver will validate)
                    quantity: 1,
                    productId: item.id, // 'cart-total' or specific ID
                    items: item.items, // <--- DETAILED LIST FOR SECURITY
                    totalParts: totalParts, // <--- CRITICAL: Send split count (e.g. 2, 3)
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
                    // SECURE FLOW: Fetch authoritative price from DB
                    const dbProduct = await api.getProduct(productId);

                    if (dbProduct) {
                        const realPrice = Number(dbProduct.price);

                        // Explicit check for requester in final list
                        if (finalUserIds.includes(user.id)) {
                            // Calculate split based on REAL price
                            const totalParts = finalUserIds.length;
                            const splitPrice = realPrice / totalParts;
                            const splitName = totalParts > 1 ? `1 / ${totalParts} ${dbProduct.name} ` : dbProduct.name;

                            // DEBUG: Inject calculated price into name to verify INSERT value vs READ value
                            const debugName = `${splitName} [R$${splitPrice.toFixed(2)}]`;

                            console.log(`🛡️[Secure Split] Creating Order for SELF.Item: ${dbProduct.name}, RealPrice: ${realPrice}, MyPart: ${splitPrice} `);

                            if (splitPrice > 0) {
                                orderPromises.push(api.addOrder(tableId, {
                                    productId: dbProduct.id, // Back to Real ID
                                    name: splitName,
                                    price: splitPrice,
                                    quantity: qty,
                                    orderedBy: user.id,

                                    // Metadata
                                    isSplit: true,
                                    splitParts: totalParts,
                                    originalPrice: realPrice,
                                    splitRequester: user.id, // I am the requester
                                    splitParticipants: finalUserIds
                                }));
                            } else {
                                console.error("❌ [Secure Split] Calculated Price is 0 or Invalid!", { realPrice, totalParts });
                                addToast(`Erro de preço no item ${dbProduct.name} `, 'error');
                            }
                        } else {
                            console.warn("🚩 [Menu] User ID not in finalUserIds (Self-exclusion?)", { uid: user.id, finalUserIds });
                        }
                    } else {
                        console.error("🚩 [Menu] Product not found in DB:", productId);
                        addToast(`Produto inválido: item removido.`, 'error');
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
            console.log("✅ WaitStatus is ACCEPTED. Scheduling finalization...");
            const timer = setTimeout(() => {
                console.log("⏱️ Timer fired. Calling finalizeSplitOrder(true)...");
                finalizeSplitOrder(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [waitStatus, finalizeSplitOrder]); // Implicitly closes over fresh finalizeSplitOrder state

    // Unified Order Processing Logic
    const processOrder = async (cartToProcess, customItemsOverride = null) => {
        const tableId = localStorage.getItem('my_table_id');

        // Use override if provided (for immediate checkout), else use state
        const itemsSource = customItemsOverride || customItems;
        if (!tableId) {
            addToast('Você precisa escanear uma mesa primeiro!', 'error');
            navigate('/scanner');
            return;
        }

        // Calculate Cart Total for this specific cart
        const currentTotal = products.reduce((acc, item) => {
            let qty = cartToProcess[item.id] || 0;
            return acc + (item.price * qty);
        }, 0) + Object.values(itemsSource).reduce((acc, item) => {
            let qty = cartToProcess[item.id] || 0;
            return acc + (item.price * qty);
        }, 0);

        // If multiple users -> Confirm Split
        if (onlineUsers.length > 1) {
            const cartItems = Object.entries(cartToProcess).map(([pid, qty]) => ({ productId: pid, quantity: qty }));

            const virtualItem = {
                name: 'Total do Pedido',
                price: currentTotal,
                id: 'cart-total',
                items: cartItems
            };
            setSplittingItem(virtualItem);
            return;
        }

        // Single User Direct Send
        setSending(true);
        try {
            const orderPromises = [];

            Object.entries(cartToProcess).forEach(([productId, qty]) => {
                // Try to find in DB products OR Custom Items (using correct source)
                let product = products.find(p => String(p.id) === String(productId));
                if (!product && itemsSource[productId]) product = itemsSource[productId];

                if (product) {
                    orderPromises.push(api.addOrder(tableId, {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: qty,
                        orderedBy: user.id,
                        metadata: product.metadata
                    }));
                }
            });

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

    const handleSendOrder = () => {
        processOrder(cart[user?.id] || {});
    };

    if (loading) return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            {/* Search Skeleton */}
            <div style={{ marginTop: '1rem', height: '40px', borderRadius: '12px', background: 'var(--bg-tertiary)' }} />

            {/* Category Skeleton */}
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'hidden', paddingBottom: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--bg-tertiary)' }} />
                        <div style={{ width: '40px', height: '10px', borderRadius: '4px', background: 'var(--bg-tertiary)' }} />
                    </div>
                ))}
            </div>

            {/* Product Skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array(6).fill(0).map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
        </div>
    );

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

            {/* Favorites / Buy Again Section */}
            {
                !searchTerm && !loading && (
                    <FavoritesSection
                        userId={user?.id}
                        onItemClick={handleItemClick}
                    />
                )
            }

            {/* Categories */}
            {
                !searchTerm && (
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
                )
            }

            {/* Product List */}
            <div>
                <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                    {searchTerm ? `Resultados` : selectedCategory}
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Contextual "Meio a Meio" Button - Only shows if category has 'Pizza' in name */}
                    {!searchTerm && selectedCategory && selectedCategory.toLowerCase().includes('pizza') && (
                        <div
                            className="card"
                            onClick={handleOpenPizzaBuilder}
                            style={{
                                display: 'flex', flexDirection: 'row', alignItems: 'center',
                                marginBottom: 0, cursor: 'pointer', gap: '1rem',
                                border: '2px dashed var(--brand-color)',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)'
                            }}
                        >
                            <div style={{
                                width: '80px', height: '80px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--brand-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '2rem', flexShrink: 0
                            }}>
                                🍕
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--brand-color)' }}>
                                    Montar Pizza Meio a Meio
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Escolha 2 sabores desta categoria.
                                </p>
                            </div>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}>
                                <Plus size={20} />
                            </div>
                        </div>
                    )}

                    {filteredItems.map(item => {
                        // Calculate total in cart for this item (across everyone)
                        let totalInCart = 0;
                        Object.values(cart).forEach(uCart => totalInCart += (uCart[item.id] || 0));

                        return (
                            <div
                                key={item.id}
                                className="card"
                                onClick={() => handleItemClick(item)}
                                style={{
                                    display: 'flex', flexDirection: 'row', alignItems: 'center', // Enforcing Row
                                    marginBottom: 0, cursor: 'pointer', gap: '1rem',
                                    textAlign: 'left' // Enforcing Left Align
                                }}
                            >
                                {(item.image_url || item.image) && (
                                    <div style={{ flexShrink: 0 }}>
                                        <img
                                            src={item.image_url || item.image}
                                            alt={item.name}
                                            style={{
                                                width: '80px', height: '80px',
                                                borderRadius: '12px', objectFit: 'cover',
                                                backgroundColor: 'var(--bg-tertiary)'
                                            }}
                                            onError={(e) => e.target.style.display = 'none'} // Fallback if broken
                                        />
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
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
            {
                cartCount > 0 && (
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
                )
            }

            {/* SPLIT MODAL */}
            {
                splittingItem && (
                    <SplitItemModal
                        item={splittingItem}
                        currentUser={user || { id: 'guest', name: 'Você' }}
                        onlineUsers={onlineUsersSafe}
                        onClose={() => setSplittingItem(null)}
                        onConfirm={handleSplitConfirm}
                        confirmLabel="Confirmar Pedido"
                    />
                )
            }

            {/* PIZZA BUILDER MODAL */}
            {showPizzaBuilder && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9000,
                    display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s'
                }}>
                    <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <button onClick={() => setShowPizzaBuilder(false)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                            <ArrowLeft />
                        </button>
                        <div>
                            <h3 style={{ margin: 0 }}>Pizza Meio a Meio</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Escolha 2 sabores</p>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>

                        {/* Selections Preview */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{
                                padding: '1rem', borderRadius: '12px',
                                border: pizzaFlavor1 ? '2px solid var(--primary)' : '2px dashed var(--bg-tertiary)',
                                background: pizzaFlavor1 ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                textAlign: 'center'
                            }}>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sabor 1</span>
                                <div style={{ fontWeight: 'bold' }}>{pizzaFlavor1 ? pizzaFlavor1.name : 'Selecionar...'}</div>
                                {pizzaFlavor1 && <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{pizzaFlavor1.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                            </div>
                            <div style={{
                                padding: '1rem', borderRadius: '12px',
                                border: pizzaFlavor2 ? '2px solid var(--primary)' : '2px dashed var(--bg-tertiary)',
                                background: pizzaFlavor2 ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                textAlign: 'center'
                            }}>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sabor 2</span>
                                <div style={{ fontWeight: 'bold' }}>{pizzaFlavor2 ? pizzaFlavor2.name : 'Selecionar...'}</div>
                                {pizzaFlavor2 && <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{pizzaFlavor2.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
                            </div>
                        </div>

                        {/* List - Filtered by SELECTED CATEGORY to ensure compatibility */}
                        <h4 style={{ marginBottom: '1rem' }}>Sabores em {selectedCategory}</h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {products
                                .filter(p => !p.isComposite && p.category === selectedCategory) // EXACT MATCH CATEGORY
                                .map(pizza => {
                                    const isSelected1 = pizzaFlavor1?.id === pizza.id;
                                    const isSelected2 = pizzaFlavor2?.id === pizza.id;
                                    const isSelected = isSelected1 || isSelected2;

                                    return (
                                        <div
                                            key={pizza.id}
                                            onClick={() => {
                                                if (isSelected1) setPizzaFlavor1(null);
                                                else if (isSelected2) setPizzaFlavor2(null);
                                                else if (!pizzaFlavor1) setPizzaFlavor1(pizza);
                                                else if (!pizzaFlavor2) setPizzaFlavor2(pizza);
                                            }}
                                            className="card"
                                            style={{
                                                marginBottom: 0, padding: '1rem',
                                                border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 'bold' }}>{pizza.name}</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    {pizza.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                            {/* Status Indicator */}
                                            {isSelected && (
                                                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem', color: 'white', fontWeight: 'bold',
                                                        background: 'var(--primary)', padding: '2px 8px', borderRadius: '12px'
                                                    }}>
                                                        {isSelected1 ? 'METADE 1' : 'METADE 2'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--bg-tertiary)', background: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span>Preço Final (Maior Valor)</span>
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
                                {Math.max(pizzaFlavor1?.price || 0, pizzaFlavor2?.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <button
                            disabled={!pizzaFlavor1 || !pizzaFlavor2}
                            onClick={handleConfirmPizza}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', opacity: (!pizzaFlavor1 || !pizzaFlavor2) ? 0.5 : 1 }}
                        >
                            Confirmar Pizza
                        </button>
                    </div>
                </div>
            )}

            {/* WAITING MODAL */}
            {
                waitStatus !== 'idle' && (
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
                )
            }
        </div >
    );
};

export default Menu;
