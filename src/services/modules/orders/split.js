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
        // STRATEGY: Smart Update (Preferred).
        // 1. Update the original order to be the "Master" (owned by original requester or first target).
        // 2. Insert the other parts.
        // This preserves the ID of the original order.

        const totalParts = targetUserIds.length;
        const basePrice = originalOrder.original_price ? Number(originalOrder.original_price) : Number(originalOrder.price);
        const cleanName = originalOrder.name.replace(/^[\d.]+\/[\d.]+\s/, '');

        // Single Survivor Logic
        const isStillSplit = totalParts > 1;
        const newPrice = isStillSplit ? (basePrice / totalParts) : basePrice;
        const newName = isStillSplit ? `1/${totalParts} ${cleanName}` : cleanName;
        // If split, keep original requester (or owner). If unsplit, clear requester.
        const newRequester = isStillSplit ? (originalOrder.split_requester || originalOrder.ordered_by) : null;
        const newParticipants = isStillSplit ? targetUserIds : null;

        console.log(`🔄 Attempting Split via Smart Update... Order: ${originalOrder.id}, Parts: ${totalParts}`);

        // 1. Update the Master (Original) Order
        const ownerId = originalOrder.ordered_by;
        const otherParticipants = targetUserIds.filter(id => id !== ownerId);

        const { data: updated, error: updateError } = await supabase
            .from('orders')
            .update({
                name: newName,
                price: newPrice,
                is_split: isStillSplit,
                split_parts: isStillSplit ? totalParts : 1,
                original_price: basePrice,
                split_requester: newRequester,
                split_participants: newParticipants
            })
            .eq('id', originalOrder.id)
            .select();

        const updateSuccess = !updateError && updated && updated.length > 0;

        if (updateSuccess) {
            console.log("✅ Update Successful. Inserting remaining parts...");
            // Update worked, now insert others
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
                    is_split: isStillSplit,
                    split_parts: isStillSplit ? totalParts : 1,
                    original_price: basePrice,
                    split_requester: newRequester,
                    split_participants: newParticipants
                }));

                const { error: insError } = await supabase.from('orders').insert(newOrders);
                if (insError) console.error("❌ Error inserting split parts (Update Flow):", insError);
            }
            return true;
        }

        console.warn("⚠️ Update failed/blocked (RLS?). Falling back to basic logic (should not happen if policies are right).");
        return false;
    },

    redistributeOrder: async (relatedOrders, targetUserIds) => {
        console.log("🔥 redistributeOrder called with:", { relatedOrdersCount: relatedOrders?.length, targetIds: targetUserIds });

        if (!relatedOrders || relatedOrders.length === 0) return false;

        // 1. Identify the "Master" Order to preserve (try to find one that matches a target user, or just the first/oldest)
        const sortedOrders = [...relatedOrders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const masterOrder = sortedOrders[0];

        // 2. Determine the "Survivor" who inherits the Master ID
        const originalOwnerId = masterOrder.ordered_by;
        // Prioritize original owner if they are still in the group, otherwise the first target user
        const survivorId = targetUserIds.includes(originalOwnerId) ? originalOwnerId : targetUserIds[0];

        // 3. Calculation
        const totalAmount = relatedOrders.reduce((acc, o) => acc + o.price, 0);
        const totalParts = targetUserIds.length;
        const basePrice = masterOrder.original_price ? Number(masterOrder.original_price) : totalAmount;
        const cleanName = masterOrder.name.replace(/^\d+\/\d+\s/, '').replace(/\s\[R\$.*\]/, '');

        const isStillSplit = totalParts > 1;
        const newPrice = isStillSplit ? (basePrice / totalParts) : basePrice;
        const newName = isStillSplit ? `1/${totalParts} ${cleanName}` : cleanName;
        // If unsplit, split_requester becomes null. 
        const newRequester = isStillSplit ? (masterOrder.split_requester || masterOrder.ordered_by) : null;
        const newParticipants = isStillSplit ? targetUserIds : null;

        console.log(`⚖️ Redistributing via Smart Update. Survivor: ${survivorId} (inherits ID ${masterOrder.id}). Unsplit? ${!isStillSplit}`);

        // 4. UPDATE the Master Order
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                name: newName,
                price: newPrice,
                ordered_by: survivorId, // Transfer ownership if needed
                is_split: isStillSplit,
                split_parts: isStillSplit ? totalParts : 1,
                original_price: basePrice,
                split_requester: newRequester,
                split_participants: newParticipants
            })
            .eq('id', masterOrder.id);

        if (updateError) {
            console.error("❌ Error updating master order:", updateError);
            return false;
        }

        // 5. DELETE the other existing related orders (orphans)
        // Ensure we don't delete the masterOrder we just updated
        const idsToDelete = relatedOrders.filter(o => o.id !== masterOrder.id).map(o => o.id);
        if (idsToDelete.length > 0) {
            const { error: delError } = await supabase.from('orders').delete().in('id', idsToDelete);
            if (delError) console.error("❌ Error deleting orphans:", delError);
        }

        // 6. INSERT new orders for the *rest* of the participants
        // Filter out the survivor since they already hold the Master Order
        const otherParticipants = targetUserIds.filter(uid => uid !== survivorId);

        if (otherParticipants.length > 0) {
            const newOrders = otherParticipants.map(userId => ({
                table_id: masterOrder.table_id,
                establishment_id: masterOrder.establishment_id,
                product_id: masterOrder.product_id,
                name: newName,
                price: newPrice,
                quantity: masterOrder.quantity,
                status: masterOrder.status,
                ordered_by: userId,
                is_split: isStillSplit,
                split_parts: isStillSplit ? totalParts : 1,
                original_price: basePrice,
                split_requester: newRequester,
                split_participants: newParticipants
            }));

            const { error: insError } = await supabase.from('orders').insert(newOrders);
            if (insError) console.error("❌ Error inserting new parts:", insError);
        }

        return true;
    }
};
