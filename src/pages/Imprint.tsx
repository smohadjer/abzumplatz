import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from './../store';
import { fetchUsers, getClub } from '../utils/utils';

type AdminContact = {
    first_name: string;
    last_name: string;
    email: string;
}

export default function Imprint() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const usersData = useSelector((state: RootState) => state.users);
    const club = getClub();
    const adminContact = usersData.value.find((user): user is AdminContact & { role: string; status: string; _id: string } => {
        return user.role === 'admin' && Boolean(user.email);
    });
    const subject = `abzumplatz: Feedback von ${auth.first_name} ${auth.last_name}`;
    const reservationRequestSubject = 'abzumplatz: Anfrage zur Platzreservierung';

    useEffect(() => {
        if (!auth.value || !auth.club_id || usersData.loaded) return;

        fetchUsers(auth.club_id, dispatch);
    }, [auth.value, auth.club_id, usersData.loaded, dispatch]);

    return (
        <div>
            <h1>Impressum</h1>
            {club && <p>Verein: {club.name}</p>}
            {adminContact ? (
                <p>
                    Anfragen zur Platzreservierung: {' '}
                    <a href={`mailto:${adminContact.email}?subject=${reservationRequestSubject}`}>
                        {adminContact.first_name} {adminContact.last_name}
                    </a>
                </p>
            ) : null}
            <p>Angaben gemäß § 5 TMG:</p>
            <p>
                Saeid Mohadjer<br />
                Denzlingerstr. 20<br />
                79108 Freiburg im Breisgau<br />
                Deutschland</p>
            <p>Support:  <a href={`mailto:abzumplatz@gmail.com?subject=${subject}`}>abzumplatz@gmail.com</a></p>
            <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Saeid Mohadjer (Anschrift wie oben)</p>
        </div>
    )
}
