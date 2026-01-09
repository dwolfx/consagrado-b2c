// Main API Aggregator
import { supabase } from './supabase';
import { productApi } from './modules/products';
import { orderApi } from './modules/orders';
import { tableApi } from './modules/tables';
import { establishmentApi } from './modules/establishments';

// Re-export supabase for legacy usage
export { supabase };

// Aggregated API object
export const api = {
    ...productApi,
    ...orderApi,
    ...tableApi,
    ...establishmentApi,

    // Legacy or Shared Utils
    resetDemoData: async (tableId) => {
        // 1. Clear first
        await orderApi.clearTableOrders(tableId);

        // 2. Insert Seed Items (Water, Wine, Pizza)
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
