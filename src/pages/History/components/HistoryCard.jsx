import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, PriceDisplay } from '../../../components/ui';

const HistoryCard = ({ group, onClick }) => {
    const getHistoryItemPrice = (i) => {
        if (i.is_split && i.split_parts > 1 && i.original_price > 0) {
            return Number(i.original_price) / i.split_parts;
        }
        return Number(i.price);
    };

    const itemSubtotal = group.items.reduce((acc, i) => acc + (getHistoryItemPrice(i) * i.quantity), 0);
    const itemTotal = itemSubtotal * 1.04 + 1.99; // 4% taxa + 1.99 app

    return (
        <Card clickable onClick={onClick}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{group.place}</h3>
                <PriceDisplay value={itemTotal} color="success" size="md" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Calendar size={16} />
                {group.date} • {group.items.length} itens
            </div>
        </Card>
    );
};

export default HistoryCard;
