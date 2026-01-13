import { useState } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const useSplitLogic = (visibleOrders = []) => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [splitItem, setSplitItem] = useState(null);
    const [selectedUsersToSplit, setSelectedUsersToSplit] = useState([]);
    const [isEditingSplit, setIsEditingSplit] = useState(false);
    const [relatedSplitOrders, setRelatedSplitOrders] = useState([]);

    const handleItemClick = (item) => {
        console.log("🖱️ Item Clicked:", item);

        if (item.status === 'paid') {
            console.warn("🚫 Item is paid, blocking split.");
            return;
        }

        const isSplit = item.is_split && item.split_parts > 1;

        if (isSplit) {
            // EDIT MODE: Find all parts of this split to redistribute
            // Matching criteria: Same Table, Product, Requester, and roughly same time (5s tolerance)
            const itemTime = new Date(item.created_at).getTime();

            const siblings = visibleOrders.filter(o => {
                const oTime = new Date(o.created_at).getTime();
                const timeDiff = Math.abs(oTime - itemTime);

                return (
                    o.is_split &&
                    o.table_id === item.table_id &&
                    o.product_id === item.product_id &&
                    (o.split_requester === item.split_requester || o.split_requester === item.ordered_by) &&
                    timeDiff < 5000 // 5 seconds tolerance for "same batch"
                );
            });

            const currentParticipants = [...new Set(siblings.map(s => s.ordered_by))];

            if (currentParticipants.length > 0) {
                // Exclude myself from "Selected" in UI?
                // No, for "Edit", checked means "In the group".
                // SplitItemModal usually assumes "Selected = Target Users (excluding me)".
                // Wait, SplitItemModal adds currentUser automatically to the group?
                // Let's check SplitItemModal logic.
                // It usually renders "Yourself" as fixed, and checkboxes for others.
                // So "selectedUsersToSplit" should contain OTHER IDs.

                const otherParticipants = currentParticipants.filter(id => id !== user.id);

                console.log("✏️ Editing Split. Siblings:", siblings.length, "Participants:", currentParticipants);

                setSelectedUsersToSplit(otherParticipants);
                setRelatedSplitOrders(siblings);
                setIsEditingSplit(true);
                setSplitItem(item); // Pass the clicked item as "reference"
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
