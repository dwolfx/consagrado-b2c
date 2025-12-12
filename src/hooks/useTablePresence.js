import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useTablePresence = () => {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Get table ID from storage
    const tableId = localStorage.getItem('my_table_id');

    useEffect(() => {
        if (!user || !tableId) return;

        // --- 1. DB Presence (Users with Active Orders) ---
        const fetchActiveUsers = async () => {
            const currentTableId = localStorage.getItem('my_table_id');
            if (!currentTableId) return;

            const { data: orders } = await supabase
                .from('orders')
                .select('ordered_by')
                .eq('table_id', currentTableId)
                .neq('status', 'paid')
                .neq('name', '🔔 CHAMAR GARÇOM'); // Ignore notifications

            if (!orders) return;

            const rawIds = [...new Set(orders.map(o => o.ordered_by))];
            const dbUsers = [];

            // Robust UUID check
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const uuids = rawIds.filter(id => uuidPattern.test(id));
            const names = rawIds.filter(id => !uuidPattern.test(id));

            if (uuids.length > 0) {
                const { data: profiles } = await supabase.from('users').select('*').in('id', uuids);
                if (profiles) {
                    profiles.forEach(p => dbUsers.push({
                        id: p.id,
                        name: p.name,
                        avatar_url: p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=random`
                    }));
                }
            }

            names.forEach(n => dbUsers.push({
                id: n,
                name: n,
                avatar_url: `https://ui-avatars.com/api/?name=${n}&background=random`
            }));

            setOnlineUsers(prev => {
                const map = new Map();
                // Prioritize Realtime users (prev) as they are likely "Live"
                prev.forEach(u => map.set(u.id, u));
                // Add DB users if not present
                dbUsers.forEach(u => {
                    if (!map.has(u.id)) map.set(u.id, u);
                });
                return Array.from(map.values());
            });
        };

        fetchActiveUsers();

        // Listen for Order changes to update presence list
        const orderChannel = supabase.channel(`table_orders:${tableId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, fetchActiveUsers)
            .subscribe();


        // --- 2. Realtime Presence (Live Cursors) ---
        const channel = supabase.channel(`table_presence:${tableId}`, {
            config: {
                presence: {
                    key: user.id, // Identify user by ID
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                // console.log('Presence sync:', newState);

                const liveUsers = [];
                for (let key in newState) {
                    if (newState[key].length > 0) {
                        liveUsers.push(newState[key][0]);
                    }
                }

                // Merge Live with DB (keeping DB users if they are not live)
                // We re-run fetchActiveUsers logic effectively or just merge here?
                // Simpler: Just set Live users, and rely on fetchActiveUsers to merge them back in?
                // No, setOnlineUsers replaces state. 
                // We need a stable merger.

                // Let's just update 'liveUsers' state and have a separate 'dbUsers' state and combine them?
                // For simplicity in this edit, I will just setOnlineUsers with Live, AND trigger a DB fetch merge.
                setOnlineUsers(liveUsers);
                fetchActiveUsers(); // Re-merge DB users on top
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const userData = {
                        id: user.id || 'guest',
                        name: user.name || 'Visitante',
                        email: user.email,
                        avatar_url: user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'Visitante'}&background=random`
                    };
                    await channel.track(userData);
                }
            });

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(orderChannel);
        };
    }, [user, tableId]);

    return { onlineUsers, tableId };
};
