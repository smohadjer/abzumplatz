import { getClub, onLogout } from '../../utils/utils';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store';
import { Link, useLocation } from 'react-router';
import './header.css';

export default function Header() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const isAuthChecked = auth.authChecked;
    const isLoggedin = auth.value;
    const club = getClub();
    const location = useLocation();
    const showClubNameAsBrand = isLoggedin && Boolean(club?.name);

    const handleLogoClick = () => {
        if (location.pathname === '/') {
            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' });
        }
    };

    return (
        <header className="header">
            <div className="header-top-row">
                <Link to="/" className="header-logo-link" onClick={handleLogoClick}>
                    {showClubNameAsBrand ? (
                        <span className="header-brand-name">{club?.name}</span>
                    ) : (
                        <img width="250" src="/assets/logo.png" alt="abzumplatz logo" className="header-logo" />
                    )}
                </Link>
                {isLoggedin ? (
                    <div className="header-login-link">
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            onLogout(dispatch);
                        }}>
                            <span>Abmelden</span>
                            <span className="icon icon--logout" aria-hidden="true"></span>
                        </a>
                    </div>
                ) : isAuthChecked ? (
                    <div className="header-login-link">
                        <Link to="/login">
                            <span>Anmelden</span>
                            <span className="icon icon--login" aria-hidden="true"></span>
                        </Link>
                    </div>
                ) : (
                    <div className="header-login-link header-login-link--placeholder" aria-hidden="true"></div>
                )}
            </div>
        </header>
    )
  }
