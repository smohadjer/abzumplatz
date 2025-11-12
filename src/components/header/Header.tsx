import { getClub } from '../../utils/utils';
import { useSelector } from 'react-redux'
import { RootState } from '../../store';
import './header.css';

export default function Header() {
    const auth = useSelector((state: RootState) => state.auth);
    const isLoggedin = auth.value;
    const club = getClub();

    return (
        <header>
            <h1>{isLoggedin && club ? club.name : 'abzumplatz'}</h1>
        </header>
    )
  }
