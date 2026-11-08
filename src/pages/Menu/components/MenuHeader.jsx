import React from 'react';
import { ArrowLeft, Search, Users } from 'lucide-react';

const MenuHeader = ({
    establishmentName,
    searchTerm,
    onSearchChange,
    onlineUsersCount = 1,
    onOpenUsersModal,
    onBack
}) => {
    const isMultiUsers = onlineUsersCount > 1;
    const pillClass = isMultiUsers
        ? 'menu-users-pill menu-users-pill--active'
        : 'menu-users-pill';

    const placeholderText = establishmentName
        ? `Buscar em ${establishmentName}...`
        : 'Buscar no cardápio...';

    return (
        <header className="menu-header">
            <button
                type="button"
                onClick={onBack}
                className="menu-back-btn"
                aria-label="Voltar"
            >
                <ArrowLeft size={18} />
            </button>

            <div className="menu-search-wrap">
                <Search size={16} className="menu-search-icon" />
                <input
                    type="text"
                    placeholder={placeholderText}
                    className="menu-search-input"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <button
                type="button"
                onClick={onOpenUsersModal}
                title="Pessoas na mesa"
                aria-label="Pessoas na mesa"
                className={pillClass}
            >
                <Users size={16} />
                <span>{onlineUsersCount}</span>
            </button>
        </header>
    );
};

export default MenuHeader;
