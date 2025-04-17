import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import { Club } from './../../types';
import './header.css';

export default function Header() {
    const auth = useSelector((state: RootState) => state.auth);
    const clubs: Club[] = useSelector((state: RootState) => state.clubs.value);
    const club = clubs.find((club: Club) => club._id === auth.club_id);

    return (
        <header>
            <h1>abzumplatz</h1>
            {(auth.value && club) &&
                <p>{auth.first_name + ' ' + auth.last_name + ', ' + club.name}</p>
            }
        </header>
    )
  }
