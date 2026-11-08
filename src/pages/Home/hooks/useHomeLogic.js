import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useTableContext } from '../../../context/TableContext';
import { useToast } from '../../../context/ToastContext';

const DEFAULT_FEATURED_MD = [
    {
        id: 'feat-1',
        name: 'Batata Frita Crocante',
        category: 'Porção 500g especial',
        price: 28.00,
        image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
        description: 'Porção 500g especial'
    },
    {
        id: 'feat-2',
        name: 'Isca de Frango',
        category: 'Empanada crocante',
        price: 38.00,
        image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80',
        description: 'Empanada crocante'
    },
    {
        id: 'feat-3',
        name: 'Smash Burger Hexa',
        category: 'Duplo cheddar artesanal',
        price: 36.00,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
        description: 'Duplo cheddar artesanal'
    }
];

const DEFAULT_USUAL_SM = [
    {
        id: 'usual-1',
        name: 'Chopp Heineken',
        category: 'Bebidas',
        price: 16.00,
        image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=400&q=80',
        description: 'Chopp trincando de gelado servido na caneca zero grau'
    },
    {
        id: 'usual-2',
        name: 'Pastel Misto',
        category: 'Petiscos',
        price: 22.00,
        image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
        description: 'Porção de mini pastéis crocantes de carne e queijo'
    },
    {
        id: 'usual-3',
        name: 'Gin Tônica',
        category: 'Drinks',
        price: 34.00,
        image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
        description: 'Gin importado com tônica e especiarias cítricas'
    }
];

const computeSharedCartCount = () => {
    try {
        const raw = localStorage.getItem('b2c_shared_cart');
        if (!raw) return 0;
        const parsed = JSON.parse(raw);
        return Object.values(parsed).reduce((total, userCart) => {
            return total + Object.values(userCart || {}).reduce((a, b) => a + Number(b || 0), 0);
        }, 0);
    } catch {
        return 0;
    }
};

export const resolveContextualTitle = (user, isWeekendNight = false) => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
        const cached = window.sessionStorage.getItem('b2c_home_contextual_title');
        if (cached) return cached;
    }

    let chosen = 'Quem conhece, pede';
    if (!user?.id) {
        chosen = 'Pra não ter erro';
    } else if (isWeekendNight) {
        chosen = 'Quem conhece, pede';
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('b2c_home_contextual_title', chosen);
    }
    return chosen;
};

