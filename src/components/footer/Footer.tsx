import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import { getClub } from './../../utils/utils';
import { Link } from 'react-router';

import './footer.css';

export default function Footer() {
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();

    return (
        (auth.value && club) &&
        <footer>
            <Link to="/reservations"><span className="icon icon--home"></span></Link>
            <Link to="/bookings"><span className="icon icon--list"></span></Link>
            <Link to="/profile"><span className="icon icon--account"></span></Link>
        </footer>
    )
}
