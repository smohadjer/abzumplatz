import { useSelector } from 'react-redux'
import { RootState } from './../../store';
import './header.css';

export default function Header() {
    const auth = useSelector((state: RootState) => state.auth);

    return (
        <header>
            <h1>abzumplatz</h1>
            {(auth.value && auth.club) &&
                <p>{auth.first_name + ' ' + auth.last_name + ', ' + auth.club.name}</p>
            }
        </header>
    )
  }
