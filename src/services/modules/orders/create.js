import { supabase } from '../../supabase';

export const createApi = {
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
    }
};
