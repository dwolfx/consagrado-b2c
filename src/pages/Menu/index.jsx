import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import SplashScreen from '../../components/SplashScreen/SplashScreen';
import SplitItemModal from '../../components/SplitItemModal';
import TableUsersModal from '../../components/TableUsersModal';
import MenuHeader from './components/MenuHeader';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import PizzaBuilderModal from './components/PizzaBuilderModal';
import SplitStatusModal from './components/SplitStatusModal';
import CartFooter from './components/CartFooter';

import { useMenuLogic } from './hooks/useMenuLogic';
import './Menu.css';

const Menu = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const {
        branding,
        categories,
        products,
        onlineUsers,
        cart,
        order,
        split,
        pizza
    } = useMenuLogic(user, addToast, navigate);

    const [searchTerm, setSearchTerm] = useState('');
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);

    const filteredItems = products.list.filter((item) => {
        if (item.isSplit) return false;
        if (searchTerm.trim()) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return item.category === categories.selected;
    });

    const onlineUsersSafe = onlineUsers && onlineUsers.length > 0
        ? onlineUsers
        : [user || { id: 'guest', name: 'Você' }];

    if (branding.loading) {
        return <SplashScreen />;
    }

    return (
        <div className="container menu-page-container">
            <MenuHeader
                establishmentName={branding.establishmentName}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onlineUsersCount={onlineUsers.length}
                onOpenUsersModal={() => setShowUsersModal(true)}
                onBack={() => navigate(-1)}
            />

            {!searchTerm && (
                <CategoryTabs
                    categories={categories.list}
                    selectedCategory={categories.selected}
                    onSelectCategory={categories.select}
                />
            )}

            <ProductGrid
                items={filteredItems}
                cart={cart.data}
                userId={user?.id || 'guest'}
                selectedCategory={categories.selected}
                searchTerm={searchTerm}
                onItemClick={(item) => setSelectedDetailProduct(item)}
                onUpdateCart={cart.update}
                onOpenPizzaBuilder={() => setShowPizzaBuilder(true)}
            />

            <CartFooter
                count={cart.count}
                total={cart.total}
                sending={order.sending}
                onCheckout={order.handleSend}
            />

            {selectedDetailProduct && (
                <ProductDetailModal
                    product={selectedDetailProduct}
                    onClose={() => setSelectedDetailProduct(null)}
                    onAddToCart={(prod, qty) => {
                        cart.update(user?.id || 'guest', prod, qty);
                        addToast(`${qty}x ${prod.name} adicionado ao carrinho!`, 'success');
                    }}
                />
            )}

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

            {showUsersModal && (
                <TableUsersModal
                    users={onlineUsersSafe}
                    onClose={() => setShowUsersModal(false)}
                />
            )}
        </div>
    );
};

export default Menu;
