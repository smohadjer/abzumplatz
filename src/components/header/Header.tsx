import { getClub, onLogout } from '../../utils/utils';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store';
import { Link, useLocation } from 'react-router';
import './header.css';

export default function Header() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const isLoggedin = auth.value;
    const club = getClub();
    const location = useLocation();

    const handleLogoClick = () => {
        if (location.pathname === '/') {
            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' });
        }
    };

    return (
        <header className="header">
            <div className="header-top-row">
                {/* <h1>{isLoggedin && club ? club.name : 'abzumplatz'}</h1> */}
                <Link to="/" className="header-logo-link" onClick={handleLogoClick}>
                    <img width="250" src="/assets/logo.png" alt="abzumplatz logo" className="header-logo" />
                </Link>
                {club ? <p className="header-club-name">{club.name}</p> : null}
                {isLoggedin ? 
                    <div className="header-login-link">
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            onLogout(dispatch);
                        }}>
                            <span>Abmelden</span>
                            <span className="icon icon--logout" aria-hidden="true"></span>
                        </a>
                    </div>
                : (
                    <div className="header-login-link">
                        <Link to="/login">
                            <span>Anmelden</span>
                            <span className="icon icon--login" aria-hidden="true"></span>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    )
  }
