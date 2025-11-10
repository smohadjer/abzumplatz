import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { Link } from 'react-router';
import { useDispatch } from 'react-redux'

export default function Profile() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const role = auth?.role === 'admin' ? '(Admin)' : '';
    const onLogout = () => {
        console.log('logging out...');
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then((response) => response.json())
        .then(json => {
            console.log(json.message);
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
        });
    }

    return (
        <>
            <p>{auth.first_name} {auth.last_name} {role}</p>
            <p>{auth.email}</p>
            <button onClick={onLogout}>Abmelden</button>
            <p><Link to="/impressum">Impressum</Link></p>
        </>
    )
}
