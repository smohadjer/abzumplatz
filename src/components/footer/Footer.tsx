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

    return (
        (auth.value) ?
        <footer>
            <Link aria-label="Reservierungen" to="/reservations"><span aria-hidden="true" className={`icon icon--home${page_id === 'reservations' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Meine Buchungen" to="/bookings"><span aria-hidden="true" className={`icon icon--list${page_id === 'bookings' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Einstellungen" to="/settings"><span aria-hidden="true" className={`icon icon--settings${page_id === 'settings' ? ' selected' : ''}`}></span></Link>
            {auth.role === 'admin' &&
                 <Link aria-label="Administration" to="/admin"><span aria-hidden="true" className={`icon icon--admin${page_id === 'admin' ? ' selected' : ''}`}></span></Link>
            }
        </footer> :
        <footer>
            <Link aria-label="Startseite" to="/"><span aria-hidden="true" className={`icon icon--home${page_id === '' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Anmelden" to="/login"><span aria-hidden="true" className={`icon icon--login${page_id === 'login' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Als Spieler registrieren" to="/register/player"><span aria-hidden="true" className={`icon icon--register${page_id === 'register/player' ? ' selected' : ''}`}></span></Link>
            <Link aria-label="Verein registrieren" to="/register/club"><span aria-hidden="true" className={`icon icon--group-add${page_id === 'register/club' ? ' selected' : ''}`}></span></Link>
        </footer>
    )
}
