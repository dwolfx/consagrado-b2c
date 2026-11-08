import { useState, useEffect, useRef } from 'react';
import { api, supabase } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const useSplitLogic = (visibleOrders = []) => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [splitItem, setSplitItem] = useState(null);
    const [selectedUsersToSplit, setSelectedUsersToSplit] = useState([]);
    const [isEditingSplit, setIsEditingSplit] = useState(false);
    const [relatedSplitOrders, setRelatedSplitOrders] = useState([]);

    // Limpeza pontual de itens órfãos (sem loop infinito)
    const notifiedOrphansRef = useRef(new Set());

    useEffect(() => {
        if (!user || user.id === 'guest' || !visibleOrders) return;

        const checkOrphans = async () => {
            const mySplitParts = visibleOrders.filter(o =>
                o.ordered_by === user.id &&
                o.is_split &&
                o.split_parts > 1 &&
                o.split_requester &&
                o.split_requester !== user.id
            );

            for (const myPart of mySplitParts) {
                if (notifiedOrphansRef.current.has(myPart.id)) continue;

                const master = visibleOrders.find(o =>
                    o.id !== myPart.id &&
                    o.ordered_by === myPart.split_requester &&
                    (myPart.order_batch_id ? o.order_batch_id === myPart.order_batch_id : o.product_id === myPart.product_id)
                );

                const isOrphan = !master || (Array.isArray(master.split_participants) && !master.split_participants.some(p => String(p).toLowerCase() === String(user.id).toLowerCase()));

                if (isOrphan) {
                    notifiedOrphansRef.current.add(myPart.id);
                    console.log("Removendo pedido dividido órfão:", myPart.id);
                    await api.deleteOrder(myPart.id);
                }
            }
        };

        checkOrphans();
    }, [visibleOrders, user]);

    const handleItemClick = (item) => {
        console.log("🖱️ Item Clicked:", item);

        if (item.status === 'paid') {
            console.warn("🚫 Item is paid, blocking split.");
            return;
        }

        const isSplit = item.is_split && item.split_parts > 1;

        if (isSplit) {
            const siblings = visibleOrders.filter(o =>
                o.is_split &&
                o.table_id === item.table_id &&
                (item.order_batch_id ? o.order_batch_id === item.order_batch_id : o.product_id === item.product_id) &&
                (o.split_requester === item.split_requester || o.split_requester === item.ordered_by)
            );

            const dbParticipants = item.split_participants || [];
            const localParticipants = [...new Set(siblings.map(s => s.ordered_by))];
            const allParticipants = [...new Set([...dbParticipants, ...localParticipants])].filter(Boolean);

            if (allParticipants.length > 0) {
                console.log("✏️ Editing Split. Combined Participants:", allParticipants);
                setSelectedUsersToSplit(allParticipants);
                setRelatedSplitOrders(siblings);
                setIsEditingSplit(true);
                setSplitItem({
                    ...item,
                    _groupItems: item._groupItems || siblings
                });
                return;
            }
        }

        console.log("✨ Opening NEW split modal for:", item);
        setSplitItem(item);
        setSelectedUsersToSplit([user?.id].filter(Boolean));
        setIsEditingSplit(false);
        setRelatedSplitOrders(item._groupItems || []);
    };

    const handleModalConfirm = async (itemFromModal, finalSelectedUsers) => {
        if (!itemFromModal || !finalSelectedUsers || finalSelectedUsers.length === 0) return;

        try {
            const itemsToSplit = (Array.isArray(itemFromModal._groupItems) && itemFromModal._groupItems.length > 0)
                ? itemFromModal._groupItems
                : [itemFromModal];

            const batchId = itemFromModal.order_batch_id || (itemsToSplit.length > 1 ? crypto.randomUUID() : null);

            if (isEditingSplit) {
                const totalParts = finalSelectedUsers.length;
                const previousParticipants = (itemFromModal.split_participants || []).map(id => String(id).toLowerCase());
                const currentParticipants = finalSelectedUsers.map(id => String(id).toLowerCase());

                const newUsers = finalSelectedUsers.filter(uid =>
                    String(uid).toLowerCase() !== String(user.id).toLowerCase() &&
                    !previousParticipants.includes(String(uid).toLowerCase())
                );

                const removedUsers = previousParticipants.filter(uid =>
                    uid !== String(user.id).toLowerCase() &&
                    !currentParticipants.includes(uid)
                );

                // 1. Deleta do banco os pedidos associados aos participantes removidos
                for (const removedId of removedUsers) {
                    try {
                        if (itemFromModal.order_batch_id) {
                            await supabase
                                .from('orders')
                                .delete()
                                .eq('table_id', itemFromModal.table_id)
                                .eq('order_batch_id', itemFromModal.order_batch_id)
                                .ilike('ordered_by', removedId);
                        }

                        for (const it of itemsToSplit) {
                            const { data: rowsToDelete } = await supabase
                                .from('orders')
                                .select('id')
                                .eq('table_id', it.table_id)
                                .eq('product_id', it.product_id)
                                .ilike('ordered_by', removedId);

                            if (rowsToDelete && rowsToDelete.length > 0) {
                                for (const r of rowsToDelete) {
                                    await api.deleteOrder(r.id);
                                }
                            }
                        }

                        // Notifica o participante removido
                        await api.notifySplitRemoval(removedId, {
                            itemName: itemsToSplit.length > 1 ? `${itemsToSplit.length} itens do pedido` : itemFromModal.name,
                            requesterName: user?.name || 'Alguém',
                            tableId: itemFromModal.table_id,
                            batchId: itemFromModal.order_batch_id
                        });
                    } catch (remErr) {
                        console.warn('Erro ao remover pedido de participante:', removedId, remErr);
                    }
                }

                // 2. Cálculo das novas frações e absorção de partes pelo solicitante
                const totalOriginalParts = itemFromModal.split_parts || previousParticipants.length || 2;
                const removedCount = removedUsers.length;

                if (totalParts <= 1) {
                    // Todos os outros foram removidos: o pedido volta a ser 100% individual para o solicitante
                    for (const it of itemsToSplit) {
                        const basePrice = it.original_price ? Number(it.original_price) : Number(it.price);
                        const cleanName = it.name.replace(/^[\d.]+\/[\d.]+\s/, '');
                        await supabase
                            .from('orders')
                            .update({
                                name: cleanName,
                                price: basePrice,
                                is_split: false,
                                split_parts: 1,
                                original_price: null,
                                split_requester: null,
                                split_participants: null,
                                metadata: {
                                    ...(it.metadata || {}),
                                    my_parts: 1,
                                    total_parts: 1,
                                    split_pending: null
                                }
                            })
                            .eq('id', it.id);
                    }

                    addToast("Divisão desfeita. O pedido voltou integralmente para a sua comanda.", "info");
                } else {
                    // Se alguém foi removido, o solicitante absorve as partes restantes
                    const myParts = 1 + removedCount;
                    const splitParts = totalOriginalParts;

                    for (const it of itemsToSplit) {
                        const basePrice = it.original_price ? Number(it.original_price) : Number(it.price);
                        const cleanName = it.name.replace(/^[\d.]+\/[\d.]+\s/, '');
                        const newPrice = (basePrice / splitParts) * myParts;

                        await supabase
                            .from('orders')
                            .update({
                                name: `${myParts}/${splitParts} ${cleanName}`,
                                price: newPrice,
                                is_split: true,
                                split_parts: splitParts,
                                original_price: basePrice,
                                split_requester: user.id,
                                split_participants: finalSelectedUsers,
                                metadata: {
                                    ...(it.metadata || {}),
                                    my_parts: myParts,
                                    total_parts: splitParts
                                }
                            })
                            .eq('id', it.id);
                    }

                    addToast(`Participante removido. Sua comanda ficou com ${myParts}/${splitParts} do pedido.`, "info");
                }

                    // Envia convite para novos participantes
                    for (const targetUserId of newUsers) {
                        if (itemsToSplit.length === 1) {
                            const single = itemsToSplit[0];
                            const basePrice = single.original_price ? Number(single.original_price) : Number(single.price);
                            const cleanName = single.name.replace(/^[\d.]+\/[\d.]+\s/, '');
                            await api.requestOrderShare({
                                name: cleanName,
                                price: basePrice,
                                originalPrice: basePrice,
                                quantity: single.quantity || 1,
                                productId: single.product_id,
                                totalParts: totalParts,
                                tableId: single.table_id,
                                requesterId: user.id,
                                splitParticipants: finalSelectedUsers,
                                masterOrderId: single.id,
                                batchId: itemFromModal.order_batch_id || null
                            }, targetUserId, user?.name || 'Alguém', user.id);
                        } else {
                            const groupTotal = itemsToSplit.reduce((acc, it) => {
                                const bp = it.original_price ? Number(it.original_price) : Number(it.price);
                                return acc + bp * (it.quantity || 1);
                            }, 0);
                            await api.requestOrderShare({
                                name: `${itemsToSplit.length} itens do pedido`,
                                price: groupTotal,
                                originalPrice: groupTotal,
                                quantity: 1,
                                items: itemsToSplit.map(it => ({
                                    productId: it.product_id,
                                    name: it.name.replace(/^[\d.]+\/[\d.]+\s/, ''),
                                    price: it.original_price ? Number(it.original_price) : Number(it.price),
                                    original_price: it.original_price ? Number(it.original_price) : Number(it.price),
                                    quantity: it.quantity || 1
                                })),
                                totalParts: totalParts,
                                tableId: itemFromModal.table_id,
                                requesterId: user.id,
                                splitParticipants: finalSelectedUsers,
                                batchId: itemFromModal.order_batch_id || null
                            }, targetUserId, user?.name || 'Alguém', user.id);
                        }
                    }

                    addToast("Divisão atualizada com sucesso!", "success");
            } else {
                if (finalSelectedUsers.length <= 1) {
                    addToast("Selecione mais pessoas na mesa para dividir.", "info");
                    return;
                }

                const others = finalSelectedUsers.filter(uid => String(uid).toLowerCase() !== String(user.id).toLowerCase());
                const totalParts = finalSelectedUsers.length;

                const pendingSplitData = {
                    targetUserIds: others,
                    totalParts: totalParts,
                    requesterId: user.id,
                    requesterName: user?.name || 'Alguém',
                    batchId: batchId,
                    createdAt: Date.now()
                };

                // 1. Marca pedido do solicitante como "aguardando aceitação" na comanda
                // Não divide o valor e nem marca como split definitivo até o parceiro aceitar
                for (const it of itemsToSplit) {
                    const basePrice = it.original_price ? Number(it.original_price) : Number(it.price);

                    const { error: updateErr } = await supabase
                        .from('orders')
                        .update({
                            original_price: basePrice,
                            order_batch_id: it.order_batch_id || batchId,
                            metadata: {
                                ...(it.metadata || {}),
                                split_pending: pendingSplitData
                            }
                        })
                        .eq('id', it.id);

                    if (updateErr) {
                        console.error("❌ Erro ao registrar split pendente:", updateErr);
                    }
                }

                // 2. Envia solicitação formal para todos os outros participantes (User B, etc.)
                for (const targetUserId of others) {
                    if (itemsToSplit.length === 1) {
                        const single = itemsToSplit[0];
                        const basePrice = single.original_price ? Number(single.original_price) : Number(single.price);
                        const cleanName = single.name.replace(/^[\d.]+\/[\d.]+\s/, '');

                        await api.requestOrderShare({
                            name: cleanName,
                            price: basePrice,
                            originalPrice: basePrice,
                            quantity: single.quantity || 1,
                            productId: single.product_id,
                            totalParts: totalParts,
                            tableId: single.table_id,
                            requesterId: user.id,
                            splitParticipants: finalSelectedUsers,
                            masterOrderId: single.id,
                            batchId: batchId
                        }, targetUserId, user?.name || 'Alguém', user.id);
                    } else {
                        const groupTotal = itemsToSplit.reduce((acc, it) => {
                            const bp = it.original_price ? Number(it.original_price) : Number(it.price);
                            return acc + bp * (it.quantity || 1);
                        }, 0);

                        await api.requestOrderShare({
                            name: `${itemsToSplit.length} itens do pedido`,
                            price: groupTotal,
                            originalPrice: groupTotal,
                            quantity: 1,
                            items: itemsToSplit.map(it => ({
                                productId: it.product_id,
                                name: it.name.replace(/^[\d.]+\/[\d.]+\s/, ''),
                                price: it.original_price ? Number(it.original_price) : Number(it.price),
                                original_price: it.original_price ? Number(it.original_price) : Number(it.price),
                                quantity: it.quantity || 1
                            })),
                            totalParts: totalParts,
                            tableId: itemFromModal.table_id,
                            requesterId: user.id,
                            splitParticipants: finalSelectedUsers,
                            batchId: batchId
                        }, targetUserId, user?.name || 'Alguém', user.id);
                    }
                }

                addToast("Solicitação de divisão enviada! Aguardando aprovação... ⏳", "info");
            }
        } catch (err) {
            console.error("Erro na divisão do pedido:", err);
            addToast("Ocorreu um erro ao processar a divisão.", "error");
        } finally {
            setSplitItem(null);
            setIsEditingSplit(false);
            setRelatedSplitOrders([]);
        }
    };

    const closeSplitModal = () => {
        setSplitItem(null);
        setIsEditingSplit(false);
        setRelatedSplitOrders([]);
    };

    return {
        splitItem,
        selectedUsersToSplit,
        isEditingSplit,
        handleItemClick,
        handleModalConfirm,
        closeSplitModal
    };
};
