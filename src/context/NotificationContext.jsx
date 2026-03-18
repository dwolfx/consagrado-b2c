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

    // 1. User Channel (Global - independent of Table)
    useEffect(() => {
        if (!user) return;

        console.log("🔌 [NotificationContext] Connecting User Channel:", user.id);

        const userChannel = supabase.channel(`user_notifications:${user.id}`)
            .on('broadcast', { event: 'request_split' }, (payload) => {
                console.log("🔥 NotificationContext received SPLIT request:", payload);
                const { orderId, itemName, targetIds, requesterName, requesterId } = payload.payload;

                setIncomingRequest({
                    id: Date.now(),
                    type: 'split_bill',
                    orderId,
                    itemName,
                    requesterName,
                    requesterId,
                    targetIds
                });
            })
            .on('broadcast', { event: 'split_response' }, async (payload) => {
                const { status, responderName, splitMetadata } = payload.payload;

                // I am the REQUESTER (User A). The Responder (User B) just said YES/NO.
                if (status === 'accepted') {
                    addToast(`${responderName} aceitou dividir! Processando...`, 'info');

                    if (splitMetadata) {
                        const { orderId, targetIds } = splitMetadata;
                        const fullOrder = await api.getOrder(orderId);
                        if (fullOrder && fullOrder.ordered_by === user.id) {
                            const success = await api.splitOrder(fullOrder, targetIds);
                            if (success) {
                                addToast("Divisão concluída com sucesso!", "success");
                            } else {
                                addToast("Erro ao processar divisão.", "error");
                            }
                        }
                    }
                } else {
                    addToast(`${responderName} recusou a divisão.`, 'warning');
                }
            })
            .on('broadcast', { event: 'request_order_share' }, (payload) => {
                const { itemDetails, targetUserId, requesterName, requesterId } = payload.payload;
                if (targetUserId === user.id) {
                    setIncomingRequest({
                        id: Date.now(),
                        type: 'join_order',
                        itemDetails,
                        itemName: itemDetails.name,
                        requesterName,
                        requesterId
                    });
                }
            })
            .subscribe();

        // Orders Status Channel (User specific)
        const orderChannel = supabase.channel(`orders_status:${user.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `ordered_by=eq.${user.id}` }, (payload) => {
                const newStatus = payload.new.status;
                const oldStatus = payload.old.status;
                const itemName = payload.new.name;
                if (newStatus !== oldStatus) {
                    if (newStatus === 'preparing') addToast(`👨‍🍳 Preparando: ${itemName}`, 'info');
                    else if (newStatus === 'ready') addToast(`✅ Pronto: ${itemName}`, 'success');
                    else if (newStatus === 'delivered') addToast(`🚀 Entregue: ${itemName}`, 'success');
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(userChannel);
            supabase.removeChannel(orderChannel);
        };
    }, [user, addToast]);

    // 2. Table Channel (Requires Table ID)
    useEffect(() => {
        if (!tableId) return;

        const tableChannel = supabase.channel(`table_notifications:${tableId}`)
            .on('broadcast', { event: 'request_split' }, (payload) => {
                // Legacy Table Broadcast listener (Backup)
                const { targetIds, orderId, itemName, requesterName, requesterId } = payload.payload;
                if (targetIds && targetIds.includes(user?.id)) {
                    setIncomingRequest(prev => {
                        if (prev && prev.orderId === orderId) return prev; // Dedup
                        return {
                            id: Date.now(),
                            type: 'split_bill',
                            orderId,
                            itemName,
                            requesterName,
                            requesterId,
                            targetIds
                        };
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(tableChannel);
        };
    }, [tableId, user]);

    const handleAccept = async () => {
        console.log("🟢 handleAccept CLICKED", { incomingRequest, tableId });
        if (!incomingRequest) return;

        // Capture data before closing modal
        const req = { ...incomingRequest };

        // Optimistic UI: Close modal immediately
        setIncomingRequest(null);

        try {
            if (req.type === 'split_bill') {
                // NEW FLOW: Send 'accepted' response to Requester. 
                // Requester (Owner) performs the split.

                const allParticipants = [req.requesterId, ...req.targetIds];
                const uniqueParticipants = [...new Set(allParticipants)];

                await api.sendSplitResponse(
                    req.requesterId,
                    'accepted',
                    user.name || 'Alguém',
                    {
                        orderId: req.orderId,
                        targetIds: uniqueParticipants
                    }
                );
                addToast("Você aceitou! A divisão será processada.", "info");
            } else if (req.type === 'join_order') {
                console.log("🚀 Processing Join Order. Requester:", req.requesterId, "[v3-SECURE-LOOP]");

                // Helper to process a single item share
                const processSingleItem = async (pid, qty) => {
                    console.log(`🔒 Validating Item ID: ${pid} (Qty: ${qty})`);

                    // 1. Fetch Authoritative Price (Security)
                    // If it's a "virtual" half-item (half-...), we cannot fetch from DB. 
                    // We must trust the payload for these composite items.
                    const isVirtualItem = String(pid).startsWith('half-');
                    let realPrice = 0;
                    let dbProduct = null;

                    if (isVirtualItem) {
                        console.log(`ℹ️ Virtual Item detected (${pid}). Validating parts in DB...`);
                        const payloadItem = (req.itemDetails.items || []).find(i => i.productId === pid) || req.itemDetails;
                        const metadata = payloadItem.metadata || {};

                        if (metadata.type === 'half_half' && metadata.parts && metadata.parts.length === 2) {
                            const [part1Id, part2Id] = metadata.parts;
                            const dbPart1 = await api.getProduct(part1Id);
                            const dbPart2 = await api.getProduct(part2Id);

                            if (!dbPart1 || !dbPart2) {
                                console.error(`❌ Pizza parts not found in DB`);
                                addToast(`Erro: Sabores da pizza original não encontrados no sistema.`, "error");
                                return false;
                            }
                            
                            const price1 = Number(dbPart1.price);
                            const price2 = Number(dbPart2.price);
                            realPrice = Math.max(price1, price2);

                            dbProduct = {
                                id: pid,
                                name: `½ ${dbPart1.name} + ½ ${dbPart2.name}`,
                                price: realPrice,
                                metadata: metadata
                            };
                            console.log(`✅ Secure Virtual Item Validation. Calculated Max Price: ${realPrice}`);
                        } else {
                            console.error(`❌ Unrecognized or insecure virtual item format`, metadata);
                            addToast(`Erro: Item customizado inválido ou adulterado.`, "error");
                            return false;
                        }
                    } else {
                        // Standard Security Check for Real Products
                        dbProduct = await api.getProduct(pid);

                        if (!dbProduct) {
                            console.error(`❌ Product ${pid} not found in DB. Skipping.`);
                            addToast(`Erro: Item não encontrado (ID: ${pid})`, "error");
                            return false;
                        }
                        realPrice = Number(dbProduct.price);
                    }

                    if (!realPrice || realPrice <= 0) {
                        console.error(`❌ Invalid Price for ${dbProduct?.name}:`, realPrice);
                        return false;
                    }

                    // 2. Calculate Split (Dynamically based on payload)
                    const totalParts = req.itemDetails.totalParts || 2; // Default to 2 if not sent
                    const splitPrice = realPrice / totalParts;
                    const splitName = totalParts > 1 ? `1/${totalParts} ${dbProduct.name}` : dbProduct.name;

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
                        splitParticipants: [req.requesterId, req.targetUserId], // Basic 2-way split context
                        metadata: dbProduct.metadata || {}
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
