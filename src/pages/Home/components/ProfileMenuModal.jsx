import { User, History, LogOut } from 'lucide-react';

const ProfileMenuModal = ({
    user,
    userFirstName,
    onClose,
    onNavigateProfile,
    onNavigateHistory,
    onRequestLogout
}) => {
    return (
        <div className="home-overlay-top" onClick={onClose}>
            <div className="home-profile-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="home-profile-identity">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={userFirstName}
                            className="home-profile-sheet-avatar"
                        />
                    ) : (
                        <div className="home-profile-sheet-avatar-fallback">
                            {userFirstName?.charAt(0)}
                        </div>
                    )}
                    <div className="home-profile-info">
                        <div className="home-profile-name">{userFirstName}</div>
                        <div className="home-profile-email">{user?.email || 'Cliente'}</div>
                    </div>
                </div>

                <button
                    type="button"
                    className="home-profile-menu-btn"
                    onClick={() => {
                        onClose();
                        onNavigateProfile();
                    }}
                >
                    <User size={18} />
                    <span>Meu Perfil</span>
                </button>

                <button
                    type="button"
                    className="home-profile-menu-btn"
                    onClick={() => {
                        onClose();
                        onNavigateHistory();
                    }}
                >
                    <History size={18} />
                    <span>Histórico de Consumo</span>
                </button>

                <button
                    type="button"
                    className="home-profile-menu-btn home-profile-menu-btn--danger"
                    onClick={() => {
                        onClose();
                        onRequestLogout();
                    }}
                >
                    <LogOut size={18} />
                    <span>Sair da Conta</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileMenuModal;
