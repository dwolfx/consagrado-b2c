import { useState, useEffect } from 'react';
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

    // 🧟 Zombie Cleanup: If I am removed from a split group, delete my orphan row
    useEffect(() => {
        if (!user || user.id === 'guest' || !visibleOrders) return;

        const cleanupZombies = async () => {
            const mySplitParts = visibleOrders.filter(o =>
                o.ordered_by === user.id &&
                o.is_split &&
                o.split_parts > 1
            );

            for (const myPart of mySplitParts) {
                if (myPart.split_requester === user.id) continue;

                let master = visibleOrders.find(o =>
                    o.split_requester === myPart.split_requester &&
                    o.ordered_by === myPart.split_requester &&
                    o.product_id === myPart.product_id &&
                    o.table_id === myPart.table_id
                );

                if (!master) {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('split_participants, id')
                        .eq('table_id', myPart.table_id)
                        .eq('product_id', myPart.product_id)
                        .eq('ordered_by', myPart.split_requester)
                        .maybeSingle();

                    if (error || !data) {
                        console.log(`🧟 Zombie Cleanup: Master Order unreachable/deleted. Deleting orphan ${myPart.id}`);
                        await api.deleteOrder(myPart.id);
                        addToast("Você foi removido da divisão (Mestre não encontrado).", "info");
                        continue;
                    }
                    master = data;
                }

                if (master && master.split_participants) {
                    const masterParticipants = master.split_participants.map(id => String(id).toLowerCase());
                    const myId = String(user.id).toLowerCase();
                    const amIStillIn = masterParticipants.includes(myId);

                    if (!amIStillIn) {
                        console.log("🧟 Zombie Cleanup: I am no longer in the list. Deleting:", myPart.id);
                        await api.deleteOrder(myPart.id);
                        addToast("Você foi removido da divisão.", "info");
                    }
                }
            }
        };

        const timeoutId = setTimeout(cleanupZombies, 2000);
        return () => clearTimeout(timeoutId);

    }, [visibleOrders, user, addToast]);

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
                o.product_id === item.product_id &&
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
                setSplitItem(item);
                return;
            }
        }

        console.log("✨ Opening NEW split modal for:", item);
        setSplitItem(item);
        setSelectedUsersToSplit([user?.id].filter(Boolean));
        setIsEditingSplit(false);
        setRelatedSplitOrders([]);
    };

    const handleModalConfirm = async (itemFromModal, finalSelectedUsers) => {
        if (!itemFromModal || !finalSelectedUsers || finalSelectedUsers.length === 0) return;

        try {
            if (isEditingSplit) {
                const ok = await api.redistributeOrder(relatedSplitOrders, finalSelectedUsers);
                if (ok !== false) {
                    addToast("Divisão atualizada com sucesso!", "success");
                } else {
                    addToast("Erro ao atualizar divisão.", "error");
                }
            } else {
                if (finalSelectedUsers.length <= 1) {
                    addToast("Selecione mais pessoas na mesa para dividir.", "info");
                    return;
                }

                // Divide o pedido diretamente na comanda / banco
                const success = await api.splitOrder(itemFromModal, finalSelectedUsers);
                if (success) {
                    addToast("Pedido dividido com sucesso!", "success");
                } else {
                    // Fallback para envio de solicitação via broadcast
                    await api.requestSplit(itemFromModal, finalSelectedUsers, user?.name || 'Alguém', user?.id);
                    addToast("Solicitação enviada para a mesa!", "info");
                }
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
