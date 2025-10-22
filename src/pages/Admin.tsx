import { useSelector } from 'react-redux'
import { RootState } from './../store';

export default function Admin() {
    const users = useSelector((state: RootState) => state.users.value);

    return (
        <ul>
            {users.map(user => <li>{user.first_name} {user.last_name}</li>)}
        </ul>
    )
}
