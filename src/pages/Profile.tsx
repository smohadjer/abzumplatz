import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import { RootState } from '../store';
import { getClub } from '../utils/utils';
import './settings.css';

const sexLabels = {male: 'Männlich', female: 'Weiblich'} as const;

export default function Profile() {
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const role = auth.role === 'admin' ? ' (Admin)' : '';
    const status = auth.status === 'inactive' ? 'Inaktiv' : 'Aktiv';
    const age = auth.birth_year ? new Date().getFullYear() - auth.birth_year : null;

    return (
        <>
            <h1>Mein Profil</h1>
            <ul className="settings-links">
                <li><Link to="/profile/edit">Profil bearbeiten</Link></li>
            </ul>
            <table className="profile-table">
                <tbody>
                    <tr>
                        <th>Name</th>
                        <td>{auth.first_name} {auth.last_name}{role}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td>{status}</td>
                    </tr>
                    <tr>
                        <th>Verein</th>
                        <td>
                            {club?.name ?? '-'}
                        </td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>{auth.email}</td>
                    </tr>
                    <tr><th>Geburtsjahr</th><td>{auth.birth_year ?? '-'}</td></tr>
                    <tr><th>Alter</th><td>{age === null ? '-' : `${age} Jahre (im laufenden Jahr)`}</td></tr>
                    <tr><th>Geschlecht</th><td>{auth.sex ? sexLabels[auth.sex] : '-'}</td></tr>
                </tbody>
            </table>
        </>
    )
}
