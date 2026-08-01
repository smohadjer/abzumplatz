import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { getClub } from '../utils/utils';
import { Link } from 'react-router';

export default function Profile() {
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const role = auth?.role === 'admin' ? '(Admin)' : '';
    const status = auth.status === 'inactive' ? 'Inaktiv' : 'Aktiv';


    return (
        <>
            <h1>Mein Profil</h1>
            <table className="profile-table">
                <tbody>
                    <tr>
                        <th>Name</th>
                        <td>{auth.first_name} {auth.last_name} {role}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td>{status}</td>
                    </tr>
                    <tr>
                        <th>Verein</th>
                        <td>
                            {club?.name ?? '-'}
                            {auth.role !== 'admin' ? (
                                <> (<Link to="/select-club">Verein wechseln</Link>)</>
                            ) : null}
                        </td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>{auth.email}</td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}
