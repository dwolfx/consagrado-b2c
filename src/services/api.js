
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
        let { data, error } = await supabase
            .from('tables')
            .select('*, orders(*)')
            .eq('id', id)
            .single();
        if (error) console.error('Error fetching table', error);
        return data;
    },
    // Orders
    addOrder: async (tableId, orderItem) => {
        // Just insert into orders table. Realtime triggers will handle the rest.
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                table_id: tableId,
                product_id: orderItem.productId,
                name: orderItem.name,
                price: orderItem.price,
                quantity: orderItem.quantity,
                status: 'pending',
                ordered_by: orderItem.orderedBy
            }])
            .select();

        // Also update table status to occupied if needed
        await supabase
            .from('tables')
            .update({ status: 'occupied' })
            .eq('id', tableId);

        if (error) console.error('Error adding order', error);
        return data;
    },

    // Service
    callWaiter: async (tableId, userId) => {
        // Workaround: Create a special 0-price order to notify staff
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                table_id: tableId,
                product_id: null, // No specific product
                name: '🔔 CHAMAR GARÇOM',
                price: 0,
                quantity: 1,
                status: 'pending',
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

    // Users (Auth)
    login: async (email, password) => {
        // For this demo, we are doing simple table lookup. 
        // In production, use supabase.auth.signInWithPassword()
        let { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();
        return data;
    }
};
