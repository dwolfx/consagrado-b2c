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
    // This handles the RLS limitation where the Requester cannot delete my row directly.
    useEffect(() => {
        if (!user || user.id === 'guest' || !visibleOrders) return;

        const cleanupZombies = async () => {
            const mySplitParts = visibleOrders.filter(o =>
                o.ordered_by === user.id &&
                o.is_split &&
                o.split_parts > 1
            );

            for (const myPart of mySplitParts) {
                // If I am the requester, I am the master (skip)
                if (myPart.split_requester === user.id) continue;

                // 1. Try to find Master in visible list
                let master = visibleOrders.find(o =>
                    o.split_requester === myPart.split_requester &&
                    o.ordered_by === myPart.split_requester &&
                    o.product_id === myPart.product_id &&
                    o.table_id === myPart.table_id
                );

                // 2. Fallback: Check DB if not found locally (RLS might hide it from list)
                if (!master) {
                    // We search for the order owned by the requester matching this item
                    const { data, error } = await supabase
                        .from('orders')
                        .select('split_participants, id')
                        .eq('table_id', myPart.table_id)
                        .eq('product_id', myPart.product_id)
                        .eq('ordered_by', myPart.split_requester)
                        .maybeSingle();

                    if (error || !data) {
                        // If we can't find the master order in DB, it's either deleted or we lost access.
                        // In either case, we are an orphan/zombie.
                        console.log(`🧟 Zombie Cleanup: Master Order unreachable/deleted. Deleting orphan ${myPart.id}`);
                        await api.deleteOrder(myPart.id);
                        addToast("Você foi removido da divisão (Mestre não encontrado).", "info");
                        continue;
                    }
                    master = data;
                }

                // 3. Verify Membership
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

        const timeoutId = setTimeout(cleanupZombies, 2000); // 2s delay for propagation
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
            // EDIT MODE: Find all parts of this split to redistribute
            // Matching criteria: Same Table, Product, Requester
            // REMOVED timeDiff check because original orders can be much older than split parts

            const siblings = visibleOrders.filter(o =>
                o.is_split &&
                o.table_id === item.table_id &&
                o.product_id === item.product_id &&
                (o.split_requester === item.split_requester || o.split_requester === item.ordered_by)
            );

            // Source of Truth Hierarchy:
            // Combine both to be safe: DB Metadata + Actual Siblings found locally

            const dbParticipants = item.split_participants || [];
            const localParticipants = [...new Set(siblings.map(s => s.ordered_by))];

            // Unique Set of all valid participants
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
        // Clean start for new split
        setSelectedUsersToSplit([]);
        setIsEditingSplit(false);
        setRelatedSplitOrders([]);
    };

    const handleModalConfirm = async (itemFromModal, finalSelectedUsers) => {
        if (!itemFromModal || finalSelectedUsers.length === 0) return;

        if (isEditingSplit) {
            await api.redistributeOrder(relatedSplitOrders, finalSelectedUsers);
            addToast("Divisão atualizada!", "success");
        } else {
            await api.requestSplit(itemFromModal, finalSelectedUsers, user.name || 'Alguém', user.id);
            addToast("Solicitação enviada!", "success");
        }

        setSplitItem(null);
        setIsEditingSplit(false);
        setRelatedSplitOrders([]);
    };

    const closeSplitModal = () => {
        setSplitItem(null);
        setIsEditingSplit(false);
    }

    return {
        splitItem,
        selectedUsersToSplit,
        isEditingSplit,
        handleItemClick,
        handleModalConfirm,
        closeSplitModal
    };
};
