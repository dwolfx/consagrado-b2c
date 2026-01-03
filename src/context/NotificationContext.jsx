import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, api } from '../services/api';
import { useAuth } from './AuthContext';
import { useTableContext } from './TableContext';
import { useToast } from './ToastContext';
import SplitRequestModal from '../components/SplitRequestModal';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { tableId } = useTableContext();
    const { addToast } = useToast();
    const [incomingRequest, setIncomingRequest] = useState(null);

    useEffect(() => {
        if (!user || !tableId) return;

        // 1. Table Channel (Broadcasts like "Someone wants to split bill")
        // Kept for backward compatibility or other table-wide events
        const tableChannel = supabase.channel(`table_notifications:${tableId}`)
            .on('broadcast', { event: 'request_split' }, (payload) => {
                const { targetIds, orderId, itemName, requesterName, requesterId } = payload.payload;
                if (targetIds && targetIds.includes(user.id)) {
                    setIncomingRequest({
                        id: Date.now(),
                        type: 'split_bill',
                        orderId,
                        itemName,
                        requesterName,
                        requesterId,
                        targetIds
                    });
                }
            })
            .subscribe();

        // 2. User Channel (Direct requests like "Share this order?")
        // This is the primary channel for the new split flow
        const userChannel = supabase.channel(`user_notifications:${user.id}`)
            .on('broadcast', { event: 'request_order_share' }, (payload) => {
                console.log("🔥 NotificationContext received SHARE request:", payload);
                const { itemDetails, targetUserId, requesterName, requesterId } = payload.payload;

                console.log("🔥 RECEIVER RAW ITEM:", itemDetails); // DEBUG PRICE

                // Verify this message is actually for us (redundant but safe)
                if (targetUserId === user.id) {
                    setIncomingRequest({
                        id: Date.now(),
                        type: 'join_order',
                        itemDetails, // { name, price, quantity, tableId }
                        itemName: itemDetails.name,
                        requesterName,
                        requesterId
                    });
                }
            })
            .subscribe((status) => {
                console.log(`📡 [NotificationContext] User Channel Status (${user.id}):`, status);
            });

        // 3. Orders Status Channel (Real-time Food Updates)
        const orderChannel = supabase.channel(`orders_status:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `ordered_by=eq.${user.id}`
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;
                    const itemName = payload.new.name;

                    // Only notify on meaningful status changes forward
                    if (newStatus !== oldStatus) {
                        if (newStatus === 'preparing') {
                            addToast(`👨‍🍳 Preparando: ${itemName}`, 'info');
                        } else if (newStatus === 'ready') {
                            addToast(`✅ Pronto: ${itemName}`, 'success');
                        } else if (newStatus === 'delivered') {
                            addToast(`🚀 Entregue: ${itemName}`, 'success');
                        }
                    }
                }
            )
            .subscribe();

        console.log("🔌 [NotificationContext] Subscribing channels for:", { uid: user.id, tid: tableId });

        return () => {
            supabase.removeChannel(tableChannel);
            supabase.removeChannel(userChannel);
            supabase.removeChannel(orderChannel);
        };
    }, [user, tableId]);

    const handleAccept = async () => {
        console.log("🟢 handleAccept CLICKED", { incomingRequest, tableId });
        if (!incomingRequest) return;

        // Capture data before closing modal
        const req = { ...incomingRequest };

        // Optimistic UI: Close modal immediately
        setIncomingRequest(null);

        try {
            if (req.type === 'split_bill') {
                const fullOrder = await api.getOrder(req.orderId);
                if (fullOrder) {
                    const allParticipants = [req.requesterId, ...req.targetIds];
                    const uniqueParticipants = [...new Set(allParticipants)];

                    await api.splitOrder(fullOrder, uniqueParticipants);
                    addToast("Divisão Aceita! Comanda atualizada.", "success");
                } else {
                    addToast("Pedido não encontrado ou já alterado.", "error");
                }
            } else if (req.type === 'join_order') {
                console.log("🚀 Processing Join Order. Requester:", req.requesterId, "[v3-SECURE-LOOP]");

                // Helper to process a single item share
                const processSingleItem = async (pid, qty) => {
                    console.log(`🔒 Validating Item ID: ${pid} (Qty: ${qty})`);

                    // 1. Fetch Authoritative Price (Security)
                    const dbProduct = await api.getProduct(pid);

                    if (!dbProduct) {
                        console.error(`❌ Product ${pid} not found in DB. Skipping.`);
                        addToast(`Erro: Item não encontrado (ID: ${pid})`, "error");
                        return false;
                    }

                    const realPrice = Number(dbProduct.price);
                    if (!realPrice || realPrice <= 0) {
                        console.error(`❌ Invalid Price for ${dbProduct.name}:`, realPrice);
                        return false;
                    }

                    // 2. Calculate Split (Dynamically based on payload)
                    const totalParts = req.itemDetails.totalParts || 2; // Default to 2 if not sent
                    const splitPrice = realPrice / totalParts;
                    const splitName = totalParts > 1 ? `1/${totalParts} ${dbProduct.name}` : dbProduct.name;
                    const debugName = `${splitName} [R$${splitPrice.toFixed(2)}]`; // DEBUG

                    console.log(`🧮 Math: ${realPrice} / ${totalParts} = ${splitPrice}`);

                    // 3. Create Order with FULL METADATA
                    const newOrder = await api.addOrder(req.itemDetails.tableId, {
                        productId: dbProduct.id, // Back to Real ID (Metadata explains price diff)
                        name: splitName,
                        price: splitPrice,
                        quantity: qty,
                        orderedBy: user.id,

                        // Metadata
                        isSplit: true,
                        splitParts: totalParts,
                        originalPrice: realPrice,
                        splitRequester: req.requesterId,
                        splitParticipants: [req.requesterId, req.targetUserId] // Basic 2-way split context
                    });

                    return !!newOrder;
                };

                const itemsToProcess = req.itemDetails.items || [{ productId: req.itemDetails.productId, quantity: req.itemDetails.quantity || 1 }];
                console.log("📦 Items to process:", itemsToProcess);

                if (itemsToProcess.length === 0) {
                    addToast("Nenhum item para dividir.", "error");
                    return;
                }

                let successCount = 0;
                for (const item of itemsToProcess) {
                    // Filter out 'cart-total' nonsense if it crept in, but Menu.jsx should send real IDs now.
                    if (item.productId === 'cart-total') continue;

                    const success = await processSingleItem(item.productId, item.quantity);
                    if (success) successCount++;
                }

                if (successCount > 0) {
                    addToast(`Você aceitou dividir ${successCount} iten(s)!`, 'success');
                    // Send Response
                    await api.sendSplitResponse(
                        req.requesterId,
                        'accepted',
                        user.name || 'Alguém'
                    );
                } else {
                    addToast("Falha ao processar divisão (Erros de validação).", "error");
                }
            }
        } catch (e) {
            console.error("Critical Error processing split:", e);
            addToast("Erro crítico ao processar solicitação.", "error");
        }
    };

    const handleDecline = async () => {
        if (!incomingRequest) return;
        const req = { ...incomingRequest };
        setIncomingRequest(null);

        try {
            if (req.type === 'join_order') {
                console.log("🚫 Sending Reject Response to User:", req.requesterId);
                await api.sendSplitResponse(
                    req.requesterId, // Target the ORIGINAL Requester
                    'rejected',
                    user.name || 'Alguém'
                );
            }
            addToast("Você recusou a divisão.", "info");
        } catch (e) {
            console.error("Error declining request", e);
        }
    };

    return (
        <NotificationContext.Provider value={{}}>
            {children}
            {incomingRequest && (
                <SplitRequestModal
                    request={incomingRequest}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
