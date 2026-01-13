import { supabase } from '../../supabase';

export const productQueries = {
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
    }
};
