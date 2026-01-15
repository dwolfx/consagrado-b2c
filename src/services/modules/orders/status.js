import { supabase } from '../../supabase';

export const statusApi = {
    getOrder: async (id) => {
        const { data } = await supabase.from('orders').select('*').eq('id', id).single();
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

    deleteOrder: async (orderId) => {
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) console.error("Error deleting order", error);
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
    }
};
