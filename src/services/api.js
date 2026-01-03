
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eilpafndxtzsmxozrpnm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbHBhZm5keHR6c214b3pycG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTcwMzUsImV4cCI6MjA4MDg3MzAzNX0.yFiNZ1W9YmrJbMx-2_YPdgfgZ2qYWUMk4xjPLDlN9hk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const api = {
    // Products
    getProducts: async () => {
        let { data, error } = await supabase
            .from('products')
            .select('*');
        if (error) console.error('Error fetching products', error);
        return data || [];
    },
    getProduct: async (id) => {
        console.log(`🔎 api.getProduct called with ID: ${id}`);
        let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('❌ Error fetching product from DB:', error);
        } else {
            console.log('✅ DB Product Response:', data);
        }
        return data;
    },

    // Tables
    getTables: async () => {
        let { data, error } = await supabase
            .from('tables')
            .select('*, orders(*), establishment:establishments(*)')
            .order('number');
        if (error) console.error('Error fetching tables', error);
        return data || [];
    },
    getTable: async (id) => {
        const { data, error } = await supabase
            .from('tables')
            .select(`
                *,
                establishment:establishments(*),
                orders:orders(*)
            `)
            .eq('id', id)
            .single();

        if (error) console.error("Error fetching table", error);
        return data;
    },

    getTableByCode: async (code) => {
        const { data, error } = await supabase
            .from('tables')
            .select(`
                *,
                establishment:establishments(*)
            `)
            .eq('code', code) // Case sensitive? User asked for alphanumeric. Typically uppercase.
            .single();

        if (error) console.log("Error fetching table by code", error);
        return data;
    },
    // Orders
    addOrder: async (tableId, orderData) => {
        console.log("📝 api.addOrder", { tableId, orderData });
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                table_id: tableId,
                product_id: orderData.productId,
                name: orderData.name,
                price: parseFloat(orderData.price), // Ensure Number
                quantity: orderData.quantity,
                status: 'pending',
                ordered_by: (orderData.orderedBy || '').toLowerCase(), // Ensure UUID format

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
        // Note: The error variable here would still hold the error from the insert operation.
        // If we want to handle the update error separately, we'd need a new variable.
        const { error: updateError } = await supabase
            .from('tables')
            .update({ status: 'occupied' })
            .eq('id', tableId);

        if (updateError) console.error('Error updating table status to occupied', updateError);

        return data ? data[0] : null;
    },

    // Service
    callWaiter: async (tableId, userId) => {
        // Workaround: Create a special 0-price order to notify staff
        // Status 'service_call' hides it from client frontend but keeps it invisible for B2B/Waiter App
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                table_id: tableId,
                product_id: null, // No specific product
                name: '🔔 CHAMAR GARÇOM',
                price: 0,
                quantity: 1,
                status: 'service_call', // NEW STATUS
                ordered_by: userId
            }])
            .select();

        if (error) console.error('Error calling waiter', error);
        return data;
    },

    // Establishments
    getEstablishments: async () => {
        let { data, error } = await supabase
            .from('establishments')
            .select('*');
        return data || [];
    },
    getEstablishment: async (id) => {
        let { data, error } = await supabase
            .from('establishments')
            .select('*')
            .eq('id', id)
            .single();
        return data;
    },

    // Users (Auth) handled by AuthContext (Supabase Auth)
    // Legacy insecure login removed.

    // DEMO UTILS (Reset/Clear)
    clearTableOrders: async (tableId) => {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('table_id', tableId);

        if (error) console.error('Error clearing table', error);
        return !error;
    },

    // Payment & History
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

    // Splitting
    getOrder: async (id) => {
        const { data } = await supabase.from('orders').select('*').eq('id', id).single();
        return data;
    },

    requestSplit: async (orderItem, targetUserIds, requesterName, requesterId) => {
        // Send Broadcast
        const channel = supabase.channel(`table_notifications:${orderItem.table_id}`);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
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
                // setTimeout(() => supabase.removeChannel(channel), 1000); // KEEP OPEN
            }
        });
        return true;
    },

    requestOrderShare: async (itemDetails, targetUserId, requesterName, requesterId) => {
        // itemDetails: { name, price, quantity, tableId }
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
                // setTimeout(() => supabase.removeChannel(channel), 1000); // KEEP OPEN
            }
        });
        return true;
    },

    sendSplitResponse: async (targetUserId, status, responderName) => {
        console.log(`📡 api.sendSplitResponse called for User: ${targetUserId} | Status: ${status}`);
        const channel = supabase.channel(`user_notifications:${targetUserId}`);
        await channel.subscribe(async (statusCode) => {
            console.log(`Correction: Subscription status for user_notifications:${targetUserId} is ${statusCode}`);
            if (statusCode === 'SUBSCRIBED') {
                console.log("✅ Channel SUBSCRIBED. Sending split_response broadcast...");
                await channel.send({
                    type: 'broadcast',
                    event: 'split_response',
                    payload: {
                        status,
                        responderName,
                        responderId: (await supabase.auth.getUser()).data.user?.id
                    }
                });
                console.log("📤 split_response SENT.");
                // Ensure message has time to fly before kill
                /* setTimeout(() => {
                    console.log("🔌 Removing channel...");
                    supabase.removeChannel(channel);
                }, 1000); */
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

        // Robust Price: Use existing original_price metadata if available, or current price as base
        const basePrice = originalOrder.original_price ? Number(originalOrder.original_price) : Number(originalOrder.price);
        const newPrice = basePrice / totalParts;

        const cleanName = originalOrder.name.replace(/^[\d.]+\/[\d.]+\s/, ''); // Regex to clean "1/2 "
        const newName = `1/${totalParts} ${cleanName}`;

        const newOrders = targetUserIds.map(userId => ({
            table_id: originalOrder.table_id,
            product_id: originalOrder.product_id, // Keep Real ID
            name: newName,
            price: newPrice,
            quantity: originalOrder.quantity, // usually 1
            status: originalOrder.status,
            ordered_by: userId,

            // Metadata Persistence
            is_split: true,
            split_parts: totalParts,
            original_price: basePrice,
            split_requester: originalOrder.ordered_by, // Original owner is requester
            split_participants: targetUserIds
        }));

        const { error: insError } = await supabase.from('orders').insert(newOrders);
        if (insError) console.error("Error inserting split orders", insError);

        return !insError;
    },

    redistributeOrder: async (relatedOrders, targetUserIds) => {
        // relatedOrders: Array of order objects currently part of the split
        // targetUserIds: Array of user IDs who should be in the NEW split

        if (!relatedOrders || relatedOrders.length === 0) return false;

        const originalOrder = relatedOrders[0]; // Take one as template
        const totalAmount = relatedOrders.reduce((acc, o) => acc + o.price, 0); // Reconstruct total price
        // OR better: use originalOrder.price * relatedOrders.length if we trust equality, 
        // but robust way is sum. 
        // Actually, if it was "1/3 Pizza" @ 10.00, total was 30.00.
        // If we have 3 orders of 10.00, total is 30.00. Correct.

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

        // Robust Price Calculation: Use stored original_price if available, otherwise reconstruct
        const basePrice = originalOrder.original_price ? Number(originalOrder.original_price) : totalAmount;
        const newPrice = basePrice / totalParts;

        // Clean name logic
        const cleanName = originalOrder.name.replace(/^\d+\/\d+\s/, '').replace(/\s\[R\$.*\]/, ''); // Remove old prefix and debugs
        const newName = `1/${totalParts} ${cleanName}`;

        const newOrders = targetUserIds.map(userId => ({
            table_id: originalOrder.table_id,
            product_id: originalOrder.product_id, // Keep Real ID
            name: newName,
            price: newPrice,
            quantity: originalOrder.quantity,
            status: originalOrder.status,
            ordered_by: userId,

            // Metadata Persistence
            is_split: true,
            split_parts: totalParts,
            original_price: basePrice,
            split_requester: originalOrder.split_requester || originalOrder.ordered_by, // Keep original requester or inherit
            split_participants: targetUserIds
        }));

        const { error: insError } = await supabase.from('orders').insert(newOrders);
        if (insError) console.error("Error inserting redistributed orders", insError);

        return !insError;
    },

    resetDemoData: async (tableId) => {
        // 1. Clear first
        await api.clearTableOrders(tableId);

        // 2. Insert Seed Items (Water, Wine, Pizza) to restore "Mid-Meal" state
        const now = new Date();
        const past30 = new Date(now.getTime() - 30 * 60000).toISOString();
        const past25 = new Date(now.getTime() - 25 * 60000).toISOString();
        const past15 = new Date(now.getTime() - 15 * 60000).toISOString();

        const orders = [
            // Water
            { table_id: tableId, product_id: 102, quantity: 1, status: 'delivered', ordered_by: 'cf02de19-9b72-45f8-a09f-7199ffcd721a', name: 'Água com Gás', price: 4.50, created_at: past30 },
            { table_id: tableId, product_id: 102, quantity: 1, status: 'delivered', ordered_by: '68df0acb-07a2-4048-a61e-d538ff3ff442', name: 'Água com Gás', price: 4.50, created_at: past30 },
            // Wine (Split)
            { table_id: tableId, product_id: 103, quantity: 1, status: 'delivered', ordered_by: '68df0acb-07a2-4048-a61e-d538ff3ff442', name: '1/2 Vinho Malbec', price: 50.00, created_at: past25 },
            { table_id: tableId, product_id: 103, quantity: 1, status: 'delivered', ordered_by: 'cf02de19-9b72-45f8-a09f-7199ffcd721a', name: '1/2 Vinho Malbec', price: 50.00, created_at: past25 },
            // Pizza (Split)
            { table_id: tableId, product_id: 101, quantity: 1, status: 'delivered', ordered_by: '68df0acb-07a2-4048-a61e-d538ff3ff442', name: '1/2 Pizza Margherita', price: 22.50, created_at: past15 },
            { table_id: tableId, product_id: 101, quantity: 1, status: 'delivered', ordered_by: 'cf02de19-9b72-45f8-a09f-7199ffcd721a', name: '1/2 Pizza Margherita', price: 22.50, created_at: past15 }
        ];

        const { error } = await supabase.from('orders').insert(orders);
        if (error) console.error('Error resetting demo', error);
        return !error;
    }
};
