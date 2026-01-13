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

        const isSplit = /^\d+\/\d+\s/.test(item.name);

        if (isSplit) {
            const siblings = visibleOrders.filter(o =>
                o.product_id === item.product_id &&
                o.name === item.name &&
                Math.abs(o.price - item.price) < 0.01
            );

            // FIX: Only treat as "Existing Split" (Edit Mode) if strictly > 1 person is involved.
            // If it's just me with a "1/2 Pizza", I want to split it NEW with someone (trigger popup).
            const distinctOwners = new Set(siblings.map(s => s.ordered_by));

            if (siblings.length > 0 && distinctOwners.size > 1) {
                const siblingUserIds = siblings.map(s => s.ordered_by);
                setSelectedUsersToSplit(siblingUserIds);
                setRelatedSplitOrders(siblings);
                setIsEditingSplit(true);
                setSplitItem(item);
                return;
            }
        }

        console.log("✨ Opening NEW split modal for:", item);
        setSplitItem(item);
        setSelectedUsersToSplit([user?.id]);
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
