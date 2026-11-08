import BrandLogo from '../../../components/BrandLogo';

const HomeHeader = ({ user, userFirstName, onToggleProfileMenu }) => {
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : (userFirstName?.charAt(0) || 'V');

    return (
        <header className="home-header">
            <BrandLogo variant="horizontal" size="xs" glow={false} />

            <button
                type="button"
                className="home-user-pill"
                onClick={onToggleProfileMenu}
                aria-label="Perfil do usuário"
            >
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={userFirstName}
                        className="home-user-avatar"
                    />
                ) : (
                    <div className="home-user-avatar-fallback">
                        {initials}
                    </div>
                )}
                <span className="home-user-name">{userFirstName}</span>
            </button>
        </header>
    );
};

export default HomeHeader;
