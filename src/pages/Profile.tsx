import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { getClub } from './../utils/utils';
import { Logout } from "./../components/logout/Logout";
import './profile.css';

export default function Profile() {
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const role = auth.role ? `(${auth.role})` : '';

    console.log(auth);

    return (
        <>
            <p>{auth.first_name} {auth.last_name} {role}</p>
            <p>Email: {auth.email}</p>
            {club && <p>Verein: {club.name}</p>}
            <Logout />
            <footer className="profile">
                <p>Support: <a href="mailto:abzumplatz@gmail.com?subject=Feedback von der App">abzumplatz@gmail.com</a>
                </p>
                <p>&copy; 2025 Saeid Mohadjer</p>
            </footer>
        </>
    )
}
