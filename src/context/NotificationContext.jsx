import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, api } from '../services/api';
import { useAuth } from './AuthContext';
import { useTableContext } from './TableContext';
import SplitRequestModal from '../components/SplitRequestModal';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { tableId } = useTableContext();
    const [incomingRequest, setIncomingRequest] = useState(null);

    useEffect(() => {
        if (!user || !tableId) return;

        // Channel for Broadcasts
        const channel = supabase.channel(`table_notifications:${tableId}`);

        channel
            .on('broadcast', { event: 'request_split' }, (payload) => {
                const { targetIds, orderId, itemName, requesterName, requesterId } = payload.payload;

                // If I am one of the targets
                if (targetIds.includes(user.id)) {
                    setIncomingRequest({
                        id: Date.now(),
                        orderId,
                        itemName,
                        requesterName,
                        requesterId,
                        targetIds
                    });
                }
            })
            .on('broadcast', { event: 'confirm_split' }, async (payload) => {
                // If I am the requester, and I receive a confirm
                // Actually, the simpler flow for this MVP:
                // 1. Target Accepts.
                // 2. Target calls API to perform split (if they have permission) OR Target broadcasts "Accepted" back.

                // Let's rely on Target performing the split action if DB policies allow.
                // If we receive confirm_split, it means someone triggered it.
                // We can show a toast or just let the realtime updates handle the UI.
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, tableId]);

    const handleAccept = async () => {
        if (!incomingRequest) return;

        // Execute Split
        // Note: The logic requires deleting the original and creating new ones.
        // We need the full order object. Our payload only has ID.
        // We fetch it first.
        try {
            const fullOrder = await api.getOrder(incomingRequest.orderId); // We need to add this to API
            if (fullOrder) {
                // Determine targets (Requester + Targets)
                // The targets list in payload might include me and others. 
                // We should reconstruct the full list: Requester + All Targets.
                const allParticipants = [incomingRequest.requesterId, ...incomingRequest.targetIds];
                // Unique
                const uniqueParticipants = [...new Set(allParticipants)];

                await api.splitOrder(fullOrder, uniqueParticipants);
                alert("Divisão Aceita!");
                setIncomingRequest(null);
            } else {
                alert("Pedido não encontrado ou já alterado.");
                setIncomingRequest(null);
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao processar divisão.");
        }
    };

    const handleDecline = () => {
        setIncomingRequest(null);
        // Optional: Broadcast decline
    };

    return (
        <NotificationContext.Provider value={{}}>
            {children}
            {incomingRequest && (
                <SplitRequestModal
                    request={incomingRequest}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
