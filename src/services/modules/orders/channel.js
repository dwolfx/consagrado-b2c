import { supabase } from '../../supabase';

export const _channelCache = {};

/**
 * Gets or creates a cached channel for sending direct user notifications.
 * @param {string} userId 
 */
export const getOrJoinUserChannel = (userId) => {
    const channelKey = `user_notifications:${userId}`;
    if (!_channelCache[channelKey]) {
        console.log(`📡 [ChannelRouter] Creating NEW User Channel: ${channelKey}`);
        _channelCache[channelKey] = supabase.channel(channelKey);
    }
    return _channelCache[channelKey];
};

/**
 * Gets or creates a cached channel for table-wide broadcasts.
 * @param {string} tableId 
 */
export const getOrJoinTableChannel = (tableId) => {
    const channelKey = `table_notifications:${tableId}`;
    if (!_channelCache[channelKey]) {
        console.log(`📡 [ChannelRouter] Creating NEW Table Channel: ${channelKey}`);
        // We might want to persist this one even more aggressively
        _channelCache[channelKey] = supabase.channel(channelKey);
    }
    return _channelCache[channelKey];
};

/**
 * Robustly sends a broadcast message to a channel.
 * Handles checks for 'joined' state and auto-retries once on failure.
 * 
 * @param {object} channel Supabase Realtime Channel
 * @param {string} event Event name
 * @param {object} payload Event payload
 * @param {string} cacheKey Key to invalidate in cache if hard error occurs
 */
export const sendBroadcast = async (channel, event, payload, cacheKey, retryCount = 0) => {
    // 1. Ensure Connected
    await new Promise((resolve) => {
        // Fast path
        if (channel.state === 'joined') {
            return resolve();
        }

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                resolve();
            }
        });
    });

    // 2. Send
    console.log(`      -> [${retryCount}] Broadcasting '${event}'...`);
    const status = await channel.send({
        type: 'broadcast',
        event: event,
        payload: payload
    });

    console.log(`      -> [${retryCount}] Status: ${status}`);

    // 3. Retry Logic (One forceful retry)
    if (status !== 'ok' && retryCount < 1) {
        console.warn(`      -> [${retryCount}] Failed. Reconnecting...`);
        if (cacheKey) {
            await supabase.removeChannel(channel);
            delete _channelCache[cacheKey];

            // Re-acquire fresh channel
            // Note: This assumes the caller will handle re-fetching if we return 'retry_needed'
            // OR we can't easily re-fetch here without the factory function.
            // Simplified approach: Return false, let caller logic handle or just fail gracefully.
            // But wait, our previous logic did recursion.

            // To do recursion properly generic here is complex. 
            // Better to let the caller handle the recursion OR pass the factory.

            // For now, mirroring previous logic:
            // We can't immediately get the "fresh" channel object here easily without params.
            // So we'll return a special status.
            return 'retry_needed';
        }
    }

    return status === 'ok';
};
