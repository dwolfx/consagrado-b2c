import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, api } from '../services/api';
import { useAuth } from './AuthContext';

const TableContext = createContext({});

export const TableProvider = ({ children }) => {
    const { user } = useAuth();
    const [tableId, setTableId] = useState(localStorage.getItem('my_table_id'));
    const [dbUsers, setDbUsers] = useState([]);
    const [realtimeUsers, setRealtimeUsers] = useState([]);
    const [establishment, setEstablishment] = useState(null);

    // Sync tableId with localStorage
    const updateTableId = (id) => {
        if (id) {
            localStorage.setItem('my_table_id', id);
        } else {
            localStorage.removeItem('my_table_id');
        }
        setTableId(id);
    };

    // Load Establishment Data when Table ID changes
    useEffect(() => {
        const loadEstablishment = async () => {
            if (!tableId) {
                setEstablishment(null);
                // Reset Theme to Dark Mode Default (Black/Neutral) if no table
                document.documentElement.style.setProperty('--bg-primary', '#000000');
                document.documentElement.style.setProperty('--brand-color', '#f59e0b'); // Default Gold
                return;
            }

            try {
                const tableData = await api.getTable(tableId);
                if (tableData && tableData.establishment) {
                    setEstablishment(tableData.establishment);

                    // APPLY THEME
                    const brandColor = tableData.establishment.theme_color || '#f59e0b';
                    document.documentElement.style.setProperty('--brand-color', brandColor);

                    // Custom Theme Logic (e.g. Red for Imperio Demo)
                    if (tableData.establishment.id === 1) {
                        document.documentElement.style.setProperty('--bg-primary', '#450a0a'); // Red 950
                        document.documentElement.style.setProperty('--bg-secondary', '#7f1d1d'); // Red 900
                        document.documentElement.style.setProperty('--bg-tertiary', '#991b1b'); // Red 800
                        document.documentElement.style.setProperty('--text-primary', '#fffFb1'); // Warm White
                        document.documentElement.style.setProperty('--text-secondary', '#fca5a5'); // Red 300
                    } else {
                        // Reset to default Dark Mode for others
                        // (Or implement proper theme system later)
                    }
                }
            } catch (err) {
                console.error("Error loading table context:", err);
            }
        };

        loadEstablishment();
    }, [tableId]);


    // --- 1. DB Presence (Users with Active Orders) ---
    useEffect(() => {
        if (!tableId) {
            setDbUsers([]);
            return;
        }

        const fetchActiveUsers = async () => {
            const { data: orders } = await supabase
                .from('orders')
                .select('ordered_by')
                .eq('table_id', tableId)
                .neq('status', 'paid')
                .neq('name', '🔔 CHAMAR GARÇOM');

            if (!orders) return;

            const rawIds = [...new Set(orders.map(o => o.ordered_by))];
            const foundUsers = [];

            // Separate UUIDs (registered users) from Strings (guest names)
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const uuids = rawIds.filter(id => uuidPattern.test(id));
            const names = rawIds.filter(id => !uuidPattern.test(id));

            // A. Fetch Profiles for UUIDs
            if (uuids.length > 0) {
                const { data: profiles } = await supabase.from('users').select('*').in('id', uuids);
                if (profiles) {
                    profiles.forEach(p => foundUsers.push({
                        id: p.id,
                        name: p.name,
                        avatar_url: p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=random`
                    }));
                }
            }

            // B. Create Stub Objects for Guest Names
            names.forEach(n => foundUsers.push({
                id: n,
                name: n,
                avatar_url: `https://ui-avatars.com/api/?name=${n}&background=random`
            }));

            setDbUsers(foundUsers);
        };

        fetchActiveUsers();

        // Listen for persistent order changes
        const orderChannel = supabase.channel(`ctx_orders:${tableId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, fetchActiveUsers)
            .subscribe();

        return () => {
            supabase.removeChannel(orderChannel);
        };
    }, [tableId]);

    // --- 2. Realtime Presence (Live Cursors) ---
    useEffect(() => {
        if (!user || !tableId) {
            setRealtimeUsers([]);
            return;
        }

        const channel = supabase.channel(`ctx_presence:${tableId}`, {
            config: {
                presence: {
                    key: user.id || 'guest',
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const liveList = [];
                for (let key in newState) {
                    if (newState[key].length > 0) {
                        liveList.push(newState[key][0]);
                    }
                }
                setRealtimeUsers(liveList);
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
        };
    }, [user, tableId]);

    // Derived state: Merge DB and Realtime
    const onlineUsers = useMemo(() => {
        const map = new Map();
        // 1. Add DB Users first
        dbUsers.forEach(u => map.set(u.id, u));
        // 2. Add/Overwrite with Realtime Users
        realtimeUsers.forEach(u => map.set(u.id, u));
        return Array.from(map.values());
    }, [dbUsers, realtimeUsers]);

    return (
        <TableContext.Provider value={{
            tableId,
            setTableId: updateTableId,
            onlineUsers,
            establishment
        }}>
            {children}
        </TableContext.Provider>
    );
};

export const useTableContext = () => useContext(TableContext);
