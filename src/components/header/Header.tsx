import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import { getClub } from './../../utils/utils';
import './header.css';

export default function Header() {
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();

    return (
        <header>
            <h1>abzumplatz</h1>
            {(auth.value && club) &&
                <p>{auth.first_name + ' ' + auth.last_name + ', ' + club.name}</p>
            }
        </header>
    )
  }
