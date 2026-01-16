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
        console.log("🔥 redistributeOrder (Diff Approach) called with:", { relatedOrdersCount: relatedOrders?.length, targetIds: targetUserIds });

        if (!relatedOrders || relatedOrders.length === 0) return false;

        // Common Data Calculation
        const masterOrder = relatedOrders[0]; // Any order serves as template for product/table info
        const totalParts = targetUserIds.length;
        const cleanName = masterOrder.name.replace(/^\d+\/\d+\s/, '').replace(/\s\[R\$.*\]/, '');

        // Price Calculation based on ORIGINAL price to avoid rounding drift
        const basePrice = masterOrder.original_price ? Number(masterOrder.original_price) : Number(masterOrder.price);

        const isStillSplit = totalParts > 1;
        const newPrice = isStillSplit ? (basePrice / totalParts) : basePrice;
        const newName = isStillSplit ? `1/${totalParts} ${cleanName}` : cleanName;

        // Requester Logic: Keep existing requester if possible
        const currentRequester = masterOrder.split_requester || masterOrder.ordered_by;
        const newRequester = isStillSplit ? currentRequester : null;
        const newParticipants = isStillSplit ? targetUserIds : null;

        // 1. Map existing orders by User ID for quick lookup
        const existingOrdersMap = new Map();
        relatedOrders.forEach(o => existingOrdersMap.set(o.ordered_by, o));

        // 2. Process Target Users (Update or Insert)
        const promises = [];

        for (const userId of targetUserIds) {
            const existingOrder = existingOrdersMap.get(userId);

            if (existingOrder) {
                // UPDATE Existing
                console.log(`🔄 Updating existing order for user ${userId} (ID: ${existingOrder.id})`);
                promises.push(
                    supabase.from('orders').update({
                        name: newName,
                        price: newPrice,
                        is_split: isStillSplit,
                        split_parts: isStillSplit ? totalParts : 1,
                        original_price: basePrice,
                        split_requester: newRequester,
                        split_participants: newParticipants
                    }).eq('id', existingOrder.id)
                );
                // Remove from map so we know what's left to delete
                existingOrdersMap.delete(userId);
            } else {
                // INSERT New
                console.log(`➕ Inserting new order for user ${userId}`);
                promises.push(
                    supabase.from('orders').insert({
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
                    })
                );
            }
        }

        // 3. Delete Removed Users (Leftovers in map)
        for (const [userId, orderToDelete] of existingOrdersMap) {
            console.log(`🗑️ Deleting removed user ${userId} (ID: ${orderToDelete.id})`);
            promises.push(
                supabase.from('orders').delete().eq('id', orderToDelete.id)
            );
        }

        // Execute all
        const results = await Promise.all(promises);
        const hasErrors = results.some(r => r.error);

        if (hasErrors) {
            console.error("❌ Errors occurred during redistributeOrder:", results.filter(r => r.error));
            return false;
        }

        return true;
    }
};
