import { getClub } from '../../utils/utils';
import { useSelector } from 'react-redux'
import { RootState } from '../../store';
import { useLocation } from 'react-router';
import './header.css';

export default function Header() {
    const auth = useSelector((state: RootState) => state.auth);
    const isLoggedin = auth.value;
    const club = getClub();
    const location = useLocation();
    const isHomepage = location.pathname === '/';

    return (
        <header>
            <h1>{isLoggedin && club ? club.name : 'abzumplatz'}</h1>
            {isHomepage && <p>Kostenlose Platzreservierung für Tennisvereine</p>}
        </header>
    )
  }
