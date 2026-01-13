import { supabase } from '../../supabase';

export const paymentApi = {
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
    }
};
