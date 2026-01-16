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
                document.documentElement.style.setProperty('--brand-color', '#dedede'); // Default Neutral
                return;
            }

            try {
                const tableData = await api.getTable(tableId);
                if (tableData && tableData.establishment) {
                    setEstablishment(tableData.establishment);

                } else {
                    setEstablishment(null);
                }
            } catch (err) {
                console.error("Error loading table context:", err);
                setEstablishment(null);
            }
        };

        loadEstablishment();
    }, [tableId]);

    // Apply Theme when Establishment Data is loaded/changes
    useEffect(() => {
        if (!establishment) {
            // Reset to default if no establishment
            document.documentElement.style.setProperty('--bg-primary', '#000000');
            document.documentElement.style.setProperty('--brand-color', '#dedede');
            document.documentElement.style.setProperty('--brand-contrast', '#000000');
            document.documentElement.style.setProperty('--brand-secondary', '#888888');
            document.documentElement.style.setProperty('--bg-gradient', 'none');
            return;
        }

        // APPLY THEME
        const brandColor = establishment.theme_color || '#dedede';
        const secondaryColor = establishment.theme_secondary_color || '#888888';

        document.documentElement.style.setProperty('--brand-color', brandColor);

        // Background & Gradient Logic
        const bgColor = establishment.theme_background_color || '#09090b';
        document.documentElement.style.setProperty('--bg-primary', bgColor);

        // Generate a subtle gradient (slightly lighter at top-center)
        const lighterBg = adjustBrightness(bgColor, 15); // Lighten by 15%
        const gradient = `radial-gradient(circle at 50% 0%, ${lighterBg}, ${bgColor})`;
        document.documentElement.style.setProperty('--bg-gradient', gradient);

        const contrastColor = getContrastYIQ(brandColor);
        document.documentElement.style.setProperty('--brand-contrast', contrastColor);

        // Secondary brand color
        const brandSecondary = establishment.theme_secondary_color || '#888888';
        document.documentElement.style.setProperty('--brand-secondary', brandSecondary);

    }, [establishment]);

    function adjustBrightness(col, percent) {
        const num = parseInt(col.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const B = ((num >> 8) & 0x00FF) + amt;
        const G = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    }

    // Helper: Calculate Contrast
    function getContrastYIQ(hexcolor) {
        hexcolor = hexcolor.replace("#", "");
        if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    };


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
                        email: p.email,
                        phone: p.phone,
                        cpf: p.cpf,
                        passport: p.passport,
                        country: p.country || 'BR',
                        settings: p.settings || {},
                        avatar_url: p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=random`
                    }));
                }
            }

            // B. Create Stub Objects for Guest Names
            // B. Create Stub Objects for Guest Names
            names.forEach(n => {
                const isMe = n === user?.id; // Check if this guest ID matches current user
                foundUsers.push({
                    id: n,
                    name: n,
                    avatar_url: (isMe && user?.avatar) ? user.avatar : `https://ui-avatars.com/api/?name=${n}&background=random`
                });
            });

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

        const allUsers = Array.from(map.values());

        // Sort: Current User First, then Alphabetical
        return allUsers.sort((a, b) => {
            if (a.id === user?.id) return -1;
            if (b.id === user?.id) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [dbUsers, realtimeUsers, user?.id]);

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
