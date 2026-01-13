import { supabase } from '../../supabase';
import { getOrJoinTableChannel, getOrJoinUserChannel, sendBroadcast, _channelCache } from './channel';

export const splitApi = {
    requestSplit: async (orderItem, targetUserIds, requesterName, requesterId) => {
        const tableId = orderItem.table_id;
        const channelKey = `table_notifications:${tableId}`;

        console.log(`📡 [DEBUG] requestSplit (Table Broadcast) called. Table: ${tableId}`);

        const performSend = async (retryCount = 0) => {
            const channel = getOrJoinTableChannel(tableId);

            const result = await sendBroadcast(channel, 'request_split', {
                orderId: orderItem.id,
                itemName: orderItem.name,
                targetIds: targetUserIds,
                requesterName,
                requesterId
            }, channelKey, retryCount);

            if (result === 'retry_needed' && retryCount < 1) {
                return performSend(retryCount + 1);
            }
            return result === true;
        };

        return await performSend();
    },

    requestOrderShare: async (itemDetails, targetUserId, requesterName, requesterId) => {
        const channel = getOrJoinUserChannel(targetUserId);
        // Note: For User Channel logic we might want to apply the same robust 'sendBroadcast' helper
        // But for now keeping it simple or using the helper? Helper is better.

        // Cache Key for user channel
        const channelKey = `user_notifications:${targetUserId}`;

        await sendBroadcast(channel, 'request_order_share', {
            itemDetails,
            targetUserId,
            requesterName,
            requesterId
        }, channelKey);

        return true;
    },

    sendSplitResponse: async (targetUserId, status, responderName, splitMetadata = null) => {
        console.log(`📡 api.sendSplitResponse called for User: ${targetUserId} | Status: ${status}`);

        const channel = getOrJoinUserChannel(targetUserId);
        const channelKey = `user_notifications:${targetUserId}`;

        const responderId = (await supabase.auth.getUser()).data.user?.id;

        await sendBroadcast(channel, 'split_response', {
            status,
            responderName,
            responderId,
            splitMetadata
        }, channelKey);

        return true;
    },

    splitOrder: async (originalOrder, targetUserIds) => {
        // STRATEGY: Try Update (Preferred). Handles "Owner" RLS.
        // Fallback: Delete + Insert (if Update blocked).

        const totalParts = targetUserIds.length;
        const basePrice = originalOrder.original_price ? Number(originalOrder.original_price) : Number(originalOrder.price);
        const newPrice = basePrice / totalParts;
        const cleanName = originalOrder.name.replace(/^[\d.]+\/[\d.]+\s/, '');
        const newName = `1/${totalParts} ${cleanName}`;

        const ownerId = originalOrder.ordered_by;
        const otherParticipants = targetUserIds.filter(id => id !== ownerId);

        console.log("🔄 Attempting Split via UPDATE Strategy...", originalOrder.id);

        // 1. Try Update (Owner Share)
        const { data: updated, error: updateError } = await supabase
            .from('orders')
            .update({
                name: newName,
                price: newPrice,
                is_split: true,
                split_parts: totalParts,
                original_price: basePrice,
                split_requester: ownerId,
                split_participants: targetUserIds
            })
            .eq('id', originalOrder.id)
            .select();

        const updateSuccess = !updateError && updated && updated.length > 0;

        if (updateSuccess) {
            console.log("✅ Update Successful. Inserting remaining parts...");
            // Update worked, just insert others
            if (otherParticipants.length > 0) {
                const newOrders = otherParticipants.map(userId => ({
                    table_id: originalOrder.table_id,
                    establishment_id: originalOrder.establishment_id,
                    product_id: originalOrder.product_id,
                    name: newName,
                    price: newPrice,
                    quantity: originalOrder.quantity,
                    status: originalOrder.status,
                    ordered_by: userId,
                    is_split: true,
                    split_parts: totalParts,
                    original_price: basePrice,
                    split_requester: ownerId,
                    split_participants: targetUserIds
                }));

                const { error: insError } = await supabase.from('orders').insert(newOrders);
                if (insError) console.error("❌ Error inserting split parts (Update Flow):", insError);
            }
            return true;
        }

        console.warn("⚠️ Update failed/blocked (RLS?). Falling back to DELETE + INSERT strategy.");

        // 2. Fallback: Delete + Insert
        // Delete original
        const { error: delError } = await supabase
            .from('orders')
            .delete()
            .eq('id', originalOrder.id);

        if (delError) {
            console.error("❌ Delete also failed:", delError);
            return false;
        }

        // Insert ALL parts (including owner)
        const allNewOrders = targetUserIds.map(userId => ({
            table_id: originalOrder.table_id,
            establishment_id: originalOrder.establishment_id,
            product_id: originalOrder.product_id,
            name: newName,
            price: newPrice,
            quantity: originalOrder.quantity,
            status: originalOrder.status,
            ordered_by: userId,
            is_split: true,
            split_parts: totalParts,
            original_price: basePrice,
            split_requester: ownerId,
            split_participants: targetUserIds
        }));

        const { error: insError2 } = await supabase.from('orders').insert(allNewOrders);
        if (insError2) {
            console.error("❌ Error inserting new orders (Fallback Flow):", insError2);
            return false;
        }

        return true;
    },

    redistributeOrder: async (relatedOrders, targetUserIds) => {
        if (!relatedOrders || relatedOrders.length === 0) return false;

        const originalOrder = relatedOrders[0];
        const totalAmount = relatedOrders.reduce((acc, o) => acc + o.price, 0);

        // 1. Delete ALL old related orders
        const idsToDelete = relatedOrders.map(o => o.id);
        const { error: delError } = await supabase
            .from('orders')
            .delete()
            .in('id', idsToDelete);

        if (delError) {
            console.error("Error deleting old orders for redistribution", delError);
            return false;
        }

        // 2. Create NEW orders
        const totalParts = targetUserIds.length;
        const basePrice = originalOrder.original_price ? Number(originalOrder.original_price) : totalAmount;
        const newPrice = basePrice / totalParts;
        const cleanName = originalOrder.name.replace(/^\d+\/\d+\s/, '').replace(/\s\[R\$.*\]/, '');
        const newName = `1/${totalParts} ${cleanName}`;

        const newOrders = targetUserIds.map(userId => ({
            table_id: originalOrder.table_id,
            establishment_id: originalOrder.establishment_id,
            product_id: originalOrder.product_id,
            name: newName,
            price: newPrice,
            quantity: originalOrder.quantity,
            status: originalOrder.status,
            ordered_by: userId,
            is_split: true,
            split_parts: totalParts,
            original_price: basePrice,
            split_requester: originalOrder.split_requester || originalOrder.ordered_by,
            split_participants: targetUserIds
        }));

        const { error: insError } = await supabase.from('orders').insert(newOrders);
        if (insError) console.error("Error inserting redistributed orders", insError);

        return !insError;
    }
};
