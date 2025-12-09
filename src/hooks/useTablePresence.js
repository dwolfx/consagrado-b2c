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

        // Create a channel for the table
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
                console.log('Presence sync:', newState);

                // Transform presence state into flat user list
                const users = [];
                for (let key in newState) {
                    // newState[key] is an array of presence objects for that key
                    // We typically just take the first one if we assume 1 device per user ID
                    if (newState[key].length > 0) {
                        users.push(newState[key][0]);
                    }
                }
                setOnlineUsers(users);
            })
            // .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            //     console.log('join', key, newPresences)
            // })
            // .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            //     console.log('leave', key, leftPresences)
            // })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Send my own presence data
                    const userData = {
                        id: user.id || 'guest',
                        name: user.name || 'Visitante',
                        email: user.email,
                        avatar_url: `https://ui-avatars.com/api/?name=${user.name || 'Visitante'}&background=random`
                    };

                    await channel.track(userData);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, tableId]);

    return { onlineUsers, tableId };
};
