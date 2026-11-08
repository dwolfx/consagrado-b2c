import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, api } from '../services/api';
import { useAuth } from './AuthContext';
import { useTableContext } from './TableContext';
import { useToast } from './ToastContext';
import SplitRequestModal from '../components/SplitRequestModal';

const NotificationContext = createContext({});

// --- Helpers de auto-aceite por comanda ---
const autoAcceptKey = (tableId) => `b2c_auto_accept_${tableId}`;

const isAutoAccepted = (tableId, requesterId) => {
    if (!tableId || !requesterId) return false;
    try {
        const list = JSON.parse(localStorage.getItem(autoAcceptKey(tableId)) || '[]');
        return list.includes(requesterId);
    } catch {
        return false;
    }
};

const saveAutoAccept = (tableId, requesterId) => {
    if (!tableId || !requesterId) return;
    try {
        const list = JSON.parse(localStorage.getItem(autoAcceptKey(tableId)) || '[]');
        if (!list.includes(requesterId)) {
            localStorage.setItem(autoAcceptKey(tableId), JSON.stringify([...list, requesterId]));
        }
    } catch {
        /* ignore */
    }
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { tableId } = useTableContext();
    const { addToast } = useToast();
    const [incomingRequest, setIncomingRequest] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);

    // Lógica de aceite extraída para poder ser chamada com ou sem modal
    const processAccept = useCallback(
        async (req) => {
            try {
                if (req.type === 'split_bill') {
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
                    addToast('Você aceitou a divisão do pedido.', 'info');
                } else if (req.type === 'join_order') {
                    const processSingleItem = async (pid, qty, itemObj = null) => {
                        const isVirtualItem = pid && String(pid).startsWith('half-');
                        let realPrice = 0;
                        let dbProduct = null;

                        if (isVirtualItem) {
                            const payloadItem =
                                (req.itemDetails.items || []).find((i) => i.productId === pid) ||
                                req.itemDetails;
                            const metadata = payloadItem.metadata || {};
                            if (metadata.type === 'half_half' && metadata.parts?.length === 2) {
                                const [p1Id, p2Id] = metadata.parts;
                                const [dbP1, dbP2] = await Promise.all([
                                    api.getProduct(p1Id),
                                    api.getProduct(p2Id)
                                ]);
                                if (!dbP1 || !dbP2) {
                                    addToast('Sabores da pizza não encontrados.', 'error');
                                    return false;
                                }
                                realPrice = Math.max(Number(dbP1.price), Number(dbP2.price));
                                dbProduct = {
                                    id: pid,
                                    name: `½ ${dbP1.name} + ½ ${dbP2.name}`,
                                    price: realPrice,
                                    metadata
                                };
                            } else {
                                addToast('Item customizado inválido.', 'error');
                                return false;
                            }
                        } else {
                            if (pid) {
                                try {
                                    dbProduct = await api.getProduct(pid);
                                } catch (e) {
                                    console.warn('Erro ao buscar produto pelo id:', pid, e);
                                }
                            }
                            if (dbProduct) {
                                realPrice = Number(dbProduct.price);
                            } else {
                                const fallbackPrice =
                                    itemObj?.original_price ||
                                    itemObj?.originalPrice ||
                                    itemObj?.price ||
                                    req.itemDetails?.originalPrice ||
                                    req.itemDetails?.price;
                                const fallbackName = itemObj?.name || req.itemDetails?.name;
                                if (fallbackPrice) {
                                    realPrice = Number(fallbackPrice);
                                    dbProduct = {
                                        id: pid || null,
                                        name: fallbackName
                                            ? fallbackName.replace(/^[\d.]+\/[\d.]+\s/, '')
                                            : 'Item',
                                        price: realPrice,
                                        metadata:
                                            itemObj?.metadata || req.itemDetails?.metadata || {}
                                    };
                                } else {
                                    addToast(`Item não encontrado (${pid})`, 'error');
                                    return false;
                                }
                            }
                        }
                        if (!realPrice || realPrice <= 0) return false;

                        const totalParts = req.itemDetails.totalParts || 2;
                        const splitPrice = realPrice / totalParts;

                        const targetTableId =
                            req.itemDetails.tableId || tableId || localStorage.getItem('my_table_id');
                        if (!targetTableId) {
                            console.error('❌ processAccept: tableId ausente no itemDetails', req.itemDetails);
                            addToast('Mesa não identificada na solicitação.', 'error');
                            return false;
                        }

                        // RPC SECURITY DEFINER: bypassa RLS para inserir a parte do amigo
                        const result = await api.addSplitOrder(targetTableId, {
                            productId: dbProduct.id,
                            name: dbProduct.name,
                            price: splitPrice,
                            quantity: qty || 1,
                            orderedBy: user.id,
                            splitParts: totalParts,
                            originalPrice: realPrice,
                            splitRequester: req.requesterId,
                            splitParticipants:
                                req.itemDetails.splitParticipants || [req.requesterId, user.id],
                            metadata: dbProduct.metadata || {},
                            batchId: req.itemDetails?.batchId || null
                        });
                        if (!result) {
                            console.error(
                                '❌ processAccept: addSplitOrder retornou null. tableId:',
                                targetTableId,
                                'userId:',
                                user.id
                            );
                        }
                        return !!result;
                    };

                    const itemsToProcess = req.itemDetails.items || [
                        {
                            productId: req.itemDetails.productId,
                            quantity: req.itemDetails.quantity || 1,
                            name: req.itemDetails.name,
                            price: req.itemDetails.price,
                            originalPrice: req.itemDetails.originalPrice
                        }
                    ];
                    let successCount = 0;
                    for (const item of itemsToProcess) {
                        if (item.productId === 'cart-total') continue;
                        if (await processSingleItem(item.productId, item.quantity, item)) {
                            successCount++;
                        }
                    }

                    if (successCount > 0) {
                        // Ativa o pedido do solicitante (de waiting_split para pending) para agora sim ir para a cozinha
                        if (req.itemDetails?.batchId) {
                            try {
                                await supabase
                                    .from('orders')
                                    .update({ status: 'pending' })
                                    .eq('order_batch_id', req.itemDetails.batchId)
                                    .eq('status', 'waiting_split');
                            } catch (statusErr) {
                                console.warn('Erro ao ativar status do lote para cozinha:', statusErr);
                            }
                        }

                        addToast(`Você aceitou dividir ${successCount} item(ns).`, 'success');
                        await api.sendSplitResponse(req.requesterId, 'accepted', user.name || 'Alguém', {
                            batchId: req.itemDetails?.batchId
                        });

                        // Remove da lista de pendentes
                        setPendingRequests((prev) =>
                            prev.filter(
                                (r) =>
                                    r.id !== req.id &&
                                    r.itemDetails?.batchId !== req.itemDetails?.batchId
                            )
                        );
                    } else {
                        addToast('Falha ao registrar divisão do pedido.', 'error');
                    }
                }
            } catch (e) {
                console.error('Erro ao processar aceite:', e);
                addToast('Erro ao processar solicitação.', 'error');
            }
        },
        [user, tableId, addToast]
    );

    // Registra uma solicitação recebida
    const registerIncomingShare = useCallback(
        async (payload) => {
            const { itemDetails, targetUserId, requesterName, requesterId } = payload;
            const myId = String(user?.id || '').toLowerCase();
            const targetId = String(targetUserId || '').toLowerCase();

            if (targetId && myId && targetId !== myId) return;

            const req = {
                id: Date.now(),
                type: 'join_order',
                itemDetails,
                itemName: itemDetails?.name || 'Pedido compartilhado',
                requesterName,
                requesterId
            };

            // Se usuário tem auto-aceite configurado para essa mesa
            if (isAutoAccepted(itemDetails?.tableId, requesterId)) {
                addToast(`Pedido de ${requesterName?.split(' ')[0]} aceito automaticamente.`, 'info');
                await processAccept(req);
                return;
            }

            setIncomingRequest(req);
            setPendingRequests((prev) => {
                const batchId = itemDetails?.batchId;
                const exists = prev.some(
                    (r) => batchId && r.itemDetails?.batchId === batchId
                );
                if (exists) return prev;
                return [req, ...prev];
            });
        },
        [user?.id, processAccept, addToast]
    );

    // 1. User Channel (Direto para o usuário)
    useEffect(() => {
        if (!user?.id) return;

        const userChannel = supabase
            .channel(`user_notifications:${user.id}`)
            .on('broadcast', { event: 'request_split' }, (payload) => {
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
            .on('broadcast', { event: 'split_removed' }, (payload) => {
                const { itemName, requesterName } = payload.payload;
                addToast(`${requesterName || 'Alguém'} removeu você da divisão de ${itemName || 'pedido'}.`, 'info');
                window.dispatchEvent(new CustomEvent('tab:reload'));
            })
            .on('broadcast', { event: 'split_response' }, (payload) => {
                const { status, responderName } = payload.payload;
                if (status === 'accepted') {
                    addToast(`${responderName} aceitou a divisão! O pedido foi para a cozinha.`, 'success');
                    window.dispatchEvent(new CustomEvent('tab:reload'));
                } else {
                    addToast(`${responderName} recusou a divisão.`, 'warning');
                }
            })
            .on('broadcast', { event: 'request_order_share' }, (payload) => {
                registerIncomingShare(payload.payload);
            })
            .on('broadcast', { event: 'split_removed' }, (payload) => {
                const { removedUserId, itemName, requesterName } = payload.payload || {};
                const myId = String(user?.id || '').toLowerCase();
                if (String(removedUserId).toLowerCase() === myId) {
                    addToast(`${requesterName || 'Alguém'} removeu você da divisão de ${itemName || 'pedido'}.`, 'info');
                    window.dispatchEvent(new CustomEvent('tab:reload'));
                }
            })
            .subscribe();

        // Orders Status Channel (User specific)
        const orderChannel = supabase
            .channel(`orders_status:${user.id}`)
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
                    if (newStatus !== oldStatus) {
                        if (newStatus === 'preparing') addToast(`Preparando: ${itemName}`, 'info');
                        else if (newStatus === 'ready') addToast(`Pronto: ${itemName}`, 'success');
                        else if (newStatus === 'delivered') addToast(`Entregue: ${itemName}`, 'success');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(userChannel);
            supabase.removeChannel(orderChannel);
        };
    }, [user?.id, registerIncomingShare, addToast]);

    // 2. Table Channel (Fallback redundante para todos na mesa)
    useEffect(() => {
        if (!tableId) return;

        const tableChannel = supabase
            .channel(`table_notifications:${tableId}`)
            .on('broadcast', { event: 'request_split' }, (payload) => {
                const { targetIds, orderId, itemName, requesterName, requesterId } = payload.payload;
                const myId = String(user?.id || '').toLowerCase();
                const hasMe = (targetIds || []).some(
                    (id) => String(id).toLowerCase() === myId
                );
                if (hasMe) {
                    setIncomingRequest((prev) => {
                        if (prev && prev.orderId === orderId) return prev;
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
            .on('broadcast', { event: 'request_order_share' }, (payload) => {
                registerIncomingShare(payload.payload);
            })
            .on('broadcast', { event: 'split_removed' }, (payload) => {
                const { removedUserId, itemName, requesterName } = payload.payload || {};
                const myId = String(user?.id || '').toLowerCase();
                if (String(removedUserId).toLowerCase() === myId) {
                    addToast(`${requesterName || 'Alguém'} removeu você da divisão de ${itemName || 'pedido'}.`, 'info');
                    window.dispatchEvent(new CustomEvent('tab:reload'));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(tableChannel);
        };
    }, [tableId, user?.id, registerIncomingShare]);

    const handleAccept = async () => {
        if (!incomingRequest) return;
        const req = { ...incomingRequest };
        setIncomingRequest(null);
        await processAccept(req);
    };

    const handleAcceptAll = async () => {
        if (!incomingRequest) return;
        const req = { ...incomingRequest };
        const tid = req.itemDetails?.tableId || tableId;
        saveAutoAccept(tid, req.requesterId);
        setIncomingRequest(null);
        const firstName = (req.requesterName || 'Alguém').split(' ')[0];
        addToast(`Pedidos de ${firstName} serão aceitos automaticamente nesta comanda.`, 'success');
        await processAccept(req);
    };

    const handleDecline = async () => {
        if (!incomingRequest) return;
        const req = { ...incomingRequest };
        setIncomingRequest(null);
        setPendingRequests((prev) =>
            prev.filter(
                (r) =>
                    r.id !== req.id &&
                    r.itemDetails?.batchId !== req.itemDetails?.batchId
            )
        );

        try {
            if (req.type === 'join_order') {
                console.log('🚫 Sending Reject Response to User:', req.requesterId);
                await api.sendSplitResponse(
                    req.requesterId,
                    'rejected',
                    user.name || 'Alguém',
                    { batchId: req.itemDetails?.batchId }
                );
            }
            addToast('Você recusou a divisão.', 'info');
        } catch (e) {
            console.error('Error declining request', e);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                pendingRequests,
                incomingRequest,
                setIncomingRequest,
                handleAccept,
                handleAcceptAll,
                handleDecline
            }}
        >
            {children}
            {incomingRequest && (
                <SplitRequestModal
                    request={incomingRequest}
                    onAccept={handleAccept}
                    onAcceptAll={handleAcceptAll}
                    onDecline={handleDecline}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
