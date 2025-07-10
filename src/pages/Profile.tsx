import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { getClub } from './../utils/utils';
import { Logout } from "./../components/logout/Logout";
import './profile.css';

export default function Profile() {
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const role = auth.role ? `(${auth.role})` : '';

    return (
        <>
            <header className="header">
                <h2>Profil</h2>
                <Logout />
            </header>
            <p>{auth.first_name} {auth.last_name} {role}</p>
            {club && <p>Verein: {club.name}</p>}
            <p>Support: <a href="mailto:abzumplatz@gmail.com?subject=Feedback von der App">abzumplatz@gmail.com</a>
            </p>
            <p>&copy; 2025 Saeid Mohadjer</p>
        </>
    )
}
