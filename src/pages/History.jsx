import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppHeader, EmptyState, LoadingSpinner } from '../components/ui';
import HistoryCard from './History/components/HistoryCard';
import ReceiptModal from './History/components/ReceiptModal';

const History = () => {
    const { user } = useAuth();
    const [historyGroups, setHistoryGroups] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.id) return;
            const orders = await api.getUserHistory(user.id);

            const groups = {};

            (orders || []).forEach(order => {
                if (order.status === 'service_call' || order.name === '🔔 CHAMAR GARÇOM') return;

                const dateObj = new Date(order.created_at);
                const dateKey = dateObj.toLocaleDateString('pt-BR');
                const estabName = order.table?.establishment?.name || order.establishment?.name || 'Local Desconhecido';
                const key = `${dateKey}-${estabName}`;

                if (!groups[key]) {
                    groups[key] = {
                        id: key,
                        place: estabName,
                        date: dateKey,
                        timestamp: dateObj.getTime(),
                        items: []
                    };
                }

                groups[key].items.push(order);
            });

            const sortedGroups = Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
            setHistoryGroups(sortedGroups);
            setLoading(false);
        };

        fetchHistory();
    }, [user?.id]);

    return (
        <div className="container fade-in">
            <AppHeader title="Histórico" />

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <LoadingSpinner size={32} />
                    </div>
                ) : historyGroups.length === 0 ? (
                    <EmptyState
                        icon={<ShoppingBag size={28} />}
                        title="Nenhum pedido anterior"
                        description="Você ainda não possui histórico de consumos registrados."
                    />
                ) : (
                    historyGroups.map(group => (
                        <HistoryCard
                            key={group.id}
                            group={group}
                            onClick={() => setSelectedOrder(group)}
                        />
                    ))
                )}
            </div>

            <ReceiptModal
                selectedOrder={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    );
};

export default History;
