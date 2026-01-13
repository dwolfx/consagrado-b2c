import { useState, useEffect } from 'react';
import { supabase, api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useTableContext } from '../../../context/TableContext';
import { useToast } from '../../../context/ToastContext';

export const useHomeLogic = () => {
    const { user, logout } = useAuth();
    const { tableId, establishment, onlineUsers, setTableId } = useTableContext();
    const { addToast } = useToast();

    // UI State
    const [statusBadge, setStatusBadge] = useState(null); // { label, color, bg }
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showUsersModal, setShowUsersModal] = useState(false);

    // Manual Code Submission
    const handleManualSubmit = async () => {
        if (!manualCode) return;
        try {
            const table = await api.getTableByCode(manualCode);
            if (table && table.id) {
                setTableId(table.id);
            } else {
                addToast('Mesa não encontrada!', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Erro ao buscar mesa.', 'error');
        }
    };

    // Poll/Subscribe to Order Status for Badge
    useEffect(() => {
        if (!tableId || !user) return;

        const fetchStatus = async () => {
            // Check for 'preparing' first (priority)
            const { count: prepCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('table_id', tableId)
                .eq('ordered_by', user.id)
                .eq('status', 'preparing');

            if (prepCount > 0) {
                setStatusBadge({ label: 'Em Preparo', color: '#1d4ed8', bg: '#dbeafe' }); // Blue
                return;
            }

            // Check for 'pending' (excluding service calls, notifying waiters is instant usually)
            const { count: pendCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('table_id', tableId)
                .eq('ordered_by', user.id)
                .eq('status', 'pending')
                .neq('name', '🔔 CHAMAR GARÇOM');

            if (pendCount > 0) {
                setStatusBadge({ label: 'Aguardando', color: '#b45309', bg: '#fef3c7' }); // Yellow
                return;
            }

            setStatusBadge(null);
        };

        fetchStatus();

        // Subscribe to changes
        const channel = supabase.channel(`home_status:${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, fetchStatus)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableId, user]);

    // Helpers
    const userFirstName = user?.name?.split(' ')[0] || 'Visitante';

    return {
        user, logout, userFirstName,
        tableId, establishment, onlineUsers, setTableId,
        statusBadge,
        showManualInput, setShowManualInput,
        manualCode, setManualCode,
        showUsersModal, setShowUsersModal,
        handleManualSubmit
    };
};
