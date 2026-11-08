export const resolveParticipantInfo = (id, onlineUsers = [], allOrders = [], knownUsers = []) => {
    if (!id) return { name: 'Visitante', avatar_url: null };
    const found = onlineUsers.find(u => String(u.id) === String(id));
    if (found && found.name && found.name !== 'Alguém') {
        return found;
    }
    const known = knownUsers.find(u => String(u.id) === String(id));
    if (known && known.name && known.name !== 'Alguém') {
        return known;
    }
    // Fallback: procura nos pedidos algum usuário gravado ou customer_name
    const orderMatch = allOrders.find(o => String(o.ordered_by) === String(id));
    if (orderMatch && orderMatch.customer_name) {
        return { name: orderMatch.customer_name, avatar_url: null };
    }
    return found || known || { name: 'Visitante', avatar_url: null };
};

export const checkParticipantPaid = (id, groupItems = [], allOrders = []) => {
    if (!id) return false;
    // 1. Checa se em groupItems o pedido desse usuário está como 'paid'
    const inGroup = groupItems.find(o => String(o.ordered_by) === String(id));
    if (inGroup && inGroup.status === 'paid') return true;

    // 2. Checa em allOrders usando order_batch_id
    const batchId = groupItems[0]?.order_batch_id;
    if (batchId) {
        const inBatch = allOrders.find(o => o.order_batch_id === batchId && String(o.ordered_by) === String(id));
        if (inBatch && inBatch.status === 'paid') return true;
    }

    return false;
};
