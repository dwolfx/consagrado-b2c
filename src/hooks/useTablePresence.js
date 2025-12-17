import { useTableContext } from '../context/TableContext';

export const useTablePresence = () => {
    // Forwarding to Context to maintain API compatibility with existing components
    const { onlineUsers, tableId } = useTableContext();
    return { onlineUsers, tableId };
};

