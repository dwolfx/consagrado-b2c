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

        const ALLOWED_STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'paid', 'cancelled'];
        const isWaiting = orderData.status === 'waiting_split' || orderData.waitingSplit;
        const validStatus = (orderData.status && ALLOWED_STATUSES.includes(orderData.status)) ? orderData.status : 'pending';

        const mergedMetadata = {
            ...(orderData.metadata || {}),
            ...(isWaiting ? { waiting_split: true } : {})
        };

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
                status: validStatus,
                ordered_by: (orderData.orderedBy || '').toLowerCase(),

                // Secure Metadata for Triggers
                metadata: mergedMetadata,

                // Split Metadata
                is_split: !!orderData.isSplit,
                split_parts: orderData.splitParts || 1,
                original_price: orderData.originalPrice || null,
                split_requester: orderData.splitRequester || null,
                split_participants: orderData.splitParticipants || null,

                // Batch ID (groups all items from the same order submission)
                order_batch_id: orderData.batchId || null
            }])
            .select();

        if (error) {
            console.error('❌ Error adding order:', error);
            return null;
        }
        console.log('✅ Order added successfully:', data);

        // Marca mesa como occupied via RPC (SECURITY DEFINER — bypassa RLS)
        const { error: rpcError } = await supabase
            .rpc('set_table_occupied', { p_table_id: tableId });

        if (rpcError) console.error('Erro ao marcar mesa como ocupada:', rpcError);

        return data ? data[0] : null;
    },

    // Usado pelo amigo que ACEITA uma divisão — bypassa RLS via SECURITY DEFINER
    addSplitOrder: async (tableId, orderData) => {
        console.log("🔀 api.addSplitOrder (RPC)", { tableId, orderData });

        const { data, error } = await supabase.rpc('add_split_order', {
            p_table_id:           tableId,
            p_product_id:         (orderData.productId && !String(orderData.productId).startsWith('half-'))
                                    ? orderData.productId : null,
            p_name:               orderData.name,
            p_price:              parseFloat(orderData.price),
            p_quantity:           orderData.quantity || 1,
            p_ordered_by:         (orderData.orderedBy || '').toLowerCase(),
            p_split_parts:        orderData.splitParts || 2,
            p_original_price:     orderData.originalPrice || null,
            p_split_requester:    orderData.splitRequester || null,
            p_split_participants: orderData.splitParticipants || null,
            p_metadata:           orderData.metadata || {},
            p_batch_id:           orderData.batchId || null
        });

        if (error) {
            console.error('❌ Error in addSplitOrder RPC:', error);
            return null;
        }

        console.log('✅ addSplitOrder success, order ID:', data);
        return { id: data };
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
