import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users } from 'lucide-react';

import { api, supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTablePresence } from '../../hooks/useTablePresence';
import { useToast } from '../../context/ToastContext';

import SkeletonProductCard from '../../components/SkeletonProductCard';
import SplitItemModal from '../../components/SplitItemModal';

import FavoritesSection from './components/FavoritesSection';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid from './components/ProductGrid';
import PizzaBuilderModal from './components/PizzaBuilderModal';
import SplitStatusModal from './components/SplitStatusModal';
import CartFooter from './components/CartFooter';

const DEFAULT_CATEGORY_ORDER = [
    'Cervejas', 'Drinks', 'Petiscos', 'Lanches', 'Pratos', 'Sem Álcool', 'Sobremesas'
];

const Menu = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { onlineUsers } = useTablePresence();

    // Data State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [establishmentName, setEstablishmentName] = useState('');

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState(DEFAULT_CATEGORY_ORDER);

    // Cart State
    const [cart, setCart] = useState({});
    const [customItems, setCustomItems] = useState({});
    const [sending, setSending] = useState(false);

    // Pizza State
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);

    // Split State
    const [splittingItem, setSplittingItem] = useState(null);
    const [waitStatus, setWaitStatus] = useState('idle'); // idle, waiting, accepted, rejected
    const [pendingSplitData, setPendingSplitData] = useState(null);
    const [responderName, setResponderName] = useState('');

    const tableId = localStorage.getItem('my_table_id');

    // --- INITIAL DATA LOAD ---
    useEffect(() => {
        const load = async () => {
            let settings = {};
            if (!tableId) {
                // Determine settings from default ID 1 if no table
                // This logic mirrors previous implementation
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
    }, [tableId]);

    // --- WEB SOCKET LISTENER ---
    useEffect(() => {
        let channel;
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

    // --- CART LOGIC ---
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
        updateCartDirect(user?.id || 'guest', item, 1);
        addToast(`${item.name} adicionado!`, 'success');
    };

    const cartCount = Object.values(cart).reduce((total, userCart) => {
        return total + Object.values(userCart).reduce((a, b) => a + b, 0);
    }, 0);

    const cartTotal = products.reduce((acc, item) => {
        let itemTotalQty = 0;
        Object.values(cart).forEach(userCart => itemTotalQty += (userCart[item.id] || 0));
        return acc + (item.price * itemTotalQty);
    }, 0) + Object.values(customItems).reduce((acc, item) => {
        let itemTotalQty = 0;
        Object.values(cart).forEach(userCart => itemTotalQty += (userCart[item.id] || 0));
        return acc + (item.price * itemTotalQty);
    }, 0);

    // --- PIZZA LOGIC ---
    const handleConfirmPizza = (flavor1, flavor2) => {
        // Rule: Price is the MAX of the two
        const finalPrice = Math.max(flavor1.price, flavor2.price);

        const compositeItem = {
            id: `half-${Date.now()}`,
            name: `½ ${flavor1.name} + ½ ${flavor2.name}`,
            price: finalPrice,
            image: flavor1.image_url || flavor1.image,
            category: 'Pizzas',
            isComposite: true,
            metadata: {
                type: 'half_half',
                parts: [flavor1.id, flavor2.id]
            }
        };

        // Persist Metadata locally
        setCustomItems(prev => ({ ...prev, [compositeItem.id]: compositeItem }));

        // Add to Cart
        updateCartDirect(user?.id || 'guest', compositeItem, 1);

        // AUTO CHECKOUT
        const currentCart = cart[user?.id || 'guest'] || {};
        const newCartForCheckout = {
            ...currentCart,
            [compositeItem.id]: (currentCart[compositeItem.id] || 0) + 1
        };

        setShowPizzaBuilder(false);
        processOrder(newCartForCheckout, { ...customItems, [compositeItem.id]: compositeItem });
    };

    // --- ORDER PROCESSING & SPLIT LOGIC ---
    const onlineUsersSafe = onlineUsers && onlineUsers.length > 0 ? onlineUsers : [user || { id: 'guest', name: 'Você' }];

    const handleSendOrder = () => {
        processOrder(cart[user?.id] || {});
    };

    const processOrder = async (cartToProcess, customItemsOverride = null) => {
        const itemsSource = customItemsOverride || customItems;
        if (!tableId) {
            addToast('Você precisa escanear uma mesa primeiro!', 'error');
            navigate('/scanner');
            return;
        }

        // Calculate total for this specific cart
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

    const handleSplitConfirm = async (item, selectedUserIds) => {
        if (!selectedUserIds || selectedUserIds.length === 0) return;

        setSplittingItem(null);
        setPendingSplitData({ selectedUserIds });
        setWaitStatus('waiting');

        try {
            const others = selectedUserIds.filter(uid => uid !== user.id);
            const totalParts = selectedUserIds.length;

            if (others.length === 0) {
                await finalizeSplitOrder(false, { selectedUserIds });
                return;
            }

            for (const uid of others) {
                await api.requestOrderShare({
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    productId: item.id,
                    items: item.items,
                    totalParts: totalParts,
                    tableId: tableId,
                    requesterId: user.id
                }, uid, user.name || 'Alguém', user.id);
            }
        } catch (error) {
            setWaitStatus('idle');
            addToast('Erro ao solicitar divisão.', 'error');
        }
    };

    const finalizeSplitOrder = async (isSplit, overrideData = null) => {
        setSending(true);
        setWaitStatus('idle');

        const splitData = overrideData || pendingSplitData;
        if (!splitData) {
            setSending(false);
            return;
        }

        const { selectedUserIds } = splitData;
        const finalUserIds = isSplit ? selectedUserIds : [user.id];

        try {
            const orderPromises = [];
            const myCart = cart[user?.id];

            if (myCart) {
                for (const [productId, qty] of Object.entries(myCart)) {
                    // Try to find in DB or custom items
                    let product = products.find(p => String(p.id) === String(productId));
                    // If not in DB, check custom items
                    if (!product && customItems[productId]) product = customItems[productId];

                    if (product) {
                        const realPrice = Number(product.price);
                        if (finalUserIds.includes(user.id)) {
                            const totalParts = finalUserIds.length;
                            const splitPrice = realPrice / totalParts;
                            const splitName = totalParts > 1 ? `1 / ${totalParts} ${product.name} ` : product.name;

                            if (splitPrice > 0) {
                                orderPromises.push(api.addOrder(tableId, {
                                    productId: product.id,
                                    name: splitName,
                                    price: splitPrice,
                                    quantity: qty,
                                    orderedBy: user.id,
                                    isSplit: true,
                                    splitParts: totalParts,
                                    originalPrice: realPrice,
                                    splitRequester: user.id,
                                    splitParticipants: finalUserIds,
                                    metadata: product.metadata
                                }));
                            }
                        }
                    }
                }
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

    useEffect(() => {
        if (waitStatus === 'accepted') {
            const timer = setTimeout(() => {
                finalizeSplitOrder(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [waitStatus]);

    // --- RENDER HELPERS ---
    const filteredItems = products.filter(item => {
        if (item.isSplit) return false;
        if (searchTerm.trim()) return item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return item.category === selectedCategory;
    });

    if (loading) return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <div style={{ marginTop: '1rem', height: '40px', borderRadius: '12px', background: 'var(--bg-tertiary)' }} />
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'hidden', paddingBottom: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} style={{ minWidth: '80px', height: '80px', background: 'var(--bg-tertiary)', borderRadius: '16px' }} />
                ))}
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
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

                {/* User Count */}
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

            {/* Favorites */}
            {!searchTerm && !loading && (
                <FavoritesSection userId={user?.id} onItemClick={handleItemClick} />
            )}

            {/* Categories */}
            {!searchTerm && (
                <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />
            )}

            {/* Products */}
            <ProductGrid
                items={filteredItems}
                cart={cart}
                userId={user?.id || 'guest'}
                selectedCategory={selectedCategory}
                searchTerm={searchTerm}
                onItemClick={handleItemClick}
                onUpdateCart={updateCartDirect}
                onOpenPizzaBuilder={() => setShowPizzaBuilder(true)}
            />

            {/* Floating Action Button */}
            <CartFooter
                count={cartCount}
                total={cartTotal}
                sending={sending}
                onCheckout={handleSendOrder}
            />

            {/* Modals */}
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

            <PizzaBuilderModal
                isOpen={showPizzaBuilder}
                onClose={() => setShowPizzaBuilder(false)}
                products={products}
                category={selectedCategory}
                onConfirm={handleConfirmPizza}
            />

            <SplitStatusModal
                status={waitStatus}
                responderName={responderName}
                onCancel={() => { setWaitStatus('idle'); setPendingSplitData(null); }}
                onContinueAlone={() => finalizeSplitOrder(false)}
            />
        </div>
    );
};

export default Menu;
