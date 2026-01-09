import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../../../services/api';

const FavoritesSection = ({ userId, onItemClick }) => {
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        if (!userId) return;
        const loadFavorites = async () => {
            // Fetch last 40 orders to find frequency
            const { data } = await supabase
                .from('orders')
                .select('*, product:products(*)') // Join products to get image/details
                .eq('ordered_by', userId)
                .neq('status', 'service_call') // Ignore waiter calls
                .neq('product_id', null)
                .order('created_at', { ascending: false })
                .limit(40);

            if (data && data.length > 0) {
                // Deduplicate by Product ID
                const uniqueMap = new Map();
                data.forEach(order => {
                    // Use product data if available (better for images), else order fallback
                    const prod = order.product || {
                        id: order.product_id,
                        name: order.name,
                        price: order.price, // Might be split price, careful
                        image: null // fallback
                    };

                    // Skip if it looks like a split fragment (name starts with "1/")
                    if (order.name.match(/^\d+\//)) return;

                    if (!uniqueMap.has(prod.id)) {
                        uniqueMap.set(prod.id, prod);
                    }
                });
                setFavorites(Array.from(uniqueMap.values()).slice(0, 5)); // Top 5 recent
            }
        };
        loadFavorites();
    }, [userId]);

    if (favorites.length === 0) return null;

    return (
        <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
                <Star size={18} fill="var(--brand-color)" color="var(--brand-color)" />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Pedir Novamente</h3>
            </div>
            <div style={{
                display: 'flex', gap: '0.75rem', overflowX: 'auto',
                paddingBottom: '0.5rem', scrollbarWidth: 'none', margin: '0 -1rem', padding: '0 1rem'
            }}>
                {favorites.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        style={{
                            minWidth: '140px', maxWidth: '140px',
                            background: 'var(--bg-secondary)',
                            padding: '0.75rem', borderRadius: '12px',
                            border: '1px solid var(--bg-tertiary)',
                            cursor: 'pointer', flexShrink: 0
                        }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <img
                                src={item.image_url || item.image}
                                alt={item.name}
                                style={{
                                    width: '100%', height: '80px', objectFit: 'cover',
                                    borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)'
                                }}
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                        <h4 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                            R$ {Number(item.price).toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FavoritesSection;
