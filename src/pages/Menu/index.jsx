import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Components
import SkeletonProductCard from '../../components/SkeletonProductCard';
import SplitItemModal from '../../components/SplitItemModal';
import FavoritesSection from './components/FavoritesSection';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid from './components/ProductGrid';
import PizzaBuilderModal from './components/PizzaBuilderModal';
import SplitStatusModal from './components/SplitStatusModal';
import CartFooter from './components/CartFooter';

// Hook
import { useMenuLogic } from './hooks/useMenuLogic';

const Menu = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    // Hook encapsulates all complex logic
    const {
        branding, categories, products, onlineUsers, cart, order, split, pizza
    } = useMenuLogic(user, addToast, navigate);

    const [searchTerm, setSearchTerm] = useState('');
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);

    // Filter Logic (UI concern)
    const filteredItems = products.list.filter(item => {
        if (item.isSplit) return false;
        if (searchTerm.trim()) return item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return item.category === categories.selected;
    });

    const onlineUsersSafe = onlineUsers && onlineUsers.length > 0 ? onlineUsers : [user || { id: 'guest', name: 'Você' }];

    if (branding.loading) return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <div style={{ marginTop: '1rem', height: '40px', borderRadius: '12px', background: 'var(--bg-tertiary)' }} />
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'hidden', paddingBottom: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} style={{ minWidth: '80px', height: '80px', background: 'var(--bg-tertiary)', borderRadius: '16px' }} />
                ))}
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {Array(6).fill(0).map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
        </div>
    );

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            {/* Header */}
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={branding.establishmentName ? `Buscar em ${branding.establishmentName}...` : "Buscar..."}
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', marginBottom: 0, height: '40px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--bg-tertiary)', padding: '0.6rem', borderRadius: '12px',
                    border: onlineUsers.length > 1 ? '1px solid var(--primary)' : '1px solid transparent'
                }}>
                    <Users size={20} color={onlineUsers.length > 1 ? 'var(--primary)' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: onlineUsers.length > 1 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {onlineUsers.length}
                    </span>
                </div>
            </header>

            {/* Favorites */}
            {!searchTerm && !branding.loading && (
                <FavoritesSection userId={user?.id} onItemClick={cart.addItem} />
            )}

            {/* Categories */}
            {!searchTerm && (
                <CategoryTabs
                    categories={categories.list}
                    selectedCategory={categories.selected}
                    onSelectCategory={categories.select}
                />
            )}

            {/* Products */}
            <ProductGrid
                items={filteredItems}
                cart={cart.data}
                userId={user?.id || 'guest'}
                selectedCategory={categories.selected}
                searchTerm={searchTerm}
                onItemClick={cart.addItem}
                onUpdateCart={cart.update}
                onOpenPizzaBuilder={() => setShowPizzaBuilder(true)}
            />

            {/* Footer */}
            <CartFooter
                count={cart.count}
                total={cart.total}
                sending={order.sending}
                onCheckout={order.handleSend}
            />

            {/* Modals */}
            {split.splittingItem && (
                <SplitItemModal
                    item={split.splittingItem}
                    currentUser={user || { id: 'guest', name: 'Você' }}
                    onlineUsers={onlineUsersSafe}
                    onClose={() => split.setSplittingItem(null)}
                    onConfirm={split.handleSplitConfirm}
                    confirmLabel="Confirmar Pedido"
                />
            )}

            <PizzaBuilderModal
                isOpen={showPizzaBuilder}
                onClose={() => setShowPizzaBuilder(false)}
                products={products.list}
                category={categories.selected}
                onConfirm={(f1, f2) => pizza.confirm(f1, f2, () => setShowPizzaBuilder(false))}
            />

            <SplitStatusModal
                status={split.waitStatus}
                responderName={split.responderName}
                onCancel={split.reset}
                onContinueAlone={split.continueAlone}
            />
        </div>
    );
};

export default Menu;
