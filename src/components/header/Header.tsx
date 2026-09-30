import { getClub } from '../../utils/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'
import { RootState } from '../../store';
import { Link, useLocation } from 'react-router';
import AccountMenu from './AccountMenu';
import PublicMenu from './PublicMenu';
import NotificationDrawer from './NotificationDrawer';
import { Loader } from '../loader/Loader';
import './header.css';

export default function Header() {
    const [activeDrawer, setActiveDrawer] = useState<'account' | 'notifications' | 'public' | null>(null);
    const auth = useSelector((state: RootState) => state.auth);
    const notifications = useSelector((state: RootState) => state.notifications);
    const refreshing = useSelector((state: RootState) => state.appRefresh.refreshing);
    const isAuthChecked = auth.authChecked;
    const isLoggedin = auth.value;
    const club = getClub();
    const location = useLocation();
    const showClubNameAsBrand = isLoggedin && Boolean(club?.name);
    const notificationStateMatchesUser = notifications.clubId === auth.club_id && notifications.userId === auth._id;
    const unreadCount = notificationStateMatchesUser ? notifications.unreadCount : 0;

    useEffect(() => {
        setActiveDrawer(null);
    }, [location.key]);

    const handleLogoClick = () => {
        if (location.pathname === '/') {
            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' });
        }
    };

    return (
        <header className="header">
            <div className={`header-top-row${showClubNameAsBrand ? ' header-top-row--club-brand' : ''}`}>
                <Link to="/" className="header-logo-link" onClick={handleLogoClick}>
                    {showClubNameAsBrand ? (
                        <span className="header-brand-name">{club?.name}</span>
                    ) : (
                        <img width="250" src="/assets/logo.png" alt="abzumplatz logo" className="header-logo" />
                    )}
                </Link>
                {!isLoggedin && isAuthChecked ? (
                    <div className="header-public-actions">
                        <div className="header-login-link">
                            <Link to="/login">
                                <span>Einloggen</span>
                                <span className="icon icon--login" aria-hidden="true"></span>
                            </Link>
                        </div>
                        <PublicMenu
                            isOpen={activeDrawer === 'public'}
                            onClose={() => setActiveDrawer(null)}
                            onOpen={() => setActiveDrawer('public')}
                        />
                    </div>
                ) : !isLoggedin ? (
                    <div className="header-login-link header-login-link--placeholder" aria-hidden="true"></div>
                ) : (
                    <div className="header-user-actions">
                        <NotificationDrawer
                            isOpen={activeDrawer === 'notifications'}
                            onClose={() => setActiveDrawer(null)}
                            onOpen={() => setActiveDrawer('notifications')}
                            unreadCount={unreadCount}
                        />
                        <AccountMenu
                            isOpen={activeDrawer === 'account'}
                            onClose={() => setActiveDrawer(null)}
                            onOpen={() => setActiveDrawer('account')}
                        />
                    </div>
                )}
            </div>
            {refreshing ? <div aria-live="polite" className="header-refresh-status" role="status">
                <Loader />
                <span>Wird aktualisiert…</span>
            </div> : null}
        </header>
    )
  }
