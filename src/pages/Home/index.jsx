import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TableUsersModal from '../../components/TableUsersModal';
import SplitItemModal from '../../components/SplitItemModal';
import { useHomeLogic } from './hooks/useHomeLogic';
import HomeHeader from './components/HomeHeader';
import TableHeroCard from './components/TableHeroCard';
import FeaturedCarouselMD from './components/FeaturedCarouselMD';
import UsualOrdersCarouselSM from './components/UsualOrdersCarouselSM';
import PrimaryActionsRow from './components/PrimaryActionsRow';
import OrderStatusDock from './components/OrderStatusDock';
import NoTableSection from './components/NoTableSection';
import ProfileMenuModal from './components/ProfileMenuModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import ProductDetailModal from '../Menu/components/ProductDetailModal';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const {
        user,
        userFirstName,
        tableId,
        table,
        establishment,
        onlineUsers,
        statusBadge,
        showManualInput,
        setShowManualInput,
        manualCode,
        setManualCode,
        showUsersModal,
        setShowUsersModal,
        showLogoutConfirm,
        setShowLogoutConfirm,
        confirmLogout,
        handleManualSubmit,
        waiterCooldown,
        handleCallWaiter,
        contextualTitle,
        featuredProducts,
        usualProducts,
        selectedQuickProduct,
        setSelectedQuickProduct,
        splittingProduct,
        setSplittingProduct,
        handleSplitHomeConfirm,
        cartCount,
        handleAddToCart
    } = useHomeLogic();

    const containerClass = `container fade-in ${
        tableId ? 'home-container' : 'home-container--no-table'
    }`;

    return (
        <div className={containerClass}>
            <HomeHeader
                user={user}
                userFirstName={userFirstName}
                onToggleProfileMenu={() => setShowProfileMenu((prev) => !prev)}
            />

            <main className="home-main">
                {tableId ? (
                    <>
                        <TableHeroCard
                            establishment={establishment}
                            table={table}
                            currentUser={user}
                            onlineUsers={onlineUsers}
                            onOpenUsersModal={() => setShowUsersModal(true)}
                        />

                        <FeaturedCarouselMD
                            title={contextualTitle}
                            products={featuredProducts}
                            onNavigateMenu={() => navigate('/menu')}
                            onSelectProduct={(prod) => setSelectedQuickProduct(prod)}
                        />

                        <UsualOrdersCarouselSM
                            products={usualProducts}
                            onNavigateMenu={() => navigate('/menu')}
                            onSelectProduct={(prod) => setSelectedQuickProduct(prod)}
                        />

                        <PrimaryActionsRow
                            onNavigateMenu={() => navigate('/menu')}
                            onCallWaiter={handleCallWaiter}
                            waiterCooldown={waiterCooldown}
                            cartCount={cartCount}
                        />

                        <OrderStatusDock
                            statusBadge={statusBadge}
                            onNavigateTab={() => navigate('/tab')}
                        />
                    </>
                ) : (
                    <NoTableSection
                        showManualInput={showManualInput}
                        setShowManualInput={setShowManualInput}
                        manualCode={manualCode}
                        setManualCode={setManualCode}
                        onManualSubmit={handleManualSubmit}
                        onNavigateScanner={() => navigate('/scanner')}
                        onNavigateHistory={() => navigate('/history')}
                        onNavigateMenu={() => navigate('/menu')}
                    />
                )}
            </main>

            {selectedQuickProduct && (
                <ProductDetailModal
                    product={selectedQuickProduct}
                    onClose={() => setSelectedQuickProduct(null)}
                    onAddToCart={handleAddToCart}
                    onSplit={(prod, qty) => {
                        setSelectedQuickProduct(null);
                        setSplittingProduct({
                            ...prod,
                            quantity: qty,
                            price: (Number(prod.price) || 0) * qty,
                            original_price: (Number(prod.price) || 0) * qty
                        });
                    }}
                />
            )}

            {splittingProduct && (
                <SplitItemModal
                    item={splittingProduct}
                    currentUser={user || { id: 'guest', name: 'Você' }}
                    onlineUsers={onlineUsers}
                    onClose={() => setSplittingProduct(null)}
                    onConfirm={handleSplitHomeConfirm}
                    confirmLabel="Confirmar Divisão e Pedir"
                />
            )}

            {showProfileMenu && (
                <ProfileMenuModal
                    user={user}
                    userFirstName={userFirstName}
                    onClose={() => setShowProfileMenu(false)}
                    onNavigateProfile={() => navigate('/profile')}
                    onNavigateHistory={() => navigate('/history')}
                    onRequestLogout={() => setShowLogoutConfirm(true)}
                />
            )}

            {showUsersModal && (
                <TableUsersModal
                    users={onlineUsers}
                    onClose={() => setShowUsersModal(false)}
                />
            )}

            {showLogoutConfirm && (
                <LogoutConfirmModal
                    onCancel={() => setShowLogoutConfirm(false)}
                    onConfirm={confirmLogout}
                />
            )}
        </div>
    );
};

export default Home;
