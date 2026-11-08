import { useState, useEffect } from 'react';
import { api, supabase } from '../../../services/api';
import { useTablePresence } from '../../../hooks/useTablePresence';

const DEFAULT_CATEGORY_ORDER = [
    'Cervejas', 'Drinks', 'Petiscos', 'Lanches', 'Pratos', 'Sem Álcool', 'Sobremesas'
];

export const useMenuLogic = (user, addToast, navigate) => {
    // Hooks
    const { onlineUsers } = useTablePresence();
    const tableId = localStorage.getItem('my_table_id');

    // Data State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [establishmentName, setEstablishmentName] = useState('');

    // Cart State
    const [cart, setCart] = useState(() => { try { const s = localStorage.getItem('b2c_shared_cart'); return s ? JSON.parse(s) : {}; } catch { return {}; } });
    useEffect(() => { try { localStorage.setItem('b2c_shared_cart', JSON.stringify(cart)); } catch {} }, [cart]);
    const [customItems, setCustomItems] = useState({});
    const [sending, setSending] = useState(false);

    // Split State
    const [splittingItem, setSplittingItem] = useState(null);
    const [waitStatus, setWaitStatus] = useState('idle');
    const [pendingSplitData, setPendingSplitData] = useState(null);
    const [responderName, setResponderName] = useState('');

    // --- INITIAL DATA LOAD ---
    useEffect(() => {
        const load = async () => {
            let currentEstabId = 1;
            let settings = {};

            const entryEstablishmentId = localStorage.getItem('b2c_entry_establishment_id');

            if (!tableId && entryEstablishmentId) {
                try {
                    const estab = await api.getEstablishment(entryEstablishmentId);
                    if (estab) {
                        currentEstabId = estab.id;
                        setEstablishmentName(estab.name);
                        settings = estab.settings || {};
                    }
                } catch (e) { console.error(e) }
            } else if (!tableId) {
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
                        currentEstabId = tableData.establishment.id;
                        setEstablishmentName(tableData.establishment.name);
                        settings = tableData.establishment.settings || {};
                    }
                } catch (e) { /* empty */ }
            }

            const currentSortOrder = settings.category_order || DEFAULT_CATEGORY_ORDER;
            const hiddenCategories = settings.hidden_categories || [];

            try {
                const data = await api.getProducts(currentEstabId);
                setProducts(data);

                const uniqueCats = [...new Set(data.map(p => p.category))].filter(Boolean);
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

    // --- LISTEN FOR SPLIT RESPONSES ---
    useEffect(() => {
        let channel;
        if (user?.id) {
            console.log(`📡 Listening for Split Responses on user_notifications:${user.id}`);
            channel = supabase.channel(`user_notifications:${user.id}`)
                .on('broadcast', { event: 'split_response' }, async (payload) => {
                    const { status, responderName: rName } = payload.payload;
                    if (status === 'accepted') {
                        setWaitStatus('accepted');
                        setResponderName(rName);
                        // B aceitou a divisão! Agora envia a parte de A para a cozinha
                        setTimeout(async () => {
                            await finalizeSplitOrder(true);
                        }, 1200);
                    } else if (status === 'rejected') {
                        setWaitStatus('rejected');
                        setResponderName(rName);
                    }
                })
                .subscribe();
        }
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [user?.id, pendingSplitData]);

    // Auto-proceed removido: o pedido do solicitante vai pra cozinha imediatamente em handleSplitConfirm
    // O waitStatus agora é apenas UI feedback, não bloqueia o envio

    // --- CART HELPERS ---
    const updateCartDirect = (userId, item, delta) => {
        if (delta > 0 && item?.is_out_of_stock) {
            addToast(`${item.name} está em falta.`, 'warning');
            return;
        }

        setCart(prev => {
            const userCart = prev[userId] || {};
            const currentQty = userCart[item.id] || 0;
            const newQty = Math.max(0, currentQty + delta);

            const newUserCart = { ...userCart };
            if (newQty === 0) delete newUserCart[item.id];
            else newUserCart[item.id] = newQty;

            const newPrev = { ...prev, [userId]: newUserCart };
            if (Object.keys(newUserCart).length === 0) delete newPrev[userId];
            return newPrev;
        });
    };

    const handleItemClick = (item) => {
        if (item?.is_out_of_stock) {
            addToast(`${item.name} está em falta.`, 'warning');
            return;
        }

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

    // --- PIZZA ---
    const handleConfirmPizza = (flavor1, flavor2, callbackCloseModal) => {
        const finalPrice = Math.max(flavor1.price, flavor2.price);
        const compositeItem = {
            id: `half-${Date.now()}`,
            name: `½ ${flavor1.name} + ½ ${flavor2.name}`,
            price: finalPrice,
            image: flavor1.image_url || flavor1.image,
            category: 'Pizzas',
            isComposite: true,
            metadata: { type: 'half_half', parts: [flavor1.id, flavor2.id] }
        };

        setCustomItems(prev => ({ ...prev, [compositeItem.id]: compositeItem }));
        updateCartDirect(user?.id || 'guest', compositeItem, 1);

        const currentCart = cart[user?.id || 'guest'] || {};
        const newCartForCheckout = {
            ...currentCart,
            [compositeItem.id]: (currentCart[compositeItem.id] || 0) + 1
        };

        if (callbackCloseModal) callbackCloseModal();
        processOrder(newCartForCheckout, { ...customItems, [compositeItem.id]: compositeItem });
    };

    // --- ORDERS ---
    const processOrder = async (cartToProcess, customItemsOverride = null) => {
        const itemsSource = customItemsOverride || customItems;
        if (!tableId) {
            addToast('Você precisa escanear uma mesa primeiro!', 'error');
            navigate('/scanner');
            return;
        }

        // Se há mais de 1 pessoa na mesa, abre modal de divisão antes de enviar
        if (onlineUsers.length > 1) {
            const itemsSource2 = customItemsOverride || customItems;
            const cartItems = Object.entries(cartToProcess).map(([pid, qty]) => {
                let product = products.find(p => String(p.id) === String(pid));
                if (!product && itemsSource2[pid]) product = itemsSource2[pid];
                return {
                    productId: pid,
                    quantity: qty,
                    name: product?.name || 'Item Desconhecido',
                    price: product?.price || 0,
                    metadata: product?.metadata || {}
                };
            });
            const currentTotal = products.reduce((acc, item) => {
                const qty = cartToProcess[item.id] || 0;
                return acc + (item.price * qty);
            }, 0) + Object.values(itemsSource).reduce((acc, item) => {
                const qty = cartToProcess[item.id] || 0;
                return acc + (item.price * qty);
            }, 0);
            setSplittingItem({ name: 'Total do Pedido', price: currentTotal, id: 'cart-total', items: cartItems });
            return;
        }

        setSending(true);
        try {
            const batchId = crypto.randomUUID();
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
                        metadata: product.metadata,
                        batchId
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

    // Abre o modal de divisão manualmente (chamado pelo botão "Dividir" no CartFooter)
    const handleOpenSplit = () => {
        const myCart = cart[user?.id] || {};
        if (Object.keys(myCart).length === 0) return;

        const itemsSource = customItems;
        const cartItems = Object.entries(myCart).map(([pid, qty]) => {
            let product = products.find(p => String(p.id) === String(pid));
            if (!product && itemsSource[pid]) product = itemsSource[pid];
            return {
                productId: pid,
                quantity: qty,
                name: product?.name || 'Item Desconhecido',
                price: product?.price || 0,
                metadata: product?.metadata || {}
            };
        });

        const currentTotal = products.reduce((acc, item) => {
            const qty = myCart[item.id] || 0;
            return acc + (item.price * qty);
        }, 0) + Object.values(itemsSource).reduce((acc, item) => {
            const qty = myCart[item.id] || 0;
            return acc + (item.price * qty);
        }, 0);

        setSplittingItem({
            name: 'Total do Pedido',
            price: currentTotal,
            id: 'cart-total',
            items: cartItems
        });
    };

    const handleSplitConfirm = async (item, selectedUserIds) => {
        if (!selectedUserIds || selectedUserIds.length === 0) return;
        setSplittingItem(null);

        const others = selectedUserIds.filter(uid => uid !== user.id);
        const totalParts = selectedUserIds.length;

        // Gera um batchId único para este pedido — compartilhado com todos os participantes
        const batchId = crypto.randomUUID();

        setPendingSplitData({ selectedUserIds, batchId });

        if (others.length === 0) {
            // Apenas eu — sem divisão, vai direto pra cozinha
            await finalizeSplitOrder(false, { selectedUserIds, batchId });
            return;
        }

        try {
            // 1. Notifica os outros ANTES de navegar (cart ainda está intacto para eles lerem)
            for (const uid of others) {
                await api.requestOrderShare({
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    productId: item.id,
                    items: item.items,
                    totalParts: totalParts,
                    tableId: tableId,
                    requesterId: user.id,
                    batchId                 // ← B usará o mesmo batchId
                }, uid, user.name || 'Alguém', user.id);
            }
        } catch (error) {
            console.warn('Erro ao notificar participantes da divisão:', error);
        }

        // 2. Não envia direto para a cozinha: abre o modal de espera até B aceitar
        setWaitStatus('waiting');
    };

    const finalizeSplitOrder = async (isSplit, overrideData = null) => {
        setSending(true);
        setWaitStatus('idle');
        const splitData = overrideData || pendingSplitData;
        if (!splitData) { setSending(false); return; }

        const { selectedUserIds, batchId } = splitData;
        const finalUserIds = isSplit ? selectedUserIds : [user.id];

        try {
            const orderPromises = [];
            const myCart = cart[user?.id];
            if (myCart) {
                for (const [productId, qty] of Object.entries(myCart)) {
                    let product = products.find(p => String(p.id) === String(productId));

                    // Fallback 1: Custom Items state (Requester)
                    if (!product && customItems[productId]) product = customItems[productId];

                    // Fallback 2: Check pendingSplitData payload if available (Receiver context)
                    // Currently pendingSplitData might just have IDs? 
                    // Actually, for pizza split, if I am the requester, I have customItems.
                    // If I am the RECEIVER, I don't use finalizeSplitOrder! The receiver uses a different flow (Accept Modal).
                    // WAIT. The logic refactored here is for the REQUESTER.
                    // So why did the user say "when I go to split, error ID not found"?
                    // It must be that customItems is losing state or key mismatch.
                    // Let's protect this anyway.

                    if (product) {
                        const realPrice = Number(product.price);
                        if (finalUserIds.includes(user.id)) {
                            const totalParts = finalUserIds.length;
                            const splitPrice = realPrice / totalParts;
                            const isActuallySplit = isSplit && totalParts > 1;
                            // Nome limpo no banco — display calcula "1/X" via is_split + split_parts
                            if (splitPrice > 0) {
                                orderPromises.push(api.addOrder(tableId, {
                                    productId: product.id,
                                    name: product.name,
                                    price: splitPrice,
                                    quantity: qty,
                                    orderedBy: user.id,
                                    isSplit: isActuallySplit,
                                    splitParts: isActuallySplit ? totalParts : 1,
                                    originalPrice: isActuallySplit ? realPrice : null,
                                    splitRequester: isActuallySplit ? user.id : null,
                                    splitParticipants: isActuallySplit ? finalUserIds : null,
                                    metadata: product.metadata,
                                    batchId: batchId || null
                                }));
                            }
                        }
                    } else {
                        console.error(`❌ Product ID not found: ${productId}`);
                        addToast(`Erro: Item ${productId} não encontrado.`, 'error');
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

    return {
        // Data
        branding: { establishmentName, loading },
        categories: { list: categories, selected: selectedCategory, select: setSelectedCategory, loading },
        products: { list: products }, // filtered later in UI or passed here
        onlineUsers,

        // Cart
        cart: { data: cart, count: cartCount, total: cartTotal, update: updateCartDirect, addItem: handleItemClick },
        order: { sending, handleSend: handleSendOrder },

        // Split
        split: {
            splittingItem,
            waitStatus,
            responderName,
            setSplittingItem,
            handleSplitConfirm,
            handleOpenSplit,
            reset: () => { setWaitStatus('idle'); setPendingSplitData(null); },
            continueAlone: () => finalizeSplitOrder(false)
        },

        // Pizza
        pizza: {
            confirm: handleConfirmPizza
        }
    };
};
