import { supabase } from '../supabase';

export const _channelCache = {};

export const orderApi = {
    addOrder: async (tableId, orderData) => {
        console.log("📝 api.addOrder", { tableId, orderData });

        // 1. Fetch Establishment ID from Table
        const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('establishment_id')
            .eq('id', tableId)
            .single();

        if (tableError || !tableData) {
            console.error("❌ Critical: Could not find table/establishment for order", tableError);
            return null;
        }

        const establishmentId = tableData.establishment_id;

        const { data, error } = await supabase
            .from('orders')
            .insert([{
                establishment_id: establishmentId,
                table_id: tableId,
                // Handle "half-" IDs or other custom IDs by setting product_id to NULL
                product_id: (orderData.productId && String(orderData.productId).startsWith('half-')) ? null : orderData.productId,
                name: orderData.name,
                price: parseFloat(orderData.price),
                quantity: orderData.quantity,
                status: 'pending',
                ordered_by: (orderData.orderedBy || '').toLowerCase(), // Ensure UUID format

                // Secure Metadata for Triggers
                metadata: orderData.metadata || {},

                // Split Metadata
                is_split: !!orderData.isSplit,
                split_parts: orderData.splitParts || 1,
                original_price: orderData.originalPrice || null,
                split_requester: orderData.splitRequester || null,
                split_participants: orderData.splitParticipants || null
            }])
            .select();

        if (error) {
            console.error('❌ Error adding order:', error);
            return null;
        }
        console.log('✅ Order added successfully:', data);

        // Also update table status to occupied if needed
        const { error: updateError } = await supabase
            .from('tables')
            .update({ status: 'occupied' })
            .eq('id', tableId);

        if (updateError) console.error('Error updating table status to occupied', updateError);

        return data ? data[0] : null;
    },

    getOrder: async (id) => {
        const { data } = await supabase.from('orders').select('*').eq('id', id).single();
        return data;
    },

    callWaiter: async (tableId, userId) => {
        // 1. Fetch Establishment ID from Table
        const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('establishment_id')
            .eq('id', tableId)
            .single();

        if (tableError || !tableData) {
            console.error("❌ Critical: Could not find table/establishment for waiter call", tableError);
            return null;
        }
        const establishmentId = tableData.establishment_id;

        // Workaround: Create a special 0-price order to notify staff
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                establishment_id: establishmentId,
                table_id: tableId,
                product_id: null,
                name: '🔔 CHAMAR GARÇOM',
                price: 0,
                quantity: 1,
                status: 'service_call',
                ordered_by: userId
            }])
            .select();

        if (error) console.error('Error calling waiter', error);
        return data;
    },

    payUserOrders: async (tableId, userId) => {
        console.log(`💰 Paying orders for User ${userId} at Table ${tableId}`);
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('table_id', tableId)
            .eq('ordered_by', userId)
            // CRITICAL: Do not pay/archive service calls
            .neq('status', 'paid')
            .neq('status', 'service_call')
            .select();

        if (error) console.error("Error paying orders", error);
        return data;
    },

    getUserHistory: async (userId) => {
        console.log(`📜 Fetching history for User ${userId}`);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                table:tables (
                    establishment:establishments(*)
                )
            `)
            .eq('ordered_by', userId)
            .eq('status', 'paid')
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching history", error);
        return data || [];
    },

    clearTableOrders: async (tableId) => {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('table_id', tableId);

        if (error) console.error('Error clearing table', error);
        return !error;
    },

    // Status Check for Auto-Logout
    checkUserHasActiveItems: async (userId) => {
        if (!userId) return false;

        // Count orders that are NOT paid and NOT service calls
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('ordered_by', userId)
            .neq('status', 'paid')
            .neq('status', 'service_call');

        if (error) {
            console.error("Error checking user status", error);
            return true; // Fail safe: assume active to prevent accidental logout
        }

        // If count > 0, user has debt/pending items -> KEEP LOGIN
        return count > 0;
    },

    // --- SPLITTING LOGIC ---

    requestSplit: async (orderItem, targetUserIds, requesterName, requesterId) => {
        console.log(`📡 [DEBUG] requestSplit called. Users:`, targetUserIds);

        // 1. Send DIRECTLY to each target user (Preferred)
        console.log(`📡 Sending Split Request to ${targetUserIds.length} users...`);
        const userPromises = targetUserIds.map(async (targetId) => {
            console.log(`   -> Target Channel: user_notifications:${targetId}`);

            // USE CACHE
            if (!_channelCache[targetId]) {
                console.log(`      -> Creating NEW channel for ${targetId}`);
                _channelCache[targetId] = supabase.channel(`user_notifications:${targetId}`);
            } else {
                console.log(`      -> Using CACHED channel for ${targetId}`);
            }

            const channel = _channelCache[targetId];

            const waitForSubscription = () => {
                return new Promise((resolve) => {
                    // FAST PATH: If already connected, resolve immediately
                    // Supabase channels usually expose .state property (joined, closed, etc)
                    // Note: implementation details may vary by version, but subscribe() is generally safe.
                    // We'll trust the event listener primarily, but handle the "already ready" case.

                    if (channel.state === 'joined') {
                        console.log(`      -> Channel ${targetId} already JOINED. Ready.`);
                        return resolve();
                    }

                    channel.subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            resolve();
                        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                            console.error(`      -> Failed to subscribe to ${targetId}: ${status}`);
                            delete _channelCache[targetId]; // Invalidate bad channel
                            resolve(); // Resolve anyway to not block Promise.all
                        }
                    });
                });
            };

            await waitForSubscription();

            console.log(`      -> Sending payload to ${targetId}...`);
            await channel.send({
                type: 'broadcast',
                event: 'request_split',
                payload: {
                    orderId: orderItem.id,
                    itemName: orderItem.name,
                    targetIds: targetUserIds,
                    requesterName,
                    requesterId
                }
            });
            console.log(`      -> Sent to ${targetId}`);
        });

        // 2. Backup: Send to Table Channel (For backward compatibility/reliability)
        console.log("📡 Sending Backup Broadcast to Table...");
        const tablePromise = new Promise((resolve) => {
            const tChannel = supabase.channel(`table_notifications:${orderItem.table_id}`);
            tChannel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await tChannel.send({
                        type: 'broadcast',
                        event: 'request_split',
                        payload: {
                            orderId: orderItem.id,
                            itemName: orderItem.name,
                            targetIds: targetUserIds,
                            requesterName,
                            requesterId
                        }
                    });
                    console.log("      -> Backup sent to Table.");
                    resolve();
                    setTimeout(() => supabase.removeChannel(tChannel), 1000);
                }
            });
        });

        await Promise.all([...userPromises, tablePromise]);
        console.log("✅ All split requests sent.");
        return true;
    },

    requestOrderShare: async (itemDetails, targetUserId, requesterName, requesterId) => {
        // Send DIRECTLY to the target user's channel
        const channel = supabase.channel(`user_notifications:${targetUserId}`);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'request_order_share',
                    payload: {
                        itemDetails,
                        targetUserId,
                        requesterName,
                        requesterId
                    }
                });
            }
        });
        return true;
    },

    sendSplitResponse: async (targetUserId, status, responderName) => {
        console.log(`📡 api.sendSplitResponse called for User: ${targetUserId} | Status: ${status}`);
        const channel = supabase.channel(`user_notifications:${targetUserId}`);
        await channel.subscribe(async (statusCode) => {
            if (statusCode === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'split_response',
                    payload: {
                        status,
                        responderName,
                        responderId: (await supabase.auth.getUser()).data.user?.id
                    }
                });
            } else {
                console.warn(`⚠️ Channel subscription failed or timed out: ${statusCode}`);
            }
        });
        return true;
    },

    splitOrder: async (originalOrder, targetUserIds) => {
        // 1. Delete original order
        const { error: delError } = await supabase
            .from('orders')
            .delete()
            .eq('id', originalOrder.id);

        if (delError) {
            console.error("Error deleting original for split", delError);
            return false;
        }

        // 2. Create new fractional orders
        const totalParts = targetUserIds.length;
        const basePrice = originalOrder.original_price ? Number(originalOrder.original_price) : Number(originalOrder.price);
        const newPrice = basePrice / totalParts;
        const cleanName = originalOrder.name.replace(/^[\d.]+\/[\d.]+\s/, '');
        const newName = `1/${totalParts} ${cleanName}`;

        const newOrders = targetUserIds.map(userId => ({
            table_id: originalOrder.table_id,
            product_id: originalOrder.product_id,
            name: newName,
            price: newPrice,
            quantity: originalOrder.quantity,
            status: originalOrder.status,
            ordered_by: userId,
            is_split: true,
            split_parts: totalParts,
            original_price: basePrice,
            split_requester: originalOrder.ordered_by,
            split_participants: targetUserIds
        }));

        const { error: insError } = await supabase.from('orders').insert(newOrders);
        if (insError) console.error("Error inserting split orders", insError);

        return !insError;
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
