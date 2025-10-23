import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import { getClub } from './../../utils/utils';
import { Link } from 'react-router';
import { useLocation } from 'react-router'

import './footer.css';

export default function Footer() {
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const location = useLocation();
    const page_id = location.pathname.substring(1);

    return (
        (auth.value && club) &&
        <footer>
            <Link to="/reservations"><span className={`icon icon--home${page_id === 'reservations' ? ' selected' : ''}`}></span></Link>
            <Link to="/bookings"><span className={`icon icon--list${page_id === 'bookings' ? ' selected' : ''}`}></span></Link>
            <Link to="/profile"><span className={`icon icon--account${page_id === 'profile' ? ' selected' : ''}`}></span></Link>
            {auth.role === 'admin' &&
                 <Link to="/admin"><span className={`icon icon--admin${page_id === 'admin' ? ' selected' : ''}`}></span></Link>
            }
        </footer>
    )
}
