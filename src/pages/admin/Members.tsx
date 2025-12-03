import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './../../store';
import { fetchUsers } from '../../utils/utils';
import { Loader } from '../../components/loader/Loader';
import { Link } from 'react-router';

export default function AdminMembersPage() {
    const [loading, setLoading] = useState(false);
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

    return (
        loading ? (
            <div className="splash">
                <Loader size="big" text="Loading users..." />
            </div>
        ) : (
            <>
                <Link className="icon icon--back" to="/admin">Zurück</Link>
                <h2>Mitgliederliste ({users.length})</h2>
                <ul className="users-list">
                    {users.map(user => <li key={user._id}>{user.first_name} {user.last_name}</li>)}
                </ul>
            </>
        )
    )
}