export const useHomeLogic = () => {
    const { user, logout } = useAuth();
    const { tableId, table, establishment, onlineUsers, setTableId } = useTableContext();
    const { addToast } = useToast();

    // UI State
    const [statusBadge, setStatusBadge] = useState({ label: 'Em preparo', variant: 'preparing' });
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);
    const [splittingProduct, setSplittingProduct] = useState(null);
    const [cartCount, setCartCount] = useState(() => computeSharedCartCount());

    // Business State
    const [waiterCooldown, setWaiterCooldown] = useState(0);
    const [featuredProducts, setFeaturedProducts] = useState(DEFAULT_FEATURED_MD);
    const [usualProducts, setUsualProducts] = useState(DEFAULT_USUAL_SM);

    const userId = user?.id;
    const contextualTitle = useMemo(() => resolveContextualTitle(user), [userId]);

    // Add item directly to shared cart
    const handleAddToCart = useCallback(
        (product, quantity = 1) => {
            if (!product) return;
            const ownerKey = userId || 'guest';
            try {
                const raw = localStorage.getItem('b2c_shared_cart');
                const currentCart = raw ? JSON.parse(raw) : {};
                const userCart = currentCart[ownerKey] || {};
                const currentQty = Number(userCart[product.id] || 0);
                userCart[product.id] = currentQty + Number(quantity || 1);
                currentCart[ownerKey] = userCart;
                localStorage.setItem('b2c_shared_cart', JSON.stringify(currentCart));
                setCartCount(computeSharedCartCount());
                addToast(`${quantity}x ${product.name} adicionado ao carrinho! 🛒`, 'success');
            } catch (err) {
                console.error('Erro ao adicionar ao carrinho:', err);
                addToast('Erro ao adicionar item ao carrinho.', 'error');
            }
        },
        [userId, addToast]
    );

    // Cooldown timer for Waiter button
    useEffect(() => {
        if (waiterCooldown <= 0) return;
        const timer = setInterval(() => {
            setWaiterCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [waiterCooldown]);

    // Concierge Waiter Call
    const handleCallWaiter = async () => {
        if (waiterCooldown > 0) {
            addToast(`Garçom já foi avisado! Chegando em breve (${waiterCooldown}s)`, 'info');
            return;
        }

        try {
            await api.callWaiter(tableId, user?.id);
            addToast('Garçom chamado! A caminho da mesa 🔔', 'success');
            setWaiterCooldown(45);
        } catch (e) {
            console.error('Erro ao chamar garçom:', e);
            addToast('Não foi possível chamar agora. Tente de novo.', 'error');
        }
    };

    // Manual Code Submission
    const handleManualSubmit = async () => {
        if (!manualCode) return;
        try {
            const establishmentData = await api.getEstablishmentByEntryCode?.(manualCode);
            if (establishmentData && establishmentData.id) {
                localStorage.setItem('b2c_entry_establishment_id', establishmentData.id);
                localStorage.setItem('b2c_entry_qr_code', manualCode);
                setTableId(null);
                return { success: true, isEntry: true };
            }

            const tableData = await api.getTableByCode(manualCode);
            if (tableData && tableData.id) {
                if (tableData.establishment_id) {
                    localStorage.setItem('b2c_entry_establishment_id', tableData.establishment_id);
                }
                setTableId(tableData.id);
                return { success: true, isEntry: false };
            } else {
                addToast('Código não encontrado!', 'error');
                return { success: false };
            }
        } catch (e) {
            console.error(e);
            addToast('Erro ao validar o código.', 'error');
            return { success: false };
        }
    };

    // Load products from DB for both Featured MD and Usual SM carousels (with real photos)
    useEffect(() => {
        const loadProducts = async () => {
            if (!establishment?.id) return;
            try {
                const prods = await api.getProducts(establishment.id);
                if (prods && prods.length > 0) {
                    const available = prods.filter((p) => p.available !== false);
                    if (available.length > 0) {
                        const mappedMD = available.slice(0, 6).map((p, idx) => ({
                            id: p.id,
                            name: p.name,
                            category: p.category || 'Porção especial',
                            price: p.price,
                            image_url:
                                p.image_url ||
                                DEFAULT_FEATURED_MD[idx % DEFAULT_FEATURED_MD.length].image_url,
                            description: p.description || p.category || 'Porção especial'
                        }));
                        setFeaturedProducts(mappedMD);

                        // Filter drinks/beers or habitual items for "O de sempre?" with real photos
                        const drinksOrSnacks = available.filter((p) =>
                            /cerveja|chopp|drink|bebida|petisco|porç/i.test(
                                `${p.category || ''} ${p.name || ''}`
                            )
                        );
                        const sourceSM =
                            drinksOrSnacks.length >= 2
                                ? drinksOrSnacks
                                : available.length > 2
                                  ? [...available].reverse()
                                  : available;

                        const mappedSM = sourceSM.slice(0, 5).map((p, idx) => ({
                            id: p.id,
                            name: p.name,
                            category: p.category || 'Bebidas',
                            price: p.price,
                            image_url:
                                p.image_url ||
                                DEFAULT_USUAL_SM[idx % DEFAULT_USUAL_SM.length].image_url,
                            description: p.description || p.category || 'Pedido habitual na casa'
                        }));
                        setUsualProducts(mappedSM);
                    }
                }
            } catch (err) {
                console.warn('Usando destaques padrão:', err);
            }
        };
        loadProducts();
    }, [establishment?.id]);

    // Fetch and Subscribe to user's latest order status (Zero count / Zero currency anxiety)
    const refreshOrderStatus = useCallback(async () => {
        if (!tableId || !userId) return;

        try {
            const tableData = await api.getTable(tableId);
            const orders = tableData?.orders || [];

            const myOrders = orders.filter(
                (o) =>
                    o.ordered_by === userId &&
                    o.status !== 'paid' &&
                    o.status !== 'service_call' &&
                    o.name !== '🔔 CHAMAR GARÇOM'
            );

            if (myOrders.length === 0) {
                setStatusBadge({ label: 'Em preparo', variant: 'preparing' });
                return;
            }

            const sorted = [...myOrders].sort(
                (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
            );
            const latestOrder = sorted[0];

            if (latestOrder.status === 'waiting_split') {
                setStatusBadge({ label: 'Aguardando aceite da mesa', variant: 'waiting' });
            } else if (latestOrder.status === 'ready') {
                setStatusBadge({ label: 'Saindo agora', variant: 'ready' });
            } else if (latestOrder.status === 'preparing') {
                setStatusBadge({ label: 'Em preparo', variant: 'preparing' });
            } else if (latestOrder.status === 'pending') {
                setStatusBadge({ label: 'Em preparo', variant: 'preparing' });
            } else if (latestOrder.status === 'delivered') {
                setStatusBadge({ label: 'Entregue na mesa', variant: 'delivered' });
            } else {
                setStatusBadge({ label: 'Em preparo', variant: 'preparing' });
            }
        } catch (err) {
            console.error('Error refreshing order status:', err);
        }
    }, [tableId, userId]);

    useEffect(() => {
        refreshOrderStatus();

        if (!tableId || !userId) return;

        const channel = supabase
            .channel(`home_orders:${tableId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` },
                () => {
                    refreshOrderStatus();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableId, userId, refreshOrderStatus]);

    const userFirstName = user?.name?.split(' ')[0] || 'Victor';

    const handleSplitHomeConfirm = useCallback(
        async (item, selectedUserIds) => {
            if (!selectedUserIds || selectedUserIds.length === 0 || !tableId) return;
            setSplittingProduct(null);

            const totalParts = selectedUserIds.length;
            const isActuallySplit = totalParts > 1;
            const batchId = crypto.randomUUID();
            const realPrice = Number(item.price) || 0;
            const splitPrice = isActuallySplit ? realPrice / totalParts : realPrice;
            const currentUserId = user?.id || 'guest';
            const others = selectedUserIds.filter((uid) => uid !== currentUserId);

            try {
                if (others.length > 0) {
                    for (const uid of others) {
                        await api.requestOrderShare?.(
                            {
                                name: item.name,
                                price: realPrice,
                                quantity: item.quantity || 1,
                                productId: item.id,
                                totalParts,
                                tableId,
                                requesterId: currentUserId,
                                batchId
                            },
                            uid,
                            user?.name || 'Alguém',
                            currentUserId
                        );
                    }
                }

                await api.addOrder(tableId, {
                    productId: item.id,
                    name: item.name,
                    price: splitPrice,
                    quantity: item.quantity || 1,
                    orderedBy: currentUserId,
                    isSplit: isActuallySplit,
                    splitParts: isActuallySplit ? totalParts : 1,
                    originalPrice: isActuallySplit ? realPrice : null,
                    splitRequester: isActuallySplit ? currentUserId : null,
                    splitParticipants: isActuallySplit ? selectedUserIds : null,
                    batchId,
                    status: isActuallySplit ? 'waiting_split' : 'pending'
                });

                addToast(
                    isActuallySplit
                        ? 'Pedido enviado. Aguardando aceite da mesa.'
                        : 'Pedido enviado para a cozinha.',
                    'success'
                );
            } catch (err) {
                console.error('Erro ao dividir pedido na home:', err);
                addToast('Erro ao processar divisão do pedido.', 'error');
            }
        },
        [tableId, user, addToast]
    );

    const confirmLogout = async () => {
        setShowLogoutConfirm(false);
        await logout();
    };

    return {
        user,
        logout,
        userFirstName,
        tableId,
        table,
        establishment,
        onlineUsers,
        setTableId,
        statusBadge,
        showManualInput,
        setShowManualInput,
        manualCode,
        setManualCode,
        showUsersModal,
        setShowUsersModal,
        showLogoutConfirm,
        setShowLogoutConfirm,
        confirmLogout,
        handleManualSubmit,
        waiterCooldown,
        handleCallWaiter,
        contextualTitle,
        featuredProducts,
        usualProducts,
        setUsualProducts,
        selectedQuickProduct,
        setSelectedQuickProduct,
        splittingProduct,
        setSplittingProduct,
        handleSplitHomeConfirm,
        cartCount,
        handleAddToCart
    };
};
