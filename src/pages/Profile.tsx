import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { useDispatch } from 'react-redux'
import { getClub } from '../utils/utils';

export default function Profile() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const club = getClub();
    const role = auth?.role === 'admin' ? '(Admin)' : '';
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
                    reservations_limit: 0,
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
            <p>{auth.first_name} {auth.last_name} {role}</p>
            {club && <p>Verein: {club.name}</p>}
            <p>Email: {auth.email}</p>
            <button onClick={onLogout}>Abmelden</button>
        </>
    )
}
