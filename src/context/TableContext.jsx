import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase, api } from '../services/api';
import { useAuth } from './AuthContext';

const TableContext = createContext({});

function adjustBrightness(col, percent) {
    const num = parseInt(col.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const B = ((num >> 8) & 0x00FF) + amt;
    const G = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
}

function getContrastYIQ(hexcolor) {
    hexcolor = hexcolor.replace('#', '');
    if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

export const TableProvider = ({ children }) => {
    const { user } = useAuth();
    const [tableId, setTableId] = useState(localStorage.getItem('my_table_id'));
    const hadUser = useRef(false);
    const [dbUsers, setDbUsers] = useState([]);
    const [realtimeUsers, setRealtimeUsers] = useState([]);
    const [unpaidUsers, setUnpaidUsers] = useState(new Set());
    const [establishment, setEstablishment] = useState(null);
    const [table, setTable] = useState(null);
    const [loadingTable, setLoadingTable] = useState(() => Boolean(localStorage.getItem('my_table_id')));

    // Sync tableId with localStorage
    const updateTableId = (id) => {
        if (id) {
            localStorage.setItem('my_table_id', id);
        } else {
            localStorage.removeItem('my_table_id');
        }
        setTableId(id);
    };

    // Detecta logout: quando user existia e virou null, limpa a mesa e o tema
    useEffect(() => {
        if (user) {
            hadUser.current = true;
        } else if (hadUser.current) {
            hadUser.current = false;
            updateTableId(null);
        }
    }, [user]);

    // Load Establishment Data when Table ID changes
    useEffect(() => {
        const loadEstablishment = async () => {
            if (!tableId) {
                setEstablishment(null);
                setTable(null);
                setLoadingTable(false);
                // Reset Theme to CONSAgrado Default if no table
                document.documentElement.style.setProperty('--bg-primary', '#090a0d');
                document.documentElement.style.setProperty('--brand-color', '#f59e0b');
                document.documentElement.style.setProperty('--brand-contrast', '#000000');
                document.documentElement.style.setProperty('--brand-glow', 'rgba(245, 158, 11, 0.24)');
                return;
            }

            setLoadingTable(true);
            try {
                const tableData = await api.getTable(tableId);
                if (tableData) {
                    setTable(tableData);

                    // Marca mesa como ocupada no banco (SECURITY DEFINER bypassa RLS)
                    supabase.rpc('set_table_occupied', { p_table_id: tableId })
                        .then(({ error }) => { if (error) console.warn('set_table_occupied:', error); });

                    // Establishment may come from the join OR need a separate fetch
                    // (separate fetch is needed when RLS blocks the join for anon users)
                    if (tableData.establishment) {
                        setEstablishment(tableData.establishment);
                    } else if (tableData.establishment_id) {
                        const estData = await api.getEstablishment(tableData.establishment_id);
                        setEstablishment(estData || null);
                    } else {
                        setEstablishment(null);
                    }
                } else {
                    setEstablishment(null);
                    setTable(null);
                }
            } catch (err) {
                console.error("Error loading table context:", err);
                setEstablishment(null);
                setTable(null);
            } finally {
                setLoadingTable(false);
            }
        };

        loadEstablishment();
    }, [tableId]);

    // --- Realtime: atualiza tema quando o dono muda as cores no B2B ---
    useEffect(() => {
        if (!establishment?.id) return;

        const channel = supabase.channel(`ctx_est:${establishment.id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'establishments', filter: `id=eq.${establishment.id}` },
                (payload) => {
                    if (payload.new) setEstablishment(payload.new);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [establishment?.id]);

    // Apply Theme when Establishment Data is loaded/changes
    useEffect(() => {
        if (!establishment) {
            // Reset to CONSAgrado brand defaults if no establishment
            document.documentElement.style.setProperty('--bg-primary', '#090a0d');
            document.documentElement.style.setProperty('--brand-color', '#f59e0b');
            document.documentElement.style.setProperty('--brand-contrast', '#000000');
            document.documentElement.style.setProperty('--brand-secondary', '#d97706');
            document.documentElement.style.setProperty('--brand-glow', 'rgba(245, 158, 11, 0.24)');
            document.documentElement.style.setProperty('--bg-gradient', 'none');
            return;
        }

        // APPLY THEME
        const brandColor = establishment.theme_color || '#f59e0b';

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

    


    // --- 1. DB Presence (Users with Active Orders) ---
    useEffect(() => {
        if (!tableId) {
            setDbUsers([]);
            return;
        }

        const fetchActiveUsers = async () => {
            // Busca todos os pedidos da mesa para mapear os participantes históricos e atuais
            // (inclusive quem já pagou ou pediu divisão, para nunca perder o nome e avatar)
            const { data: orders } = await supabase
                .from('orders')
                .select('ordered_by, split_requester, split_participants, status')
                .eq('table_id', tableId)
                .neq('name', '🔔 CHAMAR GARÇOM');

            if (!orders) return;

            const rawIdSet = new Set();
            const unpaidSet = new Set();

            orders.forEach(o => {
                if (o.ordered_by) rawIdSet.add(o.ordered_by);
                if (o.split_requester) rawIdSet.add(o.split_requester);
                if (Array.isArray(o.split_participants)) {
                    o.split_participants.forEach(p => rawIdSet.add(p));
                }

                // Usuários com pedidos ainda não pagos nesta mesa
                if (o.status !== 'paid') {
                    if (o.ordered_by) unpaidSet.add(o.ordered_by);
                    if (o.split_requester) unpaidSet.add(o.split_requester);
                    if (Array.isArray(o.split_participants)) {
                        o.split_participants.forEach(p => unpaidSet.add(p));
                    }
                }
            });

            setUnpaidUsers(unpaidSet);
            const rawIds = [...rawIdSet];
            const foundUsers = [];

            // Separate UUIDs (registered users) from Strings (guest names)
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const uuids = rawIds.filter(id => uuidPattern.test(id));
            const names = rawIds.filter(id => !uuidPattern.test(id));

            // A. Fetch Profiles for UUIDs - dados públicos da mesa (NUNCA expor CPF ou passaporte para outros usuários)
            if (uuids.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, name, email, phone, avatar_url, settings, country')
                    .in('id', uuids);
                if (profiles) {
                    profiles.forEach(p => foundUsers.push({
                        id: p.id,
                        name: p.name,
                        email: p.email,
                        phone: p.phone,
                        country: p.country || 'BR',
                        settings: p.settings || {},
                        avatar_url: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || '?')}&background=random`
                    }));
                }
            }

            // B. Create Stub Objects for Guest Names
            names.forEach(n => {
                const isMe = n === user?.id; // Check if this guest ID matches current user
                foundUsers.push({
                    id: n,
                    name: n,
                    is_guest: true,
                    avatar_url: (isMe && user?.avatar) ? user.avatar : `https://ui-avatars.com/api/?name=${n}&background=random`
                });
            });

            setDbUsers(foundUsers);
        };

        fetchActiveUsers();

        // Subscription em orders: re-busca usuários quando pedidos mudam
        const orderChannel = supabase.channel(`ctx_orders:${tableId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, fetchActiveUsers)
            .subscribe();

        // Subscription em profiles: atualiza avatar/nome em tempo real
        // sem re-buscar tudo — só troca o usuário afetado
        const profileChannel = supabase.channel(`ctx_profiles:${tableId}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles' },
                (payload) => {
                    const updated = payload.new;
                    setDbUsers(prev => prev.map(u =>
                        u.id === updated.id
                            ? {
                                ...u,
                                name: updated.name || u.name,
                                avatar_url: updated.avatar_url || u.avatar_url,
                            }
                            : u
                    ));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(orderChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [tableId, user?.id, user?.avatar]);

    // --- 2. Realtime Presence ---
    // Canal criado/destruído apenas quando tableId ou user.id muda
    // (não recria o canal a cada mudança de avatar/nome)
    useEffect(() => {
        if (!user?.id || !tableId) {
            setRealtimeUsers([]);
            return;
        }

        const channel = supabase.channel(`ctx_presence:${tableId}`, {
            config: { presence: { key: user.id } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const liveList = Object.values(state)
                    .filter(arr => arr.length > 0)
                    .map(arr => arr[0]);
                setRealtimeUsers(liveList);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        id: user.id,
                        name: user.name || 'Visitante',
                        email: user.email,
                        phone: user.phone || null,
                        settings: user.settings || {},
                        is_guest: Boolean(user.is_guest || user.id?.startsWith?.('guest')),
                        avatar_url: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'V')}&background=random`
                    });
                }
            });

        return () => supabase.removeChannel(channel);
    }, [user?.id, tableId]);

    // Re-track quando avatar, nome, telefone ou privacidade mudam (sem recriar o canal)
    useEffect(() => {
        if (!user?.id || !tableId) return;

        const channel = supabase.getChannels().find(
            ch => ch.topic === `realtime:ctx_presence:${tableId}`
        );
        if (!channel) return;

        channel.track({
            id: user.id,
            name: user.name || 'Visitante',
            email: user.email,
            phone: user.phone || null,
            settings: user.settings || {},
            is_guest: Boolean(user.is_guest || user.id?.startsWith?.('guest')),
            avatar_url: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'V')}&background=random`
        });
    }, [user?.name, user?.avatar, user?.phone, user?.settings]);

    // --- 3. Canal de Presença Global do Estabelecimento ---
    // O B2B (tela Clientes) assina esse canal como observador para ver quem está na casa
    useEffect(() => {
        if (!user?.id || !tableId || !establishment?.id) return;

        const tableLabel = table?.name || (table?.number ? `Mesa ${table.number}` : null);

        const ch = supabase.channel(`ctx_est_presence:${establishment.id}`, {
            config: { presence: { key: user.id } },
        });

        ch.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await ch.track({
                    id: user.id,
                    name: user.name || 'Visitante',
                    avatar_url: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'V')}&background=random`,
                    tableId,
                    tableLabel,
                });
            }
        });

        return () => supabase.removeChannel(ch);
    }, [user?.id, tableId, establishment?.id]);

    // Re-track no canal global quando nome, avatar ou mesa mudam
    useEffect(() => {
        if (!user?.id || !tableId || !establishment?.id) return;

        const ch = supabase.getChannels().find(
            c => c.topic === `realtime:ctx_est_presence:${establishment.id}`
        );
        if (!ch) return;

        const tableLabel = table?.name || (table?.number ? `Mesa ${table.number}` : null);
        ch.track({
            id: user.id,
            name: user.name || 'Visitante',
            avatar_url: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'V')}&background=random`,
            tableId,
            tableLabel,
        });
    }, [user?.name, user?.avatar, table?.number, table?.name]);

    // Derived state: Merge DB and Realtime
    // Se alguém saiu da mesa E já pagou o que deve, ela NÃO aparece na lista da mesa!
    // Se ela ainda não pagou o que deve, continua vinculada à mesa.
    const onlineUsers = useMemo(() => {
        const map = new Map();

        // 1. Usuários ativos em tempo real na mesa agora
        realtimeUsers.forEach(u => map.set(u.id, { ...u, isOnline: true }));

        // 2. Usuários que AINDA NÃO PAGARAM o que devem (permanecem vinculados)
        dbUsers.forEach(u => {
            const hasUnpaid = unpaidUsers.has(u.id);
            if (hasUnpaid || map.has(u.id)) {
                map.set(u.id, { ...u, ...(map.get(u.id) || {}), hasUnpaid });
            }
        });

        const allUsers = Array.from(map.values());

        // Sort: Current User First, then Alphabetical
        return allUsers.sort((a, b) => {
            if (a.id === user?.id) return -1;
            if (b.id === user?.id) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [dbUsers, realtimeUsers, unpaidUsers, user?.id]);

    return (
        <TableContext.Provider value={{
            tableId,
            table,
            loadingTable,
            setTableId: updateTableId,
            onlineUsers,
            knownTableUsers: dbUsers,
            establishment
        }}>
            {children}
        </TableContext.Provider>
    );
};

export const useTableContext = () => useContext(TableContext);
