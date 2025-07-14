import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { Logout } from "./../components/logout/Logout";
import { Link } from 'react-router';

export default function Profile() {
    const auth = useSelector((state: RootState) => state.auth);
    const role = auth?.role === 'admin' ? '(Admin)' : '';

    return (
        <>
            <p>{auth.first_name} {auth.last_name} {role}</p>
            <p>{auth.email}</p>
            <Logout />
            <p><Link to="/impressum">Impressum</Link></p>
        </>
    )
}
