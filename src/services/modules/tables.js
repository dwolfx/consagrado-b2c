import { supabase } from '../supabase';

export const tableApi = {
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
            .eq('code', code)
            .single();

        if (error) console.log("Error fetching table by code", error);
        return data;
    },
};
