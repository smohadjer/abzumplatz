import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { RootState } from '../store';
import { fetchUsers } from '../utils/utils';

type AdminContact = {
    first_name: string;
    last_name: string;
    email: string;
};

export default function Support() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const usersData = useSelector((state: RootState) => state.users);
    const hasUsersForCurrentClub = Boolean(auth.club_id) && usersData.loaded && usersData.clubId === auth.club_id;
    const adminContact = hasUsersForCurrentClub
        ? usersData.value.find((user): user is AdminContact & { role: string; status: string; _id: string } => {
            return user.role === 'admin' && Boolean(user.email);
        })
        : undefined;
    const reservationRequestSubject = 'abzumplatz: Anfrage zur Platzreservierung';

    useEffect(() => {
        if (!auth.club_id || hasUsersForCurrentClub) return;

        fetchUsers(auth.club_id, dispatch);
    }, [auth.club_id, hasUsersForCurrentClub, dispatch]);

    return (
        <>
            <p><Link className="icon icon--back" to={auth.value ? '/settings' : '/'}>Zurück</Link></p>
            <h1>Support</h1>
            {adminContact ? (
                <p>
                    Anfragen zur Platzreservierung: {' '}
                    <a href={`mailto:${adminContact.email}?subject=${reservationRequestSubject}`}>
                        {adminContact.first_name} {adminContact.last_name}
                    </a>
                </p>
            ) : null}
            <p>
                Wenn Sie auf ein technisches Problem stoßen oder einen Fehler entdecken, senden Sie bitte eine detaillierte Beschreibung, möglichst mit einem Screenshot, an {' '}
                <a href="mailto:support@abzumplatz.de?subject=abzumplatz: Technisches Problem">support@abzumplatz.de</a>.
            </p>
        </>
    );
}
