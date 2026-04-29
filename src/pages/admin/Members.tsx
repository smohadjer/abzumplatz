import { useState, useEffect, ChangeEventHandler} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './../../store';
import { fetchUsers } from '../../utils/utils';
import { Loader } from '../../components/loader/Loader';
import { Link } from 'react-router';

export default function AdminMembersPage() {
    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState(false);
    const usersData = useSelector((state: RootState) => state.users);
    const user = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const users = usersData.value;

    useEffect(() => {
        if (!usersData.loaded) {
            (async () => {
                setLoading(true);
                await fetchUsers(user.club_id, dispatch);
                setLoading(false);
            })();
        }
    }, []);

    

    const handleChange: ChangeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.checked ? "active" : "inactive";
        setPending(true);

        fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: e.target.id,
                status: e.target.value
            })
        }).then(res => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error('Something went wrong!');
            }
        }).then(data => {
            // update user status in store
            const users = usersData.value.map(user => {
                if (user._id === data._id) {
                    return {
                        ...user,
                        status: data.status
                    }
                } else {
                    return user;
                }
            });
            dispatch({
                type: 'users/fetch',
                payload: {
                    value: users,
                    loaded: true
                }
            });
            setPending(false);
        }).catch(e => {
            console.error(e);
            setPending(false);
        });
    }

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Loading users..." />
            </div>
        ) : (
            <>
                <Link className="icon icon--back" to="/admin">Zurück</Link>
                <h2><span style={{ marginRight: '0.5rem' }}>Mitgliederliste ({users.length})</span>
                    {pending ? <Loader size="small" /> : null}
                </h2>
                <ul className="users-list">
                    {users.map(user => {
                        return <li key={user._id}>
                            <label htmlFor={user._id}>
                                <input id={user._id} type="checkbox" defaultChecked={user.status === "active"} onChange={handleChange} />
                                {user.first_name} {user.last_name}
                            </label>
                            <span style={{ marginLeft: '0.25rem' }}>(<a href={`mailto:${user.email}`}>{user.email}</a>)</span>
                        </li>;
                    })}
                </ul>
            </>
        )
    )
}
