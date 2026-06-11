import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { useDispatch } from 'react-redux'
import { getClub } from '../utils/utils';
import { Link } from 'react-router';

export default function Profile() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const role = auth?.role === 'admin' ? '(Admin)' : '';
    const status = auth.status === 'inactive' ? 'Inaktiv' : 'Aktiv';
    const onLogout = () => {
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then((response) => response.json())
        .then(() => {
            // reset all state
            dispatch({type: 'auth/logout', payload: {}});
            dispatch({type: 'reservations/fetch', payload: {
                value: [],
                loaded: false
            }});
            dispatch({type: 'users/fetch', payload: {
                value: [],
                loaded: false
            }});
            dispatch({type: 'club/fetch', payload: {
                value: {
                    _id: '',
                    name: '',
                    courts: [],
                    reservations_limit: null,
                    start_hour: 0,
                    end_hour: 0,
                },
                loaded: false
            }});
        });
    }

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
                        <td>{club?.name ?? '-'}</td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>{auth.email}</td>
                    </tr>
                </tbody>
            </table>
            <div className="profile-actions">
                {auth.role !== 'admin' ? <Link className="button-link" to="/select-club">Verein wechseln</Link> : <span />}
                <button className="button-link button-link--secondary" onClick={onLogout}>Abmelden</button>
            </div>
        </>
    )
}
