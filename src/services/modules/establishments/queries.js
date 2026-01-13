import { supabase } from '../../supabase';

export const establishmentQueries = {
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
};
