import { useSelector } from 'react-redux'
import { RootState } from './../../store';
// import { getClub } from './../../utils/utils';
import { Link } from 'react-router';
import { useLocation } from 'react-router'

import './footer.css';

export default function Footer() {
    const auth = useSelector((state: RootState) => state.auth);
    //const club = getClub();
    const location = useLocation();
    const page_id = location.pathname.substring(1);

    if (auth.value && auth.role === 'admin' && auth.club_deleted) {
        return null;
    }

    return (
        (auth.value) ?
        <footer className="footer--authenticated">
            <div className="footer-content">
                <Link aria-label="Reservierungen" to="/reservations"><span aria-hidden="true" className={`icon icon--calendar${page_id === 'reservations' ? ' selected' : ''}`}></span><span className="footer-link-label">Platz buchen</span></Link>
                <Link aria-label="Meine Buchungen" to="/bookings"><span aria-hidden="true" className={`icon icon--list${page_id === 'bookings' ? ' selected' : ''}`}></span><span className="footer-link-label">Meine Buchungen</span></Link>
                <Link aria-label="Turniere" to="/tournaments">
                    <span aria-hidden="true" className={`icon icon--trophy${page_id.startsWith('tournaments') ? ' selected' : ''}`}></span>
                    <span className="footer-link-label">Turniere</span>
                </Link>
                {auth.role === 'admin' &&
                    <Link aria-label="Administration" to="/admin"><span aria-hidden="true" className={`icon icon--admin${location.pathname === '/admin' || location.pathname.startsWith('/admin/') ? ' selected' : ''}`}></span><span className="footer-link-label">Admin</span></Link>
                }
            </div>
        </footer> :
        <footer>
            <div className="footer-content">
                <Link aria-label="Startseite" to="/"><span aria-hidden="true" className={`icon icon--home${page_id === '' ? ' selected' : ''}`}></span><span className="footer-link-label">Start</span></Link>
                <Link aria-label="Als Spieler registrieren" to="/register/player"><span aria-hidden="true" className={`icon icon--register${page_id === 'register/player' ? ' selected' : ''}`}></span><span className="footer-link-label">Registrieren</span></Link>
                <Link aria-label="Verein registrieren" to="/register/club"><span aria-hidden="true" className={`icon icon--group-add${page_id === 'register/club' ? ' selected' : ''}`}></span><span className="footer-link-label">Verein anlegen</span></Link>
            </div>
        </footer>
    )
}
